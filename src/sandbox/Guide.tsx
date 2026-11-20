import type { LoadedProject } from '../content/types';
import type { RunnerStatus } from '../runtime/PythonRunner';
import { RichText } from '../ui/RichText';
import { onboardingCompleted } from '../onboarding/progress';
import { linkClick } from '../router';
import type { Progress } from './progress';
import type { FlatStep } from './Sandbox';
import { GLOSSARY } from './ConceptPopout';

export type StepFeedback = { kind: 'none' } | { kind: 'passed'; message: string } | { kind: 'not-yet'; message: string };

const HINT_LABELS = ['Where to look', 'Remember', 'An example', 'Almost there', 'The answer'];
const STEP_TYPE_LABEL: Record<string, string> = {
  predict: 'Predict',
  build: 'Build',
  fill: 'Fill the blank',
  parsons: 'Puzzle',
  fix: 'Fix it',
  'make-it-yours': 'Make it yours',
  recall: 'Quick question',
};
const CONCEPT_NAMES: Record<string, string> = {
  'function-calls': 'Commands',
  coordinates: 'x and y',
  variables: 'Variables',
  strings: 'Text (strings)',
  'for-loops': 'For loops',
  range: 'range()',
};

interface Props {
  project: LoadedProject;
  steps: FlatStep[];
  progress: Progress;
  current: FlatStep | null;
  finished: boolean;
  feedback: StepFeedback;
  hasRunThisStep: boolean;
  status: RunnerStatus;
  onBegin(): void;
  onChoose(i: number): void;
  onHint(): void;
  onNext(): void;
  onRestartStep(): void;
  onStartOver(): void;
  onPlayPreview(): void;
  onRun(): void;
  onHome(): void;
  onShowIntro(id: string): void;
}

export function Guide(p: Props) {
  if (p.progress.stepIndex === -1) return <Intro {...p} />;
  if (p.finished || !p.current) return <Finished {...p} />;

  const { step, milestone, milestoneIndex } = p.current;
  const milestones = p.project.manifest.milestones.length;
  const hintsShown = p.progress.hintsShown[step.id] ?? 0;
  const chosen = p.progress.predictions[step.id];
  const isQuestion = step.type === 'predict' || step.type === 'recall';
  const revealed = isQuestion && chosen !== undefined && (step.type === 'recall' || (p.hasRunThisStep && p.feedback.kind === 'passed') || p.progress.done.includes(step.id));
  const isLast = p.current.index === p.steps.length - 1;

  return (
    <aside className="panel guide" aria-label="Your step">
      <div className="guide-scroll">
        <p className="guide-eyebrow">
          Milestone {milestoneIndex + 1} of {milestones}
        </p>
        <h1 className="guide-title">{milestone.title}</h1>
        <p className="guide-goal">{milestone.goal}</p>

        <div className="step-card">
          <p className="step-kind">
            Step {p.current.index + 1} · {STEP_TYPE_LABEL[step.type] ?? step.type}
          </p>
          <p className="step-instruction">
            <RichText text={step.instruction} />
          </p>
          {(step.introduces ?? []).filter((c) => GLOSSARY[c]).map((c) => (
            <button key={c} className="intro-chip" onClick={() => p.onShowIntro(c)}>
              <span className="intro-chip-dot" aria-hidden="true" />
              New idea: {GLOSSARY[c].title}
            </button>
          ))}

          {isQuestion && step.choices && (
            <div className="choices" role="radiogroup" aria-label={step.type === 'predict' ? 'Your guess' : 'Your answer'}>
              {step.choices.map((c, i) => {
                const picked = chosen === i;
                const state = revealed ? (i === step.answer ? ' right' : picked ? ' wrong' : '') : '';
                return (
                  <button
                    key={i}
                    role="radio"
                    aria-checked={picked}
                    className={`choice${picked ? ' picked' : ''}${state}`}
                    onClick={() => p.onChoose(i)}
                    disabled={revealed}
                  >
                    <span className="choice-dot" aria-hidden="true" />
                    <RichText text={c} />
                  </button>
                );
              })}
            </div>
          )}

          {step.type === 'predict' && chosen !== undefined && !revealed && (
            <button className="btn btn-primary btn-block" onClick={p.onRun} disabled={p.status !== 'ready'}>
              Run to check your guess
            </button>
          )}

          {revealed && step.explain && (
            <div className={`feedback ${chosen === step.answer ? 'feedback-pass' : 'feedback-learn'}`} aria-live="polite">
              <p className="feedback-title">{chosen === step.answer ? 'You got it!' : 'Good guess! Here\'s what happened:'}</p>
              <p>
                <RichText text={step.explain} />
              </p>
            </div>
          )}

          {!isQuestion && p.feedback.kind === 'passed' && (
            <div className="feedback feedback-pass" aria-live="polite">
              <p className="feedback-title">{p.feedback.message}</p>
            </div>
          )}
          {!isQuestion && p.feedback.kind === 'not-yet' && (
            <div className="feedback feedback-notyet" aria-live="polite">
              <p className="feedback-title">Not quite yet</p>
              <p>
                <RichText text={p.feedback.message} />
              </p>
            </div>
          )}

          {(p.feedback.kind === 'passed' || (step.type === 'recall' && revealed)) && (
            <button className="btn btn-primary btn-block" onClick={p.onNext} autoFocus>
              {isLast ? 'Finish the project' : 'Next step'} →
            </button>
          )}
        </div>

        <div className="hints">
          {step.hints.slice(0, hintsShown).map((h, i) => (
            <div key={i} className="hint-card">
              <p className="hint-label">
                Hint {i + 1} · {HINT_LABELS[i]}
              </p>
              <p>
                <RichText text={h} />
              </p>
              {i === 4 && <p className="hint-note">Type it out yourself, then change one thing to make it yours.</p>}
            </div>
          ))}
          {hintsShown < step.hints.length && p.feedback.kind !== 'passed' && !revealed && (
            <button className="btn btn-ghost" onClick={p.onHint}>
              {hintsShown === 0 ? 'Stuck? Get a hint' : 'Show another hint'}
            </button>
          )}
        </div>
      </div>
      {!isQuestion && (
        <div className="guide-foot">
          <button className="link-btn" onClick={p.onRestartStep}>
            Start this step again
          </button>
        </div>
      )}
    </aside>
  );
}

