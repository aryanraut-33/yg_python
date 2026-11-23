// Floating top bar for Tinkora.
// On child pages (/home, /progress, /learn), displays the specialized child studio navbar:
// Projects, Progress, Learn lessons, and Child Name (with dropdown menu for dashboard, family page, logout)
// and Appreciation Badges. On weekends (Fri/Sat/Sun), illuminates the Weekend Showcase button.
// On marketing/other pages, displays the clean marketing navbar (How it works, Projects, For parents, Family/Child).
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { linkClick, navigate, usePath } from '../router';
import { ThemeToggle } from './ThemeToggle';
import { onboardingCompleted } from '../onboarding/progress';
import { getActiveChild, signOut, useActiveChild } from '../account/family';
import { accountsEnabled } from '../account/supabase';
import { buzz } from './fx';
import { fetchChildAppreciations, type ChildAppreciation } from '../sharing/publish';
import { calculateAppreciationBadges } from '../sharing/badges';
import { FridayShowcase, type ShowcaseProject } from '../sharing/FridayShowcase';
import { AppreciationBadgesModal } from '../sharing/AppreciationBadgesModal';
import { isParentVerified, ParentGateModal } from '../account/ParentGateModal';
import { liveProjects } from '../content/projects';
import { loadProgress } from '../sandbox/progress';

export function startHref() {
  if (getActiveChild()) return '/home';
  return onboardingCompleted() ? '/play/name-light-show' : '/start';
}

const GAP = 8; // matches .site-nav-right gap

export const HOME_HERO_EVENT = 'yg-home-hero';

function goHomeHero(e: MouseEvent<HTMLAnchorElement>) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  if (window.location.hash) window.history.replaceState(null, '', '/');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  window.dispatchEvent(new Event(HOME_HERO_EVENT));
}

