// Runs code for one lesson panel and collects its output. Several panels can be mounted at
// once: each only listens to the runs it started.
import { useCallback, useRef, useState } from 'react';
import { getRunner, useRunnerEvents, useRunnerStatus } from '../runtime/runnerHub';
import type { RunResult } from '../runtime/PythonRunner';
import type { CheckSpec } from '../runtime/protocol';
import { translateError } from '../errors/translate';
import type { ConsoleLine, ShownError } from '../ui/Console';
import { logEvent } from '../telemetry/sessionLog';

const MAX_CHARS = 20_000;

export function useCodeRun(where: string, onStage?: (batch: string) => void) {
  const status = useRunnerStatus();
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [error, setError] = useState<ShownError | null>(null);
  const [running, setRunning] = useState(false);
  const mine = useRef(false);
  const codeRef = useRef('');
  const callback = useRef<((r: RunResult) => void) | null>(null);

  const append = useCallback((kind: ConsoleLine['kind'], text: string) => {
    setLines((prev) => {
      const last = prev[prev.length - 1];
      let next = last && last.kind === kind ? [...prev.slice(0, -1), { kind, text: last.text + text }] : [...prev, { kind, text }];
      let total = next.reduce((n, l) => n + l.text.length, 0);
      while (total > MAX_CHARS && next.length > 1) {
        total -= next[0].text.length;
        next = next.slice(1);
      }
      return next;
    });
  }, []);

  useRunnerEvents({
    onStdout: (t) => mine.current && append('out', t),
    onStderr: (t) => mine.current && append('err', t),
    onStage: (b) => mine.current && onStage?.(b),
    onDone: (r) => {
      if (!mine.current) return;
      mine.current = false;
      setRunning(false);
      if (r.stopped) append('info', '\n■ Stopped.\n');
      if (r.error) {
        const kid = translateError(r.error, codeRef.current);
        setError({ kid, raw: r.error });
        logEvent('error', { step: where, id: kid.id, type: r.error.type });
      }
      const cb = callback.current;
      callback.current = null;
      cb?.(r);
    },
  });

  const run = useCallback(
    (code: string, check: CheckSpec | null, onResult?: (r: RunResult) => void) => {
      const s = getRunner().currentStatus;
      if (s === 'running' || s === 'waiting-for-input') return;
      setLines([]);
      setError(null);
      codeRef.current = code;
      callback.current = onResult ?? null;
      mine.current = true;
      setRunning(true);
      logEvent('run', { step: where });
      getRunner().run(code, check);
    },
    [where],
  );

  const stop = useCallback(() => getRunner().stop(), []);
  const submitInput = useCallback(
    (text: string) => {
      append('input', text + '\n');
      getRunner().submitInput(text);
    },
    [append],
  );
  const clear = useCallback(() => {
    setLines([]);
    setError(null);
  }, []);

  return {
    status,
    lines,
    error,
    running,
    waitingForInput: running && status === 'waiting-for-input',
    run,
    stop,
    submitInput,
    clear,
  };
}
