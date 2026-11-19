import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CodeEditor } from './editor/CodeEditor';
import { PythonRunner, type RunnerStatus } from './runtime/PythonRunner';
import type { LoadMetrics, PythonErrorInfo } from './runtime/protocol';
import { StageRenderer } from './stage/StageRenderer';
import { SAMPLES } from './samples';
import { Console, type ConsoleLine } from './ui/Console';
import { currentTheme, setTheme, type Theme } from './ui/theme';
import { MoonIcon, PlayIcon, StopIcon, SunIcon } from './ui/icons';

const MAX_CONSOLE_CHARS = 60_000;

const STATUS_LABEL: Record<RunnerStatus, string> = {
  loading: 'Getting Python ready…',
  ready: 'Python is ready',
  running: 'Running…',
  'waiting-for-input': 'Waiting for your answer',
  restarting: 'Restarting Python…',
  failed: 'Python could not start',
};

interface Metrics {
  load: (LoadMetrics & { pageToReadyMs: number }) | null;
  lastRunMs: number | null;
  stopRecoveredMs: number | null;
}

export function App() {
  const [code, setCode] = useState(SAMPLES[0].code);
  const [sampleId, setSampleId] = useState(SAMPLES[0].id);
  const [status, setStatus] = useState<RunnerStatus>('loading');
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [error, setError] = useState<PythonErrorInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({ load: null, lastRunMs: null, stopRecoveredMs: null });
  const [theme, setThemeState] = useState<Theme>(currentTheme);

  const renderer = useMemo(() => new StageRenderer(), []);
  const runnerRef = useRef<PythonRunner | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const append = useCallback((kind: ConsoleLine['kind'], text: string) => {
    setLines((prev) => {
      const last = prev[prev.length - 1];
      let next = last && last.kind === kind ? [...prev.slice(0, -1), { kind, text: last.text + text }] : [...prev, { kind, text }];
      // Keep the console light, even when a program prints forever.
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

  useEffect(() => {
    const runner = new PythonRunner({
      onStatus: setStatus,
      onReady: (load) => setMetrics((m) => ({ ...m, load })),
      onStdout: (t) => append('out', t),
      onStderr: (t) => append('err', t),
      onStage: (batch) => renderer.push(batch),
      onInputRequest: () => undefined,
      onDone: (r) => {
        setMetrics((m) => ({ ...m, lastRunMs: r.stopped ? m.lastRunMs : r.ms }));
        if (r.stopped) append('info', r.hardRestart ? '\n■ Stopped (Python was restarted).\n' : '\n■ Stopped.\n');
        if (r.error) setError(r.error);
      },
      onStopRecovered: (ms) => setMetrics((m) => ({ ...m, stopRecoveredMs: ms })),
      onLoadError: setLoadError,
    });
    runnerRef.current = runner;
    return () => runner.dispose();
  }, [append, renderer]);

  // Keep the stage crisp when its size changes.
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
    runnerRef.current?.run(code);
  }, [code, renderer]);

  const stop = useCallback(() => runnerRef.current?.stop(), []);

  const busy = status === 'running' || status === 'waiting-for-input';

  const pickSample = (id: string) => {
    const s = SAMPLES.find((x) => x.id === id);
    if (!s) return;
    if (busy) runnerRef.current?.stop();
    setSampleId(id);
    setCode(s.code);
    setLines([]);
    setError(null);
    renderer.reset();
  };

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="wordmark">yg python</span>
          <span className="tag">Phase 0 · Playground</span>
        </div>
        <div className="topbar-right">
          <span className={`status status-${status}`} role="status" aria-live="polite">
            <span className="status-dot" aria-hidden="true" />
            {STATUS_LABEL[status]}
          </span>
          <button className="icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
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
            <CodeEditor value={code} onChange={setCode} onRun={run} />
          </div>
          <div className="run-bar">
            {busy ? (
              <button className="btn btn-stop" onClick={stop}>
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
              runnerRef.current?.submitInput(text);
            }}
          />
        </section>
      </main>

      <footer className="checks" aria-label="Phase 0 checks">
        <Metric label="Shared memory" value={runnerRef.current?.sharedMemory === false ? 'Off: Stop/input limited' : 'On'} bad={runnerRef.current?.sharedMemory === false} />
        <Metric
          label="Python ready"
          value={
            metrics.load
              ? `${(metrics.load.pageToReadyMs / 1000).toFixed(1)} s after page opened · ${
                  metrics.load.cached === null ? 'cache unknown' : metrics.load.cached ? 'from cache' : `downloaded ${((metrics.load.downloadedBytes ?? 0) / 1e6).toFixed(1)} MB`
                }`
              : '…'
          }
        />
        <Metric label="Last run" value={metrics.lastRunMs === null ? '–' : `${metrics.lastRunMs} ms`} />
        <Metric label="Stop → ready again" value={metrics.stopRecoveredMs === null ? '–' : `${metrics.stopRecoveredMs} ms`} bad={(metrics.stopRecoveredMs ?? 0) > 2000} />
        <Metric label="Runtime" value={metrics.load ? `Python ${metrics.load.pythonVersion} · Pyodide ${metrics.load.pyodideVersion}` : '…'} />
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