export function SiteNav({ onHome, hero }: { onHome: boolean; hero?: string }) {
  const path = usePath();
  const child = useActiveChild();
  const rowRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const dropdownWrapRef = useRef<HTMLDivElement>(null);

  const [scrolled, setScrolled] = useState(() => window.scrollY > 24);
  const [atHero, setAtHero] = useState(Boolean(hero));
  const [ready, setReady] = useState(false);

  // Appreciation badges & showcase modal state
  const [appreciations, setAppreciations] = useState<ChildAppreciation[]>([]);
  const [showcaseOpen, setShowcaseOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);

  // Child name dropdown & parent gate state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [parentGateAction, setParentGateAction] = useState<'family' | 'logout' | null>(null);

  // Dedicated child section check: only /home, /progress, /learn show child-specific navbar
  const isChildSection = path === '/home' || path === '/progress' || path === '/learn';

  // Weekend check: Friday (5), Saturday (6), Sunday (0)
  const isWeekend = [0, 5, 6].includes(new Date().getDay());

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const onDocClick = (e: MouseEvent | globalThis.MouseEvent) => {
      if (dropdownWrapRef.current && !dropdownWrapRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!child?.id) return;
    let alive = true;
    fetchChildAppreciations(child.id)
      .then((data) => {
        if (alive) setAppreciations(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [child?.id]);

  const badgeSummary = useMemo(
    () => calculateAppreciationBadges(appreciations),
    [appreciations],
  );

  const showcaseProjects: ShowcaseProject[] = useMemo(() => {
    if (!child) return [];
    return liveProjects().map((p) => {
      const prog = loadProgress(p.manifest.id);
      const codeStr = prog.code ? prog.code['main.py'] || Object.values(prog.code)[0] : undefined;
      return {
        id: p.manifest.id,
        title: p.manifest.title,
        pitch: p.manifest.pitch,
        code: codeStr,
      };
    });
  }, [child]);

  // Scroll state: wordmark plate, and whether the hero is still on screen.
  useEffect(() => {
    const on = () => {
      setScrolled(window.scrollY > 24);
      if (!hero) return;
      const h = document.querySelector(hero)?.getBoundingClientRect();
      setAtHero(h ? h.bottom > 110 : false);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [hero]);

  // How far the panel and the switch move between the two layouts.
  useLayoutEffect(() => {
    const row = rowRef.current;
    const panel = panelRef.current;
    if (!row || !panel) return;
    const measure = () => {
      const w = panel.offsetWidth;
      const panelShift = w ? panel.offsetLeft - (row.clientWidth / 2 - w / 2) : 0;
      const themeShift = w ? w + GAP : 0;
      row.style.setProperty('--panel-shift', `${Math.max(0, panelShift)}px`);
      row.style.setProperty('--theme-shift', `${themeShift}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    ro.observe(panel);
    const raf = requestAnimationFrame(() => setReady(true));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleDropdownSelect = (action: 'family' | 'home' | 'logout') => {
    buzz(8);
    setDropdownOpen(false);

    if (action === 'home') {
      navigate('/home');
      return;
    }

    if (isParentVerified()) {
      if (action === 'family') {
        navigate('/family');
      } else if (action === 'logout') {
        signOut().catch(() => {}).finally(() => navigate('/'));
      }
      return;
    }

    setParentGateAction(action);
  };

  const handleParentGateSuccess = () => {
    const action = parentGateAction;
    setParentGateAction(null);
    if (action === 'family') {
      navigate('/family');
    } else if (action === 'logout') {
      signOut().catch(() => {}).finally(() => navigate('/'));
    }
  };

  const to = (hash: string) => (onHome ? `#${hash}` : `/#${hash}`);
  const cls = ['site-nav', scrolled && 'is-scrolled', atHero && 'at-hero', ready && 'nav-ready']
    .filter(Boolean)
    .join(' ');

  return (
    <header className={cls}>
      <div className="site-nav-row" ref={rowRef}>
        <a className="wordmark nav-plate" href="/" onClick={onHome ? goHomeHero : linkClick}>
          Tinkora
        </a>
        <div className="site-nav-right">
          {/* Weekend Showcase button only appears in child studio pages on weekends */}
          {isChildSection && isWeekend && child && (
            <button
              type="button"
              className="nav-showcase-btn"
              onClick={() => {
                buzz(10);
                setShowcaseOpen(true);
              }}
              title="Weekend Showcase"
              aria-label="Open Weekend Showcase"
            >
              ✦ SHOWCASE ✦
            </button>
          )}

          <span className="nav-theme-wrap">
            <ThemeToggle className="nav-theme" />
          </span>

          <nav className="nav-panel" aria-label="Site" ref={panelRef}>
            {isChildSection && child ? (
              // Child Studio Navbar (strictly on /home, /progress, /learn)
              <>
                <a className="nav-link" href="/projects" onClick={linkClick}>
                  Projects
                </a>
                <a className="nav-link" href="/progress" onClick={linkClick}>
                  Progress
                </a>
                <a className="nav-link" href="/learn" onClick={linkClick}>
                  <span className="nav-learn-full">Learn lessons</span>
                  <span className="nav-learn-short">Learn</span>
                </a>
                <div className="nav-child-group" ref={dropdownWrapRef}>
                  <button
                    type="button"
                    className="nav-link nav-child-name nav-child-dropdown-btn"
                    onClick={() => {
                      buzz(8);
                      setDropdownOpen((v) => !v);
                    }}
                    aria-expanded={dropdownOpen}
                    title={`${child.firstName}'s account menu`}
                  >
                    <span>{child.firstName}</span>
                    <span className="nav-child-arrow" aria-hidden="true">
                      {dropdownOpen ? '▲' : '▼'}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="nav-badge-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      buzz(8);
                      setBadgeModalOpen(true);
                    }}
                    title="Appreciation badges"
                    aria-label="Appreciation badges"
                  >
                    <span className="nav-badge-icon" aria-hidden="true">
                      <img
                        src={badgeSummary.latestUnlockedBadge?.image || '/badges/first_fans.png'}
                        alt=""
                        className={`nav-badge-thumb${badgeSummary.latestUnlockedBadge ? '' : ' is-locked'}`}
                      />
                    </span>
                    {badgeSummary.uniquePeopleCount > 0 && (
                      <span className="nav-badge-count">{badgeSummary.uniquePeopleCount}</span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="nav-child-menu" role="menu">
                      <button
                        type="button"
                        className="nav-child-menu-item"
                        role="menuitem"
                        onClick={() => handleDropdownSelect('family')}
                      >
                        <span className="nav-child-menu-icon" aria-hidden="true">👨‍👩‍👧</span>
                        <span className="nav-child-menu-label">Family page</span>
                        <span className="nav-child-menu-lock" title="Parent check required">🔒</span>
                      </button>
                      <button
                        type="button"
                        className="nav-child-menu-item"
                        role="menuitem"
                        onClick={() => handleDropdownSelect('home')}
                      >
                        <span className="nav-child-menu-icon" aria-hidden="true">🚀</span>
                        <span className="nav-child-menu-label">Open dashboard</span>
                      </button>
                      <div className="nav-child-menu-divider" />
                      <button
                        type="button"
                        className="nav-child-menu-item nav-child-menu-danger"
                        role="menuitem"
                        onClick={() => handleDropdownSelect('logout')}
                      >
                        <span className="nav-child-menu-icon" aria-hidden="true">🚪</span>
                        <span className="nav-child-menu-label">Log out</span>
                        <span className="nav-child-menu-lock" title="Parent check required">🔒</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Marketing & General Navbar (Homepage, /family, /privacy, etc.)
              <>
                <a className="nav-link" href={to('how')}>
                  How it works
                </a>
                <a className="nav-link" href={to('projects')}>
                  Projects
                </a>
                <a className="nav-link" href={to('parents')}>
                  For parents
                </a>
                {accountsEnabled && (
                  child ? (
                    <div className="nav-child-group" ref={dropdownWrapRef}>
                      <button
                        type="button"
                        className="nav-link nav-child-name nav-child-dropdown-btn"
                        onClick={() => {
                          buzz(8);
                          setDropdownOpen((v) => !v);
                        }}
                        aria-expanded={dropdownOpen}
                        title={`${child.firstName}'s account menu`}
                      >
                        <span>{child.firstName}</span>
                        <span className="nav-child-arrow" aria-hidden="true">
                          {dropdownOpen ? '▲' : '▼'}
                        </span>
                      </button>
                      {dropdownOpen && (
                        <div className="nav-child-menu" role="menu">
                          <button
                            type="button"
                            className="nav-child-menu-item"
                            role="menuitem"
                            onClick={() => handleDropdownSelect('family')}
                          >
                            <span className="nav-child-menu-icon" aria-hidden="true">👨‍👩‍👧</span>
                            <span className="nav-child-menu-label">Family page</span>
                            <span className="nav-child-menu-lock" title="Parent check required">🔒</span>
                          </button>
                          <button
                            type="button"
                            className="nav-child-menu-item"
                            role="menuitem"
                            onClick={() => handleDropdownSelect('home')}
                          >
                            <span className="nav-child-menu-icon" aria-hidden="true">🚀</span>
                            <span className="nav-child-menu-label">Open dashboard</span>
                          </button>
                          <div className="nav-child-menu-divider" />
                          <button
                            type="button"
                            className="nav-child-menu-item nav-child-menu-danger"
                            role="menuitem"
                            onClick={() => handleDropdownSelect('logout')}
                          >
                            <span className="nav-child-menu-icon" aria-hidden="true">🚪</span>
                            <span className="nav-child-menu-label">Log out</span>
                            <span className="nav-child-menu-lock" title="Parent check required">🔒</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <a className="nav-link" href="/family" onClick={linkClick}>
                      Family
                    </a>
                  )
                )}
              </>
            )}
          </nav>
        </div>
      </div>

      {showcaseOpen && child && (
        <FridayShowcase
          childId={child.id}
          childName={child.firstName}
          projects={showcaseProjects}
          onClose={() => setShowcaseOpen(false)}
        />
      )}

      {badgeModalOpen && child && (
        <AppreciationBadgesModal
          appreciations={appreciations}
          childName={child.firstName}
          onClose={() => setBadgeModalOpen(false)}
        />
      )}

      {parentGateAction && (
        <ParentGateModal
          title="Parent Verification"
          actionDescription={
            parentGateAction === 'logout'
              ? 'Logging out is restricted to grown-ups.'
              : 'Family account settings are restricted to grown-ups.'
          }
          onSuccess={handleParentGateSuccess}
          onClose={() => setParentGateAction(null)}
        />
      )}
    </header>
  );
}
