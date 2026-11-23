// "Start building" button pinned to the bottom-right corner. It appears once the
// visitor scrolls past `after` and hides again when `until` (the closing call to
// action) comes into view, so there are never two Start buttons on screen.
import { useEffect, useState } from 'react';
import { linkClick } from '../router';
import { buzz } from './fx';

export function FloatingCta({
  href,
  after,
  until,
  label = 'Start building',
}: {
  href: string;
  /** CSS selector: the button shows once this element has scrolled out of view. */
  after: string;
  /** CSS selector: the button hides once this element comes into view. */
  until: string;
  label?: string;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const on = () => {
      const a = document.querySelector(after)?.getBoundingClientRect();
      const u = document.querySelector(until)?.getBoundingClientRect();
      if (!a || !u) return;
      setShown(a.bottom < 0 && u.top > window.innerHeight);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, [after, until]);

  return (
    <a
      className={`floating-cta led-btn${shown ? ' shown' : ''}`}
      href={href}
      onClick={linkClick}
      onPointerDown={() => buzz(12)}
      aria-hidden={!shown}
      tabIndex={shown ? 0 : -1}
    >
      <span className="led on" aria-hidden="true" />
      {label} <span aria-hidden="true">→</span>
    </a>
  );
}
