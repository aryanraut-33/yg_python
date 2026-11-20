// Home page sections below the hero, in the LED-board style: hairline rules instead of boxes,
// dot-matrix numbers, a departure board of projects, typing code and its LED output.
import { useEffect, type ReactNode } from 'react';
import { linkClick } from '../router';
import { MascotImg } from '../onboarding/mascots';
import { CATALOGUE } from '../catalogue/data';

const FEATURED = CATALOGUE.filter((p) => p.featured);
import { DotNumber, FlapText, LedShow, TypingCode, buzz, useInView } from '../ui/fx';

const SAMPLE = `name = "AARAV"

for flash in range(8):
    x = 40
    for letter in name:
        color = stage.random_color()
        stage.circle(x, 200, 26, color, glow=True)
        stage.text(x, 200, letter)
        x = x + 60
    stage.wait(0.4)`;

function SectionHead({ n, label, title, id, lead }: { n: string; label: string; title: ReactNode; id?: string; lead?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.4);
  useEffect(() => {
    if (inView) buzz(8);
  }, [inView]);
  return (
    <div ref={ref} id={id} className={`sh${inView ? ' in' : ''}`}>
      <div className="sh-row">
        <DotNumber value={n} cell={5} lit={inView} className="sh-num" />
        <span className="sh-label">{label}</span>
        <span className="sh-rule" />
      </div>
      <h2 className="sh-title">{title}</h2>
      {lead && <p className="sh-lead">{lead}</p>}
    </div>
  );
}

