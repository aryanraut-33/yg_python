// Family accounts: the parent signs in once on this device, then the child picks their profile.
//
// The browser keeps a working copy of each child's progress in localStorage (namespaced
// by child), and quietly syncs it to Supabase. Guests (no active child) keep the old,
// un-namespaced keys, so nothing changes for them.
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

/** Bump when the privacy notice or terms change; parents are asked to agree again. */
export const POLICY_VERSION = '2026-11-20-draft';

export interface Child {
  id: string;
  first_name: string;
  birth_year: number;
  subscription_status?: 'free' | 'active' | 'canceled';
  subscription_expires_at?: string | null;
  subscription_plan?: string | null;
}

export interface ActiveChild {
  id: string;
  firstName: string;
  subscriptionStatus?: 'free' | 'active' | 'canceled';
}

// ---------- Single device restriction ----------

const DEVICE_KEY = 'tinkora-device-id';
const EVICTED_KEY = 'tinkora-device-evicted';

export function getDeviceId(): string {
  let id: string | null = null;
  try {
    id = localStorage.getItem(DEVICE_KEY);
  } catch {
    // ignore
  }
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'dev_' + Math.random().toString(36).slice(2);
    try {
      localStorage.setItem(DEVICE_KEY, id);
    } catch {
      // ignore
    }
  }
  return id;
}

export function wasDeviceEvicted(): boolean {
  try {
    return sessionStorage.getItem(EVICTED_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearDeviceEvicted(): void {
  try {
    sessionStorage.removeItem(EVICTED_KEY);
  } catch {
    // ignore
  }
}

export async function registerCurrentDevice(userId: string): Promise<void> {
  if (!supabase) return;
  const deviceId = getDeviceId();
  try {
    const { error } = await supabase.rpc('register_device', { device_id: deviceId });
    if (error) {
      await supabase.from('parents').update({ active_device_id: deviceId, device_updated_at: new Date().toISOString() }).eq('id', userId);
    }
  } catch {
    // ignore
  }
}

export async function checkDeviceActive(userId: string): Promise<boolean> {
  if (!supabase) return true;
  const deviceId = getDeviceId();
  try {
    const { data, error } = await supabase.from('parents').select('active_device_id').eq('id', userId).single();
    if (error || !data) return true;
    if (data.active_device_id && data.active_device_id !== deviceId) {
      try {
        sessionStorage.setItem(EVICTED_KEY, '1');
      } catch {
        // ignore
      }
      await signOut();
      return false;
    }
  } catch {
    // ignore
  }
  return true;
}

// ---------- The child using this device ----------

const ACTIVE_KEY = 'yg-active-child';
const listeners = new Set<() => void>();
let activeCache: { raw: string | null; value: ActiveChild | null } = { raw: null, value: null };

function readActive(): ActiveChild | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
  if (raw === activeCache.raw) return activeCache.value;
  let value: ActiveChild | null = null;
  try {
    const parsed = raw ? (JSON.parse(raw) as ActiveChild) : null;
    if (parsed && typeof parsed.id === 'string' && typeof parsed.firstName === 'string') {
      value = {
        id: parsed.id,
        firstName: parsed.firstName,
        subscriptionStatus: parsed.subscriptionStatus ?? 'free',
      };
    }
  } catch {
    value = null;
  }
  activeCache = { raw, value };
  return value;
}

export function getActiveChild(): ActiveChild | null {
  return readActive();
}

export function setActiveChild(child: ActiveChild | null) {
  try {
    if (child) localStorage.setItem(ACTIVE_KEY, JSON.stringify(child));
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // ignore
  }
  for (const l of listeners) l();
}

export function useActiveChild(): ActiveChild | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      const onStorage = (e: StorageEvent) => e.key === ACTIVE_KEY && cb();
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(cb);
        window.removeEventListener('storage', onStorage);
      };
    },
    readActive,
  );
}

/** localStorage key for this device's active child (or the guest key when no child is active). */
export function scopedKey(base: string): string {
  const child = readActive();
  return child ? childKey(child.id, base) : base;
}

function childKey(childId: string, base: string) {
  return `yg-c-${childId}-${base}`;
}

// ---------- Session ----------

