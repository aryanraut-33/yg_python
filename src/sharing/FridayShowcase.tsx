// Friday Showcase & WhatsApp Share Generator (Phase 3 Option A).
// Allows child and parents to pick their best build and generates ready-made WhatsApp family invitations.
import { useState } from 'react';
import { MascotImg } from '../onboarding/mascots';
import { createFamilyInvite, publishProjectSnapshot } from './publish';
import { buzz } from '../ui/fx';
import './showcase.css';

export interface ShowcaseProject {
  id: string;
  title: string;
  pitch: string;
  code?: string;
}

interface Props {
  childId: string;
  childName: string;
  projects: ShowcaseProject[];
  onClose?(): void;
}

const PRESET_RECIPIENTS = [
  'Family Group',
  'Santosh Mama',
  'Dadi',
  'Nani',
  'Papa',
  'Mummy',
  'Chacha',
  'Bua',
];

export function FridayShowcase({ childId, childName, projects, onClose }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || '',
  );
  const [recipient, setRecipient] = useState('Family Group');
  const [customRecipient, setCustomRecipient] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const finalRecipient = customRecipient.trim() || recipient;

  const handleCreateShare = async () => {
    if (!activeProject) return;
    setBusy(true);
    setError('');
    buzz(12);

    try {
      // 1. If project has code snapshot, ensure it's published
      if (activeProject.code) {
        await publishProjectSnapshot(
          childId,
          activeProject.id,
          activeProject.title,
          activeProject.code,
        );
      }
      // 2. Generate named invite
      const invite = await createFamilyInvite(childId, finalRecipient);
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const protocol = isLocal ? 'http:' : window.location.protocol;
      const origin = `${protocol}//${window.location.host}`;
      const url = `${origin}/s/${invite.token}`;
      setInviteUrl(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not generate share link');
    } finally {
      setBusy(false);
    }
  };

  const shareText = inviteUrl
    ? `🌟 Look what ${childName} built with real Python code on Tinkora!\n\n"${activeProject?.title || 'My Project'}"\n👉 ${inviteUrl}\n\nTap the link on your phone to watch it run in your browser, and tap a cheer to encourage ${childName}! ✨`
    : '';

  const whatsappHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const copyMessage = async () => {
    if (!shareText) return;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      buzz(8);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const card = (
    <div className="showcase-card" onClick={(e) => e.stopPropagation()}>
      {onClose && (
        <button
          type="button"
          className="showcase-close-btn"
          onClick={(e) => {
            e.stopPropagation();
            buzz(8);
            onClose();
          }}
          aria-label="Close"
        >
          ✕
        </button>
      )}

      <div className="showcase-badge-pill">
        <span>✦ WEEKEND SHOWCASE ✦</span>
      </div>

      <div className="showcase-body">
        <div className="showcase-content">
          <h2 className="showcase-title">Show off your best build!</h2>
          <p className="showcase-lead">
            Pick your favorite project this week to share with your family circle on WhatsApp. Relatives can play it on their phone and send cheers!
          </p>

          {!inviteUrl ? (
            <div className="showcase-form">
              {/* Project Picker */}
              <div className="showcase-section">
                <label className="label">1. Choose a project to showcase</label>
                <div className="showcase-project-grid">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`showcase-project-btn${selectedProjectId === p.id ? ' is-selected' : ''}`}
                      onClick={() => setSelectedProjectId(p.id)}
                    >
                      <span className="showcase-p-title">{p.title}</span>
                      <span className="showcase-p-sub">{p.pitch}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Picker */}
              <div className="showcase-section">
                <label className="label">2. Who are you sending this to?</label>
                <div className="showcase-chips">
                  {PRESET_RECIPIENTS.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className={`showcase-chip${recipient === name && !customRecipient ? ' is-selected' : ''}`}
                      onClick={() => {
                        setRecipient(name);
                        setCustomRecipient('');
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  className="showcase-input"
                  placeholder="Or enter a name (e.g. Ananya Mausi)"
                  value={customRecipient}
                  onChange={(e) => setCustomRecipient(e.target.value)}
                  maxLength={40}
                />
              </div>

              {error && <p className="showcase-error">{error}</p>}

              <button
                type="button"
                className="led-btn showcase-submit-btn"
                disabled={busy}
                onClick={handleCreateShare}
                onPointerDown={() => buzz(12)}
              >
                {busy ? 'Preparing showcase…' : 'Generate WhatsApp Share Link →'}
              </button>
            </div>
          ) : (
            <div className="showcase-result">
              <div className="showcase-ready-box">
                <p className="label">[ Ready to Send ]</p>
                <h3 className="showcase-ready-title">WhatsApp message ready for {finalRecipient}!</h3>

                <pre className="showcase-preview-text">{shareText}</pre>

                <div className="showcase-actions">
                  <a
                    className="showcase-wa-btn"
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => buzz(10)}
                  >
                    <span className="wa-icon">💬</span>
                    <span>Share on WhatsApp →</span>
                  </a>

                  <button type="button" className="led-btn showcase-copy-btn" onClick={copyMessage}>
                    {copied ? 'Copied to Clipboard! ✓' : 'Copy Message'}
                  </button>

                  {inviteUrl && (
                    <a
                      className="mono-link"
                      href={inviteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '13px', textDecoration: 'underline' }}
                    >
                      Open project preview ↗
                    </a>
                  )}

                  <button
                    type="button"
                    className="mono-link showcase-new-link"
                    onClick={() => setInviteUrl(null)}
                  >
                    Share another project
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="showcase-mascot-wrap" aria-hidden="true">
          <MascotImg who="riff" pose="celebrating" />
        </div>
      </div>
    </div>
  );

  if (onClose) {
    return (
      <div
        className="showcase-modal-backdrop"
        onClick={(e) => {
          e.stopPropagation();
          buzz(8);
          onClose();
        }}
        role="dialog"
        aria-modal="true"
      >
        {card}
      </div>
    );
  }

  return card;
}
