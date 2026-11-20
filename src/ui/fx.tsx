// LED-board effects for the home page: the dot-matrix pixel field, haptics, scroll reveals,
// dot-matrix numbers, split-flap text, typing code and a tiny LED light show.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { currentTheme, type Theme } from './theme';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Haptics ----------
// Short buzzes on phones that support it (Android Chrome). iPhones ignore vibrate(), so
// nothing happens there. Browsers also only allow it after the visitor has tapped once.
let tapped = false;
if (typeof window !== 'undefined') window.addEventListener('pointerdown', () => (tapped = true), { once: true, passive: true });

export function buzz(pattern: number | number[] = 10) {
  if (!tapped || !('vibrate' in navigator)) return;
  if (!window.matchMedia('(pointer: coarse)').matches || reducedMotion()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Not allowed: ignore.
  }
}

// ---------- Scroll reveal ----------
export function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, threshold]);
  return [ref, inView] as const;
}

// ---------- Pixel field: LED dots that light up and flow behind the cursor ----------
const COLORS: Record<Theme, string[]> = {
  dark: ['#FFD66B', '#FF8A65', '#7BE0C3', '#FFB4D2', '#8CC8FF'],
  light: ['#E2A332', '#E07A55', '#2FA67F', '#D9709C', '#5B95D6'],
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

/** Re-renders when the colour theme changes (toggle or system setting). */
export function useThemeValue(): Theme {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  useEffect(() => {
    const on = () => setTheme(currentTheme());
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    window.addEventListener('yg-theme', on);
    mq.addEventListener('change', on);
    return () => {
      window.removeEventListener('yg-theme', on);
      mq.removeEventListener('change', on);
    };
  }, []);
  return theme;
}

// Anything the visitor might click or type in. Near these, the pixel trail calms down.
const INTERACTIVE = 'a, button, input, textarea, select, label, summary, [role="button"], [role="radio"], .cm-editor';
const PROBES = [
  [0, 0],
  [26, 0],
  [-26, 0],
  [0, 26],
  [0, -26],
];
function nearInteractive(x: number, y: number): boolean {
  for (const [dx, dy] of PROBES) {
    const el = document.elementFromPoint(x + dx, y + dy);
    if (el && el.closest(INTERACTIVE)) return true;
  }
  return false;
}

export function PixelField({ theme: themeProp }: { theme?: Theme }) {
  const themeValue = useThemeValue();
  const theme = themeProp ?? themeValue;
  const baseRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const base = baseRef.current;
    const fx = fxRef.current;
    if (!base || !fx) return;
    const bctx = base.getContext('2d');
    const ctx = fx.getContext('2d');
    if (!bctx || !ctx) return;

    let gap = 16;
    const palette = COLORS[theme];
    const dot = theme === 'dark' ? 'rgba(245,236,220,0.11)' : 'rgba(15,31,28,0.13)';

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      gap = w < 700 ? 18 : 16;
      for (const c of [base, fx]) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
        c.style.width = `${w}px`;
        c.style.height = `${h}px`;
      }
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.clearRect(0, 0, w, h);
      bctx.fillStyle = dot;
      for (let y = gap / 2; y < h; y += gap) for (let x = gap / 2; x < w; x += gap) bctx.fillRect(x - 1, y - 1, 2, 2);
    };
    size();
    window.addEventListener('resize', size);
    if (reducedMotion()) return () => window.removeEventListener('resize', size);

    let particles: Particle[] = [];
    let raf = 0;
    let lastT = 0;
    let last: { x: number; y: number } | null = null;
    // Where the pointer is hovering near something clickable: the trail subsides around it.
    let calm: { x: number; y: number } | null = null;

    const spawn = (x: number, y: number, vx: number, vy: number) => {
      particles.push({ x, y, vx, vy, life: 1, color: palette[(Math.random() * palette.length) | 0] });
      if (particles.length > 520) particles = particles.slice(-520);
    };

    const frame = (t: number) => {
      const dt = lastT ? Math.min(48, t - lastT) : 16;
      lastT = t;
      ctx.clearRect(0, 0, fx.width, fx.height);
      const s = gap - 5;
      particles = particles.filter((p) => {
        p.x += (p.vx * dt) / 16;
        p.y += (p.vy * dt) / 16;
        p.vx *= 0.93;
        p.vy *= 0.93;
        p.life -= dt / 950;
        if (calm && Math.hypot(p.x - calm.x, p.y - calm.y) < 140) p.life -= dt / 180;
        if (p.life <= 0) return false;
        // Snap to the dot grid, like a real LED board.
        const gx = Math.round((p.x - gap / 2) / gap) * gap + gap / 2;
        const gy = Math.round((p.y - gap / 2) / gap) * gap + gap / 2;
        ctx.globalAlpha = p.life * p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(gx - s / 2, gy - s / 2, s, s);
        return true;
      });
      ctx.globalAlpha = 1;
      if (particles.length) raf = requestAnimationFrame(frame);
      else {
        raf = 0;
        lastT = 0;
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      if (nearInteractive(x, y)) {
        calm = { x, y };
        last = { x, y };
        kick();
        return;
      }
      calm = null;
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        const steps = Math.min(6, Math.ceil(Math.hypot(dx, dy) / gap));
        for (let i = 1; i <= steps; i++) {
          const k = i / steps;
          spawn(last.x + dx * k, last.y + dy * k, dx * 0.05 + (Math.random() - 0.5) * 1.4, dy * 0.05 + (Math.random() - 0.5) * 1.4);
        }
        kick();
      }
      last = { x, y };
    };
    const onLeave = () => (last = null);

    // A few idle blips so the board feels alive on phones too.
    const idle = window.setInterval(() => {
      if (document.hidden) return;
      spawn(Math.random() * window.innerWidth, Math.random() * window.innerHeight, 0, 0);
      kick();
    }, 700);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('resize', size);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.clearInterval(idle);
      cancelAnimationFrame(raf);
    };
  }, [theme]);

  return (
    <div className="pixel-field" aria-hidden="true">
      <canvas ref={baseRef} />
      <canvas ref={fxRef} />
    </div>
  );
}

