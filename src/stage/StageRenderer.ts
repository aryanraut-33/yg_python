// Draws stage commands from Python onto a canvas.
// Drawing goes to a fixed-size backing canvas, so resizing the window never loses the picture.

export const STAGE_WIDTH = 640;
export const STAGE_HEIGHT = 400;
const SCALE = 2; // backing canvas is 1280 x 800 for crisp output
const NIGHT = '#0B1714';

const FONT_FAMILY: Record<string, string> = {
  sans: '"Figtree", system-ui, sans-serif',
  serif: '"Instrument Serif", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

type Command =
  | ['bg', string]
  | ['circle', number, number, number, string, boolean]
  | ['rect', number, number, number, number, string, number]
  | ['line', number, number, number, number, string, number]
  | ['text', number, number, string, number, string, CanvasTextAlign, string, boolean]
  | ['sprite', string, number, number, number, number]
  | ['turtle', number, number, number, boolean, string]
  | ['speak', string];

/** The turtle's arrow head, drawn on top of the picture rather than into it. */
interface TurtleCursor {
  x: number;
  y: number;
  heading: number;
  visible: boolean;
  color: string;
}

export class StageRenderer {
  private readonly backing: HTMLCanvasElement;
  private readonly bctx: CanvasRenderingContext2D;
  private view: HTMLCanvasElement | null = null;
  private queue: Command[][] = [];
  private frame = 0;
  private cursor: TurtleCursor | null = null;
  /** Speech is on unless the page turns it off (e.g. while replaying a preview). */
  speech = true;

  constructor() {
    this.backing = document.createElement('canvas');
    this.backing.width = STAGE_WIDTH * SCALE;
    this.backing.height = STAGE_HEIGHT * SCALE;
    const ctx = this.backing.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.bctx = ctx;
    this.bctx.scale(SCALE, SCALE);
    this.reset();
  }

  attach(canvas: HTMLCanvasElement | null) {
    this.view = canvas;
    this.present();
  }

  reset() {
    this.queue = [];
    this.cursor = null;
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    this.fill(NIGHT);
    this.present();
  }

  /** Queue a batch (JSON array of commands) and draw it on the next animation frame. */
  push(batchJson: string) {
    try {
      this.queue.push(JSON.parse(batchJson) as Command[]);
    } catch {
      return;
    }
    if (!this.frame) this.frame = requestAnimationFrame(() => this.flush());
  }

  /** Save the current picture as a PNG on this device. */
  download(fileName: string) {
    const url = this.backing.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  }

  /** Redraw the visible canvas at its current size (call after layout changes). */
  present() {
    const view = this.view;
    if (!view) return;
    const rect = view.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (view.width !== w || view.height !== h) {
      view.width = w;
      view.height = h;
    }
    const ctx = view.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.backing, 0, 0, w, h);
    if (this.cursor?.visible) drawTurtle(ctx, this.cursor, w / STAGE_WIDTH);
  }

  private flush() {
    this.frame = 0;
    const batches = this.queue;
    this.queue = [];
    for (const batch of batches) for (const cmd of batch) this.draw(cmd);
    this.present();
  }

  private fill(color: string) {
    const c = this.bctx;
    c.save();
    c.shadowBlur = 0;
    c.fillStyle = color;
    c.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
    c.restore();
  }

  private draw(cmd: Command) {
    const c = this.bctx;
    switch (cmd[0]) {
      case 'bg':
        this.fill(cmd[1]);
        break;
      case 'circle': {
        const [, x, y, r, color, glow] = cmd;
        c.save();
        c.fillStyle = color;
        if (glow) {
          c.shadowColor = color;
          c.shadowBlur = Math.max(8, r * 0.9) * SCALE;
        }
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
        if (glow) c.fill(); // second pass makes the glow brighter
        c.restore();
        break;
      }
      case 'rect': {
        const [, x, y, w, h, color, round] = cmd;
        c.save();
        c.fillStyle = color;
        c.beginPath();
        if (round > 0) c.roundRect(x, y, w, h, round);
        else c.rect(x, y, w, h);
        c.fill();
        c.restore();
        break;
      }
      case 'line': {
        const [, x1, y1, x2, y2, color, thickness] = cmd;
        c.save();
        c.strokeStyle = color;
        c.lineWidth = thickness;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.stroke();
        c.restore();
        break;
      }
      case 'sprite': {
        const [, name, x, y, size, angle] = cmd;
        c.save();
        c.translate(x, y);
        c.rotate((angle * Math.PI) / 180);
        c.scale(size, size);
        drawSprite(c, name);
        c.restore();
        break;
      }
      case 'turtle': {
        const [, x, y, heading, visible, color] = cmd;
        this.cursor = { x, y, heading, visible, color };
        break;
      }
      case 'speak': {
        if (this.speech && typeof speechSynthesis !== 'undefined') {
          const u = new SpeechSynthesisUtterance(cmd[1]);
          u.lang = 'en-IN';
          u.rate = 0.95;
          speechSynthesis.speak(u);
        }
        break;
      }
      case 'text': {
        const [, x, y, words, size, color, align, font, glow] = cmd;
        c.save();
        c.fillStyle = color;
        c.font = `${font === 'sans' ? 600 : 400} ${size}px ${FONT_FAMILY[font] ?? FONT_FAMILY.sans}`;
        c.textAlign = align;
        c.textBaseline = 'middle';
        if (glow) {
          c.shadowColor = color;
          c.shadowBlur = Math.max(6, size * 0.5) * SCALE;
        }
        c.fillText(words, x, y);
        c.restore();
        break;
      }
    }
  }
}

