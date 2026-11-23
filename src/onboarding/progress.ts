// Onboarding progress. Saved on this device (per child when a family is signed in),
// and synced to the family's account when there is one.
import { getActiveChild, queueSync, scopedKey } from '../account/family';
export type ConceptId = 'print' | 'strings' | 'numbers' | 'variables' | 'math' | 'comments' | 'input';
export type Experience = 'new' | 'some';

/**
 * Which path a child takes after the quick check (children with some Python only):
 * - lessons:   under 30%  → the full beginner journey
 * - refresher: 30% to 85% → a quick revision, the workspace tour, then the project
 * - ready:     85% or more → straight to the project (refresher and tour offered)
 */
export type Track = 'lessons' | 'refresher' | 'ready';
export type ReadyChoice = 'project' | 'refresher' | 'tour';

export const LESSONS_BELOW = 0.3;
export const READY_FROM = 0.85;

export function trackFor(score: number, total: number): Track {
  const ratio = total ? score / total : 0;
  if (ratio < LESSONS_BELOW) return 'lessons';
  if (ratio >= READY_FROM) return 'ready';
  return 'refresher';
}

export interface OnboardingState {
  /** Id of the screen the child is on. */
  screen: string;
  /** Screens finished. */
  done: string[];
  /** What Nix and Riff call the child (stays on this device). */
  name: string;
  experience: Experience | null;
  /** Quick-check result (children with some Python only). */
  score: number | null;
  total: number | null;
  track: Track | null;
  /** Ready-track choice: go to the project, take a refresher, or see the workspace first. */
  readyChoice: ReadyChoice | null;
  /** Concepts answered correctly in the quick check (the refresher shows the others first). */
  known: ConceptId[];
  /** The hero project the child would build first. */
  dream: string | null;
  completed: boolean;
  /** When the child first opened the onboarding (ms since epoch). */
  startedAt?: number;
}

const BASE_KEY = 'yg-onboarding-v1';
const key = () => scopedKey(BASE_KEY);

export function emptyOnboarding(firstScreen: string): OnboardingState {
  return {
    screen: firstScreen,
    done: [],
    // A signed-in child is already known by their first name.
    name: getActiveChild()?.firstName ?? '',
    experience: null,
    score: null,
    total: null,
    track: null,
    readyChoice: null,
    known: [],
    dream: null,
    completed: false,
  };
}

export function loadOnboarding(firstScreen: string): OnboardingState {
  try {
    const raw = localStorage.getItem(key());
    if (raw) {
      const s = { ...emptyOnboarding(firstScreen), ...(JSON.parse(raw) as Partial<OnboardingState>) };
      // Older saves used "little"/"lots".
      if (s.experience && s.experience !== 'new' && s.experience !== 'some') s.experience = 'some';
      if (!s.name) s.name = getActiveChild()?.firstName ?? '';
      return s;
    }
  } catch {
    // ignore
  }
  return emptyOnboarding(firstScreen);
}

export function saveOnboarding(state: OnboardingState) {
  try {
    localStorage.setItem(key(), JSON.stringify(state));
  } catch {
    // Storage blocked: progress lasts for this visit only.
  }
  queueSync('onboarding', state);
}

export function clearOnboarding() {
  try {
    localStorage.removeItem(key());
  } catch {
    // ignore
  }
}

/** Has this child finished (or chosen to skip) the onboarding? */
export function onboardingCompleted(): boolean {
  try {
    const raw = localStorage.getItem(key());
    return raw ? Boolean((JSON.parse(raw) as Partial<OnboardingState>).completed) : false;
  } catch {
    return false;
  }
}
