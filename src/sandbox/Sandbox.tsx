import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CodeEditor } from '../editor/CodeEditor';
import { translateError } from '../errors/translate';
import { STARTER_ID, loadProjects } from '../content/projects';
import { accountsEnabled } from '../account/supabase';
import { recordConcepts, useActiveChild } from '../account/family';
import { ParentGate } from '../account/ParentGate';
import type { LoadedProject, Milestone, Step } from '../content/types';
import { getRunner, useRunnerEvents, useRunnerStatus } from '../runtime/runnerHub';
import type { CheckSpec } from '../runtime/protocol';
import { StageRenderer } from '../stage/StageRenderer';
import { Console, type ConsoleLine, type ShownError } from '../ui/Console';
import { ThemeToggle } from '../ui/ThemeToggle';
import { PlayIcon, StopIcon } from '../ui/icons';
import { linkClick, navigate } from '../router';
import { logEvent } from '../telemetry/sessionLog';
import { clearProgress, emptyProgress, loadProgress, progressKey, saveProgress, type Progress } from './progress';
import { Guide, type StepFeedback } from './Guide';
import { ConceptPopout, GLOSSARY } from './ConceptPopout';
import { PublishModal } from '../sharing/PublishModal';
import './sandbox.css';

const MAX_CONSOLE_CHARS = 40_000;

export interface FlatStep {
  step: Step;
  milestone: Milestone;
  milestoneIndex: number;
  index: number;
}

function flatten(project: LoadedProject): FlatStep[] {
  const out: FlatStep[] = [];
  project.manifest.milestones.forEach((milestone, milestoneIndex) =>
    milestone.steps.forEach((step) => out.push({ step, milestone, milestoneIndex, index: out.length })),
  );
  return out;
}

/**
 * Fills `{{key}}` or `{{key|default}}` in step code with values remembered by earlier checks.
 * Plain values go inside quotes in the code, so quotes and backslashes are removed.
 * Keys ending in `_py` hold a Python literal written by our own check (e.g. the child's
 * list of heroes) and are inserted as they are.
 */