function drawTurtle(ctx: CanvasRenderingContext2D, t: TurtleCursor, scale: number) {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(t.x, t.y);
  ctx.rotate((-t.heading * Math.PI) / 180);
  ctx.fillStyle = t.color;
  ctx.strokeStyle = '#0B1714';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(-7, -7);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-7, 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Ready-made pictures for stage.sprite(). Each is drawn around (0, 0), roughly 40 px across. */
function drawSprite(c: CanvasRenderingContext2D, name: string) {
  const fill = (color: string, path: () => void) => {
    c.fillStyle = color;
    c.beginPath();
    path();
    c.fill();
  };
  const circle = (x: number, y: number, r: number) => c.arc(x, y, r, 0, Math.PI * 2);
  switch (name) {
    case 'rocket':
      fill('#F5ECDC', () => {
        c.moveTo(0, -30);
        c.quadraticCurveTo(13, -16, 11, 14);
        c.lineTo(-11, 14);
        c.quadraticCurveTo(-13, -16, 0, -30);
      });
      fill('#FF8A65', () => {
        c.moveTo(-11, 4);
        c.lineTo(-20, 20);
        c.lineTo(-10, 16);
        c.moveTo(11, 4);
        c.lineTo(20, 20);
        c.lineTo(10, 16);
        c.moveTo(0, -30);
        c.quadraticCurveTo(7, -24, 9, -18);
        c.lineTo(-9, -18);
        c.quadraticCurveTo(-7, -24, 0, -30);
      });
      fill('#8CC8FF', () => circle(0, -4, 5));
      fill('#2A3B36', () => c.rect(-7, 14, 14, 4));
      break;
    case 'flame':
      fill('#FF8A65', () => {
        c.moveTo(-9, -14);
        c.quadraticCurveTo(-10, 6, 0, 22);
        c.quadraticCurveTo(10, 6, 9, -14);
      });
      fill('#FFD66B', () => {
        c.moveTo(-5, -14);
        c.quadraticCurveTo(-5, 2, 0, 12);
        c.quadraticCurveTo(5, 2, 5, -14);
      });
      break;
    case 'smoke':
      c.globalAlpha = 0.75;
      fill('#C9D1CE', () => {
        circle(-9, 3, 10);
        circle(6, -2, 12);
        circle(10, 9, 8);
      });
      break;
    case 'star':
      fill('#FFD66B', () => {
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? 7 : 16;
          const a = (Math.PI / 5) * i - Math.PI / 2;
          c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
      });
      break;
    case 'planet':
      fill('#C9B6FF', () => circle(0, 0, 16));
      c.strokeStyle = '#FFD66B';
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(0, 0, 26, 7, -0.35, 0, Math.PI * 2);
      c.stroke();
      break;
    case 'moon':
      fill('#F5ECDC', () => circle(0, 0, 16));
      fill('#D9CFBF', () => {
        circle(-5, -4, 4);
        circle(6, 5, 3);
      });
      break;
    case 'cloud':
      fill('#F5ECDC', () => {
        circle(-10, 4, 10);
        circle(2, -3, 13);
        circle(13, 5, 9);
        c.rect(-10, 4, 23, 10);
      });
      break;
    case 'heart':
      fill('#FF8FC8', () => {
        c.moveTo(0, 14);
        c.bezierCurveTo(-22, 0, -12, -18, 0, -6);
        c.bezierCurveTo(12, -18, 22, 0, 0, 14);
      });
      break;
    case 'coin':
      fill('#FFC94D', () => circle(0, 0, 14));
      fill('#E0A92F', () => circle(0, 0, 10));
      c.fillStyle = '#FFE8A3';
      c.font = '700 13px "Figtree", system-ui, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('₹', 0, 1);
      break;
    case 'rover':
      // Points up (north) at angle 0.
      fill('#2A3B36', () => {
        c.rect(-17, -15, 6, 12);
        c.rect(11, -15, 6, 12);
        c.rect(-17, 5, 6, 12);
        c.rect(11, 5, 6, 12);
      });
      fill('#FFD66B', () => c.rect(-11, -14, 22, 28));
      fill('#7BE0C3', () => c.rect(-13, -4, 26, 5));
      fill('#F5ECDC', () => c.rect(-4, -20, 8, 7));
      fill('#FF8A65', () => circle(7, 10, 2.5));
      break;
    case 'probe':
      fill('#C9D1CE', () => circle(0, 0, 9));
      c.strokeStyle = '#C9D1CE';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-18, 0);
      c.lineTo(18, 0);
      c.stroke();
      fill('#8CC8FF', () => {
        c.rect(-20, -5, 7, 10);
        c.rect(13, -5, 7, 10);
      });
      fill('#FF8A65', () => circle(0, -12, 2.5));
      break;
    case 'base':
      fill('#7BE0C3', () => {
        c.moveTo(-18, 12);
        c.arc(0, 12, 18, Math.PI, 0);
      });
      fill('#0F1F1C', () => c.rect(-5, 3, 10, 9));
      fill('#F5ECDC', () => c.rect(-20, 12, 40, 4));
      break;
    case 'crater':
      fill('#3B1F18', () => c.ellipse(0, 0, 20, 14, 0, 0, Math.PI * 2));
      fill('#2A1510', () => c.ellipse(1, 2, 13, 8, 0, 0, Math.PI * 2));
      c.strokeStyle = '#8A4A36';
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(0, 0, 20, 14, 0, Math.PI * 1.05, Math.PI * 1.95);
      c.stroke();
      break;
    case 'flag':
      c.strokeStyle = '#F5ECDC';
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(-8, 18);
      c.lineTo(-8, -18);
      c.stroke();
      fill('#7BE0C3', () => {
        c.moveTo(-7, -18);
        c.lineTo(14, -11);
        c.lineTo(-7, -4);
      });
      break;
  }
}
