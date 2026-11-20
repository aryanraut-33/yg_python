// /projects: every project, grouped by level, in the LED-board style.
import { useEffect, useMemo, useState } from 'react';
import { CATALOGUE } from './data';
import type { CatalogueProject } from './types';
import { SiteNav, startHref as getStartHref } from '../ui/SiteNav';
import { DotNumber, buzz, useInView } from '../ui/fx';
import { RichText } from '../ui/RichText';
import { linkClick } from '../router';
import './catalogue.css';

const LEVELS = [
  {
    n: 1,
    name: 'Spark',
    blurb: 'Make things happen in order, repeat them, and react to choices.',
    ideas: '`print`, variables, text, `for` and `range`, `if`/`else`, `input`, `random`, lists, simple functions',
  },
  {
    n: 2,
    name: 'Maker',
    blurb: 'Work with grids, pictures, text and real data.',
    ideas: 'nested loops, grids (2D lists), dictionaries, string tricks, `ord`/`chr`, `%`, reading data, functions that return values',
  },
  {
    n: 3,
    name: 'Builder',
    blurb: 'Build things that move, respond in real time and use real data.',
    ideas: 'game loops, state, x/y and speed, simple physics, sorting with `key=`, camera and hand points',
  },
  {
    n: 4,
    name: 'Inventor',
    blurb: 'Build smart programs that decide, learn or search.',
    ideas: 'classes, recursion and search, graphs, training and testing a model',
  },
];

const CATEGORIES = [...new Set(CATALOGUE.map((p) => p.category))].sort();