export function fillTemplate(src: string, remembered: Record<string, string>) {
  return src.replace(/\{\{(\w+)(?:\|([^}]*))?\}\}/g, (_, k: string, fallback?: string) => {
    const value = remembered[k] ?? fallback ?? (k === 'name' ? 'AARAV' : '');
    return k.endsWith('_py') ? value : value.replace(/["\\]/g, '');
  });
}

function checkSpecFor(project: LoadedProject, step: Step): CheckSpec | null {
  const c = step.check;
  if (!c) return null;
  return { kind: c.kind, value: c.value, description: c.description, code: c.file ? project.files[c.file] : undefined };
}

export function Sandbox({ projectId }: { projectId: string }) {
  const project = useMemo(() => loadProjects().find((p) => p.manifest.id === projectId && !p.manifest.draft), [projectId]);
  const child = useActiveChild();
  if (!project) {
    return (
      <div className="sandbox-missing">
        <p>That project isn't ready yet.</p>
        <a href="/" onClick={linkClick}>
          Back to the start
        </a>
      </div>
    );
  }
  // Guests get the starter project; a grown-up sets up the family to open the rest.
  // Enrolled children require their own active subscription pass for projects beyond the starter.
  if (accountsEnabled && project.manifest.id !== STARTER_ID) {
    if (!child) return <ParentGate title={project.manifest.title} />;
    if (child.subscriptionStatus !== 'active') return <ParentGate title={project.manifest.title} childName={child.firstName} />;
  }
  // Remount when the child changes, so the right child's progress loads.
  return <SandboxInner key={child?.id ?? 'guest'} project={project} />;
}

function SandboxInner({ project }: { project: LoadedProject }) {
  const id = project.manifest.id;
  const steps = useMemo(() => flatten(project), [project]);
  const status = useRunnerStatus();
  const renderer = useMemo(() => new StageRenderer(), []);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [progress, setProgress] = useState<Progress>(() => loadProgress(id));
  const [code, setCode] = useState('');
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [shownError, setShownError] = useState<ShownError | null>(null);
  const [feedback, setFeedback] = useState<StepFeedback>({ kind: 'none' });
  const [hasRunThisStep, setHasRunThisStep] = useState(false);
  const [intro, setIntro] = useState<string | null>(null);
  const previewRun = useRef(false);
  const stepStartedAt = useRef(Date.now());
  const runCount = useRef(0);
  const activeChild = useActiveChild();
  const [sharing, setSharing] = useState(false);

  const handleShare = () => {
    if (!activeChild) {
      navigate('/family');
      return;
    }
    setSharing(true);
  };

  const finished = progress.stepIndex >= steps.length;
  const current = progress.stepIndex >= 0 && !finished ? steps[progress.stepIndex] : null;
  const busy = status === 'running' || status === 'waiting-for-input';

  // Save progress whenever it changes.
  useEffect(() => saveProgress(id, progress), [id, progress]);

  // If another tab changes this project's progress (e.g. "Reset for the next kid" on /report),
  // reload so this tab never overwrites it with stale state.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === progressKey(id) || e.key === null) window.location.reload();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [id]);

  useEffect(() => {
    logEvent('sandbox_open', { project: id, step: progress.stepIndex });
    getRunner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Stage ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    renderer.attach(canvas);
    if (!canvas) return;
    const ro = new ResizeObserver(() => renderer.present());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [renderer]);

  const append = useCallback((kind: ConsoleLine['kind'], text: string) => {
    setLines((prev) => {
      const last = prev[prev.length - 1];
      let next = last && last.kind === kind ? [...prev.slice(0, -1), { kind, text: last.text + text }] : [...prev, { kind, text }];
      let total = next.reduce((n, l) => n + l.text.length, 0);
      while (total > MAX_CONSOLE_CHARS && next.length > 1) {
        total -= next[0].text.length;
        next = next.slice(1);
      }
      return next;
    });
  }, []);

  const clearOutput = useCallback(() => {
    setLines([]);
    setShownError(null);
    renderer.reset();
  }, [renderer]);

  // ---------- Steps ----------
  const startCodeFor = useCallback(
    (i: number, prog: Progress): string => {
      const s = steps[i].step;
      if (prog.startCode[s.id] !== undefined) return prog.startCode[s.id];
      if (s.code) return fillTemplate(project.files[s.code] ?? '', prog.remembered);
      if (i > 0) {
        const prev = steps[i - 1].step.id;
        return prog.code[prev] ?? prog.startCode[prev] ?? '';
      }
      return fillTemplate(project.files[project.manifest.files.starter] ?? '', prog.remembered);
    },
    [project, steps],
  );

  const enterStep = useCallback(
    (i: number, prog: Progress) => {
      clearOutput();
      setFeedback({ kind: 'none' });
      setHasRunThisStep(false);
      stepStartedAt.current = Date.now();
      if (i >= steps.length) {
        const last = steps[steps.length - 1].step.id;
        setCode(prog.freeCode ?? prog.code[last] ?? prog.startCode[last] ?? '');
        setProgress({ ...prog, stepIndex: steps.length });
        return;
      }
      const s = steps[i].step;
      const start = startCodeFor(i, prog);
      const next: Progress = {
        ...prog,
        stepIndex: i,
        startCode: { ...prog.startCode, [s.id]: start },
      };
      setCode(next.code[s.id] ?? start);
      setProgress(next);
      const unseen = (s.introduces ?? []).find((c) => GLOSSARY[c] && !(prog.seenIntros ?? []).includes(c));
      setIntro(unseen ?? null);
      // A step already done (child came back to it) shows as passed.
      if (prog.done.includes(s.id)) setFeedback({ kind: 'passed', message: s.check?.description ?? 'Done!' });
    },
    [clearOutput, startCodeFor, steps],
  );

  // Restore the step (or free-play code) on first load.
  useEffect(() => {
    if (progress.stepIndex >= 0) enterStep(progress.stepIndex, progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCodeChange = (value: string) => {
    setCode(value);
    setProgress((p) => {
      if (p.stepIndex >= steps.length) return { ...p, freeCode: value };
      if (p.stepIndex < 0) return p;
      return { ...p, code: { ...p.code, [steps[p.stepIndex].step.id]: value } };
    });
  };

  const completeStep = useCallback(
    (message: string, remember?: Record<string, string>) => {
      setProgress((p) => {
        if (p.stepIndex < 0 || p.stepIndex >= steps.length) return p;
        const s = steps[p.stepIndex].step;
        if (!p.done.includes(s.id)) {
          logEvent('step_complete', {
            step: s.id,
            index: p.stepIndex,
            ms: Date.now() - stepStartedAt.current,
            hints: p.hintsShown[s.id] ?? 0,
          });
        }
        return {
          ...p,
          done: p.done.includes(s.id) ? p.done : [...p.done, s.id],
          remembered: remember ? { ...p.remembered, ...remember } : p.remembered,
        };
      });
      setFeedback({ kind: 'passed', message });
    },
    [steps],
  );

  // ---------- Running ----------
  useRunnerEvents({
    onStdout: (t) => append('out', t),
    onStderr: (t) => append('err', t),
    onStage: (b) => renderer.push(b),
    onDone: (r) => {
      if (previewRun.current) {
        previewRun.current = false;
        logEvent('preview_done');
        return;
      }
      const step = current?.step;
      if (r.stopped) {
        append('info', '\n■ Stopped.\n');
        logEvent('stop', { step: step?.id ?? 'free' });
        return;
      }
      if (r.error) {
        const kid = translateError(r.error, code);
        setShownError({ kid, raw: r.error });
        logEvent('error', { step: step?.id ?? 'free', id: kid.id, type: r.error.type });
        if (step?.type !== 'predict') setFeedback({ kind: 'none' });
        return;
      }
      if (!step) return;
      if (r.check?.passed) {
        completeStep(r.check.message, r.check.remember);
      } else if (r.check) {
        setFeedback({ kind: 'not-yet', message: r.check.message });
        logEvent('check_failed', { step: step.id });
      }
    },
  });

  const run = useCallback(() => {
    if (busy) return;
    const step = current?.step;
    if (step?.type === 'recall') return;
    if (step?.type === 'predict' && progress.predictions[step.id] === undefined) return;
    clearOutput();
    runCount.current += 1;
    renderer.speech = true;
    setHasRunThisStep(true);
    logEvent('run', { step: step?.id ?? (finished ? 'free' : 'intro'), n: runCount.current });
    getRunner().run(code, step ? checkSpecFor(project, step) : null);
  }, [busy, clearOutput, code, current, finished, progress.predictions, project]);

  const stop = () => getRunner().stop();

  // Intro: play the finished project so the child sees the goal first.
  const playPreview = useCallback(() => {
    if (busy) return;
    clearOutput();
    previewRun.current = true;
    renderer.speech = false; // the intro demo plays silently; the child's own runs can talk
    const files = project.manifest.files;
    const solution = fillTemplate(project.files[files.preview ?? files.solution] ?? '', progress.remembered);
    getRunner().run(solution, null);
  }, [busy, clearOutput, progress.remembered, project]);

  const autoPreviewDone = useRef(false);
  useEffect(() => {
    if (autoPreviewDone.current || progress.stepIndex !== -1 || status !== 'ready') return;
    // Play the finished project once, the first time Python is ready on the intro screen.
    autoPreviewDone.current = true;
    playPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ---------- Guide actions ----------
  const choose = (choice: number) => {
    if (!current) return;
    const s = current.step;
    if (progress.predictions[s.id] !== undefined && (s.type === 'recall' || hasRunThisStep)) return;
    setProgress((p) => ({ ...p, predictions: { ...p.predictions, [s.id]: choice } }));
    logEvent('predict_answer', { step: s.id, choice, correct: choice === s.answer });
    if (s.type === 'recall') completeStep(s.explain ?? 'Done!');
  };

  const showHint = () => {
    if (!current) return;
    const s = current.step;
    const shown = progress.hintsShown[s.id] ?? 0;
    if (shown >= s.hints.length) return;
    setProgress((p) => ({ ...p, hintsShown: { ...p.hintsShown, [s.id]: shown + 1 } }));
    logEvent('hint', { step: s.id, level: shown + 1 });
  };

  const next = () => {
    const i = progress.stepIndex + 1;
    if (busy) getRunner().stop();
    enterStep(i, progress);
    if (i >= steps.length && !finished) {
      logEvent('project_complete', { project: id });
      void recordConcepts(id, project.manifest.concepts);
      // Celebrate by running the child's own finished program.
      const last = steps[steps.length - 1].step.id;
      const finalCode = progress.freeCode ?? progress.code[last] ?? progress.startCode[last] ?? '';
      setTimeout(() => getRunner().run(finalCode, null), 300);
    }
  };

  const restartStep = () => {
    if (!current) return;
    const s = current.step;
    const start = progress.startCode[s.id] ?? '';
    setCode(start);
    setProgress((p) => ({ ...p, code: { ...p.code, [s.id]: start } }));
    clearOutput();
  };

  const startOver = () => {
    if (!window.confirm(`Start ${project.manifest.title} again from the beginning? Your code for this project will be cleared.`)) return;
    if (busy) getRunner().stop();
    clearProgress(id);
    const fresh = emptyProgress();
    setProgress(fresh);
    setCode('');
    setFeedback({ kind: 'none' });
    clearOutput();
  };

  const begin = () => {
    if (busy) getRunner().stop();
    enterStep(0, progress);
  };

  const goTo = (i: number) => {
    // Children can revisit finished steps, or jump to the first unfinished one.
    const firstOpen = steps.findIndex((f) => !progress.done.includes(f.step.id));
    const allowed = i <= (firstOpen === -1 ? steps.length - 1 : firstOpen);
    if (!allowed || i === progress.stepIndex) return;
    if (busy) getRunner().stop();
    enterStep(i, progress);
  };

  const closeIntro = useCallback(() => {
    if (!intro) return;
    setProgress((p) => ({ ...p, seenIntros: [...new Set([...(p.seenIntros ?? []), intro])] }));
    logEvent('concept_intro', { concept: intro });
    setIntro(null);
  }, [intro]);

  const canRun = !busy && status !== 'failed' && current?.step.type !== 'recall' && !(current?.step.type === 'predict' && progress.predictions[current.step.id] === undefined);

  return (
    <div className="sandbox">
      <header className="sb-topbar">
        <a className="wordmark" href="/" onClick={linkClick}>
          Tinkora
        </a>
        <div className="sb-title">
          <span className="sb-project">{project.manifest.title}</span>
          <StepTrack steps={steps} progress={progress} onPick={goTo} />
        </div>
        <div className="sb-top-right">
          <button className="sb-share-pill" onClick={handleShare} title="Share project with family">
            Share with family →
          </button>
          <ChildChip />
          <ThemeToggle />
        </div>
      </header>

      <main className="sb-grid">
        <Guide
          project={project}
          steps={steps}
          progress={progress}
          current={current}
          finished={finished}
          feedback={feedback}
          hasRunThisStep={hasRunThisStep}
          status={status}
          onBegin={begin}
          onChoose={choose}
          onHint={showHint}
          onNext={next}
          onRestartStep={restartStep}
          onStartOver={startOver}
          onPlayPreview={playPreview}
          onRun={run}
          onHome={() => navigate('/')}
          onShowIntro={setIntro}
          onShare={handleShare}
        />

        <section className="panel sb-editor" aria-label="Code">
          <div className="panel-head">
            <span className="file-tab">main.py</span>
            <span className="sb-save-note">Saved on this device</span>
          </div>
          <div className="editor-wrap">
            {progress.stepIndex === -1 ? (
              <div className="sb-editor-placeholder">Your code will appear here when you start.</div>
            ) : (
              <CodeEditor value={code} onChange={onCodeChange} onRun={run} errorLine={shownError?.kid.line ?? null} />
            )}
          </div>
          <div className="run-bar">
            {busy ? (
              <button className="btn btn-stop" onClick={stop}>
                <StopIcon /> Stop
              </button>
            ) : (
              <button className="btn btn-primary" onClick={run} disabled={!canRun || progress.stepIndex === -1}>
                <PlayIcon /> Run
              </button>
            )}
            <span className="hint">
              {status === 'loading' || status === 'restarting'
                ? 'Getting Python ready…'
                : current?.step.type === 'predict' && progress.predictions[current.step.id] === undefined
                  ? 'Pick your guess first, then Run'
                  : 'Ctrl/⌘ + Enter runs your code'}
            </span>
          </div>
        </section>

        <section className="sb-side">
          <div className="panel stage-panel" aria-label="Stage">
            <canvas ref={canvasRef} className="stage-canvas" role="img" aria-label="Stage: what your program draws" />
            {progress.stepIndex === -1 && <span className="stage-badge">What you'll build</span>}
            {/* Art projects make pictures worth keeping as posters. */}
            {progress.stepIndex !== -1 && project.manifest.category === 'art' && (
              <button className="stage-save" onClick={() => renderer.download(`${id}.png`)} title="Save the stage as a picture">
                Save picture
              </button>
            )}
          </div>
          <Console
            lines={lines}
            error={shownError}
            waitingForInput={status === 'waiting-for-input'}
            onSubmitInput={(text) => {
              append('input', text + '\n');
              getRunner().submitInput(text);
            }}
          />
        </section>
      </main>
      {intro && <ConceptPopout id={intro} onClose={closeIntro} />}
      {sharing && activeChild && (
        <PublishModal
          childId={activeChild.id}
          childName={activeChild.firstName}
          projectId={id}
          projectTitle={project.manifest.title}
          currentCode={code}
          onClose={() => setSharing(false)}
        />
      )}
    </div>
  );
}

function StepTrack({ steps, progress, onPick }: { steps: FlatStep[]; progress: Progress; onPick(i: number): void }) {
  const total = steps.length;
  const label =
    progress.stepIndex < 0 ? `${total} steps` : progress.stepIndex >= total ? 'Finished!' : `Step ${progress.stepIndex + 1} of ${total}`;
  return (
    <div className="step-track">
      <ol aria-label="Your progress">
        {steps.map((f) => {
          const done = progress.done.includes(f.step.id);
          const active = f.index === progress.stepIndex;
          const newMilestone = f.index > 0 && steps[f.index - 1].milestoneIndex !== f.milestoneIndex;
          return (
            <li key={f.step.id} className={newMilestone ? 'gap' : undefined}>
              <button
                className={`track-dot${done ? ' done' : ''}${active ? ' active' : ''}`}
                onClick={() => onPick(f.index)}
                aria-label={`Step ${f.index + 1}: ${f.milestone.title}${done ? ' (done)' : ''}`}
                aria-current={active ? 'step' : undefined}
              />
            </li>
          );
        })}
      </ol>
      <span className="track-label">{label}</span>
    </div>
  );
}

/** Whose workspace this is, with a way back to their projects. */
function ChildChip() {
  const child = useActiveChild();
  if (!child) return null;
  return (
    <a className="sb-child" href="/home" onClick={linkClick} title="Back to my projects">
      <span className="led on" aria-hidden="true" />
      {child.firstName}
    </a>
  );
}
