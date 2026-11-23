import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { SiteNav } from '../ui/SiteNav';
import { StageRenderer } from '../stage/StageRenderer';
import { TouchControls } from '../stage/TouchControls';
import { getRunner, useRunnerEvents, useRunnerStatus } from '../runtime/runnerHub';
import { buzz } from '../ui/fx';
import { linkClick } from '../router';
import {
  fetchSharedStudio,
  sendReaction,
  PRESET_COMPLIMENTS,
  type SharedStudioData,
  type StudioProject,
} from './studio';
import './studio.css';

interface Props {
  token: string;
}

type StudioView = 'screen' | 'console' | 'code';

export function StudioPage({ token }: Props) {
  const [data, setData] = useState<SharedStudioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [reactedPresets, setReactedPresets] = useState<Set<string>>(new Set());
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [toast, setToast] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [hasStageOutput, setHasStageOutput] = useState(false);
  const [activeView, setActiveView] = useState<StudioView>('screen');
  const [showAbout, setShowAbout] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showTouchControls, setShowTouchControls] = useState(false);

  const status = useRunnerStatus();
  const renderer = useMemo(() => new StageRenderer(), []);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleInputSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    buzz(10);
    getRunner().submitInput(inputValue);
    setInputValue('');
  };

  // Set noindex meta tag for privacy
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const created = !meta;
    if (created) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta!.content = 'noindex, nofollow';
    return () => {
      if (created && meta && meta.parentNode) meta.parentNode.removeChild(meta);
    };
  }, []);

  // Fetch shared studio data
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchSharedStudio(token)
      .then((res) => {
        if (!alive) return;
        if (!res.valid) {
          setError(res.error || 'This invite link is invalid or has been revoked.');
        } else {
          setData(res);
          if (res.projects.length > 0) {
            setActiveProjectId(res.projects[0].id);
          }
          const counts: Record<string, number> = {};
          for (const r of res.reactions) {
            counts[r.preset] = (counts[r.preset] || 0) + Number(r.count);
          }
          setReactionCounts(counts);
        }
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Could not load studio page');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token]);

  // Robust canvas callback ref: guarantees renderer is attached to live canvas
  const attachCanvas = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      canvasRef.current = canvas;
      renderer.attach(canvas);
      if (canvas) {
        renderer.present();
      }
    },
    [renderer],
  );

  const activeProject: StudioProject | null = useMemo(() => {
    if (!data || !activeProjectId) return null;
    return data.projects.find((p) => p.id === activeProjectId) ?? data.projects[0] ?? null;
  }, [data, activeProjectId]);

  useRunnerEvents({
    onStdout: (t) => {
      setOutput((prev) => [...prev.slice(-60), t]);
    },
    onStderr: (t) => {
      setOutput((prev) => [...prev.slice(-60), `[error] ${t}`]);
    },
    onStage: (b) => {
      setHasStageOutput(true);
      renderer.push(b);
    },
    onDone: (r) => {
      if (r.stopped) setOutput((prev) => [...prev, '\n■ Stopped.\n']);
    },
  });

  const runCode = useCallback(() => {
    if (!activeProject) return;
    buzz(12);
    setHasRun(true);
    setHasStageOutput(false);
    setOutput([]);
    renderer.reset();
    if (canvasRef.current) renderer.attach(canvasRef.current);
    const runner = getRunner();
    runner.stop();
    setTimeout(() => {
      runner.run(activeProject.code);
    }, 60);
  }, [activeProject, renderer]);

  const stopCode = useCallback(() => {
    buzz(8);
    getRunner().stop();
  }, []);

  const handleReaction = async (presetId: string) => {
    if (!activeProject || reactedPresets.has(presetId)) return;
    buzz(10);
    setReactedPresets((prev) => new Set([...prev, presetId]));
    setReactionCounts((prev) => ({ ...prev, [presetId]: (prev[presetId] || 0) + 1 }));
    setToast(`Sent! ${data?.childName || 'They'} will see your cheer on their dashboard. ✨`);
    setTimeout(() => setToast(''), 3500);

    try {
      await sendReaction(token, activeProject.id, presetId);
    } catch {
      // ignore
    }
  };

  const busy = status === 'running' || status === 'waiting-for-input';

  // ── Loading state ──
  if (loading) {
    return (
      <div className="studio-hero-page">
        <SiteNav onHome={false} />
        <main className="studio-hero-main">
          <p className="label" style={{ textAlign: 'center', padding: '160px 0' }}>
            Opening family studio…
          </p>
        </main>
      </div>
    );
  }

  // ── Error state ──
  if (error || !data) {
    return (
      <div className="studio-hero-page">
        <SiteNav onHome={false} />
        <main className="studio-hero-main">
          <div className="studio-error-card">
            <p className="label">[ Link Inactive ]</p>
            <h1 className="studio-error-title">Invite link unavailable</h1>
            <p className="studio-error-desc">
              {error || 'This link may have expired or been revoked by the family.'}
            </p>
            <a className="led-btn" href="/" onClick={linkClick}>
              Go to Tinkora home →
            </a>
          </div>
        </main>
      </div>
    );
  }

  // Determine whether to display the text story screen vs canvas
  const showTextScreen = hasRun && !hasStageOutput && output.length > 0;

  return (
    <div className="studio-hero-page">
      <SiteNav onHome={false} />

      <main className="studio-hero-main">
        {/* ── LEFT COLUMN: Greeting, Compliments, Corner element ── */}
        <section className="studio-col-left">
          <div className="studio-intro">
            <span className="label">[ Family Studio · For {data.recipientName} ]</span>
            <h1 className="studio-greeting-title">
              {data.recipientName}, look what<br />
              {data.childName} built!
            </h1>
            <p className="studio-greeting-sub">
              Made with real Python code. Click <strong>Run</strong> on the right to see it work in your browser!
            </p>
          </div>

          {/* Compliments / Reactions */}
          <div className="studio-react-box">
            <div className="studio-react-head">
              <span className="label">[ Cheer {data.childName} on ]</span>
              <p className="studio-react-hint">
                Tap any compliment — {data.childName} sees it live on their home screen:
              </p>
            </div>

            {toast && <p className="studio-toast">{toast}</p>}

            <div className="studio-react-grid">
              {PRESET_COMPLIMENTS.map((c) => {
                const hasReacted = reactedPresets.has(c.id);
                const count = reactionCounts[c.id] || 0;
                return (
                  <button
                    key={c.id}
                    className={`studio-react-btn${hasReacted ? ' has-reacted' : ''}`}
                    onClick={() => void handleReaction(c.id)}
                    disabled={hasReacted}
                  >
                    <span className="studio-react-emoji">{c.emoji}</span>
                    <span className="studio-react-label">{c.label}</span>
                    {count > 0 && <span className="studio-react-badge">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Bottom-left corner element: About Tinkora trigger ── */}
          <div className="studio-corner-about">
            <button
              type="button"
              className="studio-about-pill"
              onClick={() => setShowAbout((s) => !s)}
              aria-expanded={showAbout}
            >
              <span className="studio-about-star">✦</span>
              <span>About Tinkora</span>
              <span className="studio-about-arrow">{showAbout ? '✕' : '→'}</span>
            </button>

            {showAbout && (
              <div className="studio-about-popover" role="region" aria-label="About Tinkora">
                <p className="label">[ Built on Tinkora ]</p>
                <p className="studio-about-desc">
                  <strong>{data.childName}</strong> built this on Tinkora, where kids aged 9–15 learn
                  real Python by building games, art, and experiments.
                </p>
                <a className="led-btn studio-about-cta" href="/" onClick={linkClick}>
                  Explore Tinkora →
                </a>
              </div>
            )}
          </div>
        </section>

        {/* ── RIGHT COLUMN: The Stage Player & Smart Screen ── */}
        <section className="studio-col-right">
          <div className="studio-player-card">
            {/* Top Bar: Title & View Selector */}
            <div className="studio-player-topbar">
              <div className="studio-player-meta">
                {/* Project tabs if multiple */}
                {data.projects.length > 1 ? (
                  <div className="studio-tabs" role="tablist">
                    {data.projects.map((p) => (
                      <button
                        key={p.id}
                        role="tab"
                        aria-selected={activeProjectId === p.id}
                        className={`studio-tab${activeProjectId === p.id ? ' is-active' : ''}`}
                        onClick={() => {
                          setActiveProjectId(p.id);
                          setOutput([]);
                          setHasRun(false);
                          setHasStageOutput(false);
                          renderer.reset();
                        }}
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                ) : (
                  <h2 className="studio-project-title">{activeProject?.title ?? 'Project'}</h2>
                )}
                <span className="studio-project-author">by {data.childName}</span>
              </div>

              {/* View mode toggle */}
              <div className="studio-view-toggle">
                <button
                  className={`studio-view-btn${activeView === 'screen' ? ' is-active' : ''}`}
                  onClick={() => setActiveView('screen')}
                >
                  Screen
                </button>
                <button
                  className={`studio-view-btn${activeView === 'console' ? ' is-active' : ''}`}
                  onClick={() => setActiveView('console')}
                >
                  Output {output.length > 0 && `(${output.length})`}
                </button>
                <button
                  className={`studio-view-btn${activeView === 'code' ? ' is-active' : ''}`}
                  onClick={() => setActiveView('code')}
                >
                  Python Code
                </button>
              </div>
            </div>

            {/* Status bar */}
            <div className="studio-player-subbar">
              <span className={`studio-status-indicator${busy ? ' is-running' : ''}`}>
                <span className="studio-status-dot" />
                {status === 'waiting-for-input'
                  ? 'Waiting for your input…'
                  : busy
                    ? 'Running Python…'
                    : hasRun
                      ? 'Execution finished'
                      : 'Ready to run'}
              </span>
              {activeView === 'screen' && !showTextScreen && (
                <button
                  type="button"
                  className={`studio-touch-toggle${showTouchControls ? ' is-active' : ''}`}
                  onClick={() => setShowTouchControls((s) => !s)}
                  aria-pressed={showTouchControls}
                >
                  <span>🎮 Touch Controls {showTouchControls ? 'ON' : 'OFF'}</span>
                </button>
              )}
              <span className="studio-tech-note">Pyodide CPython in browser</span>
            </div>

            {/* Screen Content: Screen | Console | Code */}
            <div className="studio-screen-viewport">
              {activeView === 'screen' && (
                <div className="studio-screen-container">
                  {/* Visual Canvas (Always mounted and attached via ref) */}
                  <canvas
                    ref={attachCanvas}
                    className="studio-canvas"
                    width={640}
                    height={400}
                    style={{
                      display: !showTextScreen ? 'block' : 'none',
                    }}
                  />

                  {/* Story / Text Output Screen (when project prints text rather than canvas) */}
                  {showTextScreen && (
                    <div className="studio-story-screen">
                      <div className="studio-story-badge">
                        <span>✦ Story Generated by Python ✦</span>
                      </div>
                      <div className="studio-story-content">
                        {output.map((line, idx) => (
                          <p key={idx} className="studio-story-line">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Standby screen overlay before first run */}
                  {!hasRun && (
                    <div className="studio-standby-overlay" onClick={runCode}>
                      <div className="studio-standby-inner">
                        <span className="studio-standby-icon">▶</span>
                        <p className="studio-standby-prompt">
                          Click to run {activeProject?.title ?? 'code'}
                        </p>
                        <span className="studio-standby-sub">Written by {data.childName}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Console Tab */}
              {activeView === 'console' && (
                <div className="studio-console-tab">
                  {output.length === 0 ? (
                    <p className="studio-console-empty">
                      No console output yet. Click <strong>Run</strong> below to execute the program.
                    </p>
                  ) : (
                    <div className="studio-console-lines">
                      {output.map((line, idx) => (
                        <div key={idx} className="studio-console-line">
                          {line}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Code Tab */}
              {activeView === 'code' && (
                <div className="studio-code-tab">
                  <div className="studio-code-head">
                    <span className="label">[ {data.childName}'s Python script ]</span>
                  </div>
                  <pre className="studio-code-pre">
                    <code>{activeProject?.code}</code>
                  </pre>
                </div>
              )}
            </div>

            {/* Interactive Input Prompt Bar */}
            {status === 'waiting-for-input' && (
              <form className="studio-input-bar" onSubmit={handleInputSubmit}>
                <label htmlFor="studio-user-input" className="studio-input-label">
                  Python is waiting for your reply:
                </label>
                <div className="studio-input-row">
                  <input
                    id="studio-user-input"
                    type="text"
                    className="studio-input-field"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your answer here..."
                    autoFocus
                  />
                  <button type="submit" className="led-btn studio-input-submit" onPointerDown={() => buzz(10)}>
                    Send ↵
                  </button>
                </div>
              </form>
            )}

            {/* Mobile Touch Controller */}
            {showTouchControls && activeView === 'screen' && !showTextScreen && (
              <TouchControls />
            )}

            {/* Controls Bar */}
            <div className="studio-player-controls">
              {busy ? (
                <button className="led-btn studio-btn-stop" onClick={stopCode}>
                  Stop ■
                </button>
              ) : (
                <button className="led-btn studio-btn-run" onClick={runCode}>
                  {hasRun ? `Run again ↻` : `Run ${activeProject?.title ?? 'project'} ▶`}
                </button>
              )}
              <span className="studio-controls-hint">
                {busy
                  ? 'Python is calculating in real-time…'
                  : hasRun
                    ? 'Ran 100% in your browser'
                    : 'Click to execute real Python code'}
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
