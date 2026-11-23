// /family: the grown-ups' area. Sign in with an emailed link, give consent once,
// add children by first name, then pick who's coding on this device.
import { useEffect, useState, type FormEvent } from 'react';
import { linkClick, navigate } from '../router';
import { SiteNav } from '../ui/SiteNav';
import { MascotImg } from '../onboarding/mascots';
import { buzz } from '../ui/fx';
import { accountsEnabled } from './supabase';
import {
  addChild,
  adoptGuestProgress,
  deleteFamilyAccount,
  ensureParent,
  exportFamilyData,
  getWeeklyEmail,
  guestProgressKeys,
  hasCurrentConsent,
  listChildren,
  pullChild,
  recordConsent,
  removeChild,
  sendSignInLink,
  setActiveChild,
  setChildSubscription,
  setWeeklyEmail,
  signOut,
  useActiveChild,
  useSession,
  wasDeviceEvicted,
  clearDeviceEvicted,
  getActiveChild,
  type Child,
} from './family';
import { isParentVerified, ParentGateModal } from './ParentGateModal';
import { fetchChildAppreciations, type ChildAppreciation } from '../sharing/publish';
import { AppreciationBadges } from '../sharing/AppreciationBadges';
import './account.css';

export function Family() {
  const { session, loading } = useSession();
  const [evicted, setEvicted] = useState(wasDeviceEvicted);
  const [parentUnlocked, setParentUnlocked] = useState(isParentVerified);
  const activeChild = getActiveChild();

  const dismissEvicted = () => {
    clearDeviceEvicted();
    setEvicted(false);
  };

  // If a child is active and parent is not yet verified, protect family settings with Parent Gate
  if (session && activeChild && !parentUnlocked) {
    return (
      <div className="acct-page">
        <SiteNav onHome={false} />
        <ParentGateModal
          title="Parent Verification"
          actionDescription="Family settings, adding children, and account management are for grown-ups."
          onSuccess={() => setParentUnlocked(true)}
          onClose={() => navigate('/home')}
        />
      </div>
    );
  }

  return (
    <div className="acct-page">
      <SiteNav onHome={false} />
      <main className="acct">
        {evicted && (
          <div className="acct-card acct-evicted" role="alert">
            <p className="label">[ Device Notice ]</p>
            <p className="acct-lead">
              Your account was signed out because it was opened on another device. Tinkora accounts can only be registered to 1 device at a time.
            </p>
            <button className="mono-link acct-linkbtn" onClick={dismissEvicted}>
              Dismiss notice
            </button>
          </div>
        )}
        {!accountsEnabled ? (
          <Notice title="Family accounts are coming soon">
            For now, everything works without signing up, and progress is saved on this device.
          </Notice>
        ) : loading ? (
          <p className="label acct-loading">Checking…</p>
        ) : !session ? (
          <SignIn />
        ) : (
          <FamilyHub userId={session.user.id} email={session.user.email ?? ''} />
        )}
      </main>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="acct-card">
      <h1 className="acct-title">{title}</h1>
      <p className="acct-lead">{children}</p>
    </section>
  );
}

// ---------- Sign in ----------