export function LandingSections({ startHref }: { startHref: string }) {
  const [stepsRef, stepsIn] = useInView<HTMLDivElement>(0.2);
  const [codeRef, codeIn] = useInView<HTMLDivElement>(0.3);
  const [boardRef, boardIn] = useInView<HTMLDivElement>(0.15);
  const [devicesRef, devicesIn] = useInView<HTMLDivElement>(0.25);
  const [ctaRef, ctaIn] = useInView<HTMLElement>(0.3);

  useEffect(() => {
    if (boardIn) buzz([6, 40, 6, 40, 6]);
  }, [boardIn]);

  return (
    <div className="lp">
      {/* ---------- 01 How it works ---------- */}
      <section className="lp-section" aria-labelledby="how-title">
        <SectionHead n="01" id="how" label="How it works" title={<span id="how-title">From “what’s Python?” to “look what I made!”</span>} />
        <div ref={stepsRef} className={`steps${stepsIn ? ' in' : ''}`}>
          {[
            {
              n: '1',
              title: 'Meet Nix and Riff',
              text: 'A short, playful adventure teaches the basics: making Python talk, variables, maths and more. Already know some Python? A quick check lets you skip ahead.',
              art: (
                <>
                  <MascotImg who="nix" pose="welcome" />
                  <MascotImg who="riff" pose="welcome" />
                </>
              ),
            },
            {
              n: '2',
              title: 'Build real projects',
              text: 'Step-by-step projects, from your name in lights to robots and space missions. Hints when you’re stuck, and error messages that actually make sense.',
              art: <MascotImg who="riff" pose="pointing" />,
            },
            {
              n: '3',
              title: 'Show your family',
              soon: true,
              text: 'Share what you build with the people you love, and collect their cheers along the way.',
              art: <MascotImg who="nix" pose="celebrating" />,
            },
          ].map((st, i) => (
            <article key={st.n} className="step" style={{ transitionDelay: `${i * 120}ms` }}>
              <DotNumber value={st.n} cell={11} lit={stepsIn} className="step-num" />
              <h3>
                {st.title} {st.soon && <span className="tag-soon">Soon</span>}
              </h3>
              <p>{st.text}</p>
              <div className="step-art">{st.art}</div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- 02 Devices ---------- */}
      <section className="lp-section">
        <SectionHead
          n="02"
          label="Laptop or phone"
          title="Learn on a laptop or a phone"
          lead="yg python runs in the browser, so there’s nothing to install on either. For the best learning experience, we recommend a laptop or Chromebook."
        />
        <div ref={devicesRef} className={`devices${devicesIn ? ' in' : ''}`}>
          <article className="device device-laptop">
            <div className="device-art">
              <MascotImg who="riff" pose="coding" />
            </div>
            <div className="device-copy">
              <p className="device-tag is-live">
                <span className="led" aria-hidden="true" /> Recommended
              </p>
              <h3 className="device-name">Laptop or Chromebook</h3>
              <p>The best way to learn. Your code, the instructions and your project all fit side by side, and a real keyboard makes typing Python much easier.</p>
              <ul className="device-points">
                <li>Every project and lesson</li>
                <li>A full keyboard for coding</li>
                <li>Code, stage and steps on one screen</li>
              </ul>
            </div>
          </article>
          <article className="device device-phone">
            <div className="device-art">
              <MascotImg who="nix" pose="mobile" />
            </div>
            <div className="device-copy">
              <p className="device-tag">
                <span className="led" aria-hidden="true" /> Also works
              </p>
              <h3 className="device-name">Phone or tablet</h3>
              <p>Learn on the go. Projects run on phones too, with touch controls, and it’s the perfect way to show your family what you built.</p>
              <ul className="device-points">
                <li>Run and play your projects</li>
                <li>Touch controls in games</li>
                <li>Best for shorter sessions</li>
              </ul>
            </div>
          </article>
        </div>
      </section>

      {/* ---------- 03 Real Python ---------- */}
      <section className="lp-section">
        <SectionHead
          n="03"
          label="Real code, right away"
          title="Real Python. Right in your browser."
          lead="Not blocks and not a toy language. The same Python professionals use, running in the browser with nothing to install."
        />
        <div ref={codeRef} className="code-split">
          <div className="term">
            <div className="term-bar">
              <span>main.py</span>
              <span className={`term-status${codeIn ? ' on' : ''}`}>
                <span className="led" aria-hidden="true" /> {codeIn ? 'running' : 'ready'}
              </span>
            </div>
            <TypingCode code={SAMPLE} active={codeIn} />
          </div>
          <div className="term term-out">
            <div className="term-bar">
              <span>stage</span>
              <span>output</span>
            </div>
            <LedShow name="AARAV" active={codeIn} />
          </div>
        </div>
        <ul className="facts">
          <li>
            <span className="fact-k">→ Mistakes become clues</span>
            Python’s error messages, translated into words that make sense.
          </li>
          <li>
            <span className="fact-k">→ Nothing to install</span>
            Open the page and start coding. Your work saves as you go.
          </li>
          <li>
            <span className="fact-k">→ Help when you’re stuck</span>
            Five levels of hints, from a gentle nudge to the full answer.
          </li>
        </ul>
      </section>

      {/* ---------- 04 Projects: departure board ---------- */}
      <section className="lp-section">
        <SectionHead
          n="04"
          id="projects"
          label="Projects"
          title="What will you build?"
          lead={`${CATALOGUE.length} projects across four levels, from your name in lights to an AI that reads your handwriting. Start with Name Light Show.`}
        />
        <div ref={boardRef}>
          <div className="board-grid board-head" aria-hidden="true">
            <span>No.</span>
            <span>Project</span>
            <span className="col-cat">Level</span>
            <span>Status</span>
          </div>
          <ol className="board" aria-label="Featured projects">
            {FEATURED.map((p, i) => {
              const live = Boolean(p.href);
              const href = live ? startHref : `/projects#${p.id}`;
              return (
                <li key={p.id} className={`board-row${live ? ' is-live' : ''}`}>
                  <a className="board-grid" href={href} onClick={linkClick} onPointerDown={() => buzz(10)}>
                    <span className="col-no">{String(i + 1).padStart(2, '0')}</span>
                    <span className="col-name">{p.name}</span>
                    <span className="col-cat">
                      <FlapText text={`L${p.level} ${p.levelName.toUpperCase()}`} active={boardIn} delay={i * 70} />
                    </span>
                    <span className={`col-status${live ? ' is-live' : ''}`}>
                      <span className="led" aria-hidden="true" />
                      <FlapText text={live ? 'BOARDING' : 'SOON'} active={boardIn} delay={i * 70 + 200} />
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
          <div className="board-foot">
            <p className="label">
              Showing {FEATURED.length} of {CATALOGUE.length} projects
            </p>
            <a className="led-btn" href="/projects" onClick={linkClick} onPointerDown={() => buzz(12)}>
              All projects catalogue <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ---------- 05 Parents ---------- */}
      <section className="lp-section">
        <SectionHead n="05" id="parents" label="For parents" title="Built for curious kids" lead="Designed for ages 9 to 15." />
        <div className="parents">
          {[
            ['Private by design', 'No ads and no third-party trackers. Your child’s work is saved on your own device.'],
            ['Real skills, step by step', 'Each project teaches one or two new ideas, then asks your child to use them on their own, so the learning sticks.'],
            ['Making, not scrolling', 'Screen time spent creating games, art and tools they’re proud to show you.'],
            ['Free to start', 'The beginner adventure and the first project are free. No sign-up needed.'],
          ].map(([h, t], i) => (
            <article key={h}>
              <span className="parent-no">P/{String(i + 1).padStart(2, '0')}</span>
              <h3>{h}</h3>
              <p>{t}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Call to action ---------- */}
      <section ref={ctaRef} className={`cta${ctaIn ? ' in' : ''}`}>
        <p className="sh-label">[ Press start ]</p>
        <h2 className="cta-title">
          Ready to make
          <br />
          something?
        </h2>
        <a className="led-btn led-btn-lg" href={startHref} onClick={linkClick} onPointerDown={() => buzz(15)}>
          Start learning free <span aria-hidden="true">→</span>
        </a>
        <div className="cta-mascots" aria-hidden="true">
          <MascotImg who="nix" pose="level-up" />
          <MascotImg who="riff" pose="level-up" />
        </div>
      </section>

      <footer className="lp-footer">
        <span className="wordmark">yg python</span>
        <span>Real Python for kids aged 9–15</span>
        <span>Made with Python, in the browser</span>
      </footer>
    </div>
  );
}
