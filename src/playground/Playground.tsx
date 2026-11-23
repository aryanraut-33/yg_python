// Developer playground (/playground): runtime checks from Phase 0.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CodeEditor } from '../editor/CodeEditor';
import { translateError } from '../errors/translate';
import type { RunnerStatus } from '../runtime/PythonRunner';
import { getLoadError, getLoadMetrics, getRunner, useRunnerEvents, useRunnerStatus } from '../runtime/runnerHub';
import { StageRenderer } from '../stage/StageRenderer';
import { SAMPLES } from '../samples';
import { Console, type ConsoleLine, type ShownError } from '../ui/Console';
import { ThemeToggle } from '../ui/ThemeToggle';
import { PlayIcon, StopIcon } from '../ui/icons';
import { linkClick } from '../router';

const MAX_CONSOLE_CHARS = 60_000;

const STATUS_LABEL: Record<RunnerStatus, string> = {
  loading: 'Getting Python ready…',
  ready: 'Python is ready',
  running: 'Running…',
  'waiting-for-input': 'Waiting for your answer',
  restarting: 'Restarting Python…',
  failed: 'Python could not start',
};

export function Playground() {
  const [code, setCode] = useState(SAMPLES[0].code);
  const [sampleId, setSampleId] = useState(SAMPLES[0].id);
  const status = useRunnerStatus();
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [error, setError] = useState<ShownError | null>(null);
  const [lastRunMs, setLastRunMs] = useState<number | null>(null);
  const [stopRecoveredMs, setStopRecoveredMs] = useState<number | null>(null);

  const renderer = useMemo(() => new StageRenderer(), []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const codeRef = useRef(code);
  codeRef.current = code;

  const append = useCallback((kind: ConsoleLine['kind'], text: string) => {
    setLines((prev) => {
      const last = prev[prev.length - 1];
      let next = last && last.kind === kind ? [...prev.slice(0, -1), { kind, text: last.text + text }] : [...prev, { kind, text }];
      let total = next.reduce((n, l) => n + l.text.length, 0);
      while (total > MAX_CONSOLE_CHARS && next.length > 0) {
        const first = next[0];
        const excess = total - MAX_CONSOLE_CHARS;
        if (first.text.length > excess) {
          next = [{ ...first, text: '…' + first.text.slice(excess + 1) }, ...next.slice(1)];
          total = MAX_CONSOLE_CHARS;
        } else {
          next = next.slice(1);
          total -= first.text.length;
        }
      }
      return next;
    });
  }, []);

  useRunnerEvents({
    onStdout: (t) => append('out', t),
    onStderr: (t) => append('err', t),
    onStage: (b) => renderer.push(b),
    onDone: (r) => {
      if (!r.stopped) setLastRunMs(r.ms);
      if (r.stopped) append('info', r.hardRestart ? '\n■ Stopped (Python was restarted).\n' : '\n■ Stopped.\n');
      if (r.error) setError({ kid: translateError(r.error, codeRef.current), raw: r.error });
    },
    onStopRecovered: setStopRecoveredMs,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    renderer.attach(canvas);
    if (!canvas) return;
    const ro = new ResizeObserver(() => renderer.present());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [renderer]);

  const run = useCallback(() => {
    setLines([]);
    setError(null);
    renderer.reset();
    getRunner().run(code);
  }, [code, renderer]);

  const busy = status === 'running' || status === 'waiting-for-input';

  const pickSample = (id: string) => {
    const s = SAMPLES.find((x) => x.id === id);
    if (!s) return;
    if (busy) getRunner().stop();
    setSampleId(id);
    setCode(s.code);
    setLines([]);
    setError(null);
    renderer.reset();
  };

  const load = getLoadMetrics();
  const loadError = getLoadError();
  const shared = getRunner().sharedMemory;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <a className="wordmark" href="/" onClick={linkClick} style={{ color: 'inherit', textDecoration: 'none' }}>
            Tinkora
          </a>
          <span className="tag">Developer playground</span>
        </div>
        <div className="topbar-right">
          <span className={`status status-${status}`} role="status" aria-live="polite">
            <span className="status-dot" aria-hidden="true" />
            {STATUS_LABEL[status]}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className="workspace">
        <section className="panel editor-panel" aria-label="Code">
          <div className="panel-head">
            <span className="file-tab">main.py</span>
            <label className="sample-picker">
              <span className="visually-hidden">Load a sample program</span>
              <select value={sampleId} onChange={(e) => pickSample(e.target.value)}>
                {SAMPLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="editor-wrap">
            <CodeEditor value={code} onChange={setCode} onRun={run} errorLine={error?.kid.line ?? null} />
          </div>
          <div className="run-bar">
            {busy ? (
              <button className="btn btn-stop" onClick={() => getRunner().stop()}>
                <StopIcon /> Stop
              </button>
            ) : (
              <button className="btn btn-primary" onClick={run} disabled={status === 'failed'}>
                <PlayIcon /> Run
              </button>
            )}
            <span className="hint">
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd> runs your code
            </span>
          </div>
        </section>

        <section className="side">
          <div className="panel stage-panel" aria-label="Stage">
            <canvas ref={canvasRef} className="stage-canvas" role="img" aria-label="Stage: what your program draws" />
          </div>
          <Console
            lines={lines}
            error={error}
            waitingForInput={status === 'waiting-for-input'}
            onSubmitInput={(text) => {
              append('input', text + '\n');
              getRunner().submitInput(text);
            }}
          />
        </section>
      </main>

      <footer className="checks" aria-label="Runtime checks">
        <Metric label="Shared memory" value={shared ? 'On' : 'Off: Stop/input limited'} bad={!shared} />
        <Metric
          label="Python ready"
          value={
            load
              ? `${(load.pageToReadyMs / 1000).toFixed(1)} s after page opened · ${
                  load.cached === null ? 'cache unknown' : load.cached ? 'from cache' : `downloaded ${((load.downloadedBytes ?? 0) / 1e6).toFixed(1)} MB`
                }`
              : '…'
          }
        />
        <Metric label="Last run" value={lastRunMs === null ? '–' : `${lastRunMs} ms`} />
        <Metric label="Stop → ready again" value={stopRecoveredMs === null ? '–' : `${stopRecoveredMs} ms`} bad={(stopRecoveredMs ?? 0) > 2000} />
        <Metric label="Runtime" value={load ? `Python ${load.pythonVersion} · Pyodide ${load.pyodideVersion}` : '…'} />
        {loadError && <Metric label="Load error" value={loadError} bad />}
      </footer>
    </div>
  );
}

function Metric({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className={`metric${bad ? ' metric-bad' : ''}`}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  );
}
