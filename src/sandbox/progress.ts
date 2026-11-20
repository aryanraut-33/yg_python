// Guest progress for a project, saved on this device only (no account in Phase 1).

export interface Progress {
  /** -1 = intro screen, steps.length = finished */
  stepIndex: number;
  done: string[];
  /** The child's latest code for each step. */
  code: Record<string, string>;
  /** The code each step started from (for "Start this step again"). */
  startCode: Record<string, string>;
  /** Values carried between steps, e.g. { name: "Meera" }. */
  remembered: Record<string, string>;
  predictions: Record<string, number>;
  hintsShown: Record<string, number>;
  /** Concept pop-outs the child has already seen. */
  seenIntros?: string[];
  /** Code in free-play mode after finishing. */
  freeCode?: string;
}

const key = (projectId: string) => `yg-progress-${projectId}`;

export function emptyProgress(): Progress {
  return { stepIndex: -1, done: [], code: {}, startCode: {}, remembered: {}, predictions: {}, hintsShown: {} };
}

export function loadProgress(projectId: string): Progress {
  try {
    const raw = localStorage.getItem(key(projectId));
    if (raw) return { ...emptyProgress(), ...(JSON.parse(raw) as Partial<Progress>) };
  } catch {
    // ignore
  }
  return emptyProgress();
}

export function saveProgress(projectId: string, progress: Progress) {
  try {
    localStorage.setItem(key(projectId), JSON.stringify(progress));
  } catch {
    // Storage blocked: progress lasts only for this visit.
  }
}

export function clearProgress(projectId: string) {
  try {
    localStorage.removeItem(key(projectId));
  } catch {
    // ignore
  }
}
