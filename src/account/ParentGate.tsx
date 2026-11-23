// Shown when access is restricted:
// 1. Guests who open a project other than the free starter (Name Light Show) -> asks grown-up to set up family.
// 2. Enrolled child without an active subscription -> asks grown-up to activate their learning pass.
import { linkClick } from '../router';
import { MascotImg } from '../onboarding/mascots';
import { buzz } from '../ui/fx';
import { STARTER_ID } from '../content/projects';
import { SiteNav } from '../ui/SiteNav';
import './account.css';

export function ParentGate({ title, childName }: { title: string; childName?: string }) {
  const isSub = Boolean(childName);
  return (
    <div className="acct-page gate-page">
      <SiteNav onHome={false} />
      <main className="acct gate">
        <MascotImg who="riff" pose="celebrating" className="gate-mascot" />
        <div className="acct-card">
          <p className="label">[ {isSub ? `${childName}'s Pass` : title} ]</p>
          <h1 className="acct-title">{isSub ? `Unlock ${title}` : 'Ready for more projects?'}</h1>
          <p className="acct-lead">
            {isSub ? (
              <>
                First project "Name Light Show" is free for everyone. To unlock <strong>{title}</strong> and all 26 projects for{' '}
                <strong>{childName}</strong>, ask a grown-up to activate their Tinkora pass.
              </>
            ) : (
              <>
                First project "Name Light Show" is free for everyone. To open <strong>{title}</strong> and the other projects, ask a grown-up to set up your
                family. It takes about two minutes.
              </>
            )}
          </p>
          <p className="acct-small">Every child's completed code and starter project is always free and never locked.</p>
          <div className="acct-actions">
            <a className="led-btn" href="/family" onClick={linkClick} onPointerDown={() => buzz(12)}>
              {isSub ? 'Grown-up: manage child pass' : 'Grown-up: set up our family'} <span aria-hidden="true">→</span>
            </a>
            <a className="mono-link" href={`/play/${STARTER_ID}`} onClick={linkClick}>
              Play Name Light Show
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
