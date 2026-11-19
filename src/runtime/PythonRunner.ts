// Page-side controller for the Python worker: start, run, stop, input.
import {
  CTL,
  CTL_SLOTS,
  STDIN_BYTES,
  type LoadMetrics,
  type PythonErrorInfo,
  type SharedBuffers,
  type WorkerToMain,
} from './protocol';

export type RunnerStatus = 'loading' | 'ready' | 'running' | 'waiting-for-input' | 'restarting' | 'failed';

export interface RunResult {
  ok: boolean;
  stopped: boolean;
  error: PythonErrorInfo | null;
  ms: number;
  /** True when Stop had to restart Python because the program ignored the interrupt. */
  hardRestart: boolean;
}

export interface RunnerEvents {
  onStatus(status: RunnerStatus): void;
  onReady(metrics: LoadMetrics & { pageToReadyMs: number }): void;
  onStdout(text: string): void;
  onStderr(text: string): void;
  onStage(batch: string): void;
  onInputRequest(): void;
  onDone(result: RunResult): void;
  /** ms from pressing Stop until Python could run again. */
  onStopRecovered(ms: number): void;
  onLoadError(message: string): void;
}

/** If an interrupted program hasn't ended by then, restart Python instead. */
const HARD_STOP_AFTER_MS = 400;

export class PythonRunner {
  readonly sharedMemory: boolean = typeof SharedArrayBuffer !== 'undefined' && globalThis.crossOriginIsolated === true;

  private worker!: Worker;
  private buffers: SharedBuffers | null = null;
  private interrupt: Uint8Array | null = null;
  private control: Int32Array | null = null;
  private stdin: Uint8Array | null = null;
  private status: RunnerStatus = 'loading';
  private runId = 0;
  private activeRun: number | null = null;
  private stopStartedAt: number | null = null;
  private hardStopTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingCode: string | null = null;
  private restartedByStop = false;

  constructor(private readonly events: RunnerEvents) {
    this.spawn();
  }

  get currentStatus(): RunnerStatus {
    return this.status;
  }

  run(code: string) {
    if (this.status === 'running' || this.status === 'waiting-for-input') return;
    if (this.status !== 'ready') {
      this.pendingCode = code; // Run as soon as Python is ready.
      return;
    }
    this.runId += 1;
    this.activeRun = this.runId;
    if (this.control) Atomics.store(this.control, CTL.STOP_REQUESTED, 0);
    this.setStatus('running');
    this.worker.postMessage({ type: 'run', runId: this.runId, code });
  }

  stop() {
    if (this.status !== 'running' && this.status !== 'waiting-for-input') return;
    this.stopStartedAt = performance.now();
    if (this.interrupt && this.control) {
      Atomics.store(this.control, CTL.STOP_REQUESTED, 1);
      this.interrupt[0] = 2; // SIGINT -> KeyboardInterrupt in Python
      Atomics.notify(this.control, CTL.STDIN_STATE); // wake input() so it notices
      this.hardStopTimer = setTimeout(() => this.hardRestart(), HARD_STOP_AFTER_MS);
    } else {
      this.hardRestart();
    }
  }

  submitInput(text: string) {
    if (this.status !== 'waiting-for-input' || !this.control || !this.stdin) return;
    const bytes = new TextEncoder().encode(text).slice(0, STDIN_BYTES);
    this.stdin.set(bytes);
    Atomics.store(this.control, CTL.STDIN_LENGTH, bytes.length);
    Atomics.store(this.control, CTL.STDIN_STATE, 1);
    Atomics.notify(this.control, CTL.STDIN_STATE);
    this.setStatus('running');
  }

  dispose() {
    this.clearHardStop();
    this.worker.terminate();
  }

  private spawn() {
    if (this.sharedMemory) {
      this.buffers = {
        interrupt: new SharedArrayBuffer(1),
        control: new SharedArrayBuffer(CTL_SLOTS * Int32Array.BYTES_PER_ELEMENT),
        stdin: new SharedArrayBuffer(STDIN_BYTES),
      };
      this.interrupt = new Uint8Array(this.buffers.interrupt);
      this.control = new Int32Array(this.buffers.control);
      this.stdin = new Uint8Array(this.buffers.stdin);
    }
    this.worker = new Worker(new URL('./py.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e: MessageEvent<WorkerToMain>) => this.handle(e.data);
    this.worker.onerror = (e) => this.events.onLoadError(e.message || 'The Python worker crashed.');
    this.worker.postMessage({ type: 'init', buffers: this.buffers });
  }

  private hardRestart() {
    this.clearHardStop();
    const wasRun = this.activeRun;
    this.worker.terminate();
    this.activeRun = null;
    this.restartedByStop = this.stopStartedAt !== null;
    this.setStatus('restarting');
    if (wasRun !== null) {
      this.events.onDone({ ok: false, stopped: true, error: null, ms: 0, hardRestart: true });
    }
    this.spawn();
  }

  private clearHardStop() {
    if (this.hardStopTimer) clearTimeout(this.hardStopTimer);
    this.hardStopTimer = null;
  }

  private recordStopRecovered() {
    if (this.stopStartedAt !== null) {
      this.events.onStopRecovered(Math.round(performance.now() - this.stopStartedAt));
      this.stopStartedAt = null;
    }
  }

  private setStatus(status: RunnerStatus) {
    this.status = status;
    this.events.onStatus(status);
  }

  private handle(msg: WorkerToMain) {
    switch (msg.type) {
      case 'ready': {
        this.setStatus('ready');
        if (this.restartedByStop) {
          this.restartedByStop = false;
          this.recordStopRecovered();
        } else {
          this.events.onReady({ ...msg.metrics, pageToReadyMs: Math.round(performance.now()) });
        }
        if (this.pendingCode !== null) {
          const code = this.pendingCode;
          this.pendingCode = null;
          this.run(code);
        }
        break;
      }
      case 'load-error':
        this.setStatus('failed');
        this.events.onLoadError(msg.message);
        break;
      case 'stdout':
        this.events.onStdout(msg.text);
        break;
      case 'stderr':
        this.events.onStderr(msg.text);
        break;
      case 'stage':
        this.events.onStage(msg.batch);
        break;
      case 'input-request':
        this.setStatus('waiting-for-input');
        this.events.onInputRequest();
        break;
      case 'done': {
        if (msg.runId !== this.activeRun) break;
        this.clearHardStop();
        this.activeRun = null;
        this.setStatus('ready');
        this.events.onDone({ ok: msg.ok, stopped: msg.stopped, error: msg.error, ms: msg.ms, hardRestart: false });
        if (msg.stopped) this.recordStopRecovered();
        break;
      }
    }
  }
}
