// /home: The child's personal Python studio dashboard.
// Enhanced with Three.js 3D interactive stage core, shadcn-inspired components,
// interactive mascot companion lounge, daily code spark riddle, and filterable project catalogue.
import { useEffect, useMemo, useRef, useState } from 'react';
import { linkClick, navigate } from '../router';
import { SiteNav } from '../ui/SiteNav';
import { MascotImg } from '../onboarding/mascots';
import { buzz } from '../ui/fx';
import { liveProjects } from '../content/projects';
import { loadProgress } from '../sandbox/progress';
import { onboardingCompleted } from '../onboarding/progress';
import { useActiveChild } from './family';
import { fetchChildAppreciations, type ChildAppreciation } from '../sharing/publish';
import { calculateAppreciationBadges } from '../sharing/badges';
import { PRESET_COMPLIMENTS } from '../sharing/studio';
import { MicroTerminal3D } from './MicroTerminal3D';
import './account.css';
import './child-home.css';

interface Row {
  id: string;
  title: string;
  pitch: string;
  steps: number;
  done: number;
  stepIndex: number;
  finished: boolean;
  started: boolean;
  updatedAt: number;
  level: number;
}

type FilterTab = 'all' | 'in-progress' | 'finished' | 'starters';

interface MascotTip {
  who: 'nix' | 'riff';
  pose: 'pointing' | 'celebrating' | 'welcome';
  quote: string;
}

const MASCOT_TIPS: MascotTip[] = [
  {
    who: 'nix',
    pose: 'pointing',
    quote: 'Words always need quotation marks like "Hello", but numbers like 42 go bare.',
  },
  {
    who: 'riff',
    pose: 'celebrating',
    quote: 'You can repeat words in Python using multiplication: print("Python! " * 3) prints three times.',
  },
  {
    who: 'nix',
    pose: 'welcome',
    quote: 'When you encounter an error, check the very bottom line. That is where Python gives the clearest hint.',
  },
  {
    who: 'riff',
    pose: 'pointing',
    quote: 'Stage canvas coordinates: (0, 0) is top-left, and (320, 200) marks the exact center.',
  },
  {
    who: 'nix',
    pose: 'celebrating',
    quote: 'Functions are reusable recipes: write them once with def, and call them whenever you need.',
  },
  {
    who: 'riff',
    pose: 'welcome',
    quote: 'Loops with range(5) run 5 times, counting 0, 1, 2, 3, and 4 in order.',
  },
];

const SPARK_QUIZ = {
  title: 'Daily Code Spark: Joining Words',
  code: 'word = "Code"\nprint("Super " + word)',
  options: [
    { id: 'a', label: 'Super Code', isCorrect: true },
    { id: 'b', label: 'Superword', isCorrect: false },
    { id: 'c', label: 'Error', isCorrect: false },
  ],
  explanation: 'In Python, the + operator joins two strings together (called string concatenation).',
};

const CONCEPTS = [
  { name: 'Output', label: 'print()' },
  { name: 'Storage', label: 'Variables' },
  { name: 'Logic', label: 'if / else' },
  { name: 'Repetition', label: 'Loops' },
  { name: 'Drawing', label: 'Stage (x, y)' },
  { name: 'Reusable', label: 'Functions' },
];

