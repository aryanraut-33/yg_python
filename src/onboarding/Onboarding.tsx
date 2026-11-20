// /start: the journey from "never seen code" to the first project, guided by Nix and Riff.
// Beginners get the full journey. Children who know some Python take a quick check and get
// the full lessons, a quick refresher, or go straight to their project (see pathFor).
import { useEffect, useRef, useState } from 'react';
import { navigate, linkClick } from '../router';
import { ThemeToggle } from '../ui/ThemeToggle';
import { RichText } from '../ui/RichText';
import { getRunner } from '../runtime/runnerHub';
import { logEvent } from '../telemetry/sessionLog';
import { CHAPTERS, FIRST_SCREEN, pathFor, type Screen } from './script';
import { CONCEPTS, type Line } from './concepts';
import { MascotImg, NAMES, preloadMascots, type Pose, type Who } from './mascots';
import { loadOnboarding, saveOnboarding, trackFor, type OnboardingState } from './progress';
import { ConceptLesson } from './ConceptLesson';
import { WorkspaceTour } from './WorkspaceTour';
import { Refresher } from './Refresher';
import {
  CheckResult,
  CompareCode,
  DreamPick,
  ExperiencePick,
  Finale,
  HelloCards,
  MatchPairs,
  NameAsk,
  QuickCheck,
  Quiz,
  SandwichOrder,
  UsesDeck,
} from './widgets';
import './onboarding.css';

export function Onboarding() {
  const [st, setSt] = useState<OnboardingState>(() => {
    const s = loadOnboarding(FIRST_SCREEN);
    return s.startedAt ? s : { ...s, startedAt: Date.now() };
  });

  useEffect(() => saveOnboarding(st), [st]);
  // "Reset for the next kid" in another tab: start this one fresh too.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if ((e.key === 'yg-onboarding-v1' && e.newValue === null) || e.key === null) window.location.reload();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  useEffect(() => {
    preloadMascots();
    getRunner(); // Python starts loading now, long before the first Run.
    logEvent('onboard_open', { screen: st.screen });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const path = pathFor(st);
  const found = path.findIndex((s) => s.id === st.screen);
  const idx = found === -1 ? 0 : found;
  const screen = path[idx];

  const goTo = (next: OnboardingState, to: number) => {
    const p = pathFor(next);
    const t = Math.max(0, Math.min(p.length - 1, to));
    setSt({ ...next, screen: p[t].id, done: next.done.includes(screen.id) ? next.done : [...next.done, screen.id] });
    logEvent('onboard_screen', { id: p[t].id });
    window.scrollTo(0, 0);
  };
  const next = (s: OnboardingState = st) => goTo(s, pathFor(s).findIndex((x) => x.id === screen.id) + 1);
  const back = () => goTo(st, idx - 1);

  const skipChapter = () => {
    const to = path.findIndex((s) => s.chapter > screen.chapter);
    logEvent('onboard_skip', { chapter: CHAPTERS[screen.chapter].id });
    goTo(st, to);
  };

  const finish = (s: OnboardingState = st) => {
    logEvent('onboard_complete', { ms: Date.now() - (s.startedAt ?? Date.now()), track: s.track ?? 'beginner' });
    const done: OnboardingState = { ...s, completed: true, done: [...s.done, screen.id] };
    setSt(done);
    saveOnboarding(done);
    navigate('/play/name-light-show');
  };

  // Only show the chapters this child's path actually visits.
  const chapters = [...new Set(path.map((s) => s.chapter))];

  return (
    <div className="ob">
      <header className="ob-top">
        <a className="wordmark" href="/" onClick={linkClick}>
          yg python
        </a>
        <ChapterMap chapters={chapters} current={screen.chapter} />
        <div className="ob-top-right">
          <ThemeToggle />
        </div>
      </header>

      <ScreenView
        key={screen.id}
        screen={screen}
        state={st}
        setState={setSt}
        canBack={idx > 0}
        onBack={back}
        onNext={next}
        onSkipChapter={CHAPTERS[screen.chapter].skippable ? skipChapter : undefined}
        onFinish={finish}
      />
    </div>
  );
}

