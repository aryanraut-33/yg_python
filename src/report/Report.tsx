// Hidden page (/report) for the Phase 1 observer. Reads the on-device session log.
import { useMemo, useState } from 'react';
import { clearSessions, getCurrentSessionId, getSessions, renameSession, startNewSession, type Session } from '../telemetry/sessionLog';
import { clearProgress } from '../sandbox/progress';
import { clearOnboarding } from '../onboarding/progress';
import { loadProjects } from '../content/projects';
import { linkClick } from '../router';
import './report.css';

const PROJECT_ID = 'name-light-show';
const FIRST_RUN_TARGET_S = 180;

interface Summary {
  session: Session;
  onboarding: string;
  onboardingMinutes: number | null;
  openedAt: number | null;
  firstRunS: number | null;
  stepsDone: number;
  finished: boolean;
  usedAnswerHint: boolean;
  finishedAlone: boolean;
  hints: number[];
  errors: Record<string, number>;
  runs: number;
  minutes: number | null;
  stepTimes: { step: string; s: number; hints: number }[];
}

function summarise(session: Session): Summary {
  const ev = session.events;
  // The clock starts when the child first opens the onboarding (or the project, if they skipped it).
  const opened = ev.find((e) => e.type === 'onboard_open' || e.type === 'sandbox_open');
  const openedAt = opened ? opened.t : null;
  const firstRun = ev.find((e) => e.type === 'run' && e.data?.step !== 'intro');
  const obOpen = ev.find((e) => e.type === 'onboard_open');
  const obDone = ev.find((e) => e.type === 'onboard_complete');
  const lastScreen = [...ev].reverse().find((e) => e.type === 'onboard_screen' && !String(e.data?.id).startsWith('tour-'));
  const skipped = ev.filter((e) => e.type === 'onboard_skip').map((e) => String(e.data?.chapter));
  const diag = ev.find((e) => e.type === 'onboard_diag');
  const onboardingMinutes = obDone ? Math.round((Number(obDone.data?.ms ?? 0) / 60000) * 10) / 10 : null;
  const onboarding = !obOpen
    ? 'Not opened'
    : obDone
      ? `Done in ${onboardingMinutes} min`
      : `Stopped at ${lastScreen ? String(lastScreen.data?.id) : 'the start'}`;
  const extras = [skipped.length ? `skipped ${skipped.join(', ')}` : '', diag ? `quick check ${diag.data?.score}/${diag.data?.of} → ${diag.data?.track}` : ''].filter(Boolean).join(' · ');
  const firstRunS = openedAt !== null && firstRun ? Math.round((firstRun.t - openedAt) / 1000) : null;
  const completes = ev.filter((e) => e.type === 'step_complete');
  const stepsDone = new Set(completes.map((e) => String(e.data?.step))).size;
  const finished = ev.some((e) => e.type === 'project_complete');
  const hints = [0, 0, 0, 0, 0];
  for (const e of ev) if (e.type === 'hint') hints[Number(e.data?.level ?? 1) - 1] += 1;
  const usedAnswerHint = hints[4] > 0;
  const errors: Record<string, number> = {};
  for (const e of ev) if (e.type === 'error') errors[String(e.data?.id)] = (errors[String(e.data?.id)] ?? 0) + 1;
  const runs = ev.filter((e) => e.type === 'run').length;
  const last = ev[ev.length - 1];
  const minutes = openedAt !== null && last ? Math.round(((last.t - openedAt) / 60000) * 10) / 10 : null;
  const stepTimes = completes.map((e) => ({ step: String(e.data?.step), s: Math.round(Number(e.data?.ms ?? 0) / 1000), hints: Number(e.data?.hints ?? 0) }));
  return { session, onboarding: extras ? `${onboarding} (${extras})` : onboarding, onboardingMinutes, openedAt, firstRunS, stepsDone, finished, usedAnswerHint, finishedAlone: finished && !usedAnswerHint, hints, errors, runs, minutes, stepTimes };
}

function asText(summaries: Summary[], totalSteps: number): string {
  const rows = summaries.map((s) =>
    [
      s.session.label,
      new Date(s.session.startedAt).toLocaleString(),
      s.session.viewport,
      s.onboarding,
      s.firstRunS ?? '-',
      `${s.stepsDone}/${totalSteps}`,
      s.finished ? 'yes' : 'no',
      s.finishedAlone ? 'yes' : 'no',
      s.hints.join(' '),
      Object.entries(s.errors).map(([k, v]) => `${k}×${v}`).join(' ') || '-',
      s.runs,
      s.minutes ?? '-',
    ].join('\t'),
  );
  return ['Kid\tStarted\tScreen\tOnboarding\tFirst run (s)\tSteps\tFinished\tAlone\tHints L1-L5\tErrors\tRuns\tMinutes', ...rows].join('\n');
}