function Intro(p: Props) {
  const m = p.project.manifest;
  return (
    <aside className="panel guide" aria-label="About this project">
      <div className="guide-scroll">
        <p className="guide-eyebrow">Your first project</p>
        <h1 className="guide-title guide-title-big">{m.title}</h1>
        <p className="guide-lead">
          In about 10 minutes, you'll write real Python that makes <strong>your name</strong> flash in lights.
        </p>
        <p className="guide-goal">The stage on the right shows what you'll build.</p>
        <ol className="intro-list">
          {m.milestones.map((ms) => (
            <li key={ms.id}>{ms.title}</li>
          ))}
        </ol>
        <button className="btn btn-primary btn-block" onClick={p.onBegin}>
          Let's start →
        </button>
        <button className="btn btn-ghost btn-block" onClick={p.onPlayPreview} disabled={p.status !== 'ready'}>
          {p.status === 'ready' ? 'Play it again' : p.status === 'running' ? 'Playing…' : 'Getting Python ready…'}
        </button>
        <p className="guide-small">No sign-up. Your work is saved on this device.</p>
        {!onboardingCompleted() && (
          <p className="guide-small">
            New to Python?{' '}
            <a href="/start" onClick={linkClick} className="guide-link">
              Meet Nix and Riff first
            </a>
          </p>
        )}
      </div>
    </aside>
  );
}

function Finished(p: Props) {
  const m = p.project.manifest;
  return (
    <aside className="panel guide" aria-label="Project finished">
      <div className="guide-scroll">
        <div className="finish-lights" aria-hidden="true">
          {['butter', 'coral', 'mint', 'blossom', 'sky'].map((c, i) => (
            <span key={c} className={`finish-light fl-${c}`} style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </div>
        <p className="guide-eyebrow">Project finished</p>
        <h1 className="guide-title guide-title-big">You built {m.title}!</h1>
        <p className="guide-lead">Every line of that light show is your own Python.</p>
        <p className="guide-goal">Python ideas you used:</p>
        <ul className="concept-chips">
          {m.concepts.map((c) => (
            <li key={c}>{CONCEPT_NAMES[c] ?? c}</li>
          ))}
        </ul>
        <button className="btn btn-primary btn-block" onClick={p.onRun} disabled={p.status !== 'ready'}>
          Watch my light show
        </button>
        <p className="guide-small">
          Keep tinkering: change anything in the code and press Run. Try a different name, colour or speed.
        </p>
        <div className="finish-next">
          <p className="guide-goal">Next projects are on their way: Mars Rover Rescue, Planet Maker, Secret Code Machine…</p>
        </div>
        <div className="finish-actions">
          <button className="link-btn" onClick={p.onHome}>
            Back to the home page
          </button>
          <button className="link-btn" onClick={p.onStartOver}>
            Start this project again
          </button>
        </div>
      </div>
    </aside>
  );
}
