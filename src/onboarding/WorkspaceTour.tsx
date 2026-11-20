// Chapter 5: a hands-on tour of the real workspace layout. Each step spotlights one area and
// waits for the child to do the thing (click, type, run, fix an error) before moving on.
import { useEffect, useMemo, useRef, useState } from 'react';
import { CodeEditor } from '../editor/CodeEditor';
import { Console } from '../ui/Console';
import { PlayIcon, StopIcon } from '../ui/icons';
import { RichText } from '../ui/RichText';
import { StageRenderer } from '../stage/StageRenderer';
import { logEvent } from '../telemetry/sessionLog';
import checkHello from '../../content/onboarding/check-tour-hello.py?raw';
import type { Line } from './concepts';
import { MascotImg, NAMES } from './mascots';
import { useCodeRun } from './useCodeRun';
import '../sandbox/sandbox.css';

type Target = 'guide' | 'editor' | 'run' | 'output' | 'hint' | 'stage' | 'progress';
type Action = 'click' | 'focus' | 'type' | 'run-ok' | 'run-error' | 'next' | 'stage';

interface TourStep {
  id: string;
  /** Area(s) spotlit during this step: everything the child needs to touch. */
  target: Target | Target[];
  line: Line;
  action: Action;
  /** Code to put in the editor when this step starts. */
  setCode?: string;
}

