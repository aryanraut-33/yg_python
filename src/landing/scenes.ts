// Hero scenes, ported from the Figma landing designs (1408 × 868 card).
// Each scene returns SVG markup. Elements with `a-*` classes are animated in landing.css.
// Scenes keep clear of the centred text zone (x 290–1120, y 110–610).

export const SCENE_W = 1408;
export const SCENE_H = 868;

export interface Palette {
  bg: string;
  ink: string;
  soft: string;
  butter: string;
  coral: string;
  mint: string;
  blossom: string;
  sky: string;
  fa: string;
  fb: string;
  label: string;
  /** Readable text version of butter (light mode needs a darker amber). */
  butterText: string;
  green: string;
}

export const PALETTES: Record<'dark' | 'light', Palette> = {
  dark: {
    bg: '#0F1F1C', ink: '#F5ECDC', soft: '#A9B8B0', butter: '#FFD66B', coral: '#FF8A65', mint: '#7BE0C3',
    blossom: '#FFB4D2', sky: '#8CC8FF', fa: '#1D3530', fb: '#26403A', label: '#7F958C', butterText: '#FFD66B', green: '#3DBE6B',
  },
  light: {
    bg: '#F5ECDC', ink: '#0F1F1C', soft: '#52665E', butter: '#EBB84A', coral: '#C9502C', mint: '#13876A',
    blossom: '#C2457A', sky: '#3E7CC0', fa: '#EADFC9', fb: '#E3D7C2', label: '#7C8A83', butterText: '#8A5A00', green: '#2FA65A',
  },
};

