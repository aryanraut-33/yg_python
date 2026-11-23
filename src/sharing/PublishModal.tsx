import { useState, type FormEvent } from 'react';
import { scanChildText } from './safety';
import { publishProjectSnapshot, createFamilyInvite } from './publish';
import { buzz } from '../ui/fx';
import './sharing.css';

interface Props {
  childId: string;
  childName: string;
  projectId: string;
  projectTitle: string;
  currentCode: string;
  onClose(): void;
}

const PRESET_RECIPIENTS = ['Santosh Mama', 'Dadi', 'Nani', 'Papa', 'Mummy', 'Chacha', 'Bua', 'Tushar'];

export function PublishModal({ childId, childName, projectId, projectTitle, currentCode, onClose }: Props) {
  const [recipient, setRecipient] = useState('');
  const [title, setTitle] = useState(projectTitle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Live safety check on title
  const safety = scanChildText(title);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !title.trim()) return;
    if (!safety.safe) return;

    setBusy(true);
    setError('');
    buzz(12);

    try {
      // 1. Publish frozen code snapshot
      await publishProjectSnapshot(childId, projectId, title, currentCode);
      // 2. Generate named invite
      const invite = await createFamilyInvite(childId, recipient);
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const protocol = isLocal ? 'http:' : window.location.protocol;
      const origin = `${protocol}//${window.location.host}`;
      const url = `${origin}/s/${invite.token}`;
      setInviteUrl(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create link');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      buzz(8);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const whatsappText = inviteUrl
    ? encodeURIComponent(
      `Hi ${recipient}! Look what ${childName} built with real Python on Tinkora:\n\n"${title}"\n${inviteUrl}\n\n(You can play it on your phone and send reactions!)`,
    )
    : '';

  return (
    <div className="share-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <button className="share-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {!inviteUrl ? (
          <div>
            <p className="label">[ Share with family ]</p>
            <h2 className="share-title">Show what you built!</h2>
            <p className="share-lead">
              Create a personal link for someone in your family. They can play your project on their phone and send you encouragement!
            </p>

            <form className="share-form" onSubmit={handleSubmit}>
              <div>
                <label className="label" htmlFor="recipient-input">
                  Who are you showing this to?
                </label>
                <div className="share-chips">
                  {PRESET_RECIPIENTS.map((name) => (
                    <button
                      type="button"
                      key={name}
                      className={`share-chip${recipient === name ? ' is-selected' : ''}`}
                      onClick={() => setRecipient(name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <input
                  id="recipient-input"
                  className="acct-input"
                  style={{ width: '100%' }}
                  placeholder="Or type a name (e.g. Geeta Masi)"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="title-input">
                  Project title
                </label>
                <input
                  id="title-input"
                  className="acct-input"
                  style={{ width: '100%' }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {!safety.safe && <div className="share-warning">{safety.warning}</div>}

              {error && <p className="acct-error">{error}</p>}

              <div className="share-btn-group">
                <button className="led-btn" type="submit" disabled={busy || !recipient.trim() || !safety.safe}>
                  {busy ? 'Creating personal link…' : `Create link for ${recipient || 'family'}`} →
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <p className="label">[ Link ready ]</p>
            <h2 className="share-title">{childName}'s build for {recipient}</h2>
            <p className="share-lead">
              Send this link to {recipient}. They don't need an account or password to play your build!
            </p>

            <div className="share-success-box">
              <label className="label" htmlFor="share-url">
                Your personal link
              </label>
              <div className="share-url-row">
                <input id="share-url" className="share-url-input" readOnly value={inviteUrl} />
                <button className="led-btn" onClick={copyLink}>
                  {copied ? 'Copied! ✓' : 'Copy'}
                </button>
              </div>
              {window.location.hostname === 'localhost' && (
                <p className="acct-small" style={{ margin: '6px 0 0', opacity: 0.8 }}>
                  Note: In local testing, ensure your browser opens <strong>http://</strong> (not https://).
                </p>
              )}

              <a
                className="share-whatsapp-btn"
                href={`https://api.whatsapp.com/send?text=${whatsappText}`}
                target="_blank"
                rel="noreferrer"
              >
                <span>Share on WhatsApp</span> →
              </a>

              {inviteUrl && (
                <div style={{ marginTop: 10 }}>
                  <a
                    className="mono-link"
                    href={inviteUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '12.5px', textDecoration: 'underline' }}
                  >
                    Open project preview ↗
                  </a>
                </div>
              )}
            </div>

            <p className="acct-small" style={{ marginTop: 16 }}>
              {recipient} can tap preset compliments like "How did you make this?!" or send hearts and stars.
            </p>

            <button className="mono-link" style={{ marginTop: 12 }} onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
