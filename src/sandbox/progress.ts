// Progress for a project. Saved on this device (per child when a family is signed in),
// and synced to the family's account when there is one.
import { queueSync, scopedKey } from '../account/family';

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
  /** When this was last saved (ms since epoch), for the Continue card. */
  updatedAt?: number;
}

/** The localStorage key for a project's progress (namespaced by the active child). */
export const progressKey = (projectId: string) => scopedKey(`yg-progress-${projectId}`);
const key = progressKey;

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
  const stamped = { ...progress, updatedAt: Date.now() };
  try {
    localStorage.setItem(key(projectId), JSON.stringify(stamped));
  } catch {
    // Storage blocked: progress lasts only for this visit.
  }
  queueSync(projectId, stamped);
}

export function clearProgress(projectId: string) {
  try {
    localStorage.removeItem(key(projectId));
  } catch {
    // ignore
  }
}
