import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { SLIDES } from './slides';
import { SCENE_H, SCENE_W, sceneSvg } from './scenes';
import { linkClick } from '../router';
import { getRunner } from '../runtime/runnerHub';
import { LandingSections } from './LandingSections';
import { buzz, useThemeValue } from '../ui/fx';
import { HOME_HERO_EVENT, SiteNav, startHref as getStartHref } from '../ui/SiteNav';
import { FloatingCta } from '../ui/FloatingCta';
import './scenes.css';
import './landing.css';

const ADVANCE_MS = 6000;
const SWIPE_PX = 50;

type Move = { from: number | null; dir: 'next' | 'prev' };

function useMediaQuery(q: string) {
  const [match, setMatch] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setMatch(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return match;
}

/** Start loading Python quietly once the page is idle, unless the visitor is saving data. */
function usePreloadPython() {
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData || conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') return;
    const t = setTimeout(() => getRunner(), 2500);
    return () => clearTimeout(t);
  }, []);
}

export function Landing() {
  const theme = useThemeValue();
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const portrait = useMediaQuery('(max-aspect-ratio: 1/1)');
  usePreloadPython();

  const [index, setIndex] = useState(0);
  const [move, setMove] = useState<Move>({ from: null, dir: 'next' });
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tabHidden, setTabHidden] = useState(document.hidden);
  const [scrolled, setScrolled] = useState(false);
  const pointerStart = useRef<number | null>(null);

  const startHref = useMemo(getStartHref, []);
  const scenes = useMemo(() => SLIDES.map((s, i) => sceneSvg(s.key, theme, i)), [theme]);

  const goTo = useCallback(
    (next: number, dir?: 'next' | 'prev') => {
      const n = (next + SLIDES.length) % SLIDES.length;
      if (n === index) return;
      setMove({ from: index, dir: dir ?? (n > index ? 'next' : 'prev') });
      setIndex(n);
    },
    [index],
  );

  // The wordmark brings the visitor back to the intro slide, not whichever project is showing.
  useEffect(() => {
    const on = () => goTo(0, 'prev');
    window.addEventListener(HOME_HERO_EVENT, on);
    return () => window.removeEventListener(HOME_HERO_EVENT, on);
  }, [goTo]);

  const autoAdvance = !userPaused && !hovered && !focused && !tabHidden && !reduced;

  useEffect(() => {
    if (!autoAdvance) return;
    const t = setTimeout(() => goTo(index + 1, 'next'), ADVANCE_MS);
    return () => clearTimeout(t);
  }, [autoAdvance, goTo, index]);

  useEffect(() => {
    const on = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);

  // The scroll hint fades away once the visitor starts scrolling.
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(index + 1, 'next');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(index - 1, 'prev');
    }
  };

  const stateOf = (i: number) => {
    const active = i === index;
    const leaving = i === move.from && !active;
    return active ? `is-active enter-${move.from === null ? 'none' : move.dir}` : leaving ? `is-leaving leave-${move.dir}` : '';
  };

  return (
    <div className="landing">
      <SiteNav onHome hero=".hero" />

      <section
        className={`hero${userPaused ? ' is-paused' : ''}${reduced ? ' is-reduced' : ''}`}
        aria-roledescription="carousel"
        aria-label="Tinkora and some projects kids build"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
        }}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => (pointerStart.current = e.clientX)}
        onPointerUp={(e) => {
          if (pointerStart.current === null) return;
          const dx = e.clientX - pointerStart.current;
          pointerStart.current = null;
          if (Math.abs(dx) > SWIPE_PX) {
            buzz(8);
            goTo(index + (dx < 0 ? 1 : -1), dx < 0 ? 'next' : 'prev');
          }
        }}
      >
        <div className="slides">
          {SLIDES.map((s, i) => {
            const active = i === index;
            const intro = s.key === 'intro';
            return (
              <div
                key={s.key}
                className={`slide ${stateOf(i)}`}
                role="group"
                aria-roledescription="slide"
                aria-label={intro ? 'About Tinkora' : s.name}
                aria-hidden={!active}
                onAnimationEnd={(e) => {
                  if (i === move.from && i !== index && e.target === e.currentTarget) setMove((m) => ({ ...m, from: null }));
                }}
              >
                <svg
                  className="scene"
                  viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
                  preserveAspectRatio={portrait ? 'xMidYMax meet' : 'xMidYMid slice'}
                  aria-hidden="true"
                  focusable="false"
                  dangerouslySetInnerHTML={{ __html: scenes[i] }}
                />
                <div className="hero-text">
                  <p className="hero-eyebrow">{intro ? '[ Real Python · Ages 9–15 ]' : `[ You could build · ${s.name} ]`}</p>
                  <h1 className="hero-headline">
                    {s.headline.split('\n').map((line, li) => (
                      <span key={li}>{line}</span>
                    ))}
                  </h1>
                  <p className="hero-sub">{s.sub}</p>
                  <div className="hero-ctas">
                    <a className="led-btn" href={startHref} onClick={linkClick} onPointerDown={() => buzz(12)} tabIndex={active ? 0 : -1}>
                      Start learning free <span aria-hidden="true">→</span>
                    </a>
                    {intro ? (
                      <a className="mono-link" href="#how" tabIndex={active ? 0 : -1}>
                        How it works ↓
                      </a>
                    ) : (
                      <span className={`status-led${s.href ? ' is-live' : ''}`}>
                        <span className="led" aria-hidden="true" />
                        {s.href ? (s.key === 'lights' ? 'Your first project' : 'Ready to build') : 'Coming soon'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* A small scroll hint instead of slide controls. */}
        <a className={`scroll-hint${scrolled ? ' gone' : ''}`} href="#how" aria-label="Scroll to see how it works">
          <span className="scroll-track" aria-hidden="true">
            <span className="scroll-led" />
          </span>
          <span className="scroll-text">Scroll</span>
        </a>

        {/* Pausing the rotation must stay possible (WCAG 2.2.2). */}
        <button
          className="sq-btn hero-pause"
          onClick={() => setUserPaused((p) => !p)}
          aria-pressed={userPaused}
          aria-label={userPaused ? 'Play the slideshow and animations' : 'Pause the slideshow and animations'}
        >
          {userPaused ? (
            <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M3 1.5v9l7-4.5z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
              <rect x="2.5" y="1.5" width="2.5" height="9" fill="currentColor" />
              <rect x="7" y="1.5" width="2.5" height="9" fill="currentColor" />
            </svg>
          )}
        </button>
      </section>

      <LandingSections startHref={startHref} />
      <FloatingCta href={startHref} after=".hero" until=".cta" />
    </div>
  );
}
