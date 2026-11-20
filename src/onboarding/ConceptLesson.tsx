import { useEffect, useRef, useState } from 'react';
import { CodeEditor } from '../editor/CodeEditor';
import { Console } from '../ui/Console';
import { PlayIcon, StopIcon } from '../ui/icons';
import { RichText } from '../ui/RichText';
import { logEvent } from '../telemetry/sessionLog';
import { exampleCode, type Concept } from './concepts';
import { useCodeRun } from './useCodeRun';
import type { WidgetProps } from './widgets';

type Phase = 'parts' | 'try' | 'challenge' | 'done';

/** Steps 2–6 of a Speak Python lesson (the analogy is spoken by the shell first). */
export function ConceptLesson({ concept, onDone, say }: WidgetProps & { concept: Concept }) {
  const [phase, setPhase] = useState<Phase>('parts');
  const [explored, setExplored] = useState<number[]>([]);
  const [focus, setFocus] = useState<number | null>(null);

  const explainable = concept.parts.map((p, i) => (p.explain ? i : -1)).filter((i) => i >= 0);
  const allExplored = explainable.every((i) => explored.includes(i));

  useEffect(() => {
    if (phase === 'try') say(concept.tryPrompt);
    if (phase === 'challenge') say(concept.challenge.lines[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div className="ob-card lesson">
      <ol className="lesson-steps" aria-label="Lesson steps">
        {(['parts', 'try', 'challenge'] as Phase[]).map((p, i) => {
          const order = ['parts', 'try', 'challenge', 'done'];
          const state = order.indexOf(phase) > i ? 'done' : phase === p ? 'now' : '';
          return (
            <li key={p} className={state}>
              {['Look closer', 'Try it', 'Challenge'][i]}
            </li>
          );
        })}
      </ol>

      {phase === 'parts' && (
        <>
          <p className="ob-small">Tap each glowing part of the code.</p>
          <pre className="ob-code lesson-parts">
            {concept.parts.map((p, i) =>
              p.explain ? (
                <button
                  key={i}
                  className={`code-part${explored.includes(i) ? ' seen' : ''}${focus === i ? ' focus' : ''}`}
                  onClick={() => {
                    setFocus(i);
                    if (!explored.includes(i)) setExplored([...explored, i]);
                  }}
                >
                  {p.code}
                </button>
              ) : (
                <span key={i}>{p.code}</span>
              ),
            )}
          </pre>
          <div className="part-explain" aria-live="polite">
            {focus !== null ? (
              <>
                <code>{concept.parts[focus].code.trim()}</code>
                <p>{concept.parts[focus].explain}</p>
              </>
            ) : (
              <p className="ob-small">Explanations show up here.</p>
            )}
          </div>
          <div className="ob-row">
            <span className="ob-small">
              {explored.length} of {explainable.length} parts explored
            </span>
            <button className="btn btn-primary" disabled={!allExplored} onClick={() => setPhase('try')}>
              Try it myself →
            </button>
          </div>
        </>
      )}

      {phase === 'try' && (
        <TryIt
          key="try"
          where={`concept-${concept.id}-try`}
          start={exampleCode(concept)}
          needsChange={concept.tryNeedsChange}
          onTried={() => say(concept.tryDone)}
          onUnchanged={() => say({ who: 'nix', pose: 'thinking', text: 'Change something in the code first, then press Run!' })}
          next={() => setPhase('challenge')}
        />
      )}

      {phase === 'challenge' && (
        <Challenge
          key="challenge"
          concept={concept}
          onPassed={(attempts, hints) => {
            say(concept.challenge.success);
            logEvent('onboard_challenge', { concept: concept.id, attempts, hints });
            setPhase('done');
            onDone();
          }}
          onError={() => say({ who: 'riff', pose: 'encouraging', text: 'Bugs happen to everyone. Read what Python said, fix it, and try again!' })}
        />
      )}

      {phase === 'done' && (
        <div className="feedback feedback-pass">
          <p className="feedback-title">You learned {concept.short}!</p>
        </div>
      )}
    </div>
  );
}

function RunBar({ busy, onRun, onStop, disabled, label = 'Run' }: { busy: boolean; onRun(): void; onStop(): void; disabled?: boolean; label?: string }) {
  return busy ? (
    <button className="btn btn-stop" onClick={onStop}>
      <StopIcon /> Stop
    </button>
  ) : (
    <button className="btn btn-primary" onClick={onRun} disabled={disabled}>
      <PlayIcon /> {label}
    </button>
  );
}

function TryIt({ where, start, needsChange, onTried, onUnchanged, next }: { where: string; start: string; needsChange: boolean; onTried(): void; onUnchanged(): void; next(): void }) {
  const [code, setCode] = useState(start);
  const [tried, setTried] = useState(false);
  const r = useCodeRun(where);
  const ready = r.status === 'ready' || r.running;

  const run = () => {
    const changed = code.trim() !== start.trim();
    r.run(code, null, (res) => {
      if (res.stopped) return;
      if (needsChange && !changed) {
        onUnchanged();
        return;
      }
      if (!tried) {
        setTried(true);
        onTried();
      }
    });
  };

  return (
    <div className="mini-ws">
      <div className="mini-editor">
        <CodeEditor value={code} onChange={setCode} onRun={run} errorLine={r.error?.kid.line ?? null} />
      </div>
      <div className="ob-row">
        <RunBar busy={r.running} onRun={run} onStop={r.stop} disabled={!ready} />
        {!ready && <span className="ob-small">Getting Python ready…</span>}
        {tried && (
          <button className="btn btn-ghost" onClick={next}>
            Take the challenge →
          </button>
        )}
      </div>
      <Console lines={r.lines} error={r.error} waitingForInput={r.waitingForInput} onSubmitInput={r.submitInput} emptyText="Press Run. What Python shows appears here." />
    </div>
  );
}

function Challenge({ concept, onPassed, onError }: { concept: Concept; onPassed(attempts: number, hints: number): void; onError(): void }) {
  const ch = concept.challenge;
  const [code, setCode] = useState(ch.starter);
  const [hints, setHints] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);
  const attempts = useRef(0);
  const r = useCodeRun(`concept-${concept.id}-challenge`);
  const ready = r.status === 'ready' || r.running;

  const run = () => {
    attempts.current += 1;
    setFeedback(null);
    r.run(code, { kind: 'python', code: ch.check, description: 'Challenge complete!' }, (res) => {
      if (res.stopped) return;
      if (res.error) {
        onError();
        return;
      }
      if (res.check?.passed) {
        setPassed(true);
        onPassed(attempts.current, hints);
      } else if (res.check) {
        setFeedback(res.check.message);
      }
    });
  };

  return (
    <div className="mini-ws">
      <div className="challenge-task">
        <RichText text={ch.lines[0].text} />
      </div>
      <div className="mini-editor">
        <CodeEditor value={code} onChange={setCode} onRun={run} errorLine={r.error?.kid.line ?? null} />
      </div>
      <div className="ob-row">
        {!passed && <RunBar busy={r.running} onRun={run} onStop={r.stop} disabled={!ready} label="Run and check" />}
        {!passed && hints < ch.hints.length && (
          <button className="btn btn-ghost" onClick={() => setHints(hints + 1)}>
            {hints === 0 ? 'Stuck? Get a hint' : 'Another hint'}
          </button>
        )}
      </div>
      {feedback && (
        <div className="feedback feedback-notyet" aria-live="polite">
          <p className="feedback-title">Not quite yet</p>
          <p>
            <RichText text={feedback} />
          </p>
        </div>
      )}
      {hints > 0 && !passed && (
        <div className="hints">
          {ch.hints.slice(0, hints).map((h, i) => (
            <div key={i} className="hint-card">
              <p className="hint-label">Hint {i + 1}</p>
              {i === ch.hints.length - 1 ? <pre className="ob-code">{h}</pre> : <p><RichText text={h} /></p>}
            </div>
          ))}
        </div>
      )}
      <Console lines={r.lines} error={r.error} waitingForInput={r.waitingForInput} onSubmitInput={r.submitInput} emptyText="Press Run and check. Your output appears here." />
    </div>
  );
}