function ChapterMap({ chapters, current }: { chapters: number[]; current: number }) {
  return (
    <nav className="chapter-map" aria-label="Your journey">
      <ol>
        {chapters.map((i) => (
          <li key={CHAPTERS[i].id} className={i < current ? 'done' : i === current ? 'now' : ''} aria-current={i === current ? 'step' : undefined}>
            <span className="cm-dot" aria-hidden="true" />
            <span className="cm-label">{CHAPTERS[i].title}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface ScreenProps {
  screen: Screen;
  state: OnboardingState;
  setState(fn: (s: OnboardingState) => OnboardingState): void;
  canBack: boolean;
  onBack(): void;
  onNext(s?: OnboardingState): void;
  onSkipChapter?: () => void;
  onFinish(s?: OnboardingState): void;
}

function linesFor(screen: Screen): Line[] {
  if (screen.kind === 'concept') return CONCEPTS[screen.index].analogy;
  return screen.lines;
}

function ScreenView({ screen, state, setState, canBack, onBack, onNext, onSkipChapter, onFinish }: ScreenProps) {
  const lines = linesFor(screen);
  const [shown, setShown] = useState(1);
  const [chat, setChat] = useState<Line[]>([lines[0]]);
  const [widgetDone, setWidgetDone] = useState(screen.kind === 'talk');
  const [poses, setPoses] = useState<Record<Who, Pose>>({ nix: 'idle', riff: 'welcome' });
  const chatRef = useRef<HTMLDivElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);

  const talkDone = shown >= lines.length;
  const current = chat[chat.length - 1];
  const name = state.name || 'friend';
  const fill = (t: string) => t.replace(/\{name\}/g, name);
  const isTalk = screen.kind === 'talk';

  useEffect(() => {
    setPoses((p) => ({ ...p, [current.who]: current.pose }));
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [current]);

  const say = (line: Line) => setChat((c) => [...c, line]);
  const nextLine = () => {
    if (shown < lines.length) {
      setChat((c) => [...c, lines[shown]]);
      setShown(shown + 1);
    }
  };

  useEffect(() => {
    nextBtn.current?.focus();
  }, [shown]);

  // Result screen reacts once with the right mascot mood.
  useEffect(() => {
    if (screen.kind !== 'check-result' || !state.track) return;
    say(
      state.track === 'ready'
        ? { who: 'riff', pose: 'level-up', text: 'WHOA. You really know your Python!' }
        : state.track === 'refresher'
          ? { who: 'riff', pose: 'celebrating', text: 'Nice! You know quite a bit already.' }
          : { who: 'nix', pose: 'encouraging', text: 'Thanks for being honest! Now we know exactly where to start.' },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const concept = screen.kind === 'concept' ? CONCEPTS[screen.index] : null;

  if (screen.kind === 'tour' && talkDone) {
    return (
      <main className="ob-tour">
        <WorkspaceTour name={state.name} onDone={() => setWidgetDone(true)} />
        <div className="ob-actions ob-actions-tour">
          {canBack && (
            <button className="link-btn" onClick={onBack}>
              ← Back
            </button>
          )}
          <button className="btn btn-primary" disabled={!widgetDone} onClick={() => onNext()}>
            Continue →
          </button>
        </div>
      </main>
    );
  }

  const widget = (() => {
    const props = { onDone: () => setWidgetDone(true), say };
    switch (screen.kind) {
      case 'name':
        return (
          <NameAsk
            initial={state.name}
            say={say}
            onName={(n) => {
              setState((s) => ({ ...s, name: n }));
              setWidgetDone(true);
            }}
          />
        );
      case 'experience':
        return (
          <ExperiencePick
            onPick={(e) => {
              const next: OnboardingState = { ...state, experience: e, track: null, readyChoice: null, score: null, total: null };
              setState(() => next);
              logEvent('onboard_screen', { id: `experience-${e}` });
              onNext(next);
            }}
          />
        );
      case 'quick-check':
        return (
          <QuickCheck
            onFinish={(score, total, known) => {
              const track = trackFor(score, total);
              const next: OnboardingState = { ...state, score, total, known, track, readyChoice: null };
              setState(() => next);
              logEvent('onboard_diag', { score, of: total, track });
              onNext(next);
            }}
          />
        );
      case 'check-result':
        return state.score !== null && state.total !== null && state.track ? (
          <CheckResult
            score={state.score}
            total={state.total}
            track={state.track}
            onContinue={() => onNext()}
            onReady={(choice) => {
              const next: OnboardingState = { ...state, readyChoice: choice };
              setState(() => next);
              logEvent('onboard_screen', { id: `ready-${choice}` });
              if (choice === 'project') onFinish(next);
              else onNext(next);
            }}
          />
        ) : null;
      case 'refresher':
        return <Refresher {...props} known={state.known} />;
      case 'sandwich':
        return <SandwichOrder {...props} />;
      case 'hello':
        return <HelloCards {...props} />;
      case 'compare':
        return <CompareCode {...props} />;
      case 'quiz':
        return <Quiz {...props} question={screen.question} choices={screen.choices} answer={screen.answer} right={screen.right} wrong={screen.wrong} />;
      case 'uses':
        return <UsesDeck {...props} />;
      case 'match':
        return <MatchPairs {...props} />;
      case 'dream':
        return (
          <DreamPick
            initial={state.dream}
            say={say}
            onPick={(id) => {
              setState((s) => ({ ...s, dream: id }));
              logEvent('onboard_screen', { id: `dream-${id}` });
              setWidgetDone(true);
            }}
          />
        );
      case 'concept':
        return <ConceptLesson {...props} concept={concept!} />;
      case 'finale':
        return <Finale onStart={() => onFinish()} />;
      default:
        return null;
    }
  })();

  const selfAdvancing = ['experience', 'quick-check', 'check-result', 'finale'].includes(screen.kind);
  const ctaLabel = isTalk ? (screen.cta ?? 'Continue →') : 'Continue →';

  return (
    <main className={`ob-main ob-kind-${screen.kind}`}>
      <section className="ob-cast" aria-label="Nix and Riff">
        {concept && <p className="ob-lesson-tag">Speak Python · {screen.kind === 'concept' ? screen.index + 1 : ''} of {CONCEPTS.length}</p>}
        {concept && <h1 className="ob-lesson-title">{concept.title}</h1>}
        <div className="ob-dialog">
          <div className="ob-chat" ref={chatRef} aria-live="polite">
            {chat.map((l, i) => (
              <div key={i} className={`bubble bubble-${l.who}${i === chat.length - 1 ? ' latest' : ''}`}>
                <span className="bubble-name">{NAMES[l.who]}</span>
                <RichText text={fill(l.text)} />
              </div>
            ))}
          </div>
        </div>
        <div className="ob-mascots" aria-hidden="true">
          {(['nix', 'riff'] as Who[]).map((w) => (
            <div key={w} className={`ob-mascot${current.who === w ? ' speaking' : ''}`}>
              <MascotImg who={w} pose={poses[w]} />
            </div>
          ))}
        </div>
      </section>

      <section className="ob-activity" aria-label="Activity">
        {!isTalk && (talkDone ? widget : <div className="ob-waiting">Press Next to hear from Nix and Riff first.</div>)}

        <div className="ob-actions">
          {canBack ? (
            <button className="link-btn" onClick={onBack}>
              ← Back
            </button>
          ) : (
            <span />
          )}
          <div className="ob-actions-right">
            {onSkipChapter && (
              <button className="link-btn" onClick={onSkipChapter}>
                Skip this chapter
              </button>
            )}
            {/* Next (dialogue) sits above the screen's main button, outside the boxes. */}
            <div className="ob-btn-stack">
              {!talkDone && (
                <button ref={nextBtn} className="btn btn-primary" onClick={nextLine}>
                  Next
                </button>
              )}
              {(isTalk || !selfAdvancing) && (
                <button
                  className="btn btn-primary"
                  disabled={isTalk ? !talkDone : !(talkDone && widgetDone)}
                  onClick={() => onNext()}
                  autoFocus={isTalk && talkDone}
                >
                  {ctaLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