// ---------- Dot-matrix numbers (5 × 7) ----------
const DIGITS: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
};

export function DotNumber({ value, cell = 9, lit, className }: { value: string; cell?: number; lit: boolean; className?: string }) {
  const chars = value.split('');
  const w = chars.length * 6 - 1;
  return (
    <svg className={`dot-number${lit ? ' lit' : ''} ${className ?? ''}`} viewBox={`0 0 ${w * cell} ${7 * cell}`} width={w * cell} height={7 * cell} aria-hidden="true">
      {chars.map((ch, ci) =>
        (DIGITS[ch] ?? DIGITS['0']).map((row, ry) =>
          row.split('').map((bit, rx) => (
            <rect
              key={`${ci}-${ry}-${rx}`}
              x={(ci * 6 + rx) * cell + cell * 0.12}
              y={ry * cell + cell * 0.12}
              width={cell * 0.76}
              height={cell * 0.76}
              className={bit === '1' ? 'on' : 'off'}
              style={bit === '1' ? { transitionDelay: `${(ci * 6 + rx) * 35 + ry * 12}ms` } : undefined}
            />
          )),
        ),
      )}
    </svg>
  );
}

// ---------- Split-flap text (departure-board style) ----------
const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function FlapText({ text, active, delay = 0 }: { text: string; active: boolean; delay?: number }) {
  const [shown, setShown] = useState(text);
  useEffect(() => {
    if (!active || reducedMotion()) {
      setShown(text);
      return;
    }
    let tick = 0;
    const start = performance.now() + delay;
    const id = window.setInterval(() => {
      const t = performance.now() - start;
      if (t < 0) return;
      tick++;
      const settled = Math.floor(t / 45);
      const out = text
        .split('')
        .map((ch, i) => (i < settled || ch === ' ' ? ch : FLAP_CHARS[(tick * 7 + i * 13) % FLAP_CHARS.length]))
        .join('');
      setShown(out);
      if (settled >= text.length) window.clearInterval(id);
    }, 40);
    setShown(text.replace(/[^ ]/g, '·'));
    return () => window.clearInterval(id);
  }, [active, text, delay]);
  return (
    <span className="flap" aria-label={text}>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}

// ---------- Typing code with simple highlighting ----------
const KEYWORDS = new Set(['for', 'in', 'import', 'if', 'else', 'while', 'def', 'return', 'True', 'False']);

function tokenize(code: string): [string, string][] {
  const out: [string, string][] = [];
  const re = /("[^"\n]*"|#[^\n]*|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b|\s+|.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const t = m[0];
    let kind = 'text';
    if (t.startsWith('"')) kind = 'str';
    else if (t.startsWith('#')) kind = 'com';
    else if (/^\d/.test(t)) kind = 'num';
    else if (KEYWORDS.has(t)) kind = 'kw';
    else if (/^[A-Za-z_]/.test(t) && code[re.lastIndex] === '(') kind = 'fn';
    out.push([t, kind]);
  }
  return out;
}

export function TypingCode({ code, active }: { code: string; active: boolean }) {
  const tokens = useMemo(() => tokenize(code), [code]);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (reducedMotion()) {
      setN(code.length);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 3;
      setN(Math.min(i, code.length));
      if (i >= code.length) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [active, code.length]);

  let left = n;
  const parts: ReactNode[] = [];
  tokens.forEach(([t, kind], k) => {
    if (left <= 0) return;
    const piece = t.slice(0, left);
    left -= piece.length;
    parts.push(
      <span key={k} className={`tk-${kind}`}>
        {piece}
      </span>,
    );
  });
  return (
    <pre className="type-code" aria-label={code}>
      <code aria-hidden="true">
        {parts}
        <span className={`type-cursor${n >= code.length ? ' done' : ''}`} />
      </code>
    </pre>
  );
}

// ---------- LED light show (what the code makes) ----------
export function LedShow({ name, active }: { name: string; active: boolean }) {
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    if (!active || reducedMotion()) return;
    const id = window.setInterval(() => setSeed((s) => s + 1), 420);
    return () => window.clearInterval(id);
  }, [active]);
  const colors = ['#FFD66B', '#FF8A65', '#7BE0C3', '#FFB4D2', '#8CC8FF'];
  const letters = name.split('');
  const w = 640;
  const gap = 96;
  const start = (w - (letters.length - 1) * gap) / 2;
  return (
    <svg className="led-show" viewBox="0 0 640 260" role="img" aria-label={`The letters ${name} glowing in changing colours`}>
      <defs>
        <filter id="led-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="led-dots" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect x="7" y="7" width="2" height="2" fill="rgba(245,236,220,0.12)" />
        </pattern>
      </defs>
      <rect width="640" height="260" fill="#0B1714" />
      <rect width="640" height="260" fill="url(#led-dots)" />
      {letters.map((ch, i) => (
        <g key={i}>
          <circle cx={start + i * gap} cy={130} r={38} fill={colors[(seed * 3 + i * 2) % colors.length]} filter="url(#led-glow)" />
          <text x={start + i * gap} y={132} textAnchor="middle" dominantBaseline="middle" fontFamily="Instrument Serif, serif" fontSize="44" fill="#0F1F1C">
            {ch}
          </text>
        </g>
      ))}
    </svg>
  );
}