export function ChildHome() {
  const child = useActiveChild();
  const [appreciations, setAppreciations] = useState<ChildAppreciation[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [tipIndex, setTipIndex] = useState(0);
  const [sparkChoice, setSparkChoice] = useState<string | null>(null);

  useEffect(() => {
    if (!child) navigate('/family');
  }, [child]);

  // Load family reactions for this child
  useEffect(() => {
    if (!child?.id) return;
    let alive = true;
    fetchChildAppreciations(child.id)
      .then((data) => {
        if (alive) setAppreciations(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [child?.id]);

  const rows: Row[] = useMemo(
    () =>
      liveProjects().map((p) => {
        const steps = p.manifest.milestones.reduce((n, m) => n + m.steps.length, 0);
        const prog = loadProgress(p.manifest.id);
        return {
          id: p.manifest.id,
          title: p.manifest.title,
          pitch: p.manifest.pitch,
          steps,
          done: prog.done.length,
          stepIndex: prog.stepIndex,
          finished: prog.stepIndex >= steps,
          started: prog.stepIndex >= 0,
          updatedAt: prog.updatedAt ?? 0,
          level: p.manifest.level ?? 1,
        };
      }),
    [child?.id],
  );

  if (!child) return null;

  const inProgress = rows.filter((r) => r.started && !r.finished).sort((a, b) => b.updatedAt - a.updatedAt);
  const finishedCount = rows.filter((r) => r.finished).length;
  const startersCount = rows.filter((r) => r.level === 1).length;

  const badgeSummary = calculateAppreciationBadges(appreciations);

  // Onboarding card only shows if child hasn't finished the intro session and hasn't started projects
  const showOnboarding =
    !onboardingCompleted() &&
    !rows.some((r) => r.started || r.finished) &&
    finishedCount === 0;

  // Filtered rows based on selected tab
  const filteredRows = rows.filter((r) => {
    if (activeTab === 'in-progress') return r.started && !r.finished;
    if (activeTab === 'finished') return r.finished;
    if (activeTab === 'starters') return r.level === 1;
    return true;
  });

  const activeTip = MASCOT_TIPS[tipIndex];

  const handleNextTip = () => {
    buzz(8);
    setTipIndex((prev) => (prev + 1) % MASCOT_TIPS.length);
  };

  const handleSparkAnswer = (optId: string) => {
    setSparkChoice(optId);
    const opt = SPARK_QUIZ.options.find((o) => o.id === optId);
    if (opt?.isCorrect) {
      buzz(15);
    } else {
      buzz(35);
    }
  };

  return (
    <div className="acct-page">
      <SiteNav onHome={false} />

      <main className="child-home-main">
        {/* 1. Hero Workshop Section with Interactive Three.js 3D Core */}
        <header className="child-hero">
          <div className="child-hero-info">
            <span className="child-hero-badge">Python Studio &middot; {child.firstName}&apos;s Workshop</span>
            <h1 className="child-hero-title">Hi {child.firstName}</h1>
            <p className="child-hero-lead">
              Build games, animations, and experiments with real Python code. Everything you create runs right in your browser.
            </p>

            <div className="child-hero-actions">
              <a href="/playground" onClick={linkClick} className="child-act-btn child-act-primary">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Free Playground</span>
              </a>
              <a href="/learn" onClick={linkClick} className="child-act-btn child-act-ghost">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <path d="M6 6h10" />
                  <path d="M6 10h10" />
                </svg>
                <span>Learn Lessons</span>
              </a>
              <a href="/progress" onClick={linkClick} className="child-act-btn child-act-ghost">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <span>My Progress</span>
              </a>
            </div>
          </div>

          {/* Three.js 3D Interactive Core */}
          <div className="child-hero-3d">
            <MicroTerminal3D />
          </div>
        </header>

        {/* 2. Interactive Mascot Companion Lounge (Nix & Riff) */}
        <section
          className="mascot-lounge-card"
          onClick={handleNextTip}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNextTip();
            }
          }}
          aria-label="Click for next coding tip"
        >
          <div className="mascot-lounge-avatar" aria-hidden="true">
            <MascotImg who={activeTip.who} pose={activeTip.pose} />
          </div>

          <div className="mascot-lounge-body">
            <div className="mascot-lounge-top">
              <span className="mascot-lounge-speaker">
                {activeTip.who === 'nix' ? 'Nix says' : 'Riff says'}
              </span>
              <span className="mascot-lounge-counter">
                Tip {tipIndex + 1} of {MASCOT_TIPS.length} &middot; Tap for next tip &rarr;
              </span>
            </div>
            <p className="mascot-lounge-quote">{activeTip.quote}</p>
          </div>
        </section>

        {/* 3. Metrics & Skill Mastery Overview (3 shadcn Cards with SVG icons) */}
        <div className="child-metrics-grid">
          {/* Card 1: Projects Built */}
          <div className="child-metric-card">
            <div className="child-metric-header">
              <span className="label">Projects Built</span>
              <span className="child-metric-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </span>
            </div>
            <p className="child-metric-value">
              {finishedCount} <span className="acct-small">of {rows.length}</span>
            </p>
            <div className="badge-progress-wrap" aria-hidden="true">
              <div
                className="badge-progress-bar"
                style={{ width: `${Math.round((finishedCount / rows.length) * 100)}%` }}
              />
            </div>
            <p className="child-metric-desc">
              {inProgress.length === 0
                ? 'Ready to start a new creation.'
                : `${inProgress.length} project currently in progress.`}
            </p>
          </div>

          {/* Card 2: Concept Superpowers */}
          <div className="child-metric-card">
            <div className="child-metric-header">
              <span className="label">Python Concepts</span>
              <span className="child-metric-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </span>
            </div>
            <div className="child-concepts-wrap">
              {CONCEPTS.map((c, i) => (
                <a
                  key={c.name}
                  href="/learn"
                  onClick={linkClick}
                  className={`child-concept-chip${finishedCount > 0 || inProgress.length > 0 || i < 2 ? ' is-active' : ''}`}
                >
                  <span>{c.label}</span>
                  {(finishedCount > 0 || inProgress.length > 0 || i < 2) && <span>✓</span>}
                </a>
              ))}
            </div>
            <p className="child-metric-desc">Concepts practiced in builds. Tap any to learn.</p>
          </div>

          {/* Card 3: Family Cheers */}
          <div className="child-metric-card">
            <div className="child-metric-header">
              <span className="label">Family Cheers</span>
              <span className="child-metric-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </span>
            </div>
            <p className="child-metric-value">
              {appreciations.length}{' '}
              <span className="acct-small">from {badgeSummary.uniquePeopleCount} people</span>
            </p>
            <p className="child-metric-desc">
              {appreciations.length === 0
                ? 'Share builds with family on weekends to receive cheers here.'
                : `${badgeSummary.uniquePeopleNames.slice(0, 3).join(', ')} cheered your code.`}
            </p>
          </div>
        </div>

        {/* 4. Interactive Daily Code Spark (Micro-riddle) */}
        <section className="spark-card" aria-labelledby="spark-heading">
          <div className="spark-header">
            <span className="label">Quick Brain Spark</span>
            <h2 id="spark-heading" className="spark-title">{SPARK_QUIZ.title}</h2>
          </div>
          <pre className="spark-pre">
            <code>{SPARK_QUIZ.code}</code>
          </pre>
          <div className="spark-options">
            {SPARK_QUIZ.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`spark-opt-btn${
                  sparkChoice === opt.id
                    ? opt.isCorrect
                      ? ' is-correct'
                      : ' is-wrong'
                    : ''
                }`}
                onClick={() => handleSparkAnswer(opt.id)}
              >
                {opt.label} {sparkChoice === opt.id && (opt.isCorrect ? '✓' : '✕')}
              </button>
            ))}
          </div>
          {sparkChoice && (
            <p className="spark-feedback">
              {sparkChoice === 'a'
                ? `Correct. ${SPARK_QUIZ.explanation}`
                : `Not quite. Try again. In Python, + joins text together.`}
            </p>
          )}
        </section>

        {/* 5. Onboarding Prompt (only if brand new and 0 projects started) */}
        {showOnboarding && (
          <a className="home-continue home-onboard" href="/start" onClick={linkClick} onPointerDown={() => buzz(10)}>
            <span className="label">New to Python?</span>
            <span className="home-continue-title">Meet Nix and Riff first</span>
            <span className="acct-small">Seven short lessons, then you are ready to build.</span>
            <span className="home-arrow" aria-hidden="true">
              &rarr;
            </span>
          </a>
        )}

        {/* 6. Projects Studio Explorer with Filter Tabs */}
        <section className="child-explorer-section" aria-labelledby="explorer-heading">
          <div className="child-explorer-head">
            <h2 id="explorer-heading" className="child-explorer-title">
              Python Projects
            </h2>

            {/* shadcn-style Segmented Tabs */}
            <div className="child-tabs-list" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'all'}
                className={`child-tab-btn${activeTab === 'all' ? ' is-active' : ''}`}
                onClick={() => {
                  buzz(8);
                  setActiveTab('all');
                }}
              >
                All ({rows.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'in-progress'}
                className={`child-tab-btn${activeTab === 'in-progress' ? ' is-active' : ''}`}
                onClick={() => {
                  buzz(8);
                  setActiveTab('in-progress');
                }}
              >
                In Progress ({inProgress.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'finished'}
                className={`child-tab-btn${activeTab === 'finished' ? ' is-active' : ''}`}
                onClick={() => {
                  buzz(8);
                  setActiveTab('finished');
                }}
              >
                Built ({finishedCount})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'starters'}
                className={`child-tab-btn${activeTab === 'starters' ? ' is-active' : ''}`}
                onClick={() => {
                  buzz(8);
                  setActiveTab('starters');
                }}
              >
                Starters ({startersCount})
              </button>
            </div>
          </div>

          <div className="child-projects-grid">
            {filteredRows.map((r, i) => (
              <a
                key={r.id}
                className={`child-pcard${r.finished ? ' is-done' : ''}`}
                href={`/play/${r.id}`}
                onClick={linkClick}
                onPointerDown={() => buzz(8)}
              >
                <div className="child-pcard-head">
                  <span className="child-pcard-no">PROJECT {String(i + 1).padStart(2, '0')}</span>
                  <span
                    className={`child-pcard-badge${
                      r.finished ? ' is-done' : r.started ? ' is-active' : ''
                    }`}
                  >
                    {r.finished
                      ? 'Built ✓'
                      : r.started
                      ? `Step ${r.stepIndex + 1} of ${r.steps}`
                      : 'Ready to build'}
                  </span>
                </div>

                <h3 className="child-pcard-title">{r.title}</h3>
                <p className="child-pcard-pitch">{r.pitch}</p>

                <div className="child-pcard-foot">
                  <div className="child-pcard-steps">
                    <Segments total={r.steps} done={r.done} />
                  </div>
                  <span className="child-pcard-cta">
                    <span>{r.finished ? 'Open Studio' : r.started ? 'Resume' : 'Build'}</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <p className="acct-small home-switch">
          Signed in as {child.firstName}.{' '}
          <a href="/family" onClick={linkClick} className="mono-link">
            Switch child
          </a>
        </p>
      </main>

      {/* Floating Cheers Notification Button in bottom-right corner */}
      <CheersNotificationButton appreciations={appreciations} />
    </div>
  );
}

function Segments({ total, done }: { total: number; done: number }) {
  return (
    <span className="segments" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < done ? 'on' : ''} />
      ))}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  try {
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return '';
  }
}