export function Report() {
  const [version, setVersion] = useState(0);
  const sessions = useMemo(() => getSessions(), [version]);
  const currentId = useMemo(() => getCurrentSessionId(), [version]);
  const totalSteps = useMemo(() => {
    const p = loadProjects().find((x) => x.manifest.id === PROJECT_ID);
    return p ? p.manifest.milestones.reduce((n, m) => n + m.steps.length, 0) : 0;
  }, []);
  const summaries = useMemo(
    () => sessions.filter((s) => s.events.some((e) => e.type === 'sandbox_open' || e.type === 'onboard_open')).map(summarise).reverse(),
    [sessions],
  );
  const [copied, setCopied] = useState(false);

  const kids = summaries.length;
  const alone = summaries.filter((s) => s.finishedAlone).length;
  const quickStart = summaries.filter((s) => s.firstRunS !== null && s.firstRunS <= FIRST_RUN_TARGET_S).length;
  const onboarded = summaries.filter((s) => s.onboardingMinutes !== null);
  const medianOnboarding = onboarded.length
    ? [...onboarded.map((s) => s.onboardingMinutes!)].sort((a, b) => a - b)[Math.floor(onboarded.length / 2)]
    : null;

  const nextKid = () => {
    const label = window.prompt('Label for the next kid (no real names needed):', `Kid ${sessions.length + 1}`);
    if (label === null) return;
    clearProgress(PROJECT_ID);
    clearOnboarding();
    startNewSession(label || undefined);
    setVersion((v) => v + 1);
  };

  const clearAll = () => {
    if (!window.confirm('Delete every session on this device? This cannot be undone.')) return;
    clearSessions();
    clearProgress(PROJECT_ID);
    clearOnboarding();
    setVersion((v) => v + 1);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText(summaries, totalSteps));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this:', asText(summaries, totalSteps));
    }
  };

  return (
    <div className="report">
      <header className="report-head">
        <div>
          <p className="guide-eyebrow">Phase 1 · Observer report · this device only</p>
          <h1>Session report</h1>
        </div>
        <div className="report-actions">
          <button className="btn btn-primary" onClick={nextKid}>
            Reset for the next kid
          </button>
          <button className="btn btn-ghost" onClick={copy} disabled={kids === 0}>
            {copied ? 'Copied!' : 'Copy as table'}
          </button>
          <a className="btn btn-ghost" href={`/play/${PROJECT_ID}`} onClick={linkClick}>
            Open the starter
          </a>
        </div>
      </header>

      <section className="gate-cards" aria-label="Phase 1 gate">
        <div className="gate-card">
          <span className="gate-num">
            {alone} / {kids}
          </span>
          <span className="gate-label">finished the starter alone (no answer hint)</span>
          <span className={`gate-target ${kids > 0 && alone / kids >= 0.7 ? 'met' : ''}`}>Target: 7 of 10</span>
        </div>
        <div className="gate-card">
          <span className="gate-num">
            {quickStart} / {kids}
          </span>
          <span className="gate-label">ran code within 3 minutes of starting</span>
          <span className="gate-target">Onboarding now comes first, so this target needs re-setting</span>
        </div>
        <div className="gate-card">
          <span className="gate-num">
            {onboarded.length} / {kids}
          </span>
          <span className="gate-label">finished the onboarding with Nix and Riff</span>
          <span className="gate-target">{medianOnboarding === null ? 'Median time: –' : `Median time: ${medianOnboarding} min`}</span>
        </div>
      </section>

      {kids === 0 ? (
        <p className="report-empty">No sessions yet. Press "Reset for the next kid", then hand over the laptop at the starter project.</p>
      ) : (
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>Kid</th>
                <th>Onboarding</th>
                <th>First run</th>
                <th>Steps</th>
                <th>Finished alone?</th>
                <th>Hints (levels 1-5)</th>
                <th>Errors</th>
                <th>Runs</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.session.id} className={s.session.id === currentId ? 'current' : undefined}>
                  <td>
                    <button
                      className="link-btn"
                      onClick={() => {
                        const label = window.prompt('Rename this session:', s.session.label);
                        if (label) {
                          renameSession(s.session.id, label);
                          setVersion((v) => v + 1);
                        }
                      }}
                    >
                      {s.session.label}
                    </button>
                    {s.session.id === currentId && <span className="tag-now">now</span>}
                    <div className="sub">
                      {new Date(s.session.startedAt).toLocaleString()} · {s.session.viewport}
                    </div>
                  </td>
                  <td>{s.onboarding}</td>
                  <td className={s.firstRunS !== null && s.firstRunS <= FIRST_RUN_TARGET_S ? 'ok' : 'warn'}>
                    {s.firstRunS === null ? '–' : s.firstRunS < 120 ? `${s.firstRunS} s` : `${Math.round(s.firstRunS / 6) / 10} min`}
                  </td>
                  <td>
                    {s.stepsDone} / {totalSteps}
                  </td>
                  <td className={s.finishedAlone ? 'ok' : s.finished ? 'warn' : ''}>
                    {s.finished ? (s.finishedAlone ? 'Yes' : 'Finished, used answer hint') : 'Not finished'}
                  </td>
                  <td>{s.hints.join(' · ')}</td>
                  <td>
                    {Object.keys(s.errors).length === 0
                      ? '–'
                      : Object.entries(s.errors)
                          .sort((a, b) => b[1] - a[1])
                          .map(([k, v]) => `${k} ×${v}`)
                          .join(', ')}
                  </td>
                  <td>{s.runs}</td>
                  <td>{s.minutes === null ? '–' : `${s.minutes} min`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {summaries.length > 0 && (
        <details className="report-details">
          <summary>Time and hints per step (latest session first)</summary>
          {summaries.map((s) => (
            <div key={s.session.id} className="step-times">
              <p className="sub">{s.session.label}</p>
              <ol>
                {s.stepTimes.map((t) => (
                  <li key={t.step}>
                    {t.step}: {t.s} s{t.hints ? `, ${t.hints} hint${t.hints > 1 ? 's' : ''}` : ''}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </details>
      )}

      <footer className="report-foot">
        <p>
          Everything here is stored in this browser only and never sent anywhere. Use labels like "Kid 3", not real names.
        </p>
        <button className="link-btn" onClick={clearAll}>
          Delete all sessions
        </button>
      </footer>
    </div>
  );
}
