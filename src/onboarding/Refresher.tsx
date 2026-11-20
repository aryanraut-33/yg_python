// Quick refresher for children who already know some Python: every basic in one place,
// each with a runnable example, then one mini challenge that uses several of them.
import { useState } from 'react';
import { CodeEditor } from '../editor/CodeEditor';
import { Console } from '../ui/Console';
import { PlayIcon, StopIcon } from '../ui/icons';
import { RichText } from '../ui/RichText';
import { logEvent } from '../telemetry/sessionLog';
import checkInput from '../../content/onboarding/check-input.py?raw';
import { CONCEPTS, exampleCode, type Concept } from './concepts';
import type { ConceptId } from './progress';
import { useCodeRun } from './useCodeRun';
import type { WidgetProps } from './widgets';

export function Refresher({ known, onDone, say }: WidgetProps & { known: ConceptId[] }) {
  // Missed basics first, so the refresher spends attention where it's needed.
  const ordered = [...CONCEPTS.filter((c) => !known.includes(c.id)), ...CONCEPTS.filter((c) => known.includes(c.id))];
  return (
    <div className="refresher">
      {ordered.map((c) => (
        <RecapCard key={c.id} concept={c} missed={!known.includes(c.id)} />
      ))}
      <div className="ob-card recap-card">
        <div className="recap-head">
          <p className="ob-card-title">When Python gets confused</p>
        </div>
        <p>
          <RichText text="Errors are clues, not failures. Read the message under **Output**, look at the highlighted line in the editor, and fix one thing at a time. Stuck? There's always a hint." />
        </p>
      </div>
      <MiniChallenge
        onPassed={(attempts) => {
          logEvent('onboard_challenge', { concept: 'refresher', attempts, hints: 0 });
          say({ who: 'riff', pose: 'celebrating', text: 'Refresher DONE. Your Python is warmed up!' });
          onDone();
        }}
        onError={() => say({ who: 'nix', pose: 'thinking', text: 'Python got confused. Check the highlighted line and try again.' })}
      />
    </div>
  );
}

function RecapCard({ concept, missed }: { concept: Concept; missed: boolean }) {
  const r = useCodeRun(`refresher-${concept.id}`);
  const code = exampleCode(concept);
  const showOutput = r.lines.length > 0 || r.error || r.waitingForInput;
  return (
    <div className={`ob-card recap-card${missed ? ' missed' : ''}`}>
      <div className="recap-head">
        <p className="ob-card-title">{concept.short}</p>
        {missed && <span className="recap-tag">Worth a look</span>}
      </div>
      <p>
        <RichText text={concept.recap} />
      </p>
      <div className="recap-code">
        <pre className="ob-code">{code}</pre>
        {r.running ? (
          <button className="btn btn-stop btn-small-run" onClick={r.stop}>
            <StopIcon /> Stop
          </button>
        ) : (
          <button className="btn btn-ghost btn-small-run" onClick={() => r.run(code, null)}>
            <PlayIcon /> Run it
          </button>
        )}
      </div>
      {showOutput && <Console lines={r.lines} error={r.error} waitingForInput={r.waitingForInput} onSubmitInput={r.submitInput} />}
    </div>
  );
}

function MiniChallenge({ onPassed, onError }: { onPassed(attempts: number): void; onError(): void }) {
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const r = useCodeRun('refresher-challenge');

  const run = () => {
    setAttempts((a) => a + 1);
    setFeedback(null);
    r.run(code, { kind: 'python', code: checkInput, description: 'ok' }, (res) => {
      if (res.stopped) return;
      if (res.error) return onError();
      if (res.check?.passed) {
        setPassed(true);
        onPassed(attempts + 1);
      } else if (res.check) setFeedback(res.check.message);
    });
  };

  return (
    <div className="ob-card recap-card recap-challenge">
      <p className="ob-eyebrow">Mini challenge</p>
      <p className="ob-card-title">Ask a question, use the answer</p>
      <p>
        <RichText text="Use `input()` to ask for someone's favourite food, store it in a variable, then `print` a sentence that uses it." />
      </p>
      <div className="mini-editor">
        <CodeEditor value={code} onChange={setCode} onRun={run} errorLine={r.error?.kid.line ?? null} />
      </div>
      <div className="ob-row">
        {r.running ? (
          <button className="btn btn-stop" onClick={r.stop}>
            <StopIcon /> Stop
          </button>
        ) : (
          !passed && (
            <button className="btn btn-primary" onClick={run} disabled={!code.trim()}>
              <PlayIcon /> Run and check
            </button>
          )
        )}
      </div>
      {feedback && (
        <div className="feedback feedback-notyet">
          <p className="feedback-title">Not quite yet</p>
          <p>
            <RichText text={feedback} />
          </p>
        </div>
      )}
      {passed && (
        <div className="feedback feedback-pass">
          <p className="feedback-title">Challenge complete!</p>
        </div>
      )}
      <Console lines={r.lines} error={r.error} waitingForInput={r.waitingForInput} onSubmitInput={r.submitInput} emptyText="Press Run and check. Your output appears here." />
    </div>
  );
}
