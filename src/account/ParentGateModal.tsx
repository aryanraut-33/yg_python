// Parental Verification Gate (DPDP / Child Safety).
// Restricts access to sensitive family account actions:
// - Accessing /family settings (adding children, billing, deleting account)
// - Logging out
// Children can freely explore and code on Tinkora; grown-up controls require this verification.
import { useState, useId } from 'react';
import { buzz } from '../ui/fx';
import './parent-gate.css';

interface Props {
  title?: string;
  actionDescription?: string;
  onSuccess(): void;
  onClose(): void;
}

export function isParentVerified(): boolean {
  try {
    const val = sessionStorage.getItem('tinkora-parent-verified');
    if (!val) return false;
    return Number(val) > Date.now();
  } catch {
    return false;
  }
}

export function markParentVerified(): void {
  try {
    // 15 minutes grace period for the parent
    sessionStorage.setItem('tinkora-parent-verified', String(Date.now() + 15 * 60 * 1000));
  } catch {
    // ignore
  }
}

export function clearParentVerified(): void {
  try {
    sessionStorage.removeItem('tinkora-parent-verified');
  } catch {
    // ignore
  }
}

export function ParentGateModal({
  title = 'Parent Verification',
  actionDescription = 'Family settings and logout are for grown-ups.',
  onSuccess,
  onClose,
}: Props) {
  // Generate a random multiplication question (e.g. 7 x 8)
  const [{ a, b }] = useState(() => {
    const n1 = Math.floor(Math.random() * 4) + 6; // 6 to 9
    const n2 = Math.floor(Math.random() * 4) + 6; // 6 to 9
    return { a: n1, b: n2 };
  });

  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const inputId = useId();

  const expected = a * b;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(input.trim(), 10) === expected) {
      buzz(12);
      markParentVerified();
      onSuccess();
    } else {
      buzz(40);
      setError(true);
      setInput('');
    }
  };

  return (
    <div
      className="parent-gate-backdrop"
      onClick={(e) => {
        e.stopPropagation();
        buzz(8);
        onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="parent-gate-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="parent-gate-close"
          onClick={(e) => {
            e.stopPropagation();
            buzz(8);
            onClose();
          }}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="parent-gate-head">
          <span className="label">[ Grown-ups Only ]</span>
          <h2 className="parent-gate-title">{title}</h2>
          <p className="parent-gate-lead">{actionDescription} Solve this quick math check to continue:</p>
        </div>

        <form onSubmit={handleSubmit} className="parent-gate-form">
          <div className="parent-gate-math">
            <span className="parent-gate-equation">
              {a} &times; {b} = ?
            </span>
          </div>

          <div className="parent-gate-input-row">
            <label htmlFor={inputId} className="visually-hidden">
              Answer to {a} &times; {b}
            </label>
            <input
              id={inputId}
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              autoFocus
              className={`parent-gate-input${error ? ' has-error' : ''}`}
              placeholder="Your answer"
              value={input}
              onChange={(e) => {
                setError(false);
                setInput(e.target.value);
              }}
            />
            <button type="submit" className="led-btn parent-gate-btn">
              Continue &rarr;
            </button>
          </div>

          {error && (
            <p className="parent-gate-err" role="alert">
              That is not quite right. Please try again.
            </p>
          )}

          <div className="parent-gate-actions">
            <button
              type="button"
              className="mono-link parent-gate-cancel"
              onClick={() => {
                buzz(8);
                onClose();
              }}
            >
              Cancel and return
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