export function Catalogue() {
  const [level, setLevel] = useState<number | 'all'>('all');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const start = useMemo(getStartHref, []);

  // /projects#doodle-guesser opens and highlights that project.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id || !CATALOGUE.some((p) => p.id === id)) return;
    setOpen((o) => (o.includes(id) ? o : [...o, id]));
    setFlash(id);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'center' }));
    const t = setTimeout(() => setFlash(null), 2200);
    return () => clearTimeout(t);
  }, []);

  const q = query.trim().toLowerCase();
  const shown = CATALOGUE.filter(
    (p) =>
      (level === 'all' || p.level === level) &&
      (category === 'all' || p.category === category) &&
      (!q || `${p.name} ${p.pitch} ${p.build} ${p.python} ${p.category}`.toLowerCase().includes(q)),
  );
  const toggle = (id: string) => {
    buzz(6);
    setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  };
  const live = CATALOGUE.filter((p) => p.href).length;

  return (
    <div className="cat">
      <SiteNav onHome={false} />

      <header className="cat-head">
        <p className="label">[ Project catalogue ]</p>
        <h1 className="cat-title">Everything you can build</h1>
        <p className="cat-lead">
          Four levels, from your first glowing name to an AI that reads your handwriting. Each project teaches one or two new Python ideas, then asks you to
          use them your own way.
        </p>
        <dl className="cat-stats">
          {[
            [String(CATALOGUE.length), 'projects'],
            ['4', 'levels'],
            [String(CATEGORIES.length), 'categories'],
            [String(live), 'live now'],
          ].map(([n, l]) => (
            <div key={l}>
              <dt className="label">{l}</dt>
              <dd>
                <DotNumber value={n.padStart(2, '0')} cell={6} lit />
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="cat-filters" role="search">
        <div className="seg" role="group" aria-label="Level">
          <button className={level === 'all' ? 'on' : ''} aria-pressed={level === 'all'} onClick={() => setLevel('all')}>
            All
          </button>
          {LEVELS.map((l) => (
            <button key={l.n} className={level === l.n ? 'on' : ''} aria-pressed={level === l.n} onClick={() => setLevel(l.n)}>
              <span className="seg-n">{l.n}</span> {l.name}
            </button>
          ))}
        </div>
        <label className="cat-select">
          <span className="visually-hidden">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="cat-search">
          <span className="visually-hidden">Search projects</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search: robots, camera, loops…" />
        </label>
        <span className="label cat-count" aria-live="polite">
          {shown.length} shown
        </span>
      </div>

      {LEVELS.map((l) => {
        const items = shown.filter((p) => p.level === l.n);
        if (!items.length) return null;
        return <LevelBlock key={l.n} level={l} items={items} open={open} flash={flash} start={start} onToggle={toggle} />;
      })}

      {shown.length === 0 && (
        <div className="cat-empty">
          <p className="label">[ No matches ]</p>
          <p>Nothing matches that search. Try a different word, or clear the filters.</p>
          <button
            className="mono-link"
            onClick={() => {
              setLevel('all');
              setCategory('all');
              setQuery('');
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      <footer className="cat-foot">
        <div>
          <p className="label">[ Where to start ]</p>
          <p className="cat-foot-title">Every builder starts with Name Light Show.</p>
        </div>
        <a className="led-btn" href={start} onClick={linkClick} onPointerDown={() => buzz(12)}>
          Start learning free <span aria-hidden="true">→</span>
        </a>
      </footer>
    </div>
  );
}

function LevelBlock({
  level,
  items,
  open,
  flash,
  start,
  onToggle,
}: {
  level: (typeof LEVELS)[number];
  items: CatalogueProject[];
  open: string[];
  flash: string | null;
  start: string;
  onToggle(id: string): void;
}) {
  const [ref, inView] = useInView<HTMLElement>(0.1);
  return (
    <section ref={ref} className={`cat-level${inView ? ' in' : ''}`} aria-labelledby={`level-${level.n}`}>
      <div className="cat-level-head">
        <DotNumber value={String(level.n)} cell={10} lit={inView} className="cat-level-num" />
        <div>
          <p className="label">Level {level.n}</p>
          <h2 id={`level-${level.n}`} className="cat-level-name">
            {level.name}
          </h2>
          <p className="cat-level-blurb">{level.blurb}</p>
        </div>
        <div className="cat-level-ideas">
          <p className="label">New Python ideas</p>
          <p>
            <RichText text={level.ideas} />
          </p>
        </div>
      </div>
      <div className="cat-grid">
        {items.map((p) => (
          <Tile key={p.id} p={p} open={open.includes(p.id)} flash={flash === p.id} start={start} onToggle={() => onToggle(p.id)} />
        ))}
      </div>
    </section>
  );
}

function Tile({ p, open, flash, start, onToggle }: { p: CatalogueProject; open: boolean; flash: boolean; start: string; onToggle(): void }) {
  const live = Boolean(p.href);
  return (
    <article id={p.id} className={`tile${open ? ' open' : ''}${live ? ' is-live' : ''}${flash ? ' flash' : ''}`}>
      <div className="tile-top">
        <span className="label">{p.category}</span>
        <span className={`status-led${live ? ' is-live' : ''}`}>
          <span className="led" aria-hidden="true" />
          {live ? 'Live now' : 'Soon'}
        </span>
      </div>
      <h3 className="tile-name">{p.name}</h3>
      <p className="tile-pitch">{p.pitch}</p>
      <p className="tile-build">{p.build}</p>
      <ul className="tile-meta">
        <li>
          {p.sessions} {p.sessions === 1 ? 'session' : 'sessions'}
        </li>
        <li>{p.phoneFriendly ? 'Works on phones' : 'Best on a laptop'}</li>
      </ul>
      <div className="tile-python">
        <span className="label">Python</span>
        <RichText text={p.python} />
      </div>
      {open && (
        <div className="tile-more">
          <p className="label">Wow moment</p>
          <p>{p.wow}</p>
          {p.steps.length > 0 && (
            <>
              <p className="label">Steps</p>
              <ol>
                {p.steps.map((s, i) => (
                  <li key={i}>
                    <RichText text={s} />
                  </li>
                ))}
              </ol>
            </>
          )}
          {p.hook && (
            <>
              <p className="label">Show it off</p>
              <p>
                <RichText text={p.hook.replace(/^./, (c) => c.toUpperCase())} />
              </p>
            </>
          )}
          {p.needs && (
            <>
              <p className="label">Needs</p>
              <p>
                <RichText text={p.needs} />
              </p>
            </>
          )}
        </div>
      )}
      <div className="tile-actions">
        <button className="mono-link tile-toggle" aria-expanded={open} onClick={onToggle}>
          {open ? 'Less −' : 'Details +'}
        </button>
        {live && (
          <a className="led-btn led-btn-sm" href={start} onClick={linkClick} onPointerDown={() => buzz(12)}>
            Build it now <span aria-hidden="true">→</span>
          </a>
        )}
      </div>
    </article>
  );
}
