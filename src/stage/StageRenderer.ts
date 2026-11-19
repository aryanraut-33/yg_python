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
  | ['text', number, number, string, number, string, CanvasTextAlign, string, boolean];

export class StageRenderer {
  private readonly backing: HTMLCanvasElement;
  private readonly bctx: CanvasRenderingContext2D;
  private view: HTMLCanvasElement | null = null;
  private queue: Command[][] = [];
  private frame = 0;

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
