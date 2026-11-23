// On-device session log for observed sessions: it lives in this browser's localStorage
// and is read on the hidden /report page. When a family is signed in, the same events
// also go to the family's own events table (never to a third party).
import { queueEvent } from '../account/family';

export type LogEventType =
  | 'sandbox_open'
  | 'preview_done'
  | 'run'
  | 'error'
  | 'stop'
  | 'hint'
  | 'predict_answer'
  | 'check_failed'
  | 'step_complete'
  | 'project_complete'
  | 'onboard_open'
  | 'onboard_screen'
  | 'onboard_skip'
  | 'onboard_diag'
  | 'onboard_challenge'
  | 'onboard_complete'
  | 'concept_intro';

export interface LogEvent {
  /** ms since the session started */
  t: number;
  type: LogEventType;
  data?: Record<string, string | number | boolean | null>;
}

export interface Session {
  id: string;
  startedAt: string;
  label: string;
  viewport: string;
  events: LogEvent[];
}

interface Store {
  current: string | null;
  sessions: Session[];
}

const KEY = 'yg-report-v1';
const MAX_SESSIONS = 50;
const MAX_EVENTS = 3000;

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Store;
      if (Array.isArray(parsed.sessions)) return parsed;
    }
  } catch {
    // Storage blocked or corrupt: start fresh.
  }
  return { current: null, sessions: [] };
}

function write(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Storage full or blocked: the report just won't have this session.
  }
}

function makeSession(store: Store, label?: string): Session {
  const session: Session = {
    id: `s${Date.now().toString(36)}`,
    startedAt: new Date().toISOString(),
    label: label ?? `Kid ${store.sessions.length + 1}`,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    events: [],
  };
  store.sessions.push(session);
  if (store.sessions.length > MAX_SESSIONS) store.sessions.splice(0, store.sessions.length - MAX_SESSIONS);
  store.current = session.id;
  return session;
}

function currentSession(store: Store): Session {
  return store.sessions.find((s) => s.id === store.current) ?? makeSession(store);
}

export function logEvent(type: LogEventType, data?: LogEvent['data']) {
  const store = read();
  const session = currentSession(store);
  if (session.events.length >= MAX_EVENTS) return;
  session.events.push({ t: Date.now() - Date.parse(session.startedAt), type, data });
  write(store);
  queueEvent(type, data);
}

export function getSessions(): Session[] {
  return read().sessions;
}

export function getCurrentSessionId(): string | null {
  return read().current;
}

/** Start a fresh session (the next kid). */
export function startNewSession(label?: string) {
  const store = read();
  makeSession(store, label);
  write(store);
}

export function renameSession(id: string, label: string) {
  const store = read();
  const s = store.sessions.find((x) => x.id === id);
  if (s) s.label = label.slice(0, 40);
  write(store);
}

export function clearSessions() {
  write({ current: null, sessions: [] });
}