function SignIn() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('That email address doesn\'t look right. Check it and try again.');
      setState('error');
      return;
    }
    setState('sending');
    try {
      await sendSignInLink(email);
      setState('sent');
    } catch (err) {
      setError(friendly(err));
      setState('error');
    }
  };

  return (
    <div className="acct-split">
      <section className="acct-card">
        <p className="label">[ For grown-ups ]</p>
        <h1 className="acct-title">Set up your family</h1>
        <p className="acct-lead">
          First project "Name Light Show" is free for everyone. A free family account opens the other projects and keeps your child's progress safe
          across devices.
        </p>
        {state === 'sent' ? (
          <div className="acct-sent" role="status">
            <p className="acct-sent-title">Check your inbox</p>
            <p>
              We sent a sign-in link to <strong>{email.trim()}</strong>. Open it on this device. It may take a minute, and it might land in
              spam.
            </p>
            <button className="mono-link acct-linkbtn" onClick={() => setState('idle')}>
              Use a different email
            </button>
          </div>
        ) : (
          <form className="acct-form" onSubmit={submit} noValidate>
            <label className="label" htmlFor="parent-email">
              Your email
            </label>
            <input
              id="parent-email"
              className="acct-input"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {state === 'error' && (
              <p className="acct-error" role="alert">
                {error}
              </p>
            )}
            <button className="led-btn" type="submit" disabled={state === 'sending'} onPointerDown={() => buzz(12)}>
              {state === 'sending' ? 'Sending…' : 'Email me a sign-in link'} <span aria-hidden="true">→</span>
            </button>
            <p className="acct-small">No password needed. We'll only use your email for sign-in and, if you choose, a weekly progress email.</p>
          </form>
        )}
      </section>
      <aside className="acct-side">
        <MascotImg who="nix" pose="welcome" className="acct-mascot" />
        <ul className="acct-facts">
          <li>Children never need an email or password.</li>
          <li>We keep your child's first name only.</li>
          <li>No ads. No third-party tracking.</li>
          <li>Download or delete everything, any time.</li>
        </ul>
        <a className="mono-link" href="/privacy" onClick={linkClick}>
          Read the privacy notice
        </a>
      </aside>
    </div>
  );
}

// ---------- Signed in ----------

type Stage = 'loading' | 'consent' | 'add-child' | 'pick' | 'error';

function FamilyHub({ userId, email }: { userId: string; email: string }) {
  const [stage, setStage] = useState<Stage>('loading');
  const [children, setChildren] = useState<Child[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      await ensureParent(userId);
      if (!(await hasCurrentConsent(userId))) {
        setStage('consent');
        return;
      }
      const kids = await listChildren();
      setChildren(kids);
      setStage(kids.length ? 'pick' : 'add-child');
    } catch (err) {
      setError(friendly(err));
      setStage('error');
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (stage === 'loading') return <p className="label acct-loading">Opening your family…</p>;
  if (stage === 'error')
    return (
      <Notice title="Something went wrong">
        {error}{' '}
        <button className="mono-link acct-linkbtn" onClick={() => void load()}>
          Try again
        </button>
      </Notice>
    );
  if (stage === 'consent') return <Consent userId={userId} onDone={() => void load()} />;
  if (stage === 'add-child')
    return (
      <AddChild
        userId={userId}
        first={children.length === 0}
        onAdded={(kid) => {
          setChildren((c) => [...c, kid]);
          setStage('pick');
        }}
        onCancel={children.length ? () => setStage('pick') : undefined}
      />
    );
  return (
    <Pick
      userId={userId}
      email={email}
      children={children}
      onAdd={() => setStage('add-child')}
      onRemoved={(id) => setChildren((c) => c.filter((k) => k.id !== id))}
      onUpdated={(kid) => setChildren((c) => c.map((k) => (k.id === kid.id ? kid : k)))}
    />
  );
}

// ---------- Consent ----------

function Consent({ userId, onDone }: { userId: string; onDone(): void }) {
  const [isParentAdult, setAdult] = useState(false);
  const [agreesToNotice, setAgree] = useState(false);
  const [weeklyEmail, setWeekly] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isParentAdult || !agreesToNotice) return;
    setBusy(true);
    try {
      await recordConsent(userId, { isParentAdult, agreesToNotice, weeklyEmail });
      onDone();
    } catch (err) {
      setError(friendly(err));
      setBusy(false);
    }
  };

  return (
    <section className="acct-card acct-wide">
      <p className="label">[ Step 1 of 2 · Your permission ]</p>
      <h1 className="acct-title">Before your child starts</h1>
      <p className="acct-lead">Here's exactly what we keep, in plain words.</p>
      <div className="acct-table" role="table" aria-label="What we keep and why">
        {[
          ['Your email', 'To sign you in, and for the weekly progress email if you want it.'],
          ["Your child's first name and birth year", 'So Nix and Riff can greet them, and to pick the right projects for their age.'],
          ['Their code and progress', 'So they can carry on where they stopped, on any device.'],
          ['What happens while they code (runs, errors, hints)', 'Only to find where lessons are confusing and fix them. Kept in our own database, never shared.'],
        ].map(([what, why]) => (
          <div className="acct-row" role="row" key={what}>
            <span role="cell" className="acct-what">
              {what}
            </span>
            <span role="cell" className="acct-why">
              {why}
            </span>
          </div>
        ))}
      </div>
      <p className="acct-small">
        We never show ads, sell data, or use third-party trackers. Data is stored in India (Mumbai). You can download or delete it all,
        any time, from this page.
      </p>
      <form className="acct-form" onSubmit={submit}>
        <label className="acct-check">
          <input type="checkbox" checked={isParentAdult} onChange={(e) => setAdult(e.target.checked)} />
          <span>I'm the parent or legal guardian of the child (or children) I'll add, and I'm 18 or older.</span>
        </label>
        <label className="acct-check">
          <input type="checkbox" checked={agreesToNotice} onChange={(e) => setAgree(e.target.checked)} />
          <span>
            I've read the{' '}
            <a href="/privacy" target="_blank" rel="noreferrer">
              privacy notice and terms
            </a>{' '}
            and I agree to them.
          </span>
        </label>
        <label className="acct-check">
          <input type="checkbox" checked={weeklyEmail} onChange={(e) => setWeekly(e.target.checked)} />
          <span>Send me a short weekly email about what my child built and learned. (Optional)</span>
        </label>
        {error && (
          <p className="acct-error" role="alert">
            {error}
          </p>
        )}
        <button className="led-btn" type="submit" disabled={!isParentAdult || !agreesToNotice || busy} onPointerDown={() => buzz(12)}>
          {busy ? 'Saving…' : 'I agree'} <span aria-hidden="true">→</span>
        </button>
      </form>
    </section>
  );
}

