/**
 * Day 03 - Lobby Battery Banks Visualizer
 *
 * Renders the greedy selection of batteries per bank as a scanning beam in a lobby.
 * Shows the lookahead window, chosen digits rising into a power rail, and pulses
 * along an escalator spine as each bank completes. Supports WebM recording.
 *
 * Resolution: 720p (1280x720). The scene needs width for long battery rows and a
 * readable 12-slot power rail; 720p keeps text crisp while keeping recordings small.
 */

export {};

type FrameType = 'bank_start' | 'scan_window' | 'pick' | 'skip' | 'bank_complete' | 'final';

interface Frame {
  frame_type: FrameType;
  bank_index: number;
  bank_digits: string;
  window_start: number;
  window_end: number;
  cursor: number;
  remaining_picks: number;
  chosen_so_far: string;
  locked_indices: number[];
  running_total: number;
  bank_value?: number;
  bank_output?: string;
  banks_completed?: number;
  skip_count?: number;
}

interface LogData {
  day: number;
  part: number;
  digits_to_pick: number;
  total_banks: number;
  final_total: number;
  frames: Frame[];
}

interface Theme {
  background: string;
  backgroundAccent: string;
  brass: string;
  coral: string;
  jade: string;
  amber: string;
  textPrimary: string;
  textSecondary: string;
  cell: string;
  cellEdge: string;
  pickedCell: string;
  skipGlow: string;
  windowFill: string;
  windowEdge: string;
  escalator: string;
  escalatorLit: string;
  rail: string;
  railEdge: string;
  railSlot: string;
  slotFill: string;
  spark: string;
}

interface RenderState {
  bankDigits: string;
  bankIndex: number;
  cursor: number;
  windowStart: number;
  windowEnd: number;
  remainingPicks: number;
  chosen: string;
  locked: number[];
  runningTotal: number;
  bankValue?: number;
  frameType: FrameType;
  banksCompleted: number;
}

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const BASE_FRAME_DURATION = 80; // ms per frame before speed multiplier
const PICK_ANIM_DURATION = 420; // ms for digit lift animation
const DEFAULT_SPEED = 2;
const MAX_FRAMES = 6000;

