// Messages between the page (main thread) and the Python worker.

/** Layout of the shared control buffer (Int32Array). */
export const CTL = {
  /** 0 = waiting for input, 1 = input is ready to read. */
  STDIN_STATE: 0,
  /** Byte length of the text in the stdin data buffer. */
  STDIN_LENGTH: 1,
  /** Set to 1 by the page when the child presses Stop. */
  STOP_REQUESTED: 2,
  /** Never written: the worker waits on it to sleep without busy-looping. */
  SLEEP: 3,
} as const;

export const CTL_SLOTS = 4;
export const STDIN_BYTES = 16 * 1024;

export interface SharedBuffers {
  /** Pyodide interrupt buffer: writing 2 (SIGINT) raises KeyboardInterrupt. */
  interrupt: SharedArrayBuffer;
  control: SharedArrayBuffer;
  stdin: SharedArrayBuffer;
}

/** A behaviour check to run after the child's code (see content/README.md). */
export interface CheckSpec {
  kind: 'runs' | 'output-contains' | 'output-matches' | 'python';
  value?: string;
  /** Python source for kind "python". */
  code?: string;
  description: string;
}

export interface CheckResult {
  passed: boolean;
  /** Kid-language message: what passed, or what's still missing. */
  message: string;
  /** Values a passing check asked to keep for later steps, e.g. { name: "Meera" }. */
  remember?: Record<string, string>;
}

export type MainToWorker =
  | { type: 'init'; buffers: SharedBuffers | null }
  | { type: 'run'; runId: number; code: string; check: CheckSpec | null };

export interface PythonErrorInfo {
  /** Python exception class name, e.g. "NameError". */
  type: string;
  message: string;
  /** Line in the child's main.py, when known. */
  line: number | null;
  /** Traceback trimmed to the child's own code. */
  traceback: string;
  /** For NameError / AttributeError: the unknown name. */
  name?: string | null;
  /** A close match from the child's own names, e.g. "score" for "scroe". */
  suggestion?: string | null;
  /** True when the error came from inside the stage library (bad argument), not Python itself. */
  fromStage?: boolean;
}

export interface LoadMetrics {
  /** ms from worker start until Python was ready. */
  loadMs: number;
  /** True when the big runtime files came from the browser cache. */
  cached: boolean | null;
  /** Bytes actually downloaded for the runtime (0 when cached). */
  downloadedBytes: number | null;
  pyodideVersion: string;
  pythonVersion: string;
}

export type WorkerToMain =
  | { type: 'ready'; metrics: LoadMetrics }
  | { type: 'load-error'; message: string }
  | { type: 'stdout'; text: string }
  | { type: 'stderr'; text: string }
  | { type: 'stage'; batch: string }
  | { type: 'input-request' }
  | {
      type: 'done';
      runId: number;
      ok: boolean;
      stopped: boolean;
      error: PythonErrorInfo | null;
      check: CheckResult | null;
      ms: number;
    };