// ---------- Add a child ----------

const THIS_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: 11 }, (_, i) => THIS_YEAR - 6 - i).filter((y) => y >= 2006 && y <= 2022);

function AddChild({ userId, first, onAdded, onCancel }: { userId: string; first: boolean; onAdded(c: Child): void; onCancel?: () => void }) {
  const [firstName, setFirstName] = useState('');
  const [birthYear, setBirthYear] = useState<number | ''>('');
  const hasGuest = first && guestProgressKeys().length > 0;
  const [adopt, setAdopt] = useState(hasGuest);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const name = firstName.trim();
    if (!name) return setError('Type your child\'s first name.');
    if (/\s/.test(name)) return setError('Just the first name, please. No surname needed.');
    if (!birthYear) return setError('Pick the year your child was born.');
    setBusy(true);
    setError('');
    try {
      const kid = await addChild(userId, name, birthYear);
      if (adopt) await adoptGuestProgress(kid.id);
      onAdded(kid);
    } catch (err) {
      setError(friendly(err));
      setBusy(false);
    }
  };

  return (
    <section className="acct-card">
      <p className="label">[ {first ? 'Step 2 of 2 · ' : ''}Add a child ]</p>
      <h1 className="acct-title">Who's going to code?</h1>
      <form className="acct-form" onSubmit={submit} noValidate>
        <label className="label" htmlFor="child-name">
          First name
        </label>
        <input
          id="child-name"
          className="acct-input"
          autoComplete="off"
          maxLength={30}
          placeholder="e.g. Meera"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <p className="acct-small">First name only. It's how Nix and Riff will greet them.</p>
        <label className="label" htmlFor="child-year">
          Year of birth
        </label>
        <select id="child-year" className="acct-input" value={birthYear} onChange={(e) => setBirthYear(Number(e.target.value) || '')}>
          <option value="">Pick a year</option>
          {BIRTH_YEARS.map((y) => (
            <option key={y} value={y}>
              {y} (about {THIS_YEAR - y})
            </option>
          ))}
        </select>
        <p className="acct-small">Tinkora is made for ages 10 to 14.</p>
        {hasGuest && (
          <label className="acct-check">
            <input type="checkbox" checked={adopt} onChange={(e) => setAdopt(e.target.checked)} />
            <span>Bring the progress already saved on this device into their profile.</span>
          </label>
        )}
        {error && (
          <p className="acct-error" role="alert">
            {error}
          </p>
        )}
        <div className="acct-actions">
          <button className="led-btn" type="submit" disabled={busy} onPointerDown={() => buzz(12)}>
            {busy ? 'Adding…' : 'Add child'} <span aria-hidden="true">→</span>
          </button>
          {onCancel && (
            <button type="button" className="mono-link acct-linkbtn" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

// ---------- Pick a child + grown-up controls ----------

function Pick({
  userId,
  email,
  children,
  onAdd,
  onRemoved,
  onUpdated,
}: {
  userId: string;
  email: string;
  children: Child[];
  onAdd(): void;
  onRemoved(id: string): void;
  onUpdated(kid: Child): void;
}) {
  const active = useActiveChild();
  const [opening, setOpening] = useState<string | null>(null);
  const [weekly, setWeekly] = useState<boolean | null>(null);
  const [confirmDelete, setConfirmDelete] = useState('');
  const [message, setMessage] = useState('');
  const [appreciations, setAppreciations] = useState<ChildAppreciation[]>([]);

  useEffect(() => {
    getWeeklyEmail(userId).then(setWeekly).catch(() => setWeekly(null));
  }, [userId]);

  useEffect(() => {
    if (!active?.id) return;
    let alive = true;
    fetchChildAppreciations(active.id)
      .then((data) => {
        if (alive) setAppreciations(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [active?.id]);

  const open = async (kid: Child) => {
    setOpening(kid.id);
    buzz(12);
    setActiveChild({
      id: kid.id,
      firstName: kid.first_name,
      subscriptionStatus: kid.subscription_status ?? 'free',
    });
    try {
      await pullChild(kid.id);
    } catch {
      // Offline: carry on with whatever is on this device.
    }
    navigate('/home');
  };

  const download = async () => {
    setMessage('Preparing your file…');
    try {
      const blob = await exportFamilyData();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `tinkora-family-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      setMessage('Downloaded.');
    } catch (err) {
      setMessage(friendly(err));
    }
  };

  const remove = async (kid: Child) => {
    if (!window.confirm(`Remove ${kid.first_name}'s profile? Their projects, code and progress will be deleted for good.`)) return;
    try {
      await removeChild(kid.id);
      onRemoved(kid.id);
    } catch (err) {
      setMessage(friendly(err));
    }
  };

  const deleteAll = async () => {
    try {
      await deleteFamilyAccount(children);
      navigate('/');
    } catch (err) {
      setMessage(friendly(err));
    }
  };

  return (
    <div className="acct-stack">
      <section className="acct-card acct-wide">
        <p className="label">[ This device ]</p>
        <h1 className="acct-title">Who's coding today?</h1>
        <ul className="kid-grid">
          {children.map((kid, i) => {
            const isSub = kid.subscription_status === 'active';
            return (
              <li key={kid.id}>
                <button className={`kid-card${active?.id === kid.id ? ' is-active' : ''}`} onClick={() => void open(kid)} disabled={opening !== null}>
                  <MascotImg who={i % 2 ? 'riff' : 'nix'} pose="welcome" className="kid-mascot" />
                  <span className="kid-name">{kid.first_name}</span>
                  <span className={`kid-pass-badge ${isSub ? 'is-active' : 'is-free'}`}>
                    {isSub ? 'Pass Active' : 'Free Starter'}
                  </span>
                  <span className="label">{opening === kid.id ? 'Opening…' : active?.id === kid.id ? 'Coding now · continue' : 'Start coding'}</span>
                </button>
              </li>
            );
          })}
          <li>
            <button className="kid-card kid-add" onClick={onAdd}>
              <span className="kid-plus" aria-hidden="true">
                +
              </span>
              <span className="label">Add a child</span>
            </button>
          </li>
        </ul>
      </section>

      {active && (
        <AppreciationBadges
          appreciations={appreciations}
          childName={active.firstName}
        />
      )}

      <section className="acct-card acct-wide acct-grownups">
        <p className="label">[ Grown-ups only ]</p>
        <h2 className="acct-subtitle">Your family account</h2>
        <p className="acct-small">Signed in as {email}</p>
        <div className="acct-controls">
          <label className="acct-check">
            <input
              type="checkbox"
              checked={weekly ?? false}
              disabled={weekly === null}
              onChange={async (e) => {
                const on = e.target.checked;
                setWeekly(on);
                try {
                  await setWeeklyEmail(userId, on);
                } catch (err) {
                  setWeekly(!on);
                  setMessage(friendly(err));
                }
              }}
            />
            <span>Weekly progress email</span>
          </label>
          <button className="mono-link acct-linkbtn" onClick={() => void download()}>
            Download all our data
          </button>
          <button
            className="mono-link acct-linkbtn"
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
          >
            Sign out of this device
          </button>
        </div>

        {children.length > 0 && (
          <div className="acct-passes">
            <p className="label">[ Child learning passes ]</p>
            <p className="acct-small">
              Each child requires their own pass to access all 26 projects. Starter project "Name Light Show" is always free.
            </p>
            <div className="acct-pass-list">
              {children.map((kid) => {
                const isSub = kid.subscription_status === 'active';
                return (
                  <div key={kid.id} className="acct-pass-row">
                    <span className="acct-pass-name">{kid.first_name}</span>
                    <span className={`kid-pass-badge ${isSub ? 'is-active' : 'is-free'}`}>
                      {isSub ? 'Pass Active' : 'Free Starter'}
                    </span>
                    <button
                      className="mono-link acct-linkbtn"
                      onClick={async () => {
                        const next = isSub ? 'free' : 'active';
                        try {
                          await setChildSubscription(kid.id, next);
                          onUpdated({ ...kid, subscription_status: next });
                          setMessage(`${kid.first_name}'s pass updated to ${next === 'active' ? 'Active' : 'Free'}.`);
                        } catch (err) {
                          setMessage(friendly(err));
                        }
                      }}
                    >
                      {isSub ? 'Pause pass' : 'Activate pass'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {children.length > 0 && (
          <div className="acct-kids-manage">
            {children.map((kid) => (
              <button key={kid.id} className="mono-link acct-linkbtn acct-danger-link" onClick={() => void remove(kid)}>
                Remove {kid.first_name}'s profile
              </button>
            ))}
          </div>
        )}
        <details className="acct-delete">
          <summary className="mono-link">Delete our account</summary>
          <p className="acct-small">
            This deletes your account and every child's profile, code and progress, for good. Type <strong>DELETE</strong> to confirm.
          </p>
          <div className="acct-actions">
            <input className="acct-input acct-input-sm" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} aria-label="Type DELETE to confirm" />
            <button className="led-btn led-btn-sm acct-danger" disabled={confirmDelete !== 'DELETE'} onClick={() => void deleteAll()}>
              Delete everything
            </button>
          </div>
        </details>
        {message && (
          <p className="acct-small" role="status">
            {message}
          </p>
        )}
      </section>
    </div>
  );
}

function friendly(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/rate limit|too many/i.test(msg)) return 'Too many tries in a short time. Wait a minute, then try again.';
  if (/fetch|network/i.test(msg)) return 'We couldn\'t reach the server. Check your internet connection and try again.';
  if (/sending (confirmation|magic link|recovery)? ?email|smtp/i.test(msg)) return 'We couldn\'t send the email just now. Please try again in a few minutes.';
  return msg;
}