const theme: Theme = {
  background: '#07161d',
  backgroundAccent: '#0c2a33',
  brass: '#d8a24a',
  coral: '#ff6f61',
  jade: '#2dd4bf',
  amber: '#f5c16c',
  textPrimary: '#f1e9da',
  textSecondary: '#9fbcc5',
  cell: '#0f2c36',
  cellEdge: '#1f4d5a',
  pickedCell: '#ffd166',
  skipGlow: '#256d85',
  windowFill: 'rgba(45, 212, 191, 0.12)',
  windowEdge: '#2dd4bf',
  escalator: '#12323f',
  escalatorLit: '#f7d96f',
  rail: '#0c2f39',
  railEdge: '#1f5c6b',
  railSlot: '#0d222a',
  slotFill: '#f7f1e3',
  spark: '#ff8f70',
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

class LobbyVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private frames: Frame[] = [];
  private currentFrameIndex = 0;
  private previousFrame: Frame | null = null;
  private currentFrame: Frame | null = null;
  private lastTimestamp = 0;
  private frameElapsed = 0;
  private playing = false;
  private playbackSpeed = DEFAULT_SPEED;
  private digitsToPick = 12;
  private totalBanks = 0;
  private finalTotal = 0;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recording = false;
  private pickEffect:
    | { active: boolean; digit: string; index: number; slot: number; progress: number; bankIndex: number }
    | null = null;
  private escalatorPulse = 0;
  private bankCompleteArrow: { active: boolean; progress: number; bankValue: number } | null = null;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    requestAnimationFrame(this.loop);
  }

  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.25, speed);
  }

  async loadFromFile(file: File): Promise<void> {
    const text = await file.text();
    const data: LogData = JSON.parse(text);
    this.digitsToPick = data.digits_to_pick;
    this.totalBanks = data.total_banks;
    this.finalTotal = data.final_total;
    this.frames = this.downsampleFrames(data.frames ?? []);
    if (this.frames.length === 0) {
      throw new Error('Log contains no frames.');
    }
    this.currentFrameIndex = 0;
    this.previousFrame = this.frames[0];
    this.currentFrame = this.frames[0];
    this.frameElapsed = 0;
    this.playing = false;
    this.pickEffect = null;
  }

  start(): void {
    if (this.frames.length === 0) {
      return;
    }
    this.currentFrameIndex = 0;
    this.previousFrame = this.frames[0];
    this.currentFrame = this.frames[0];
    this.frameElapsed = 0;
    this.playing = true;
    this.pickEffect = null;
    this.escalatorPulse = 0.5;
    this.bankCompleteArrow = null;
  }

  stop(): void {
    this.playing = false;
    this.frameElapsed = 0;
    this.stopRecording();
  }

  startRecording(): void {
    if (this.recording) return;
    const stream = this.canvas.captureStream(60);
    const mimeType = this.pickMimeType();
    try {
      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
    } catch (err) {
      console.error('MediaRecorder init failed', err);
      return;
    }
    this.recordedChunks = [];
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };
    this.mediaRecorder.onstop = () => this.saveRecording(mimeType);
    this.mediaRecorder.start();
    this.recording = true;
    if (!this.playing) {
      this.start();
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.recording) {
      this.mediaRecorder.stop();
    }
    this.recording = false;
  }

  private saveRecording(mimeType: string): void {
    const blob = new Blob(this.recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'day03-lobby.webm';
    a.click();
    URL.revokeObjectURL(url);
  }

  private pickMimeType(): string {
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) return 'video/webm;codecs=vp9';
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) return 'video/webm;codecs=vp8';
    return 'video/webm';
  }

  private loop = (timestamp: number): void => {
    const delta = this.lastTimestamp ? timestamp - this.lastTimestamp : 0;
    this.lastTimestamp = timestamp;
    if (this.playing) {
      this.update(delta);
    }
    this.render();
    requestAnimationFrame(this.loop);
  };

  private update(delta: number): void {
    const effectiveDuration = BASE_FRAME_DURATION / this.playbackSpeed;
    this.frameElapsed += delta;

    if (this.pickEffect && this.pickEffect.active) {
      this.pickEffect.progress += delta / PICK_ANIM_DURATION;
      if (this.pickEffect.progress >= 1) {
        this.pickEffect = null;
      }
    }

    this.escalatorPulse = Math.max(0, this.escalatorPulse - delta / 900);

    if (this.bankCompleteArrow && this.bankCompleteArrow.active) {
      this.bankCompleteArrow.progress += delta / 600; // 600ms animation
      if (this.bankCompleteArrow.progress >= 1) {
        this.bankCompleteArrow = null;
      }
    }

    while (this.frameElapsed >= effectiveDuration && this.currentFrameIndex < this.frames.length - 1) {
      this.frameElapsed -= effectiveDuration;
      this.advanceFrame();
    }
  }

  private advanceFrame(): void {
    this.previousFrame = this.currentFrame ?? this.frames[this.currentFrameIndex];
    this.currentFrameIndex = Math.min(this.currentFrameIndex + 1, this.frames.length - 1);
    this.currentFrame = this.frames[this.currentFrameIndex];

    if (!this.previousFrame || !this.currentFrame) return;

    const prevChosen = this.previousFrame.chosen_so_far ?? '';
    const currChosen = this.currentFrame.chosen_so_far ?? prevChosen;
    if (currChosen.length > prevChosen.length && this.currentFrame.frame_type === 'pick') {
      const newDigit = currChosen[currChosen.length - 1];
      this.pickEffect = {
        active: true,
        digit: newDigit,
        index: this.currentFrame.cursor ?? 0,
        slot: currChosen.length - 1,
        progress: 0,
        bankIndex: this.currentFrame.bank_index,
      };
    }

    if (this.currentFrame.frame_type === 'bank_complete') {
      this.escalatorPulse = 1;
      this.bankCompleteArrow = {
        active: true,
        progress: 0,
        bankValue: this.currentFrame.bank_value ?? 0,
      };
    }

    if (this.currentFrameIndex === this.frames.length - 1) {
      this.playing = false;
      this.stopRecording();
    }
  }

  private downsampleFrames(frames: Frame[]): Frame[] {
    if (frames.length <= MAX_FRAMES) return frames;
    const skipFrames = frames.filter((f) => f.frame_type === 'skip').length;
    const essential = frames.length - skipFrames;
    const allowedSkip = Math.max(0, MAX_FRAMES - essential);
    if (allowedSkip <= 0) {
      return frames.slice(0, MAX_FRAMES);
    }
    const skipStride = Math.max(1, Math.floor(skipFrames / allowedSkip));
    let skipSeen = 0;
    const result: Frame[] = [];
    for (const frame of frames) {
      if (frame.frame_type !== 'skip') {
        result.push(frame);
        continue;
      }
      if (skipSeen % skipStride === 0 && result.length < MAX_FRAMES) {
        result.push(frame);
      }
      skipSeen++;
      if (result.length >= MAX_FRAMES) break;
    }
    if (result.length === 0) {
      result.push(frames[frames.length - 1]);
    } else if (result[result.length - 1] !== frames[frames.length - 1]) {
      result[result.length - 1] = frames[frames.length - 1];
    }
    return result;
  }

  private composeState(): RenderState | null {
    if (!this.currentFrame) return null;
    const prev = this.previousFrame ?? this.currentFrame;
    const curr = this.currentFrame;
    const effectiveDuration = BASE_FRAME_DURATION / this.playbackSpeed;
    const t = clamp01(this.frameElapsed / effectiveDuration);
    const sameBank = prev.bank_index === curr.bank_index && prev.bank_digits === curr.bank_digits;

    const bankDigits = curr.bank_digits ?? prev.bank_digits ?? '';
    const windowStart = sameBank
      ? lerp(prev.window_start, curr.window_start, t)
      : curr.window_start ?? prev.window_start ?? 0;
    const windowEnd = sameBank ? lerp(prev.window_end, curr.window_end, t) : curr.window_end ?? prev.window_end ?? 0;
    const cursor = sameBank ? lerp(prev.cursor, curr.cursor, t) : curr.cursor ?? prev.cursor ?? 0;
    const chosen = t < 0.5 ? prev.chosen_so_far : curr.chosen_so_far;
    const locked = curr.locked_indices ?? prev.locked_indices ?? [];
    const banksCompleted =
      curr.banks_completed ??
      (curr.frame_type === 'bank_complete' || curr.frame_type === 'final' ? curr.bank_index + 1 : curr.bank_index);
    const len = Math.max(1, bankDigits.length);
    const clampedStart = clamp(windowStart, 0, len);
    const clampedEnd = clamp(windowEnd, clampedStart, len);

    return {
      bankDigits,
      bankIndex: curr.bank_index,
      cursor,
      windowStart: clampedStart,
      windowEnd: clampedEnd,
      remainingPicks: curr.remaining_picks ?? prev.remaining_picks ?? 0,
      chosen: chosen ?? '',
      locked,
      runningTotal: curr.running_total,
      bankValue: curr.bank_value,
      frameType: curr.frame_type,
      banksCompleted,
    };
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.drawBackground();

    if (!this.currentFrame) {
      this.drawEmptyState();
      return;
    }

    const state = this.composeState();
    if (!state) {
      this.drawEmptyState();
      return;
    }

    this.drawHeader(state);
    this.drawEscalator(state);
    const layout = this.getBankLayout(state.bankDigits.length);
    this.drawPowerRail(state);
    this.drawBankCompleteArrow();
    this.drawBankRow(state, layout);
    this.drawPickAnimation(state, layout);
    this.drawFooter(state);
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    grad.addColorStop(0, theme.backgroundAccent);
    grad.addColorStop(1, theme.background);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // subtle columns
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let i = 0; i < 6; i++) {
      const x = (CANVAS_WIDTH / 5) * i;
      ctx.fillRect(x, 0, 2, CANVAS_HEIGHT);
    }
  }

  private drawEmptyState(): void {
    const ctx = this.ctx;
    ctx.fillStyle = theme.textSecondary;
    ctx.font = '18px "Trebuchet MS", "Futura", "Gill Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Load a JSON log to begin the lobby visualization.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }

  private drawHeader(state: RenderState): void {
    const ctx = this.ctx;
    ctx.fillStyle = theme.textPrimary;
    ctx.font = '28px "Trebuchet MS", "Futura", "Gill Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Day 03 — Lobby Battery Banks', 36, 54);

    ctx.font = '16px "Trebuchet MS", "Futura", "Gill Sans", sans-serif';
    ctx.fillStyle = theme.textSecondary;
    ctx.fillText(`Bank ${state.bankIndex + 1} of ${this.totalBanks}`, 36, 80);

    ctx.textAlign = 'right';
    ctx.fillStyle = theme.textSecondary;
    ctx.fillText('Total joltage', CANVAS_WIDTH - 36, 54);
    ctx.font = '26px "Trebuchet MS", "Futura", "Gill Sans", sans-serif';
    ctx.fillStyle = theme.brass;
    ctx.fillText(state.runningTotal.toLocaleString(), CANVAS_WIDTH - 36, 82);
  }

  private drawEscalator(state: RenderState): void {
    const ctx = this.ctx;
    const x = CANVAS_WIDTH - 100;
    const y = 110;
    const w = 70;
    const h = 360;
    roundRectPath(ctx, x, y, w, h, 14);
    ctx.fillStyle = theme.escalator;
    ctx.fill();
    ctx.strokeStyle = theme.railEdge;
    ctx.lineWidth = 3;
    ctx.stroke();

    const progress = clamp01(state.banksCompleted / Math.max(1, this.totalBanks));
    const litHeight = h * progress;
    const pulse = this.escalatorPulse;
    const grad = ctx.createLinearGradient(0, y + h - litHeight, 0, y + h);
    grad.addColorStop(0, `${theme.escalatorLit}${'cc'}`);
    grad.addColorStop(1, theme.escalatorLit);
    ctx.fillStyle = grad;
    ctx.save();
    ctx.globalAlpha = 0.7 + pulse * 0.3;
    roundRectPath(ctx, x + 8, y + h - litHeight - 6, w - 16, litHeight + 4, 10);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = theme.textSecondary;
    ctx.font = '14px "Trebuchet MS", "Futura", "Gill Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Escalator charge', x + w / 2, y - 10);
  }

  private getBankLayout(length: number): { startX: number; y: number; cellWidth: number; cellHeight: number } {
    const maxWidth = CANVAS_WIDTH - 140; // Leave room for escalator on the right
    const cellWidth = Math.max(10, Math.min(34, maxWidth / Math.max(1, length)));
    const totalRowWidth = cellWidth * length;
    const startX = (CANVAS_WIDTH - 120 - totalRowWidth) / 2 + 10; // Center in available space, leaving 120px for escalator
    const y = CANVAS_HEIGHT - 180;
    return { startX, y, cellWidth, cellHeight: 40 };
  }

  private drawBankRow(state: RenderState, layout: { startX: number; y: number; cellWidth: number; cellHeight: number }): void {
    const ctx = this.ctx;
    const digits = state.bankDigits.split('');
    const { startX, y, cellWidth, cellHeight } = layout;

    // window overlay
    const windowWidth = (state.windowEnd - state.windowStart + 1) * cellWidth;
    const windowX = startX + state.windowStart * cellWidth;
    ctx.save();
    ctx.fillStyle = theme.windowFill;
    ctx.strokeStyle = theme.windowEdge;
    ctx.lineWidth = 2;
    roundRectPath(ctx, windowX, y - 12, windowWidth, cellHeight + 24, 12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    digits.forEach((d, idx) => {
      const x = startX + idx * cellWidth;
      const base = state.locked.includes(idx)
        ? theme.pickedCell
        : idx >= state.windowStart && idx <= state.windowEnd
        ? theme.cell
        : `${theme.cellEdge}55`;
      ctx.save();
      roundRectPath(ctx, x + 2, y, cellWidth - 4, cellHeight, 10);
      ctx.fillStyle = base;
      ctx.fill();
      ctx.strokeStyle = theme.cellEdge;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      const isCursor = Math.round(state.cursor) === idx;
      if (isCursor) {
        ctx.fillStyle = theme.coral;
        ctx.beginPath();
        ctx.moveTo(x + cellWidth / 2, y - 20);
        ctx.lineTo(x + cellWidth / 2 + 8, y - 8);
        ctx.lineTo(x + cellWidth / 2 - 8, y - 8);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = state.locked.includes(idx) ? '#1a1a1a' : theme.textPrimary;
      ctx.font = `${Math.max(14, Math.min(20, cellWidth - 6))}px "Trebuchet MS", "Futura", "Gill Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d, x + cellWidth / 2, y + cellHeight / 2 + 1);
    });
  }

  private drawPowerRail(state: RenderState): void {
    const ctx = this.ctx;
    const slotWidth = 50;
    const gap = 10;
    const totalWidth = this.digitsToPick * slotWidth + (this.digitsToPick - 1) * gap;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;
    const y = 210;

    ctx.fillStyle = theme.rail;
    roundRectPath(ctx, startX - 24, y - 34, totalWidth + 48, 100, 18);
    ctx.fill();
    ctx.strokeStyle = theme.railEdge;
    ctx.lineWidth = 3;
    ctx.stroke();

    for (let i = 0; i < this.digitsToPick; i++) {
      const x = startX + i * (slotWidth + gap);
      const filled = i < state.chosen.length;
      ctx.save();
      roundRectPath(ctx, x, y, slotWidth, 52, 12);
      ctx.fillStyle = filled ? theme.slotFill : theme.railSlot;
      ctx.globalAlpha = filled ? 0.95 : 0.7;
      ctx.fill();
      ctx.strokeStyle = filled ? theme.brass : theme.railEdge;
      ctx.lineWidth = filled ? 3 : 2;
      ctx.stroke();
      ctx.restore();

      if (filled) {
        ctx.fillStyle = theme.coral;
        ctx.font = '26px "Trebuchet MS", "Futura", "Gill Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.chosen[i], x + slotWidth / 2, y + 26);
      }
    }

    ctx.fillStyle = theme.textSecondary;
    ctx.font = '14px "Trebuchet MS", "Futura", "Gill Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Power rail — selected batteries', CANVAS_WIDTH / 2, y - 16);
  }

  private drawBankCompleteArrow(): void {
    if (!this.bankCompleteArrow || !this.bankCompleteArrow.active) return;

    const ctx = this.ctx;
    const t = clamp01(this.bankCompleteArrow.progress);

    // Arrow starts from power rail and moves toward escalator
    const railCenterX = CANVAS_WIDTH / 2;
    const railY = 260; // Below the power rail
    const escalatorX = CANVAS_WIDTH - 65; // Center of escalator
    const escalatorY = 300;

    // Curved path using quadratic bezier
    const controlX = (railCenterX + escalatorX) / 2 + 50;
    const controlY = railY - 40;

    // Calculate position along bezier curve
    const cx = (1 - t) * (1 - t) * railCenterX + 2 * (1 - t) * t * controlX + t * t * escalatorX;
    const cy = (1 - t) * (1 - t) * railY + 2 * (1 - t) * t * controlY + t * t * escalatorY;

    // Fade out near the end
    const alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Draw glowing arrow
    ctx.fillStyle = theme.escalatorLit;
    ctx.shadowColor = theme.escalatorLit;
    ctx.shadowBlur = 16;

    // Arrow head pointing toward escalator
    const arrowSize = 14;
    const angle = Math.atan2(escalatorY - controlY, escalatorX - controlX) * t +
                  Math.atan2(controlY - railY, controlX - railCenterX) * (1 - t);

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * arrowSize, cy + Math.sin(angle) * arrowSize);
    ctx.lineTo(cx + Math.cos(angle + 2.5) * arrowSize, cy + Math.sin(angle + 2.5) * arrowSize);
    ctx.lineTo(cx + Math.cos(angle - 2.5) * arrowSize, cy + Math.sin(angle - 2.5) * arrowSize);
    ctx.closePath();
    ctx.fill();

    // Draw trailing spark particles
    for (let i = 0; i < 3; i++) {
      const trailT = Math.max(0, t - i * 0.08);
      const trailX = (1 - trailT) * (1 - trailT) * railCenterX + 2 * (1 - trailT) * trailT * controlX + trailT * trailT * escalatorX;
      const trailY = (1 - trailT) * (1 - trailT) * railY + 2 * (1 - trailT) * trailT * controlY + trailT * trailT * escalatorY;
      ctx.globalAlpha = alpha * (0.6 - i * 0.15);
      ctx.beginPath();
      ctx.arc(trailX, trailY, 4 - i, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawPickAnimation(state: RenderState, layout: { startX: number; y: number; cellWidth: number; cellHeight: number }): void {
    if (!this.pickEffect || !this.pickEffect.active) return;
    if (this.pickEffect.bankIndex !== state.bankIndex) return;
    const ctx = this.ctx;
    const { startX, y, cellWidth, cellHeight } = layout;
    const startXPos = startX + this.pickEffect.index * cellWidth + cellWidth / 2;
    const startYPos = y + cellHeight / 2;

    const slotWidth = 50;
    const gap = 10;
    const totalWidth = this.digitsToPick * slotWidth + (this.digitsToPick - 1) * gap;
    const railStartX = (CANVAS_WIDTH - totalWidth) / 2;
    const targetX = railStartX + this.pickEffect.slot * (slotWidth + gap) + slotWidth / 2;
    const targetY = 236; // center of slot

    const t = clamp01(this.pickEffect.progress);
    const cx = lerp(startXPos, targetX, t);
    const cy = lerp(startYPos, targetY, t);

    ctx.save();
    ctx.fillStyle = theme.coral;
    ctx.shadowColor = theme.coral;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0c1218';
    ctx.font = '18px "Trebuchet MS", "Futura", "Gill Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.pickEffect.digit, cx, cy);
    ctx.restore();
  }

  private drawFooter(state: RenderState): void {
    const ctx = this.ctx;
    ctx.fillStyle = theme.textSecondary;
    ctx.font = '15px "Trebuchet MS", "Futura", "Gill Sans", sans-serif';
    ctx.textAlign = 'left';
    const bankValueText =
      state.frameType === 'bank_complete' || state.frameType === 'final'
        ? `Bank output: ${state.bankValue?.toString() ?? ''}`
        : `Remaining picks: ${state.remainingPicks}`;
    ctx.fillText(bankValueText, 36, CANVAS_HEIGHT - 30);

    if (state.frameType === 'final') {
      ctx.textAlign = 'center';
      ctx.font = '28px "Trebuchet MS", "Futura", "Gill Sans", sans-serif';
      ctx.fillStyle = theme.brass;
      ctx.fillText(`Final joltage: ${this.finalTotal.toLocaleString()}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    }
  }
}

// -----------------------------------------------------------------------------
// Bootstrapping UI
// -----------------------------------------------------------------------------

const visualizer = new LobbyVisualizer('canvas');

const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const recordBtn = document.getElementById('recordBtn') as HTMLButtonElement;
const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
const speedSelect = document.getElementById('speedSelect') as HTMLSelectElement;
const descriptionBtn = document.getElementById('descriptionBtn') as HTMLButtonElement;
const descriptionDialog = document.getElementById('descriptionDialog') as HTMLDialogElement;
const closeDialogBtn = document.getElementById('closeDialogBtn') as HTMLButtonElement;
const howItWorksBtn = document.getElementById('howItWorksBtn') as HTMLButtonElement;
const howItWorksDialog = document.getElementById('howItWorksDialog') as HTMLDialogElement;
const closeHowItWorksBtn = document.getElementById('closeHowItWorksBtn') as HTMLButtonElement;

fileInput.addEventListener('change', async (e) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  try {
    await visualizer.loadFromFile(file);
    startBtn.disabled = false;
    recordBtn.disabled = false;
    stopBtn.disabled = false;
  } catch (err) {
    console.error(err);
    alert('Failed to load log. Ensure it matches json_log_spec.md.');
  }
});

startBtn.addEventListener('click', () => visualizer.start());
recordBtn.addEventListener('click', () => visualizer.startRecording());
stopBtn.addEventListener('click', () => visualizer.stop());
speedSelect.addEventListener('change', () => {
  const value = parseFloat(speedSelect.value);
  visualizer.setPlaybackSpeed(value);
});

// Description dialog controls
descriptionBtn.addEventListener('click', () => {
  descriptionDialog.showModal();
});

closeDialogBtn.addEventListener('click', () => {
  descriptionDialog.close();
});

descriptionDialog.addEventListener('click', (e) => {
  if (e.target === descriptionDialog) {
    descriptionDialog.close();
  }
});

// How It Works dialog controls
howItWorksBtn.addEventListener('click', () => {
  howItWorksDialog.showModal();
});

closeHowItWorksBtn.addEventListener('click', () => {
  howItWorksDialog.close();
});

howItWorksDialog.addEventListener('click', (e) => {
  if (e.target === howItWorksDialog) {
    howItWorksDialog.close();
  }
});