const HELLO = /print\(\s*["']Hello, World!["']\s*\)/;
const BROKEN = 'print("Hello, World!"\n';

const STEPS: TourStep[] = [
  { id: 'guide', target: 'guide', action: 'click', line: { who: 'nix', pose: 'teaching', text: 'This is the **instructions panel**. It tells you what to build in each step. Tap it!' } },
  { id: 'editor', target: 'editor', action: 'focus', line: { who: 'riff', pose: 'pointing', text: 'This is the **code editor**, where you write Python. Click inside it.' } },
  { id: 'type', target: 'editor', action: 'type', line: { who: 'nix', pose: 'coding', text: 'Now type this exactly: `print("Hello, World!")`' } },
  { id: 'run', target: 'run', action: 'run-ok', line: { who: 'riff', pose: 'encouraging', text: 'Press **Run** to make Python do it!' } },
  { id: 'output', target: 'output', action: 'click', line: { who: 'nix', pose: 'thinking', text: 'Where did your message appear? Tap that spot. That\'s the **output**.' } },
  {
    id: 'bug',
    target: 'run',
    action: 'run-error',
    setCode: BROKEN,
    line: { who: 'riff', pose: 'error', text: 'Oops! I bumped the keyboard and broke your code. Press **Run** and see what happens.' },
  },
  {
    id: 'read-error',
    target: ['output', 'editor'],
    action: 'next',
    line: { who: 'nix', pose: 'teaching', text: 'That\'s an **error message**: Python telling you it got confused, and where. The red line in the editor shows which line to check.' },
  },
  {
    id: 'fix',
    target: ['editor', 'run'],
    action: 'run-ok',
    line: { who: 'riff', pose: 'encouraging', text: 'Errors are normal. Every coder sees them all day! Add the missing `)` at the end of the line, then press **Run**.' },
  },
  { id: 'hint', target: 'hint', action: 'click', line: { who: 'nix', pose: 'reading', text: 'Stuck in a project? Tap **Stuck? Get a hint**. Hints never cost you anything.' } },
  { id: 'stage', target: 'stage', action: 'stage', line: { who: 'riff', pose: 'pointing', text: 'This is the **stage**. Your drawings, animations and games appear here.' } },
  { id: 'progress', target: 'progress', action: 'click', line: { who: 'nix', pose: 'teaching', text: 'Last one! These dots show how far you are through a project. Tap them.' } },
];

const STAGE_DEMO = `import stage
stage.background("night")
colors = ["butter", "coral", "mint", "blossom", "sky"]
x = 120
for c in colors:
    stage.circle(x, 200, 34, c, glow=True)
    x = x + 100
`;

export function WorkspaceTour({ onDone, name }: { onDone(): void; name: string }) {
  const [i, setI] = useState(0);
  const [code, setCode] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [line, setLine] = useState<Line>(STEPS[0].line);
  const [finished, setFinished] = useState(false);
  const renderer = useMemo(() => new StageRenderer(), []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const r = useCodeRun('tour', (b) => renderer.push(b));
  const demo = useCodeRun('tour-stage', (b) => renderer.push(b));
  const step = STEPS[i];

  useEffect(() => {
    const canvas = canvasRef.current;
    renderer.attach(canvas);
    if (!canvas) return;
    const ro = new ResizeObserver(() => renderer.present());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [renderer]);

  const advance = () => {
    logEvent('onboard_screen', { id: `tour-${step.id}` });
    if (i === STEPS.length - 1) {
      setFinished(true);
      setLine({ who: 'riff', pose: 'level-up', text: `${name ? name + ', you' : 'You'}'re a workspace pro! Time for the big moment.` });
      onDone();
      return;
    }
    const next = STEPS[i + 1];
    if (next.setCode !== undefined) setCode(next.setCode);
    setLine(next.line);
    setI(i + 1);
  };

  const targets = (st: TourStep) => (Array.isArray(st.target) ? st.target : [st.target]);
  const wants = (t: Target, a: Action) => !finished && targets(step).includes(t) && step.action === a;

  const run = () => {
    if (step.action !== 'run-ok' && step.action !== 'run-error') return;
    renderer.reset();
    r.run(code, { kind: 'python', code: checkHello, description: 'ok' }, (res) => {
      if (res.stopped) return;
      if (step.action === 'run-error') {
        if (res.error) advance();
        return;
      }
      if (res.error) {
        setLine({ who: 'nix', pose: 'thinking', text: 'Python got confused. Read the message under Output, then check that line.' });
      } else if (res.check?.passed) {
        if (step.id === 'fix') setLine({ who: 'riff', pose: 'celebrating', text: 'FIXED IT! See? Errors are just clues.' });
        setTimeout(advance, step.id === 'fix' ? 1400 : 300);
      } else if (res.check) {
        setLine({ who: 'nix', pose: 'thinking', text: res.check.message });
      }
    });
  };

  const onCode = (v: string) => {
    setCode(v);
    if (wants('editor', 'type') && HELLO.test(v)) advance();
  };

  const zone = (t: Target) => `tz${!finished && targets(step).includes(t) ? ' tz-on' : ''}`;
  const runEnabled = !finished && (step.action === 'run-ok' || step.action === 'run-error');

  return (
    <div className={`tour${finished ? ' tour-finished' : ''}`}>
      <div className={`tour-top ${zone('progress')}`} onClick={() => wants('progress', 'click') && advance()}>
        <span className="sb-project">Practice project</span>
        <div className="step-track">
          <ol aria-label="Progress">
            {[0, 1, 2, 3, 4].map((k) => (
              <li key={k}>
                <span className={`track-dot${k === 0 ? ' active' : ''}`} />
              </li>
            ))}
          </ol>
          <span className="track-label">Step 1 of 5</span>
        </div>
      </div>

      <div className="tour-grid">
        <aside className={`panel guide ${zone('guide')}`} onClick={() => wants('guide', 'click') && advance()}>
          <div className="guide-scroll">
            <p className="guide-eyebrow">Milestone 1 of 2</p>
            <h2 className="guide-title">Say hello</h2>
            <div className="step-card">
              <p className="step-kind">Step 1 · Build</p>
              <p className="step-instruction">
                <RichText text={'Make Python say hello to the world. Type `print("Hello, World!")` in the editor, then press **Run**.'} />
              </p>
            </div>
            <div className={`hints ${zone('hint')}`}>
              {hintOpen && (
                <div className="hint-card">
                  <p className="hint-label">Hint 1 · Where to look</p>
                  <p>Look at the code editor. Your line goes there.</p>
                </div>
              )}
              <button
                className="btn btn-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setHintOpen(true);
                  if (wants('hint', 'click')) advance();
                }}
              >
                Stuck? Get a hint
              </button>
            </div>
          </div>
        </aside>

        <section className="panel sb-editor">
          <div className="panel-head">
            <span className="file-tab">main.py</span>
          </div>
          <div className={`editor-wrap ${zone('editor')}`} onFocusCapture={() => wants('editor', 'focus') && advance()}>
            <CodeEditor value={code} onChange={onCode} onRun={() => runEnabled && run()} errorLine={r.error?.kid.line ?? null} />
          </div>
          <div className={`run-bar ${zone('run')}`}>
            {r.running ? (
              <button className="btn btn-stop" onClick={r.stop}>
                <StopIcon /> Stop
              </button>
            ) : (
              <button className="btn btn-primary" onClick={run} disabled={!runEnabled}>
                <PlayIcon /> Run
              </button>
            )}
          </div>
        </section>

        <section className="sb-side">
          <div className={`panel stage-panel ${zone('stage')}`}>
            <canvas ref={canvasRef} className="stage-canvas" role="img" aria-label="Stage" />
          </div>
          <div className={zone('output')} onClick={() => wants('output', 'click') && advance()}>
            <Console lines={r.lines} error={r.error} waitingForInput={r.waitingForInput} onSubmitInput={r.submitInput} />
          </div>
        </section>
      </div>

      <div className="coach" role="status" aria-live="polite">
        <MascotImg who={line.who} pose={line.pose} className="coach-mascot" />
        <div className="coach-bubble">
          <p className="coach-name">{NAMES[line.who]}</p>
          <p>
            <RichText text={line.text} />
          </p>
          {!finished && (
            <p className="coach-step">
              Step {i + 1} of {STEPS.length}
            </p>
          )}
          {!finished && step.action === 'next' && (
            <button className="btn btn-primary" onClick={advance}>
              Got it
            </button>
          )}
          {!finished && step.action === 'stage' && (
            <button
              className="btn btn-primary"
              disabled={demo.running}
              onClick={() => {
                renderer.reset();
                demo.run(STAGE_DEMO, null, () => setTimeout(advance, 1200));
              }}
            >
              Show me!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
