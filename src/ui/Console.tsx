import { useEffect, useRef, useState } from 'react';
import type { PythonErrorInfo } from '../runtime/protocol';
import type { KidError } from '../errors/translate';
import { RichText } from './RichText';

export interface ConsoleLine {
  kind: 'out' | 'err' | 'info' | 'input';
  text: string;
}

export interface ShownError {
  kid: KidError;
  raw: PythonErrorInfo;
}

interface Props {
  lines: ConsoleLine[];
  error: ShownError | null;
  waitingForInput: boolean;
  onSubmitInput(text: string): void;
  emptyText?: string;
}

/** Program output, errors in kid language, and the answer box for input(). */
export function Console({ lines, error, waitingForInput, onSubmitInput, emptyText }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, error, waitingForInput]);

  useEffect(() => {
    if (waitingForInput) inputRef.current?.focus();
  }, [waitingForInput]);

  const empty = lines.length === 0 && !error && !waitingForInput;

  return (
    <section className="panel console-panel" aria-label="Output">
      <div className="panel-head">
        <span className="panel-title">Output</span>
      </div>
      <div className="console-scroll" ref={scroller}>
        {empty && <p className="console-empty">{emptyText ?? 'Press Run and anything your program prints shows up here.'}</p>}
        <pre className="console-text" aria-live="polite">
          {lines.map((l, i) => (
            <span key={i} className={`out-${l.kind}`}>
              {l.text}
            </span>
          ))}
        </pre>
        {waitingForInput && (
          <form
            className="input-row"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmitInput(answer);
              setAnswer('');
            }}
          >
            <label className="visually-hidden" htmlFor="console-input">
              Type your answer
            </label>
            <input
              id="console-input"
              ref={inputRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="Type your answer and press Enter"
            />
            <button className="btn btn-small" type="submit">
              Enter
            </button>
          </form>
        )}
        {error && (
          <div className="error-card" role="alert">
            <p className="error-title">{error.kid.title}</p>
            <p className="error-message">
              <RichText text={error.kid.message} />
            </p>
            <p className="error-tip">
              <RichText text={error.kid.tip} />
            </p>
            {error.raw.traceback && (
              <details>
                <summary>Python's own words</summary>
                <pre>{error.raw.traceback}</pre>
              </details>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
