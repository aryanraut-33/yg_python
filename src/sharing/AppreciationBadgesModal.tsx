// Pop-up modal for Appreciation Badges.
// Triggered when clicking the badge alongside the child's name in the top navbar.
import { useMemo } from 'react';
import { calculateAppreciationBadges, type BadgeSummary } from './badges';
import type { ChildAppreciation } from './publish';
import { buzz } from '../ui/fx';
import './badges.css';

interface Props {
  appreciations: ChildAppreciation[];
  childName: string;
  onClose(): void;
}

export function AppreciationBadgesModal({ appreciations, childName, onClose }: Props) {
  const summary: BadgeSummary = useMemo(
    () => calculateAppreciationBadges(appreciations),
    [appreciations],
  );

  return (
    <div
      className="badge-modal-backdrop"
      onClick={(e) => {
        e.stopPropagation();
        buzz(8);
        onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="badge-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="badge-modal-close"
          onClick={(e) => {
            e.stopPropagation();
            buzz(8);
            onClose();
          }}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="badge-modal-head">
          <span className="label">[ Milestones ]</span>
          <h2 className="badge-modal-title">Appreciation badges</h2>
          <p className="badge-modal-lead">
            {summary.uniquePeopleCount === 0
              ? `When relatives play ${childName}'s Python projects and send cheers, milestones appear here.`
              : `${summary.uniquePeopleCount} family ${summary.uniquePeopleCount === 1 ? 'member' : 'members'} cheering ${childName}'s Python builds.`}
          </p>
        </div>

        <div className="badge-modal-grid">
          {summary.badges.map((b) => (
            <div key={b.id} className={`badge-card${b.unlocked ? ' is-unlocked' : ''}`}>
              <div className="badge-art-wrap">
                <img src={b.image} alt={b.title} className="badge-art-img" />
              </div>
              <div className="badge-top">
                <span className={`badge-status-pill${b.unlocked ? ' is-done' : ''}`}>
                  {b.unlocked ? 'Unlocked ✓' : `${b.current} / ${b.target}`}
                </span>
              </div>
              <h3 className="badge-card-title">{b.title}</h3>
              <p className="badge-card-desc">{b.description}</p>
              <div className="badge-progress-wrap" aria-hidden="true">
                <div className="badge-progress-bar" style={{ width: `${b.percent}%` }} />
              </div>
            </div>
          ))}
        </div>

        {summary.uniquePeopleNames.length > 0 && (
          <div className="badge-fans-row" style={{ marginTop: '16px' }}>
            <span className="label">Cheered by:</span>
            <div className="badge-fans-chips">
              {summary.uniquePeopleNames.map((name) => (
                <span key={name} className="badge-fan-chip">
                  ❤️ {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
