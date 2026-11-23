// /progress: Detailed learning progress for the active child.
// Features progress from beginning, last week, and last month: projects built, concepts mastered, and personalized stats.
import { useEffect, useMemo, useState } from 'react';
import { SiteNav } from '../ui/SiteNav';
import { MascotImg } from '../onboarding/mascots';
import { liveProjects } from '../content/projects';
import { loadProgress } from '../sandbox/progress';
import { useActiveChild } from './family';
import { navigate, linkClick } from '../router';
import { fetchChildAppreciations, type ChildAppreciation } from '../sharing/publish';
import { calculateAppreciationBadges } from '../sharing/badges';
import { buzz } from '../ui/fx';
import './account.css';
import './progress-page.css';

type Timeframe = 'all' | 'month' | 'week';

interface ProjectProgressRow {
  id: string;
  title: string;
  pitch: string;
  steps: number;
  done: number;
  finished: boolean;
  started: boolean;
  updatedAt: number;
}

export function ProgressPage() {
  const child = useActiveChild();
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [appreciations, setAppreciations] = useState<ChildAppreciation[]>([]);

  useEffect(() => {
    if (!child) navigate('/family');
  }, [child]);

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

  const allRows: ProjectProgressRow[] = useMemo(() => {
    return liveProjects().map((p) => {
      const steps = p.manifest.milestones.reduce((n, m) => n + m.steps.length, 0);
      const prog = loadProgress(p.manifest.id);
      return {
        id: p.manifest.id,
        title: p.manifest.title,
        pitch: p.manifest.pitch,
        steps,
        done: prog.done.length,
        finished: prog.stepIndex >= steps,
        started: prog.stepIndex >= 0,
        updatedAt: prog.updatedAt ?? 0,
      };
    });
  }, [child?.id]);

  // Filter projects by selected timeframe
  const filteredRows = useMemo(() => {
    const now = Date.now();
    const cutoff =
      timeframe === 'week'
        ? now - 7 * 86400 * 1000
        : timeframe === 'month'
        ? now - 30 * 86400 * 1000
        : 0;

    return allRows.filter((r) => {
      if (!r.started && !r.finished) return timeframe === 'all';
      return r.updatedAt >= cutoff;
    });
  }, [allRows, timeframe]);

  const finishedCount = filteredRows.filter((r) => r.finished).length;
  const inProgressCount = filteredRows.filter((r) => r.started && !r.finished).length;

  const badgeSummary = useMemo(
    () => calculateAppreciationBadges(appreciations),
    [appreciations],
  );

  // Key concepts taught across Level 1 & 2 projects
  const conceptsList = [
    {
      id: 'print',
      name: 'print() & Screen Output',
      desc: 'Instructs Python to display text or numbers on the console screen.',
      learned: allRows.some((r) => r.started),
    },
    {
      id: 'variables',
      name: 'Variables',
      desc: 'Named storage locations in memory holding data that can change over time.',
      learned: allRows.some((r) => r.started && r.done >= 3),
    },
    {
      id: 'coordinates',
      name: 'Stage Coordinates (x, y)',
      desc: 'Horizontal (x) and vertical (y) pixel positions across the 640×400 canvas.',
      learned: allRows.some((r) => r.id === 'name-light-show' && r.done >= 2),
    },
    {
      id: 'loops',
      name: 'for Loops & range()',
      desc: 'Repeats a code block multiple times without writing repetitive statements.',
      learned: allRows.some((r) => r.id === 'rocket-launch' && r.started),
    },
    {
      id: 'turtle',
      name: 'Turtle Graphics & Angles',
      desc: 'Commands a virtual pen using heading angles and forward motion to draw geometry.',
      learned: allRows.some((r) => r.id === 'spiral-art' && r.started),
    },
    {
      id: 'conditionals',
      name: 'if / else Conditionals',
      desc: 'Evaluates logical Boolean conditions to branch program execution.',
      learned: allRows.some((r) => r.id === 'guess-my-number' && r.started),
    },
    {
      id: 'lists',
      name: 'Lists & Randomness',
      desc: 'Ordered data structures storing sequences of items accessible by position.',
      learned: allRows.some((r) => r.id === 'story-machine' && r.started),
    },
  ];

  const conceptsLearnedCount = conceptsList.filter((c) => c.learned).length;

  if (!child) return null;

  return (
    <div className="acct-page">
      <SiteNav onHome={false} />

      <main className="acct progress-main">
        {/* Header */}
        <header className="home-hello">
          <div>
            <span className="label">[ Learning Progress ]</span>
            <h1 className="acct-title">{child.firstName}'s Coding Progress</h1>
            <p className="acct-lead">
              A comprehensive view of projects built, Python concepts mastered, and family milestones.
            </p>
          </div>
          <div className="home-cast" aria-hidden="true">
            <MascotImg who="nix" pose="welcome" />
            <MascotImg who="riff" pose="pointing" />
          </div>
        </header>

        {/* Timeframe Filter Tabs */}
        <div className="progress-timeframe-bar">
          <span className="label">Timeframe:</span>
          <div className="progress-tabs" role="tablist">
            <button
              type="button"
              className={`progress-tab${timeframe === 'all' ? ' is-active' : ''}`}
              onClick={() => {
                buzz(8);
                setTimeframe('all');
              }}
            >
              From Beginning
            </button>
            <button
              type="button"
              className={`progress-tab${timeframe === 'month' ? ' is-active' : ''}`}
              onClick={() => {
                buzz(8);
                setTimeframe('month');
              }}
            >
              Last Month
            </button>
            <button
              type="button"
              className={`progress-tab${timeframe === 'week' ? ' is-active' : ''}`}
              onClick={() => {
                buzz(8);
                setTimeframe('week');
              }}
            >
              Last Week
            </button>
          </div>
        </div>

        {/* High-level Metric Cards */}
        <div className="progress-stats-grid">
          <div className="progress-metric-card">
            <span className="label">Projects Completed</span>
            <span className="progress-metric-val">{finishedCount}</span>
            <span className="progress-metric-sub">
              {allRows.length} total projects in current level
            </span>
          </div>

          <div className="progress-metric-card">
            <span className="label">Active Builds</span>
            <span className="progress-metric-val">{inProgressCount}</span>
            <span className="progress-metric-sub">Projects in progress</span>
          </div>

          <div className="progress-metric-card">
            <span className="label">Concepts Mastered</span>
            <span className="progress-metric-val">{conceptsLearnedCount}</span>
            <span className="progress-metric-sub">of {conceptsList.length} foundational topics</span>
          </div>

          <div className="progress-metric-card">
            <span className="label">Family Cheers</span>
            <span className="progress-metric-val">{appreciations.length}</span>
            <span className="progress-metric-sub">
              from {badgeSummary.uniquePeopleCount} family members
            </span>
          </div>
        </div>

        {/* Projects Section */}
        <section className="progress-section">
          <div className="home-projects-head">
            <h2 className="acct-subtitle">Projects in this period</h2>
            <a className="mono-link" href="/projects" onClick={linkClick}>
              Explore catalogue →
            </a>
          </div>

          {filteredRows.length === 0 ? (
            <div className="progress-empty-box">
              <p>No project activity recorded in this timeframe.</p>
              <a className="led-btn led-btn-sm" href="/projects" onClick={linkClick}>
                Start a project →
              </a>
            </div>
          ) : (
            <div className="progress-projects-grid">
              {filteredRows.map((r) => (
                <div key={r.id} className={`progress-p-card${r.finished ? ' is-done' : ''}`}>
                  <div className="progress-p-top">
                    <span className="label">{r.finished ? 'Completed ✓' : r.started ? 'In Progress' : 'Available'}</span>
                    {r.updatedAt > 0 && (
                      <span className="progress-p-date">
                        {new Date(r.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>

                  <h3 className="progress-p-title">{r.title}</h3>
                  <p className="progress-p-pitch">{r.pitch}</p>

                  <div className="progress-p-foot">
                    <span className="label">
                      {r.finished ? `${r.steps}/${r.steps} steps complete` : `${r.done}/${r.steps} steps`}
                    </span>
                    <a className="mono-link" href={`/play/${r.id}`} onClick={linkClick}>
                      {r.finished ? 'Replay build →' : r.started ? 'Continue →' : 'Start →'}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Concepts Mastered Section */}
        <section className="progress-section">
          <div className="home-projects-head">
            <h2 className="acct-subtitle">Python Concepts Mastered</h2>
            <a className="mono-link" href="/learn" onClick={linkClick}>
              Review learn lessons →
            </a>
          </div>

          <div className="progress-concepts-grid">
            {conceptsList.map((c) => (
              <div key={c.id} className={`progress-concept-card${c.learned ? ' is-learned' : ''}`}>
                <div className="progress-c-status">
                  <span className="progress-c-badge">
                    {c.learned ? '✓ Learned' : 'Coming Up'}
                  </span>
                </div>
                <h3 className="progress-c-name">{c.name}</h3>
                <p className="progress-c-desc">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Family Appreciation Badges Section */}
        <section className="progress-section">
          <div className="home-projects-head">
            <h2 className="acct-subtitle">Family Circle Milestones</h2>
          </div>
          <div className="progress-badges-box">
            <div className="progress-badges-grid">
              {badgeSummary.badges.map((b) => (
                <div key={b.id} className={`badge-card${b.unlocked ? ' is-unlocked' : ''}`}>
                  <div className="badge-top">
                    <span className="badge-card-icon" aria-hidden="true">{b.icon}</span>
                    <span className={`badge-status-pill${b.unlocked ? ' is-done' : ''}`}>
                      {b.unlocked ? 'Unlocked ✓' : `${b.current} / ${b.target}`}
                    </span>
                  </div>
                  <h4 className="badge-card-title">{b.title}</h4>
                  <p className="badge-card-desc">{b.description}</p>
                  <div className="badge-progress-wrap" aria-hidden="true">
                    <div className="badge-progress-bar" style={{ width: `${b.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