export function useSession(): { session: Session | null; loading: boolean } {
  const [state, setState] = useState<{ session: Session | null; loading: boolean }>({ session: null, loading: Boolean(supabase) });
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setState({ session: data.session, loading: false });
      if (data.session) void registerCurrentDevice(data.session.user.id);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setState({ session, loading: false });
      if (session) void registerCurrentDevice(session.user.id);
    });
    const interval = setInterval(() => {
      supabase?.auth.getSession().then(({ data }) => {
        if (data.session) void checkDeviceActive(data.session.user.id);
      });
    }, 15000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        supabase?.auth.getSession().then(({ data }) => {
          if (data.session) void checkDeviceActive(data.session.user.id);
        });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      data.subscription.unsubscribe();
    };
  }, []);
  return state;
}

function db() {
  if (!supabase) throw new Error('Family accounts are not set up on this site yet.');
  return supabase;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export async function sendSignInLink(email: string) {
  const res = await db().auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: `${window.location.origin}/family`, shouldCreateUser: true },
  });
  if (res.error) throw new Error(res.error.message);
}

export async function signOut() {
  await flushSync();
  setActiveChild(null);
  await db().auth.signOut();
}

// ---------- Parent, consent, children ----------

export async function ensureParent(userId: string) {
  check(await db().from('parents').upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true }));
}

export async function hasCurrentConsent(userId: string): Promise<boolean> {
  const rows = check(
    await db().from('consents').select('id').eq('parent_id', userId).eq('policy_version', POLICY_VERSION).limit(1),
  );
  return (rows ?? []).length > 0;
}

export interface ConsentAnswers {
  isParentAdult: boolean;
  agreesToNotice: boolean;
  weeklyEmail: boolean;
}

export async function recordConsent(userId: string, answers: ConsentAnswers) {
  check(
    await db()
      .from('consents')
      .insert({
        parent_id: userId,
        policy_version: POLICY_VERSION,
        agreed: { ...answers, method: 'email-link + self-declaration', userAgent: navigator.userAgent.slice(0, 160) },
      }),
  );
  check(await db().from('parents').update({ weekly_email: answers.weeklyEmail }).eq('id', userId));
}

export async function getWeeklyEmail(userId: string): Promise<boolean> {
  const rows = check(await db().from('parents').select('weekly_email').eq('id', userId).limit(1));
  return rows?.[0]?.weekly_email ?? true;
}

export async function setWeeklyEmail(userId: string, on: boolean) {
  check(await db().from('parents').update({ weekly_email: on }).eq('id', userId));
}

export async function listChildren(): Promise<Child[]> {
  return (check(await db().from('children').select('id, first_name, birth_year, subscription_status, subscription_expires_at, subscription_plan').order('created_at')) ?? []) as Child[];
}

export async function setChildSubscription(childId: string, status: 'free' | 'active', plan = 'spark'): Promise<void> {
  const { error } = await db().rpc('set_child_subscription', { child: childId, new_status: status, plan });
  if (error) {
    check(await db().from('children').update({
      subscription_status: status,
      subscription_plan: plan,
      subscription_expires_at: status === 'active' ? new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString() : null,
    }).eq('id', childId));
  }
  const active = readActive();
  if (active && active.id === childId) {
    setActiveChild({ ...active, subscriptionStatus: status });
  }
}

export async function addChild(userId: string, firstName: string, birthYear: number): Promise<Child> {
  const rows = check(
    await db()
      .from('children')
      .insert({ parent_id: userId, first_name: firstName.trim(), birth_year: birthYear })
      .select('id, first_name, birth_year'),
  );
  return (rows as Child[])[0];
}

export async function removeChild(childId: string) {
  check(await db().from('children').delete().eq('id', childId));
  clearChildLocal(childId);
  if (readActive()?.id === childId) setActiveChild(null);
}

// ---------- Progress sync ----------

const PROGRESS_PREFIX = 'yg-progress-';
const ONBOARDING_KEY = 'yg-onboarding-v1';

/** Maps a sync key ("rocket-launch" or "onboarding") to its localStorage base key. */
function baseKeyFor(syncKey: string) {
  return syncKey === 'onboarding' ? ONBOARDING_KEY : PROGRESS_PREFIX + syncKey;
}

const pending = new Map<string, { child_id: string; key: string; data: unknown; updated_at: string }>();
let timer: ReturnType<typeof setTimeout> | null = null;

/** Called whenever progress is saved locally. Uploads it a moment later (batched). */
export function queueSync(syncKey: string, data: unknown) {
  const child = readActive();
  if (!child || !supabase) return;
  pending.set(`${child.id}|${syncKey}`, { child_id: child.id, key: syncKey, data, updated_at: new Date().toISOString() });
  if (!timer) timer = setTimeout(() => void flushSync(), 2500);
}

