// Interactive activities for chapters 1–3 and the finale.
import { useMemo, useState } from 'react';
import type { Line } from './concepts';
import { CONCEPTS } from './concepts';
import type { ConceptId, Experience, ReadyChoice, Track } from './progress';
import { RichText } from '../ui/RichText';

export interface WidgetProps {
  /** Mark the activity finished (unlocks Continue). */
  onDone(): void;
  /** Make a mascot react. */
  say(line: Line): void;
}

function shuffle<T>(items: T[], seed: number): T[] {
  const a = [...items];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Name ----------
export function NameAsk({ initial, onName, say }: { initial: string; onName(n: string): void } & Pick<WidgetProps, 'say'>) {
  const [value, setValue] = useState(initial);
  const clean = value.replace(/[^\p{L}\p{M}' -]/gu, '').trim().slice(0, 20);
  return (
    <form
      className="ob-card ob-name"
      onSubmit={(e) => {
        e.preventDefault();
        if (!clean) return;
        onName(clean);
        say({ who: 'riff', pose: 'celebrating', text: `${clean}! Great name. Let's GO!` });
      }}
    >
      <label htmlFor="ob-name" className="ob-label">
        Your name or nickname
      </label>
      <div className="ob-name-row">
        <input id="ob-name" value={value} onChange={(e) => setValue(e.target.value)} maxLength={24} autoComplete="off" autoFocus placeholder="e.g. Meera" />
        <button className="btn btn-primary" type="submit" disabled={!clean}>
          That's me!
        </button>
      </div>
      <p className="ob-small">Only Nix and Riff use this, and it stays on this device.</p>
    </form>
  );
}

// ---------- Experience ----------
export function ExperiencePick({ onPick }: { onPick(e: Experience): void }) {
  const options: [Experience, string, string][] = [
    ['new', "Never. I'm brand new!", 'Perfect. We start right from the beginning.'],
    ['some', 'Yes, a bit', 'Nice! A quick check shows what you know, so you can skip ahead.'],
  ];
  return (
    <div className="ob-card ob-options">
      {options.map(([id, label, sub]) => (
        <button key={id} className="ob-option" onClick={() => onPick(id)}>
          <span className="ob-option-title">{label}</span>
          <span className="ob-option-sub">{sub}</span>
        </button>
      ))}
    </div>
  );
}

// ---------- Quick check: the 7 basics plus spotting errors ----------
interface CheckQuestion {
  concept: ConceptId | 'errors';
  code: string;
  question: string;
  choices: string[];
  answer: number;
}

const ERROR_QUESTIONS: Record<string, CheckQuestion> = {
  quote: {
    concept: 'errors',
    code: 'print("Hello)',
    question: 'Python shows an error for this line. Why?',
    choices: ['The closing quote is missing', 'print needs a capital P', 'Hello should be a number', 'There is nothing wrong'],
    answer: 0,
  },
  typo: {
    concept: 'errors',
    code: 'pet = "Bruno"\nprint(pte)',
    question: 'What happens when this runs?',
    choices: ["An error: Python doesn't know pte", 'It shows Bruno', 'It shows pte', 'It shows nothing'],
    answer: 0,
  },
  join: {
    concept: 'errors',
    code: 'age = 12\nprint("I am " + age)',
    question: 'What happens when this runs?',
    choices: ["An error: + can't join text and a number", 'It shows I am 12', 'It shows I am age', 'It shows 12'],
    answer: 0,
  },
  bracket: {
    concept: 'errors',
    code: 'print("Total:", 5 + 3',
    question: 'How do you fix this line?',
    choices: ['Add a ) at the end', 'Remove the comma', 'Put 5 + 3 in quotes', 'Change print to say'],
    answer: 0,
  },
};

const fromConcept = (id: ConceptId): CheckQuestion => {
  const c = CONCEPTS.find((x) => x.id === id)!;
  return { concept: id, ...c.quickCheck };
};

export const QUICK_CHECK: CheckQuestion[] = [
  fromConcept('print'),
  fromConcept('strings'),
  ERROR_QUESTIONS.quote,
  fromConcept('numbers'),
  fromConcept('variables'),
  ERROR_QUESTIONS.typo,
  fromConcept('math'),
  ERROR_QUESTIONS.join,
  fromConcept('comments'),
  fromConcept('input'),
  ERROR_QUESTIONS.bracket,
];

export function QuickCheck({ onFinish }: { onFinish(score: number, total: number, known: ConceptId[]): void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [known, setKnown] = useState<ConceptId[]>([]);
  const q = QUICK_CHECK[i];
  const last = i === QUICK_CHECK.length - 1;
  // Show the choices in a mixed-up order, so the right answer isn't always in the same place.
  const order = useMemo(() => shuffle(q.choices.map((_, k) => k), i * 7 + 11), [i, q.choices]);

  return (
    <div className="ob-card">
      <div className="qc-head">
        <p className="ob-eyebrow">
          Question {i + 1} of {QUICK_CHECK.length}
          {q.concept === 'errors' ? ' · Spot the error' : ''}
        </p>
        <div className="qc-bar" aria-hidden="true">
          <span style={{ width: `${(i / QUICK_CHECK.length) * 100}%` }} />
        </div>
      </div>
      <pre className="ob-code">{q.code}</pre>
      <p className="ob-card-title">{q.question}</p>
      <div className="choices">
        {order.map((ci) => (
          <button key={ci} className={`choice${picked === ci ? ' picked' : ''}`} onClick={() => setPicked(ci)} aria-pressed={picked === ci}>
            <span className="choice-dot" aria-hidden="true" />
            <span className={q.concept === 'errors' ? '' : 'mono'}>{q.choices[ci]}</span>
          </button>
        ))}
        <button className="choice choice-unsure" onClick={() => setPicked(-1)} aria-pressed={picked === -1}>
          <span className="choice-dot" aria-hidden="true" />
          I'm not sure
        </button>
      </div>
      <button
        className="btn btn-primary btn-block"
        disabled={picked === null}
        onClick={() => {
          const right = picked === q.answer;
          const nextScore = score + (right ? 1 : 0);
          const nextKnown = right && q.concept !== 'errors' ? [...known, q.concept] : known;
          if (last) {
            onFinish(nextScore, QUICK_CHECK.length, nextKnown);
            return;
          }
          setScore(nextScore);
          setKnown(nextKnown);
          setPicked(null);
          setI(i + 1);
        }}
      >
        {last ? 'See my results' : 'Next question'}
      </button>
    </div>
  );
}

// ---------- Quick-check result: one of three paths ----------
export function CheckResult({
  score,
  total,
  track,
  onContinue,
  onReady,
}: {
  score: number;
  total: number;
  track: Track;
  onContinue(): void;
  onReady(choice: ReadyChoice): void;
}) {
  const pct = Math.round((score / total) * 100);
  return (
    <div className="ob-card qc-result">
      <div className="qc-score">
        <span className="qc-num">
          {score}/{total}
        </span>
        <span className="qc-pct">{pct}%</span>
      </div>
      {track === 'lessons' && (
        <>
          <p className="ob-card-title">Let's build a strong base together</p>
          <p>You'll get the full adventure: what Python is, where it's used, all 7 basics with hands-on challenges, and a tour of your workspace.</p>
          <button className="btn btn-primary btn-block" onClick={onContinue}>
            Start the adventure →
          </button>
        </>
      )}
      {track === 'refresher' && (
        <>
          <p className="ob-card-title">You know quite a bit!</p>
          <p>Here's your shortcut: a quick refresher of the basics (about 5 minutes), a peek at your workspace, then your first project.</p>
          <button className="btn btn-primary btn-block" onClick={onContinue}>
            Start my refresher →
          </button>
        </>
      )}
      {track === 'ready' && (
        <>
          <p className="ob-card-title">You're ready to build!</p>
          <p>You clearly know your Python basics. Jump straight into your first project, or warm up first.</p>
          <button className="btn btn-primary btn-block" onClick={() => onReady('project')}>
            Jump into my project →
          </button>
          <div className="ob-row">
            <button className="btn btn-ghost" onClick={() => onReady('refresher')}>
              Quick refresher first
            </button>
            <button className="btn btn-ghost" onClick={() => onReady('tour')}>
              Show me the workspace first
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Sandwich: a program is exact instructions in order ----------
const SANDWICH = [
  { id: 'bread', text: 'Take two slices of bread' },
  { id: 'butter', text: 'Spread butter on one slice' },
  { id: 'cheese', text: 'Put cheese on the butter' },
  { id: 'top', text: 'Put the other slice on top' },
];
const OOPS: Record<string, string> = {
  butter: 'Riff spreads butter onto... the empty plate. Splat!',
  cheese: 'Riff looks for butter to put the cheese on. There isn\'t any!',
  top: 'Riff puts a slice on top of... nothing at all.',
};

export function SandwichOrder({ onDone, say }: WidgetProps) {
  const pool = useMemo(() => shuffle(SANDWICH, 7), []);
  const [seq, setSeq] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [result, setResult] = useState<'none' | 'win' | 'oops'>('none');

  const run = () => {
    const wrongAt = seq.findIndex((id, i) => id !== SANDWICH[i].id);
    const steps = seq.map((id) => SANDWICH.find((s) => s.id === id)!.text);
    if (wrongAt === -1) {
      setLog([...steps.map((t) => `Riff: ${t.toLowerCase()}.`), 'A perfect sandwich!']);
      setResult('win');
      say({ who: 'riff', pose: 'celebrating', text: 'A PERFECT sandwich! You just wrote a program: exact steps, in the right order.' });
      onDone();
    } else {
      setLog([...steps.slice(0, wrongAt).map((t) => `Riff: ${t.toLowerCase()}.`), OOPS[seq[wrongAt]] ?? 'Something went wrong!']);
      setResult('oops');
      say({ who: 'riff', pose: 'error', text: 'Oops! I did EXACTLY what you said. Computers are like that. Try a different order!' });
    }
  };

  return (
    <div className="ob-card">
      <p className="ob-label">Instructions (tap to add)</p>
      <div className="sw-pool">
        {pool.map((s) => {
          const used = seq.includes(s.id);
          return (
            <button key={s.id} className="sw-card" disabled={used || result === 'win'} onClick={() => setSeq([...seq, s.id])}>
              {s.text}
            </button>
          );
        })}
      </div>
      <p className="ob-label">Riff's program</p>
      <ol className="sw-program">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className={seq[i] ? 'filled' : ''}>
            {seq[i] ? (
              <button className="sw-slot" onClick={() => result !== 'win' && setSeq(seq.filter((_, k) => k !== i))} aria-label={`Remove step ${i + 1}`}>
                {SANDWICH.find((s) => s.id === seq[i])!.text}
              </button>
            ) : (
              <span className="sw-empty">Step {i + 1}</span>
            )}
          </li>
        ))}
      </ol>
      {log.length > 0 && (
        <div className={`sw-log ${result}`} aria-live="polite">
          {log.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
      )}
      <div className="ob-row">
        {result !== 'win' && (
          <button className="btn btn-primary" disabled={seq.length < 4} onClick={run}>
            Run
          </button>
        )}
        {seq.length > 0 && result !== 'win' && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              setSeq([]);
              setLog([]);
              setResult('none');
            }}
          >
            Start again
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Hello in many languages ----------
const HELLOS = [
  { word: 'नमस्ते', lang: 'Hindi', who: 'for people' },
  { word: 'வணக்கம்', lang: 'Tamil', who: 'for people' },
  { word: 'Hola', lang: 'Spanish', who: 'for people' },
  { word: 'print("Hello")', lang: 'Python', who: 'for computers!', code: true },
];

export function HelloCards({ onDone, say }: WidgetProps) {
  const [open, setOpen] = useState<number[]>([]);
  return (
    <div className="ob-card">
      <div className="hello-grid">
        {HELLOS.map((h, i) => {
          const isOpen = open.includes(i);
          return (
            <button
              key={h.lang}
              className={`hello-card${isOpen ? ' open' : ''}${h.code ? ' is-code' : ''}`}
              aria-expanded={isOpen}
              onClick={() => {
                if (isOpen) return;
                const next = [...open, i];
                setOpen(next);
                if (h.code) say({ who: 'nix', pose: 'surprised', text: 'Python says hello too! It\'s a language computers understand.' });
                if (next.length === HELLOS.length) onDone();
              }}
            >
              <span className={`hello-word${h.code ? ' mono' : ''}`}>{h.word}</span>
              <span className="hello-lang">{isOpen ? `${h.lang}, ${h.who}` : 'Tap to find out'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Python vs Java ----------
const JAVA = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello!");
    }
}`;

export function CompareCode({ onDone, say }: WidgetProps) {
  const [ran, setRan] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="ob-card">
      <div className="compare-grid">
        <div>
          <p className="ob-label">Java</p>
          <pre className="ob-code">{JAVA}</pre>
          {ran && <pre className="ob-output">Hello!</pre>}
        </div>
        <div>
          <p className="ob-label">Python</p>
          <pre className="ob-code">print("Hello!")</pre>
          {ran && <pre className="ob-output">Hello!</pre>}
        </div>
      </div>
      {!ran ? (
        <button className="btn btn-primary btn-block" onClick={() => setRan(true)}>
          Run both
        </button>
      ) : (
        <>
          <p className="ob-card-title">Same result! Which one would you rather type?</p>
          <div className="ob-row">
            {['Python', 'Java'].map((l) => (
              <button
                key={l}
                className={`btn ${picked === l ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setPicked(l);
                  say(
                    l === 'Python'
                      ? { who: 'riff', pose: 'celebrating', text: 'Same! One line, same result. More time for building.' }
                      : { who: 'nix', pose: 'encouraging', text: 'Respect! Java is great too. Python just lets you start building faster.' },
                  );
                  onDone();
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Quiz ----------
export function Quiz({ question, choices, answer, right, wrong, onDone, say }: WidgetProps & { question: string; choices: string[]; answer: number; right: Line; wrong: Line }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="ob-card">
      <p className="ob-card-title">{question}</p>
      <div className="choices">
        {choices.map((c, i) => {
          const state = picked === null ? '' : i === answer ? ' right' : picked === i ? ' wrong' : '';
          return (
            <button
              key={i}
              className={`choice${picked === i ? ' picked' : ''}${state}`}
              disabled={picked !== null}
              onClick={() => {
                setPicked(i);
                say(i === answer ? right : wrong);
                onDone();
              }}
            >
              <span className="choice-dot" aria-hidden="true" />
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Python in the real world ----------
const USES = [
  {
    key: 'ai',
    tag: 'AI and smart assistants',
    title: 'Most AI speaks Python',
    fact: 'The tools researchers use to teach AI, so it can understand speech, recognise photos or chat, are mostly used from Python.',
    peek: 'model.learn(examples)',
  },
  {
    key: 'games',
    tag: 'Video games',
    title: 'Games with Python inside',
    fact: 'The strategy game Civilization IV used Python to run its game rules, so players could write their own mods. Kids around the world make games with a Python library called Pygame.',
    peek: 'player.jump()',
  },
  {
    key: 'space',
    tag: 'Space and science',
    title: 'The first photo of a black hole',
    fact: 'In 2019, scientists showed the first-ever picture of a black hole. Python code helped turn data from telescopes all over Earth into that one image.',
    peek: 'image = combine(telescopes)',
  },
  {
    key: 'robots',
    tag: 'Robots and gadgets',
    title: 'Tiny computers, big robots',
    fact: 'Little computers like the Raspberry Pi and the BBC micro:bit run Python. People use them to build robots, weather stations and drones.',
    peek: 'motor.forward(10)',
  },
  {
    key: 'apps',
    tag: 'Websites and apps',
    title: 'Apps you might know',
    fact: 'Instagram runs one of the biggest Python websites in the world, and YouTube has used Python since its early days.',
    peek: 'show(next_video)',
  },
  {
    key: 'data',
    tag: 'Data and real problems',
    title: 'What should I watch next?',
    fact: 'Netflix uses Python to study what people watch and suggest what to watch next. Sports teams use it to study matches and plan better.',
    peek: 'best = max(scores)',
  },
];

function UseArt({ k }: { k: string }) {
  const common = { width: 120, height: 90, viewBox: '0 0 120 90', 'aria-hidden': true as const };
  switch (k) {
    case 'ai':
      return (
        <svg {...common}>
          {[[20, 20], [20, 45], [20, 70], [60, 32], [60, 58], [100, 45]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="7" fill={i === 5 ? 'var(--accent)' : 'var(--mint)'} />
          ))}
          {[[20, 20, 60, 32], [20, 45, 60, 32], [20, 70, 60, 58], [20, 45, 60, 58], [60, 32, 100, 45], [60, 58, 100, 45], [20, 20, 60, 58], [20, 70, 60, 32]].map(([a, b, c, d], i) => (
            <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="var(--text-soft)" strokeOpacity="0.5" strokeWidth="2" />
          ))}
        </svg>
      );
    case 'games':
      return (
        <svg {...common}>
          <rect x="14" y="26" width="92" height="44" rx="22" fill="var(--coral)" />
          <rect x="30" y="44" width="18" height="6" rx="2" fill="var(--bg)" />
          <rect x="36" y="38" width="6" height="18" rx="2" fill="var(--bg)" />
          <circle cx="80" cy="42" r="5" fill="var(--accent)" />
          <circle cx="90" cy="52" r="5" fill="var(--mint)" />
        </svg>
      );
    case 'space':
      return (
        <svg {...common}>
          <circle cx="60" cy="45" r="30" fill="none" stroke="var(--coral)" strokeWidth="10" />
          <circle cx="60" cy="45" r="30" fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray="30 20" />
          <circle cx="60" cy="45" r="20" fill="#0B1714" />
        </svg>
      );
    case 'robots':
      return (
        <svg {...common}>
          <rect x="34" y="22" width="52" height="42" rx="10" fill="var(--mint)" />
          <circle cx="50" cy="42" r="6" fill="var(--bg)" />
          <circle cx="70" cy="42" r="6" fill="var(--bg)" />
          <line x1="60" y1="22" x2="60" y2="10" stroke="var(--text-soft)" strokeWidth="3" />
          <circle cx="60" cy="9" r="4" fill="var(--accent)" />
          <rect x="44" y="68" width="32" height="12" rx="4" fill="var(--text-soft)" opacity="0.5" />
        </svg>
      );
    case 'apps':
      return (
        <svg {...common}>
          <rect x="40" y="8" width="40" height="74" rx="8" fill="none" stroke="var(--text-soft)" strokeWidth="3" />
          <rect x="47" y="18" width="26" height="18" rx="3" fill="var(--blossom)" />
          <rect x="47" y="40" width="26" height="18" rx="3" fill="var(--accent)" />
          <rect x="47" y="62" width="26" height="10" rx="3" fill="var(--mint)" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          {[30, 50, 22, 62, 40].map((h, i) => (
            <rect key={i} x={18 + i * 18} y={80 - h} width="12" height={h} rx="3" fill={i === 3 ? 'var(--accent)' : 'var(--mint)'} />
          ))}
        </svg>
      );
  }
}

export function UsesDeck({ onDone, say }: WidgetProps) {
  const [i, setI] = useState(0);
  const [seen, setSeen] = useState(1);
  const u = USES[i];
  const go = (n: number) => {
    setI(n);
    const s = Math.max(seen, n + 1);
    setSeen(s);
    if (s === USES.length && seen < USES.length) {
      say({ who: 'riff', pose: 'surprised', text: 'Games, space, robots, AI... and you\'re about to learn the same language!' });
      onDone();
    }
  };
  return (
    <div className="ob-card uses-card">
      <div className="uses-art">
        <UseArt k={u.key} />
      </div>
      <p className="ob-eyebrow">
        {u.tag} · {i + 1} of {USES.length}
      </p>
      <p className="ob-card-title">{u.title}</p>
      <p>{u.fact}</p>
      <pre className="ob-peek">{u.peek}</pre>
      <div className="ob-row uses-nav">
        <button className="btn btn-ghost" disabled={i === 0} onClick={() => go(i - 1)}>
          ← Back
        </button>
        <span className="uses-dots" aria-hidden="true">
          {USES.map((x, k) => (
            <span key={x.key} className={k === i ? 'on' : k < seen ? 'seen' : ''} />
          ))}
        </span>
        <button className="btn btn-primary" disabled={i === USES.length - 1} onClick={() => go(i + 1)}>
          Next card →
        </button>
      </div>
    </div>
  );
}

// ---------- Match the pairs ----------
const PAIRS = [
  { id: 'ai', left: 'AI assistants', right: 'Learn from millions of examples' },
  { id: 'hole', left: 'The black hole photo', right: 'Turned telescope data into one image' },
  { id: 'bit', left: 'micro:bit robots', right: 'A tiny computer drives the motors' },
  { id: 'tv', left: 'Netflix suggestions', right: 'Guess what you\'ll want to watch next' },
];

export function MatchPairs({ onDone, say }: WidgetProps) {
  const rights = useMemo(() => shuffle(PAIRS, 3), []);
  const [left, setLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);

  const pickRight = (id: string) => {
    if (!left || matched.includes(id)) return;
    if (id === left) {
      const next = [...matched, id];
      setMatched(next);
      setLeft(null);
      if (next.length === PAIRS.length) {
        say({ who: 'nix', pose: 'celebrating', text: 'All matched! Your memory is excellent.' });
        onDone();
      }
    } else {
      setWrong(id);
      setTimeout(() => setWrong(null), 600);
    }
  };

  return (
    <div className="ob-card">
      <p className="ob-small">Tap a thing on the left, then what Python does for it on the right.</p>
      <div className="match-grid">
        <div className="match-col">
          {PAIRS.map((p) => (
            <button
              key={p.id}
              className={`match-item${left === p.id ? ' selected' : ''}${matched.includes(p.id) ? ' matched' : ''}`}
              disabled={matched.includes(p.id)}
              aria-pressed={left === p.id}
              onClick={() => setLeft(p.id)}
            >
              {p.left}
            </button>
          ))}
        </div>
        <div className="match-col">
          {rights.map((p) => (
            <button
              key={p.id}
              className={`match-item${matched.includes(p.id) ? ' matched' : ''}${wrong === p.id ? ' shake' : ''}`}
              disabled={matched.includes(p.id) || !left}
              onClick={() => pickRight(p.id)}
            >
              {p.right}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Dream project ----------
const DREAMS = [
  { id: 'cloak', name: 'Invisible Cloak', line: 'Make yourself disappear on camera' },
  { id: 'drone', name: 'Drone Delivery', line: 'Fly a drone across a city' },
  { id: 'lander', name: 'Chandrayaan Lander', line: 'Land softly on the Moon' },
  { id: 'doodle', name: 'Doodle Guesser', line: 'Train an AI to read your drawings' },
  { id: 'cricket', name: 'Cricket Stats Explorer', line: 'Settle every cricket argument' },
  { id: 'cipher', name: 'Secret Code Machine', line: 'Send messages only family can read' },
];

export function DreamPick({ onPick, say, initial }: { onPick(id: string): void; initial: string | null } & Pick<WidgetProps, 'say'>) {
  const [picked, setPicked] = useState(initial);
  return (
    <div className="ob-card">
      <div className="dream-grid">
        {DREAMS.map((d) => (
          <button
            key={d.id}
            className={`dream-item${picked === d.id ? ' picked' : ''}`}
            aria-pressed={picked === d.id}
            onClick={() => {
              setPicked(d.id);
              onPick(d.id);
              say({ who: 'riff', pose: 'celebrating', text: `${d.name}? Great pick! Everything you learn today gets you closer to building it.` });
            }}
          >
            <span className="dream-name">{d.name}</span>
            <span className="dream-line">{d.line}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Finale ----------
export function Finale({ onStart }: { onStart(): void }) {
  return (
    <div className="ob-card ob-finale">
      <p className="ob-eyebrow">You learned</p>
      <ul className="concept-chips">
        {CONCEPTS.map((c) => (
          <li key={c.id}>{c.short}</li>
        ))}
        <li>Running code</li>
        <li>Fixing errors</li>
      </ul>
      <div className="finale-project">
        <p className="ob-eyebrow">Your first project</p>
        <p className="ob-card-title">Name Light Show</p>
        <p>
          <RichText text="You'll use `print`, text and variables, plus one brand-new trick: **loops**. Then your name flashes in lights!" />
        </p>
      </div>
      <button className="btn btn-primary btn-block" onClick={onStart}>
        Start Name Light Show →
      </button>
    </div>
  );
}
