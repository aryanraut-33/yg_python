// Visual Component for Family Appreciation Badges.
// Displayed on /home (Child Home) and /family (Parent Hub).
import { useMemo } from 'react';
import { calculateAppreciationBadges, type BadgeSummary } from './badges';
import type { ChildAppreciation } from './publish';
import './badges.css';

interface Props {
  appreciations: ChildAppreciation[];
  childName?: string;
  showPeopleList?: boolean;
}

export function AppreciationBadges({ appreciations, childName, showPeopleList = true }: Props) {
  const summary: BadgeSummary = useMemo(
    () => calculateAppreciationBadges(appreciations),
    [appreciations],
  );

  return (
    <div className="badge-panel">
      <div className="badge-head">
        <div>
          <span className="label">[ Family Appreciation Badges ]</span>
          <h3 className="badge-title">
            {summary.uniquePeopleCount === 0
              ? 'Cheer Badges'
              : `${summary.uniquePeopleCount} family ${summary.uniquePeopleCount === 1 ? 'member' : 'members'} cheering ${childName || 'you'} on!`}
          </h3>
        </div>
        {summary.latestUnlockedBadge && (
          <span className="badge-latest-tag">
            <span className="badge-icon">{summary.latestUnlockedBadge.icon}</span>
            <span>Latest: {summary.latestUnlockedBadge.title}</span>
          </span>
        )}
      </div>

      <p className="badge-sub">
        Every time a relative plays your Python project and sends a cheer, you reach new family milestones.
      </p>

      <div className="badge-grid">
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

            <h4 className="badge-card-title">{b.title}</h4>
            <p className="badge-card-desc">{b.description}</p>

            <div className="badge-progress-wrap" aria-hidden="true">
              <div className="badge-progress-bar" style={{ width: `${b.percent}%` }} />
            </div>
          </div>
        ))}
      </div>

      {showPeopleList && summary.uniquePeopleNames.length > 0 && (
        <div className="badge-fans-row">
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
  );
}