export async function flushSync() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (!supabase) return;
  const rows = [...pending.values()];
  const events = eventQueue.splice(0, eventQueue.length);
  pending.clear();
  if (rows.length) {
    const res = await supabase.from('progress').upsert(rows, { onConflict: 'child_id,key' });
    if (res.error) for (const r of rows) pending.set(`${r.child_id}|${r.key}`, r); // try again later
  }
  if (events.length) {
    const res = await supabase.from('events').insert(events);
    if (res.error) eventQueue.unshift(...events.slice(-200));
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushSync();
  });
}

/** Download a child's saved progress into this device's localStorage. */
export async function pullChild(childId: string) {
  const rows = check(await db().from('progress').select('key, data').eq('child_id', childId)) as { key: string; data: unknown }[];
  for (const row of rows ?? []) {
    try {
      localStorage.setItem(childKey(childId, baseKeyFor(row.key)), JSON.stringify(row.data));
    } catch {
      // storage full: the child continues from the server copy next time
    }
  }
}

/** Is there guest progress on this device worth carrying into a new child's profile? */
export function guestProgressKeys(): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith(PROGRESS_PREFIX) || k === ONBOARDING_KEY) keys.push(k);
    }
  } catch {
    // ignore
  }
  return keys;
}

/** Copy this device's guest progress into a child's profile, and upload it. */
export async function adoptGuestProgress(childId: string) {
  const rows: { child_id: string; key: string; data: unknown; updated_at: string }[] = [];
  for (const k of guestProgressKeys()) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      localStorage.setItem(childKey(childId, k), raw);
      const syncKey = k === ONBOARDING_KEY ? 'onboarding' : k.slice(PROGRESS_PREFIX.length);
      rows.push({ child_id: childId, key: syncKey, data: JSON.parse(raw), updated_at: new Date().toISOString() });
    } catch {
      // skip anything unreadable
    }
  }
  if (rows.length) check(await db().from('progress').upsert(rows, { onConflict: 'child_id,key' }));
}

function clearChildLocal(childId: string) {
  try {
    const prefix = `yg-c-${childId}-`;
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith(prefix)) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

// ---------- Events and concepts ----------

const eventQueue: { child_id: string; type: string; data: unknown }[] = [];

/** Usage events go to our own events table (never a third party), only for signed-in families. */
export function queueEvent(type: string, data?: unknown) {
  const child = readActive();
  if (!child || !supabase) return;
  if (eventQueue.length > 500) return;
  eventQueue.push({ child_id: child.id, type, data: data ?? null });
  if (!timer) timer = setTimeout(() => void flushSync(), 2500);
}

export async function recordConcepts(projectId: string, concepts: string[]) {
  const child = readActive();
  if (!child || !supabase || concepts.length === 0) return;
  await supabase
    .from('concepts_learned')
    .upsert(
      concepts.map((concept) => ({ child_id: child.id, concept, project: projectId })),
      { onConflict: 'child_id,concept', ignoreDuplicates: true },
    );
}

// ---------- Data controls (DPDP) ----------

/** Everything we hold about this family, as one JSON file. */
export async function exportFamilyData(): Promise<Blob> {
  const d = db();
  const [user, parents, consents, children, progress, events, concepts] = await Promise.all([
    d.auth.getUser(),
    d.from('parents').select('*'),
    d.from('consents').select('*'),
    d.from('children').select('*'),
    d.from('progress').select('*'),
    d.from('events').select('*').order('at'),
    d.from('concepts_learned').select('*'),
  ]);
  const body = {
    exportedAt: new Date().toISOString(),
    account: { email: user.data.user?.email ?? null, createdAt: user.data.user?.created_at ?? null },
    parent: parents.data,
    consents: consents.data,
    children: children.data,
    progress: progress.data,
    events: events.data,
    conceptsLearned: concepts.data,
  };
  return new Blob([JSON.stringify(body, null, 2)], { type: 'application/json' });
}

/** Deletes the parent's account and every child's data, on the server and on this device. */
export async function deleteFamilyAccount(children: Child[]) {
  check(await db().rpc('delete_my_account'));
  for (const c of children) clearChildLocal(c.id);
  setActiveChild(null);
  await db().auth.signOut();
}
