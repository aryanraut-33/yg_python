// Sticky top bar for the marketing pages (home and project catalogue).
import { useMemo } from 'react';
import { linkClick } from '../router';
import { ThemeToggle } from './ThemeToggle';
import { buzz } from './fx';
import { onboardingCompleted } from '../onboarding/progress';

export function startHref() {
  // Children who haven't met Nix and Riff yet start with the onboarding.
  return onboardingCompleted() ? '/play/name-light-show' : '/start';
}

export function SiteNav({ onHome }: { onHome: boolean }) {
  const start = useMemo(startHref, []);
  // On the home page the links jump to sections; elsewhere they go back to them.
  const to = (hash: string) => (onHome ? `#${hash}` : `/#${hash}`);
  return (
    <header className="site-nav">
      <a className="wordmark" href="/" onClick={linkClick}>
        yg python
      </a>
      <nav className="site-links" aria-label="Site">
        <a href={to('how')}>
          <span>01</span> How it works
        </a>
        <a href={to('projects')}>
          <span>02</span> Projects
        </a>
        <a href={to('parents')}>
          <span>03</span> For parents
        </a>
      </nav>
      <div className="site-nav-right">
        <ThemeToggle className="sq-btn" />
        <a className="led-btn led-btn-sm" href={start} onClick={linkClick} onPointerDown={() => buzz(12)}>
          Start <span aria-hidden="true">→</span>
        </a>
      </div>
    </header>
  );
}
