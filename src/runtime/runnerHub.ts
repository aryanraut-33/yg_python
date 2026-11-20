// One Python worker for the whole app. It starts loading as soon as the site opens
// (even on the landing page), so Python is usually ready by the time a child clicks Run.
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { PythonRunner, type RunnerEvents, type RunnerStatus } from './PythonRunner';
import type { LoadMetrics } from './protocol';

type Listener = Partial<RunnerEvents>;

let runner: PythonRunner | null = null;
const listeners = new Set<Listener>();
let status: RunnerStatus = 'loading';
let loadMetrics: (LoadMetrics & { pageToReadyMs: number }) | null = null;
let loadError: string | null = null;
const statusSubscribers = new Set<() => void>();

function emit<K extends keyof RunnerEvents>(key: K, ...args: Parameters<RunnerEvents[K]>) {
  for (const l of listeners) {
    const fn = l[key] as ((...a: Parameters<RunnerEvents[K]>) => void) | undefined;
    fn?.(...args);
  }
}

function notifyStatus() {
  for (const s of statusSubscribers) s();
}

export function getRunner(): PythonRunner {
  if (!runner) {
    runner = new PythonRunner({
      onStatus: (s) => {
        status = s;
        notifyStatus();
        emit('onStatus', s);
      },
      onReady: (m) => {
        loadMetrics = m;
        notifyStatus();
        emit('onReady', m);
      },
      onStdout: (t) => emit('onStdout', t),
      onStderr: (t) => emit('onStderr', t),
      onStage: (b) => emit('onStage', b),
      onInputRequest: () => emit('onInputRequest'),
      onDone: (r) => emit('onDone', r),
      onStopRecovered: (ms) => emit('onStopRecovered', ms),
      onLoadError: (msg) => {
        loadError = msg;
        notifyStatus();
        emit('onLoadError', msg);
      },
    });
  }
  return runner;
}

export function getLoadMetrics() {
  return loadMetrics;
}

export function getLoadError() {
  return loadError;
}

/** Current runner status, re-rendering when it changes. */
export function useRunnerStatus(): RunnerStatus {
  return useSyncExternalStore(
    (cb) => {
      statusSubscribers.add(cb);
      return () => statusSubscribers.delete(cb);
    },
    () => status,
  );
}

/** Subscribe to runner events while the component is mounted. */
export function useRunnerEvents(handlers: Listener) {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    getRunner();
    const proxy: Listener = new Proxy(
      {},
      {
        get: (_t, key: string) => (ref.current as Record<string, unknown>)[key],
      },
    );
    listeners.add(proxy);
    return () => {
      listeners.delete(proxy);
    };
  }, []);
}
