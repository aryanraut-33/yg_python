// Runs the child's Python in a Web Worker, so a busy program never freezes the page.
import type { PyodideAPI } from 'pyodide';
import {
  CTL,
  type CheckResult,
  type CheckSpec,
  type LoadMetrics,
  type MainToWorker,
  type PythonErrorInfo,
  type WorkerToMain,
} from './protocol';
import bootstrapPy from './python/bootstrap.py?raw';
import stagePy from './python/stage.py?raw';

declare const __PYODIDE_VERSION__: string;

const INDEX_URL = `/pyodide/${__PYODIDE_VERSION__}/`;
const OUTPUT_FLUSH_MS = 30;
const OUTPUT_FLUSH_CHARS = 8000;
const SLEEP_CHUNK_MS = 50;

// The DOM lib types `self` as Window; in a worker we only need postMessage/onmessage.
const ctx = self as unknown as {
  postMessage(message: WorkerToMain): void;
  onmessage: ((event: MessageEvent<MainToWorker>) => void) | null;
};

const startedAt = performance.now();
let py: PyodideAPI | null = null;
let interrupt: Uint8Array | null = null;
let control: Int32Array | null = null;
let stdinData: Uint8Array | null = null;

const post = (message: WorkerToMain) => ctx.postMessage(message);

// ---- Output: batch writes so `while True: print(1)` can't flood the page ----
let outBuf = '';
let errBuf = '';
let lastFlush = 0;
const outDecoder = new TextDecoder();
const errDecoder = new TextDecoder();

function flushOutput() {
  if (outBuf) post({ type: 'stdout', text: outBuf });
  if (errBuf) post({ type: 'stderr', text: errBuf });
  outBuf = '';
  errBuf = '';
  lastFlush = performance.now();
}

function maybeFlush() {
  if (performance.now() - lastFlush > OUTPUT_FLUSH_MS || outBuf.length + errBuf.length > OUTPUT_FLUSH_CHARS) {
    flushOutput();
  }
}

function stopRequested(): boolean {
  return control !== null && Atomics.load(control, CTL.STOP_REQUESTED) === 1;
}

/** Called from Python while it waits, so Stop works even during wait() or input(). */
function checkStop() {
  if (stopRequested() && py) py.checkInterrupt();
}

// ---- Bridge functions the Python side calls (module `_yg`) ----
function sleep(seconds: number) {
  flushOutput();
  const end = performance.now() + Math.max(0, seconds) * 1000;
  for (;;) {
    checkStop();
    const left = end - performance.now();
    if (left <= 0) break;
    if (control) Atomics.wait(control, CTL.SLEEP, 0, Math.min(SLEEP_CHUNK_MS, left));
    else break; // No shared memory: can't block safely, so skip the pause.
  }
}

function stageFlush(batch: string) {
  flushOutput();
  post({ type: 'stage', batch });
}

function readInput(): string | null {
  flushOutput();
  if (!control || !stdinData) {
    throw new Error('input() needs a browser that supports shared memory.');
  }
  Atomics.store(control, CTL.STDIN_STATE, 0);
  post({ type: 'input-request' });
  while (Atomics.load(control, CTL.STDIN_STATE) !== 1) {
    Atomics.wait(control, CTL.STDIN_STATE, 0, 100);
    checkStop();
  }
  const length = Atomics.load(control, CTL.STDIN_LENGTH);
  const copy = new Uint8Array(length);
  copy.set(stdinData.subarray(0, length));
  Atomics.store(control, CTL.STDIN_STATE, 0);
  return new TextDecoder().decode(copy) + '\n';
}

function runtimeCacheInfo(): Pick<LoadMetrics, 'cached' | 'downloadedBytes'> {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const big = entries.filter((e) => /pyodide\.asm\.wasm|python_stdlib\.zip/.test(e.name));
  if (big.length === 0) return { cached: null, downloadedBytes: null };
  const downloaded = big.reduce((sum, e) => sum + e.transferSize, 0);
  // A cache revalidation still transfers a few hundred bytes of headers.
  return { cached: downloaded < 100_000, downloadedBytes: downloaded };
}

async function init(buffers: Extract<MainToWorker, { type: 'init' }>['buffers']) {
  if (buffers) {
    interrupt = new Uint8Array(buffers.interrupt);
    control = new Int32Array(buffers.control);
    stdinData = new Uint8Array(buffers.stdin);
  }

  const { loadPyodide } = (await import(/* @vite-ignore */ `${INDEX_URL}pyodide.mjs`)) as typeof import('pyodide');
  const pyodide = await loadPyodide({ indexURL: INDEX_URL });

  pyodide.setStdout({
    write: (buf: Uint8Array) => {
      outBuf += outDecoder.decode(buf, { stream: true });
      maybeFlush();
      return buf.length;
    },
  });
  pyodide.setStderr({
    write: (buf: Uint8Array) => {
      errBuf += errDecoder.decode(buf, { stream: true });
      maybeFlush();
      return buf.length;
    },
  });
  pyodide.setStdin({ stdin: readInput });
  if (interrupt) pyodide.setInterruptBuffer(interrupt);

  pyodide.registerJsModule('_yg', { sleep, stage_flush: stageFlush });
  pyodide.FS.mkdirTree('/home/pyodide/yg');
  pyodide.FS.writeFile('/home/pyodide/yg/stage.py', stagePy);
  pyodide.runPython(bootstrapPy);

  py = pyodide;
  const pythonVersion = pyodide.runPython('import sys; sys.version.split()[0]') as string;
  post({
    type: 'ready',
    metrics: {
      loadMs: Math.round(performance.now() - startedAt),
      pyodideVersion: __PYODIDE_VERSION__,
      pythonVersion,
      ...runtimeCacheInfo(),
    },
  });
}

function run(runId: number, code: string, check: CheckSpec | null) {
  if (!py) return;
  if (control) Atomics.store(control, CTL.STOP_REQUESTED, 0);
  if (interrupt) interrupt[0] = 0;
  const t0 = performance.now();
  const runner = py.globals.get('_yg_run') as (src: string, checkJson: string | null) => string;
  let parsed: { ok: boolean; stopped: boolean; error: PythonErrorInfo | null; check: CheckResult | null };
  try {
    parsed = JSON.parse(runner(code, check ? JSON.stringify(check) : null));
  } catch (e) {
    parsed = {
      ok: false,
      stopped: stopRequested(),
      error: { type: 'InternalError', message: String(e), line: null, traceback: '' },
      check: null,
    };
  }
  flushOutput();
  const stopped = parsed.stopped || stopRequested();
  post({
    type: 'done',
    runId,
    ok: parsed.ok && !stopped,
    stopped,
    error: stopped ? null : parsed.error,
    check: stopped ? null : parsed.check,
    ms: Math.round(performance.now() - t0),
  });
  if (control) Atomics.store(control, CTL.STOP_REQUESTED, 0);
  if (interrupt) interrupt[0] = 0;
}

ctx.onmessage = (event) => {
  const msg = event.data;
  if (msg.type === 'init') {
    init(msg.buffers).catch((e: unknown) => post({ type: 'load-error', message: String(e) }));
  } else if (msg.type === 'run') {
    run(msg.runId, msg.code, msg.check);
  }
};