/** Floating notification button in bottom-right corner with adjoining popover (~20% width) */
function CheersNotificationButton({ appreciations }: { appreciations: ChildAppreciation[] }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent | globalThis.MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const toggle = () => {
    buzz(10);
    setOpen((v) => !v);
  };

  return (
    <div className="cheers-fab-wrap" ref={wrapRef}>
      {open && (
        <div className="cheers-popover" role="dialog" aria-label="Family Cheers">
          <div className="cheers-popover-head">
            <h3 className="cheers-popover-title">
              <span>Family Cheers</span>
              {appreciations.length > 0 && (
                <span className="cheers-popover-count">{appreciations.length}</span>
              )}
            </h3>
            <button
              className="cheers-popover-close"
              onClick={() => setOpen(false)}
              aria-label="Close cheers"
            >
              ✕
            </button>
          </div>

          <div className="cheers-popover-body">
            {appreciations.length === 0 ? (
              <p className="cheers-popover-empty">
                No cheers yet. Share your projects with family to get compliments here.
              </p>
            ) : (
              appreciations.map((a) => {
                const preset = PRESET_COMPLIMENTS.find((c) => c.id === a.preset) ?? {
                  emoji: '❤️',
                  label: a.preset,
                };
                const time = timeAgo(a.createdAt);
                return (
                  <div key={a.id} className="cheers-popover-item">
                    <span className="cheers-popover-emoji" aria-hidden="true">
                      {preset.emoji}
                    </span>
                    <div className="cheers-popover-info">
                      <span className="cheers-popover-sender">
                        <strong>{a.recipientName}</strong> cheered &ldquo;{preset.label}&rdquo;
                      </span>
                      <span className="cheers-popover-project">
                        on {a.projectTitle} {time && `· ${time}`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        className="cheers-fab-btn"
        onClick={toggle}
        aria-expanded={open}
        aria-label={`Family Cheers (${appreciations.length} received)`}
        title="Family Cheers"
      >
        <span className="cheers-fab-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="currentColor" fillOpacity="0.25" />
          </svg>
        </span>
        {appreciations.length > 0 && (
          <span className="cheers-badge">{appreciations.length}</span>
        )}
      </button>
    </div>
  );
}