// ---------- tiny SVG helpers ----------
const C = (x: number, y: number, r: number, f: string, o = 1, z = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" fill-opacity="${o}" ${z}/>`;
const CS = (x: number, y: number, r: number, s: string, w: number, o = 1, z = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${s}" stroke-width="${w}" stroke-opacity="${o}" ${z}/>`;
const E = (x: number, y: number, rx: number, ry: number, f: string, o = 1, z = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" fill-opacity="${o}" ${z}/>`;
const ES = (x: number, y: number, rx: number, ry: number, s: string, w: number, o = 1, z = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="${s}" stroke-width="${w}" stroke-opacity="${o}" ${z}/>`;
const R = (x: number, y: number, w: number, h: number, f: string, o = 1, rx = 0, z = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" fill-opacity="${o}" ${z}/>`;
const RS = (x: number, y: number, w: number, h: number, s: string, sw: number, o = 1, rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="none" stroke="${s}" stroke-width="${sw}" stroke-opacity="${o}"/>`;
const L = (x1: number, y1: number, x2: number, y2: number, s: string, w: number, o = 1, z = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s}" stroke-width="${w}" stroke-opacity="${o}" stroke-linecap="round" ${z}/>`;
const PA = (d: string, s: string, w: number, o = 1, z = '') => `<path d="${d}" fill="none" stroke="${s}" stroke-width="${w}" stroke-opacity="${o}" stroke-linecap="round" stroke-linejoin="round" ${z}/>`;
const PF = (d: string, f: string, o = 1, z = '') => `<path d="${d}" fill="${f}" fill-opacity="${o}" ${z}/>`;
const G = (cls: string, inner: string, z = '') => `<g class="${cls}" ${z}>${inner}</g>`;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const T = (x: number, y: number, t: string, fill: string, size = 15, weight = 400, family = 'JetBrains Mono', anchor = 'start', cls = '') =>
  `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}" font-family="${family}, monospace" text-anchor="${anchor}" dominant-baseline="middle" class="${cls}">${esc(t)}</text>`;
/** Code label that "types itself" when its slide becomes active. */
const CODE = (x: number, y: number, t: string, p: Palette) =>
  `<text x="${x}" y="${y}" fill="${p.label}" font-size="15" font-family="JetBrains Mono, monospace" dominant-baseline="hanging" class="a-type" style="white-space:pre">${[...t]
    .map((ch, i) => `<tspan style="animation-delay:${(0.5 + i * 0.05).toFixed(2)}s">${esc(ch)}</tspan>`)
    .join('')}</text>`;
const DASH = 'stroke-dasharray="2 12"';

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function background(_p: Palette, _seed: number): string {
  // The home page's LED dot field sits behind every scene, so scenes add no background of their own.
  return '';
}

const glowFilter = (id: string, dev = 8) =>
  `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${dev}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

// ---------- scenes ----------
type SceneFn = (p: Palette, uid: string) => string;

const lights: SceneFn = (p, uid) => {
  const name = 'AARAV';
  let s = `<defs>${glowFilter(`glow-${uid}`, 10)}</defs>`;
  const xs = [468, 586, 704, 822, 940];
  name.split('').forEach((ch, i) => {
    s += G('a-bulb', C(xs[i], 712, 44, p.butter, 1, `filter="url(#glow-${uid})"`), `style="animation-delay:${(i * 0.35).toFixed(2)}s"`);
    s += T(xs[i], 714, ch, '#0F1F1C', 46, 400, 'Instrument Serif', 'middle');
  });
  // a few stray lights in the corners
  s += G('a-bulb', C(150, 250, 14, p.mint, 1, `filter="url(#glow-${uid})"`), 'style="animation-delay:-1.1s"');
  s += G('a-bulb', C(1250, 210, 18, p.coral, 1, `filter="url(#glow-${uid})"`), 'style="animation-delay:-0.6s"');
  s += G('a-bulb', C(1290, 480, 10, p.blossom, 1, `filter="url(#glow-${uid})"`), 'style="animation-delay:-1.8s"');
  s += G('a-bulb', C(120, 520, 9, p.sky, 1, `filter="url(#glow-${uid})"`), 'style="animation-delay:-2.3s"');
  s += CODE(150, 600, 'for letter in name:', p) + CODE(1060, 600, 'stage.wait(0.4)', p);
  return s;
};

const cloak: SceneFn = (p) => {
  const vx = 950, vy = 600, vw = 380, vh = 240, b = 28;
  let s = R(vx, vy, vw, vh, p.fa, 0.6, 0);
  const br = (d: string) => PA(d, p.ink, 3, 0.8);
  s += br(`M${vx} ${vy + b} V${vy} H${vx + b}`) + br(`M${vx + vw - b} ${vy} H${vx + vw} V${vy + b}`) + br(`M${vx} ${vy + vh - b} V${vy + vh} H${vx + b}`) + br(`M${vx + vw - b} ${vy + vh} H${vx + vw} V${vy + vh - b}`);
  s += G('a-rec', C(vx + 30, vy + 30, 6, p.coral));
  s += L(vx + 40, vy + 175, vx + vw - 30, vy + 175, p.ink, 2, 0.25) + R(vx + 56, vy + 128, 22, 46, p.blossom, 0.7, 3) + R(vx + 88, vy + 116, 16, 58, p.mint, 0.6, 3) + R(vx + 112, vy + 138, 26, 36, p.butter, 0.6, 3);
  const px = vx + 235;
  s += C(px, vy + 78, 32, p.ink, 0.85);
  s += PF(`M${px - 90} ${vy + vh} C${px - 90} ${vy + 150} ${px - 60} ${vy + 122} ${px} ${vy + 122} C${px + 60} ${vy + 122} ${px + 90} ${vy + 150} ${px + 90} ${vy + vh} Z`, p.ink, 0.85);
  const hx = px - 62, hy = vy + 148, hw = 124, hh = vh - 148;
  // the room shows through the cloak...
  let hole = R(hx, hy, hw, hh, p.fa, 1) + L(hx, vy + 175, hx + hw, vy + 175, p.ink, 2, 0.25);
  const rnd = rng(7);
  for (let yy = hy; yy < hy + hh - 8; yy += 10) for (const ex of [hx, hx + hw]) for (let k = -2; k <= 1; k++) if (rnd() < 0.5) hole += R(ex + k * 9, yy, 8, 8, p.mint, +(0.3 + rnd() * 0.6).toFixed(2), 1.5);
  s += hole;
  // ...whenever the green cloth turns invisible
  s += G('a-cloth', R(hx - 6, hy - 6, hw + 12, hh + 6, p.green, 1, 6) + PA(`M${hx + 10} ${hy + 20} q20 14 40 0 t40 0 t40 0`, '#0F1F1C', 1.5, 0.18));
  [p.coral, p.butter, p.green, p.blossom].forEach((col, i) => (s += C(110, 660 + i * 52, 16, col)));
  s += CS(110, 764, 24, p.ink, 2, 0.8);
  s += CODE(70, 590, 'colour = "green"', p) + CODE(950, 556, 'if is_green(pixel):', p);
  return s;
};

const finger: SceneFn = (p) => {
  const w: [number, number] = [200, 830];
  const f: Record<string, [number, number][]> = {
    t: [[150, 792], [118, 755], [98, 722], [84, 692]],
    i: [[182, 735], [172, 668], [167, 628], [163, 592]],
    m: [[210, 732], [210, 660], [210, 618], [210, 580]],
    r: [[236, 738], [244, 672], [248, 634], [251, 600]],
    k: [[258, 752], [274, 702], [282, 672], [288, 644]],
  };
  let s = PA('M163 592 C330 660 470 760 620 760 C760 760 880 650 960 730 C1060 830 1230 800 1300 640', p.coral, 12, 0.9, 'pathLength="1" class="a-draw"');
  s += PA('M975 772 C1090 860 1270 840 1340 690', p.mint, 6, 0.7, 'pathLength="1" class="a-draw a-draw-late"');
  s += C(1322, 604, 7, p.butter) + C(1292, 584, 4, p.blossom) + C(1350, 640, 3, p.mint);
  for (const k of ['t', 'i', 'm', 'r', 'k']) s += PA(`M${w[0]} ${w[1]} ` + f[k].map((q) => `L${q[0]} ${q[1]}`).join(' '), p.soft, 2.5, 0.9);
  s += PA(`M${f.t[0][0]} ${f.t[0][1]} L${f.i[0][0]} ${f.i[0][1]} L${f.m[0][0]} ${f.m[0][1]} L${f.r[0][0]} ${f.r[0][1]} L${f.k[0][0]} ${f.k[0][1]} L${w[0]} ${w[1]}`, p.soft, 2.5, 0.9);
  for (const q of [w, ...f.t, ...f.i, ...f.m, ...f.r, ...f.k]) s += C(q[0], q[1], 5, p.ink);
  s += G('a-pulse', CS(163, 592, 18, p.butter, 2, 0.7) + C(163, 592, 9, p.butter), 'style="transform-origin:163px 592px"');
  s += CODE(300, 806, 'brush = hand.index_tip', p) + CODE(1110, 552, 'trail.append(brush)', p);
  return s;
};

const rover: SceneFn = (p) => {
  let s = E(704, 1500, 1300, 800, p.coral, 0.16) + ES(704, 1500, 1300, 800, p.coral, 2, 0.5);
  for (const q of [[300, 795, 60, 13], [1010, 805, 44, 10], [1250, 848, 70, 14], [150, 850, 40, 9]]) s += E(q[0], q[1], q[2], q[3], p.coral, 0.22) + ES(q[0], q[1], q[2], q[3], p.coral, 1.5, 0.55);
  s += PF('M180 772 A50 50 0 0 1 280 772 Z', p.fb) + PA('M180 772 A50 50 0 0 1 280 772 Z', p.ink, 2, 0.6) + L(230, 722, 230, 686, p.ink, 2, 0.7) + PF('M230 686 L258 695 L230 704 Z', p.mint);
  s += PA('M288 762 C450 735 640 722 800 726 S1000 735 1050 735', p.ink, 3, 0.55, DASH);
  const rx = 1070, gy = 744;
  let r = '';
  for (const o of [18, 60, 102]) r += C(rx + o, gy - 12, 12, p.ink, 0.9) + C(rx + o, gy - 12, 4, p.bg);
  r += R(rx, gy - 58, 120, 34, p.butter, 1, 8) + R(rx - 10, gy - 68, 140, 8, p.mint, 1, 3) + L(rx + 30, gy - 68, rx + 30, gy - 104, p.ink, 3, 0.9) + R(rx + 16, gy - 120, 30, 16, p.ink, 0.9, 4) + C(rx + 38, gy - 112, 4, p.butter) + L(rx + 100, gy - 68, rx + 110, gy - 100, p.ink, 2, 0.7) + C(rx + 110, gy - 102, 4, p.coral);
  s += G('a-rover', r);
  s += RS(70, 150, 64, 30, p.ink, 2, 0.7, 6) + R(136, 159, 6, 12, p.ink, 0.7, 2) + R(76, 156, 12, 18, p.butter, 1, 2) + G('a-blink', R(92, 156, 12, 18, p.butter, 1, 2));
  s += C(1290, 175, 28, p.butter, 0.85) + CS(1290, 175, 40, p.butter, 1.5, 0.3);
  s += CODE(70, 194, 'battery = 42', p) + CODE(560, 672, 'rover.forward(3)', p);
  return s;
};

const drone: SceneFn = (p) => {
  const rnd = rng(11);
  let s = '';
  let x = 0;
  while (x < SCENE_W) {
    const w = 50 + Math.floor(rnd() * 60);
    const h = 70 + Math.floor(rnd() * 150);
    if (x >= 90 && x < 200) { x = 200; continue; }
    if (x + w > 440 && x < 990) { x = 990; continue; }
    if (x + w > 1170 && x < 1300) { x = 1300; continue; }
    s += R(x, SCENE_H - h, w, h + 10, p.fa, 1, 4) + RS(x, SCENE_H - h, w, h + 10, p.ink, 1, 0.18, 4);
    let k = 0;
    for (let wy = SCENE_H - h + 14; wy < SCENE_H - 12; wy += 22)
      for (let wx = x + 10; wx < x + w - 12; wx += 18)
        if (rnd() < 0.35) s += R(wx, wy, 8, 10, p.butter, 0.55, 1, ++k % 5 === 0 ? `class="a-twinkle" style="animation-delay:-${(rnd() * 4).toFixed(1)}s"` : '');
    x += w + 6;
  }
  s += R(100, 688, 90, 190, p.fb, 1, 4) + RS(100, 688, 90, 190, p.ink, 1, 0.25, 4);
  s += R(1180, 660, 110, 220, p.fb, 1, 4) + RS(1180, 660, 110, 220, p.ink, 1, 0.25, 4) + E(1235, 654, 34, 7, p.mint, 0.35) + ES(1235, 654, 34, 7, p.mint, 2, 0.9);
  for (const tx of [470, 950]) s += L(tx, 868, tx, 846, p.ink, 2, 0.4) + C(tx, 836, 13, p.mint, 0.55);
  s += PA('M150 680 C250 590 380 650 520 630 S860 590 985 560', p.butter, 3, 0.8, DASH) + PA('M1045 590 C1120 600 1200 620 1232 644', p.mint, 3, 0.8, DASH);
  s += G('a-wind', PA('M70 300 C110 285 150 315 200 300', p.mint, 3, 0.7) + PA('M95 330 C135 315 175 345 235 330', p.mint, 3, 0.5) + PA('M60 360 C100 345 140 375 180 360', p.mint, 3, 0.6));
  let d = L(966, 532, 966, 540, p.ink, 2, 0.8) + L(1054, 532, 1054, 540, p.ink, 2, 0.8) + L(966, 540, 1054, 540, p.ink, 3, 0.9);
  d += G('a-rotor', E(966, 530, 24, 5, p.ink, 0.5), 'style="transform-origin:966px 530px"') + G('a-rotor', E(1054, 530, 24, 5, p.ink, 0.5), 'style="transform-origin:1054px 530px"');
  d += R(990, 534, 40, 20, p.butter, 1, 7) + L(1000, 554, 996, 568, p.ink, 1.5, 0.7) + L(1020, 554, 1024, 568, p.ink, 1.5, 0.7) + R(992, 568, 36, 28, p.coral, 1, 4) + L(1010, 568, 1010, 596, p.ink, 1.5, 0.35);
  s += G('a-drone', d);
  s += C(1285, 165, 22, p.butter, 0.8);
  s += CODE(70, 250, 'wind = 4', p) + CODE(1068, 494, 'drone.fly_to(roof)', p);
  return s;
};

const lander: SceneFn = (p) => {
  let s = E(704, 1450, 1250, 720, p.fb) + ES(704, 1450, 1250, 720, p.ink, 1.5, 0.35);
  for (const q of [[260, 800, 70, 14], [1180, 792, 52, 11], [985, 850, 36, 8], [420, 852, 30, 7]]) s += E(q[0], q[1], q[2], q[3], p.bg, 0.5) + ES(q[0], q[1], q[2], q[3], p.ink, 1.5, 0.25);
  s += C(1250, 190, 46, p.mint, 0.9) + PF('M1225 170 C1240 160 1258 168 1255 182 C1252 196 1232 200 1222 190 Z', p.bg, 0.35) + PF('M1262 205 C1275 200 1285 210 1278 222 C1270 230 1258 222 1262 205 Z', p.bg, 0.35) + CS(1250, 190, 58, p.mint, 1.5, 0.3);
  s += L(1040, 380, 1040, 548, p.ink, 2, 0.4, 'stroke-dasharray="2 10"');
  let l = R(1022, 558, 36, 22, p.ink, 0.9, 4) + C(1040, 550, 6, p.coral) + PF('M1012 580 L1068 580 L1078 610 L1002 610 Z', p.butter);
  l += PA('M1010 610 L990 650 M1070 610 L1090 650', p.ink, 3, 0.9) + L(980, 650, 1000, 650, p.ink, 3, 0.9) + L(1080, 650, 1100, 650, p.ink, 3, 0.9);
  l += G('a-flame', PF('M1028 612 L1052 612 L1040 654 Z', p.coral, 0.9), 'style="transform-origin:1040px 612px"');
  s += G('a-lander', l);
  s += L(110, 520, 110, 800, p.ink, 2, 0.35);
  for (let y = 520; y <= 800; y += 40) s += L(102, y, 118, y, p.ink, 2, 0.35);
  s += G('a-gauge', PF('M124 600 L140 592 L140 608 Z', p.butter));
  s += CODE(70, 476, 'height = 120', p) + CODE(150, 580, 'speed = 2', p) + CODE(1090, 462, 'if height < 50: thrust()', p);
  return s;
};

const planet: SceneFn = (p) => {
  let s = G('a-comet', L(190, 165, 285, 122, p.ink, 2, 0.5) + C(285, 122, 5, p.butter));
  s += ES(1170, 780, 320, 74, p.mint, 3, 0.9, 'transform="rotate(-14 1170 780)"');
  s += C(1170, 780, 215, p.fb) + CS(1170, 780, 215, p.ink, 1.5, 0.3);
  s += E(1170, 700, 190, 14, p.coral, 0.55) + E(1170, 770, 205, 12, p.butter, 0.5) + E(1170, 850, 190, 15, p.coral, 0.45) + C(1100, 640, 18, p.ink, 0.1) + C(1215, 622, 11, p.ink, 0.1);
  s += ES(1170, 780, 290, 58, p.butter, 6, 1, 'transform="rotate(-12 1170 780)"');
  // moons orbit the planet
  s += G('a-orbit a-orbit-slow', C(866, 690, 16, p.coral));
  s += G('a-orbit a-orbit-fast', C(1320, 400, 10, p.blossom));
  s += G('a-float', C(200, 520, 26, p.mint));
  s += CODE(100, 556, 'planet.add_ring(150)', p) + CODE(1180, 330, 'moons = 2', p);
  return s;
};

const doodle: SceneFn = (p) => {
  let s = R(70, 610, 200, 200, p.fa, 1, 16) + RS(70, 610, 200, 200, p.ink, 1.5, 0.18, 16);
  s += PA('M112 660 L228 655 L158 778', p.butter, 13, 1, 'pathLength="1" class="a-draw a-draw-quick"') + PA('M142 718 L205 716', p.butter, 9, 1, 'pathLength="1" class="a-draw a-draw-quick a-draw-late"');
  s += PA('M292 710 L358 710', p.ink, 2, 0.5) + PF('M358 702 L372 710 L358 718 Z', p.ink, 0.5);
  const L1 = [640, 680, 720, 760, 800].map((y) => [400, y]);
  const L2 = [660, 700, 740, 780].map((y) => [470, y]);
  const L3 = [680, 720, 760].map((y) => [540, y]);
  for (const a of L1) for (const b of L2) s += L(a[0], a[1], b[0], b[1], p.ink, 1, 0.12);
  for (const a of L2) for (const b of L3) s += L(a[0], a[1], b[0], b[1], p.ink, 1, 0.12);
  s += PA('M400 720 L470 700 L540 720', p.butter, 2.5, 0.9, 'class="a-flow" stroke-dasharray="6 8"');
  for (const q of [...L1, ...L2, ...L3]) s += C(q[0], q[1], 6, p.ink, 0.75);
  s += PA('M572 720 C700 690 860 690 965 712', p.ink, 2, 0.4, DASH);
  const hs = [18, 12, 30, 22, 10, 26, 14, 150, 40, 20];
  s += L(985, 790, 1315, 790, p.ink, 1.5, 0.3);
  hs.forEach((h, i) => {
    const x = 990 + i * 32;
    s += G('a-grow', R(x, 790 - h, 22, h, i === 7 ? p.butter : p.ink, i === 7 ? 1 : 0.2, 4), `style="transform-origin:${x + 11}px 790px;animation-delay:${(0.6 + i * 0.05).toFixed(2)}s"`);
    s += T(x + 11, 806, String(i), p.soft, 13, 400, 'JetBrains Mono', 'middle');
  });
  s += T(1194, 620, '7 · 94% sure', p.butterText, 14, 500, 'JetBrains Mono', 'start', 'a-appear');
  s += CODE(990, 830, 'guess = model.predict(doodle)', p);
  return s;
};

const cricket: SceneFn = (p) => {
  const rnd = rng(23);
  let s = PA('M70 140 V330 H270', p.ink, 1.5, 0.35);
  for (let i = 0; i < 14; i++) s += C(+(90 + rnd() * 165).toFixed(1), +(160 + rnd() * 155).toFixed(1), 4, p.mint, +(0.4 + rnd() * 0.5).toFixed(2));
  s += C(232, 176, 7, p.butter);
  s += PA('M232 700 C320 610 420 620 476 690', p.ink, 2, 0.45, 'stroke-dasharray="2 10"');
  s += G('a-ball', C(180, 720, 46, p.coral) + PA('M160 682 C176 704 176 736 160 758', p.ink, 2.5, 0.55) + PA('M200 682 C184 704 184 736 200 758', p.ink, 2.5, 0.55), 'style="transform-origin:180px 720px"');
  for (const x of [490, 506, 522]) s += R(x, 640, 8, 120, p.ink, 0.85, 2);
  s += G('a-bails', L(488, 634, 532, 634, p.ink, 4, 0.85), 'style="transform-origin:510px 634px"');
  const ws = [300, 250, 230, 190, 160];
  const nums = ['812', '690', '645', '540', '470'];
  ws.forEach((w, i) => {
    const y = 618 + i * 34;
    s += G('a-growx', R(1000, y, w, 20, i === 0 ? p.butter : p.ink, i === 0 ? 1 : 0.2, 6), `style="transform-origin:1000px ${y}px;animation-delay:${(0.4 + i * 0.12).toFixed(2)}s"`);
    s += T(1000 + w + 10, y + 11, nums[i], p.soft, 13);
  });
  s += CODE(70, 346, 'avg = runs / outs', p) + CODE(1000, 830, 'top = sorted(players, key=runs)', p);
  return s;
};

const train: SceneFn = (p) => {
  const N: Record<string, [number, number]> = {
    Delhi: [170, 230], Jaipur: [110, 420], Ahmedabad: [170, 610], Mumbai: [320, 770], Pune: [500, 700],
    Hyderabad: [930, 760], Bengaluru: [1130, 826], Chennai: [1310, 720], Kolkata: [1290, 330], Lucknow: [1250, 170],
  };
  const edges = [['Delhi', 'Jaipur'], ['Jaipur', 'Ahmedabad'], ['Ahmedabad', 'Mumbai'], ['Mumbai', 'Pune'], ['Hyderabad', 'Bengaluru'], ['Bengaluru', 'Chennai'], ['Hyderabad', 'Chennai'], ['Kolkata', 'Lucknow'], ['Chennai', 'Kolkata'], ['Ahmedabad', 'Pune']];
  let s = '';
  for (const [a, b] of edges) s += L(N[a][0], N[a][1], N[b][0], N[b][1], p.ink, 2, 0.3, 'stroke-dasharray="6 8"');
  s += L(500, 700, 930, 760, p.butter, 5, 1) + L(930, 760, 1290, 330, p.butter, 5, 1);
  s += PA('M500 700 L930 760 L1290 330', p.bg, 2, 0.6, 'class="a-flow" stroke-dasharray="4 18"');
  const tr = R(-24, -11, 48, 22, p.coral, 1, 7) + R(-16, -6, 9, 8, p.bg, 0.8, 2) + R(-3, -6, 9, 8, p.bg, 0.8, 2) + R(10, -6, 9, 8, p.bg, 0.8, 2);
  s += G('a-train', `<g transform="rotate(8)">${tr}</g>`);
  for (const [n, [x, y]] of Object.entries(N)) {
    const end = n === 'Pune' || n === 'Kolkata';
    s += end ? C(x, y, 11, p.butter) : C(x, y, 8, p.bg) + CS(x, y, 8, p.ink, 2, 0.7);
    if (n === 'Kolkata') s += T(x + 18, y, n, p.ink, 13, 600, 'Figtree');
    else s += T(x, y + 24, n, end ? p.ink : p.soft, 13, end ? 600 : 500, 'Figtree', 'middle');
  }
  s += CODE(40, 812, 'path = fastest(rail, "Pune", "Kolkata")', p);
  return s;
};

const cipher: SceneFn = (p) => {
  const cx = 1170, cy = 770;
  let s = CS(cx, cy, 205, p.ink, 1.5, 0.3) + CS(cx, cy, 160, p.ink, 1.5, 0.3);
  const AB = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let outer = '';
  let inner = CS(cx, cy, 118, p.ink, 1.5, 0.3) + C(cx, cy, 118, p.fa, 0.6);
  for (let i = 0; i < 26; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 26;
    outer += T(+(cx + 182 * Math.cos(a)).toFixed(1), +(cy + 182 * Math.sin(a)).toFixed(1), AB[i], p.ink, 15, 500, 'JetBrains Mono', 'middle');
    inner += T(+(cx + 139 * Math.cos(a)).toFixed(1), +(cy + 139 * Math.sin(a)).toFixed(1), AB[(i + 3) % 26], p.butterText, 15, 500, 'JetBrains Mono', 'middle');
  }
  s += outer;
  s += G('a-wheel', inner, `style="transform-origin:${cx}px ${cy}px"`);
  s += R(cx - 19, cy - 216, 38, 104, p.mint, 0.22, 19);
  s += C(cx, cy, 40, p.fa) + CS(cx, cy, 40, p.ink, 1.5, 0.3) + C(cx, cy, 7, p.butter) + L(cx, cy, cx, cy - 110, p.butter, 2.5, 0.9);
  s += R(70, 628, 250, 50, p.fa, 1, 25) + PA('M195 690 V716', p.ink, 2, 0.5) + PF('M187 712 L195 726 L203 712 Z', p.ink, 0.5) + R(70, 734, 250, 50, p.fa, 1, 25);
  s += T(195, 654, 'KHOOR PDPD', p.coral, 20, 500, 'JetBrains Mono', 'middle');
  s += G('a-appear-late', T(195, 760, 'HELLO MAMA', p.mint, 20, 500, 'JetBrains Mono', 'middle'));
  s += CODE(70, 580, 'shift = 3', p) + CODE(70, 800, 'decode(secret, shift)', p);
  return s;
};



// ---------- Intro slide: pixel icons of things kids build, plus Nix and Riff ----------
const ICONS: Record<string, string[]> = {
  rocket: ['....y....', '...yyy...', '...ycy...', '..yyyyy..', '..yyyyy..', '.yyyyyyy.', 'yy.yyy.yy', 'y..yyy..y', '...o.o...', '..o.o.o..'],
  planet: ['....mmm....', '..mmmmmmm..', '.mmmmmmmmm.', 'yyyyyyyyyyy', '.mmmmmmmmm.', '..mmmmmmm..', '....mmm....'],
  heart: ['.pp...pp.', 'ppppppppp', 'ppppppppp', '.ppppppp.', '..ppppp..', '...ppp...', '....p....'],
  pad: ['..ccccccccc..', '.ccccccccccc.', 'cc.cccccc.yc.', 'c...cccc.y.yc', 'cc.cccccc.yc.', '.ccc.....ccc.', '..c.......c..'],
  bulb: ['..yyy..', '.yyyyy.', 'yyyyyyy', 'yyyyyyy', '.yyyyy.', '..yyy..', '..ccc..', '..ccc..'],
  robot: ['....c....', '..ccccc..', '.ccccccc.', '.cmcccmc.', '.ccccccc.', '..ccccc..', '.c.ccc.c.', '...c.c...'],
};

function pixelIcon(p: Palette, name: string, x: number, y: number, cell = 10, twinkle = 0): string {
  const color: Record<string, string> = { y: p.butter, m: p.mint, p: p.blossom, o: p.coral, c: p.coral, s: p.sky };
  if (name === 'pad' || name === 'robot') color.c = p.sky;
  let out = '';
  ICONS[name].forEach((row, ry) =>
    row.split('').forEach((ch, rx) => {
      if (ch === '.') return;
      const tw = (rx * 7 + ry * 3 + twinkle) % 9 === 0 ? ` class="a-twinkle" style="animation-delay:-${((rx + ry) % 5) * 0.6}s"` : '';
      out += `<rect x="${x + rx * cell}" y="${y + ry * cell}" width="${cell - 2}" height="${cell - 2}" fill="${color[ch] ?? p.ink}"${tw}/>`;
    }),
  );
  return out;
}

const intro: SceneFn = (p) => {
  let s = '';
  s += G('a-float', pixelIcon(p, 'rocket', 110, 150, 10, 1));
  s += pixelIcon(p, 'bulb', 230, 360, 10, 2);
  s += G('a-float', pixelIcon(p, 'planet', 1160, 140, 10, 3));
  s += pixelIcon(p, 'pad', 1150, 330, 9, 4);
  s += pixelIcon(p, 'heart', 120, 470, 8, 5);
  s += pixelIcon(p, 'robot', 1280, 480, 8, 6);
  // Nix and Riff stand at the bottom corners.
  s += `<image href="/mascots/nix/welcome.webp" x="40" y="560" height="300" width="230" preserveAspectRatio="xMidYMax meet"/>`;
  s += `<image href="/mascots/riff/welcome.webp" x="1130" y="550" height="310" width="250" preserveAspectRatio="xMidYMax meet"/>`;
  s += CODE(330, 640, 'print("Hello, world!")', p) + CODE(860, 700, 'build(your_idea)', p);
  return s;
};

const SCENES: Record<string, SceneFn> = { intro,  lights, cloak, finger, rover, drone, lander, planet, doodle, cricket, train, cipher };

export function sceneSvg(key: string, mode: 'dark' | 'light', index: number): string {
  const p = PALETTES[mode];
  const fn = SCENES[key];
  return background(p, index * 17 + (mode === 'dark' ? 3 : 5)) + (fn ? fn(p, `${key}-${mode}`) : '');
}
