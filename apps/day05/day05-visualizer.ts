/**
 * Day 05 - Cafeteria Visualizer
 *
 * Renders the range-merging algorithm that calculates total fresh ingredient IDs.
 * Shows sorting, then step-by-step merging of overlapping ranges.
 * Supports WebM recording.
 *
 * Resolution: 720p (1280x720)
 */

export {};

type FrameType = 'initial' | 'sorted' | 'merge_step' | 'final';
type MergeAction = 'new' | 'merged';

interface Range {
  start: string;
  end: string;
  original_index: number;
}

interface Frame {
  frame_type: FrameType;
  step_index: number;
  ranges: Range[];
  current_index?: number;
  action?: MergeAction;
  merged_ranges: Range[];
  running_total: string;
}

interface LogData {
  day: number;
  part: number;
  range_count: number;
  global_min: string;
  global_max: string;
  total_fresh: string;
  merged_count: number;
  frames: Frame[];
}

interface Theme {
  background: string;
  backgroundAccent: string;
  freshRange: string;
  freshRangeAlt: string;
  mergedRange: string;
  overlapHighlight: string;
  currentHighlight: string;
  numberLine: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  progressBar: string;
  progressBg: string;
  newAction: string;
  mergeAction: string;
}

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const FRAME_DURATION = 400;
const DEFAULT_SPEED = 2;

const theme: Theme = {
  background: '#1a2420',
  backgroundAccent: '#243028',
  freshRange: '#4ade80',
  freshRangeAlt: '#22c55e',
  mergedRange: '#86efac',
  overlapHighlight: '#fbbf24',
  currentHighlight: '#f97316',
  numberLine: '#475569',
  textPrimary: '#f0fdf4',
  textSecondary: '#86efac',
  accent: '#4ade80',
  progressBar: '#22c55e',
  progressBg: '#1e3a2f',
  newAction: '#60a5fa',
  mergeAction: '#f97316',
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function formatLargeNumber(numStr: string): string {
  const num = BigInt(numStr);
  if (num >= 1_000_000_000_000n) {
    const trillions = Number(num / 1_000_000_000n) / 1000;
    return trillions.toFixed(2) + 'T';
  }
  if (num >= 1_000_000_000n) {
    const billions = Number(num / 1_000_000n) / 1000;
    return billions.toFixed(2) + 'B';
  }
  if (num >= 1_000_000n) {
    const millions = Number(num / 1_000n) / 1000;
    return millions.toFixed(2) + 'M';
  }
  return num.toLocaleString();
}

function formatFullNumber(numStr: string): string {
  return BigInt(numStr).toLocaleString();
}

class CafeteriaVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private frames: Frame[] = [];
  private currentFrameIndex = 0;
  private lastTimestamp = 0;
  private frameElapsed = 0;
  private playing = false;
  private playbackSpeed = DEFAULT_SPEED;
  private globalMin = 0n;
  private globalMax = 1n;
  private totalFresh = '0';
  private rangeCount = 0;
  private mergedCount = 0;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recording = false;

  // Layout constants
  private readonly HEADER_HEIGHT = 90;
  private readonly FOOTER_HEIGHT = 80;
  private readonly RANGE_AREA_TOP = 120;
  private readonly RANGE_AREA_HEIGHT = 450;
  private readonly MERGED_AREA_TOP = 580;
  private readonly NUMBER_LINE_Y = 560;
  private readonly PADDING = 40;

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
    this.globalMin = BigInt(data.global_min);
    this.globalMax = BigInt(data.global_max);
    this.totalFresh = data.total_fresh;
    this.rangeCount = data.range_count;
    this.mergedCount = data.merged_count;
    this.frames = data.frames ?? [];
    if (this.frames.length === 0) {
      throw new Error('Log contains no frames.');
    }
    this.currentFrameIndex = 0;
    this.frameElapsed = 0;
    this.playing = false;
  }

  private normalize(value: string): number {
    const v = BigInt(value);
    const range = this.globalMax - this.globalMin;
    if (range === 0n) return 0.5;
    return Number((v - this.globalMin) * 10000n / range) / 10000;
  }

  start(): void {
    if (this.frames.length === 0) return;
    this.currentFrameIndex = 0;
    this.frameElapsed = 0;
    this.playing = true;
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
    a.download = 'day05-cafeteria.webm';
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
    const frameDuration = FRAME_DURATION / this.playbackSpeed;
    this.frameElapsed += delta;

    if (this.frameElapsed >= frameDuration) {
      this.frameElapsed = 0;
      if (this.currentFrameIndex < this.frames.length - 1) {
        this.currentFrameIndex++;
      } else {
        this.playing = false;
        this.stopRecording();
      }
    }
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.drawBackground();

    if (this.frames.length === 0) {
      this.drawEmptyState();
      return;
    }

    const frame = this.frames[this.currentFrameIndex];
    const progress = clamp01(this.frameElapsed / (FRAME_DURATION / this.playbackSpeed));

    this.drawHeader(frame);
    this.drawNumberLine();
    this.drawRanges(frame, progress);
    this.drawMergedRanges(frame, progress);
    this.drawFooter(frame);
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    const grad = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH
    );
    grad.addColorStop(0, theme.backgroundAccent);
    grad.addColorStop(1, theme.background);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
  }

  private drawEmptyState(): void {
    const ctx = this.ctx;
    ctx.fillStyle = theme.textSecondary;
    ctx.font = '18px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Load a JSON log to visualize range merging.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }

  private drawHeader(frame: Frame): void {
    const ctx = this.ctx;

    // Title
    ctx.fillStyle = theme.textPrimary;
    ctx.font = 'bold 28px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Day 05 — Cafeteria', 30, 40);

    // Phase indicator
    ctx.font = '16px "Trebuchet MS", sans-serif';
    ctx.fillStyle = theme.textSecondary;
    let phaseText = '';
    switch (frame.frame_type) {
      case 'initial':
        phaseText = 'Initial Ranges (Unsorted)';
        break;
      case 'sorted':
        phaseText = 'Sorted by Start Position';
        break;
      case 'merge_step':
        phaseText = `Merge Step ${frame.step_index} — ${frame.action === 'merged' ? 'Merging Overlap' : 'Adding New Range'}`;
        break;
      case 'final':
        phaseText = 'Final Merged Ranges';
        break;
    }
    ctx.fillText(phaseText, 30, 70);

    // Running total on right
    ctx.textAlign = 'right';
    ctx.fillStyle = theme.textSecondary;
    ctx.font = '14px "Trebuchet MS", sans-serif';
    ctx.fillText('Fresh Ingredient IDs', CANVAS_WIDTH - 30, 30);
    ctx.font = 'bold 32px "Trebuchet MS", sans-serif';
    ctx.fillStyle = theme.accent;
    ctx.fillText(formatFullNumber(frame.running_total), CANVAS_WIDTH - 30, 65);
  }

  private drawNumberLine(): void {
    const ctx = this.ctx;
    const lineY = this.NUMBER_LINE_Y;
    const startX = this.PADDING + 20;
    const endX = CANVAS_WIDTH - this.PADDING - 20;

    // Main line
    ctx.strokeStyle = theme.numberLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, lineY);
    ctx.lineTo(endX, lineY);
    ctx.stroke();

    // End markers
    ctx.fillStyle = theme.numberLine;
    ctx.beginPath();
    ctx.moveTo(startX, lineY - 8);
    ctx.lineTo(startX, lineY + 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(endX, lineY - 8);
    ctx.lineTo(endX, lineY + 8);
    ctx.stroke();

    // Labels
    ctx.font = '11px monospace';
    ctx.fillStyle = theme.textSecondary;
    ctx.textAlign = 'center';
    ctx.fillText(formatLargeNumber(this.globalMin.toString()), startX, lineY + 22);
    ctx.fillText(formatLargeNumber(this.globalMax.toString()), endX, lineY + 22);
  }

  private drawRanges(frame: Frame, progress: number): void {
    const ctx = this.ctx;
    const ranges = frame.ranges;
    const startX = this.PADDING + 20;
    const lineWidth = CANVAS_WIDTH - 2 * this.PADDING - 40;

    // Calculate row height based on range count
    const maxRows = 25;
    const rowHeight = Math.min(18, this.RANGE_AREA_HEIGHT / maxRows);
    const barHeight = rowHeight - 3;

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const normStart = this.normalize(range.start);
      const normEnd = this.normalize(range.end);

      const x1 = startX + normStart * lineWidth;
      const x2 = startX + normEnd * lineWidth;
      const width = Math.max(2, x2 - x1);

      // Position in rows (wrap around)
      const row = i % maxRows;
      const y = this.RANGE_AREA_TOP + row * rowHeight;

      // Determine color
      let color = i % 2 === 0 ? theme.freshRange : theme.freshRangeAlt;
      let alpha = 0.7;

      // Highlight current range being processed
      if (frame.frame_type === 'merge_step' && frame.current_index === i) {
        color = frame.action === 'merged' ? theme.mergeAction : theme.newAction;
        alpha = 1;

        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x1, y, width, barHeight, 3);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  private drawMergedRanges(frame: Frame, progress: number): void {
    const ctx = this.ctx;
    const merged = frame.merged_ranges;
    if (merged.length === 0) return;

    const startX = this.PADDING + 20;
    const lineWidth = CANVAS_WIDTH - 2 * this.PADDING - 40;
    const y = this.MERGED_AREA_TOP;
    const barHeight = 20;

    // Label
    ctx.font = '12px "Trebuchet MS", sans-serif';
    ctx.fillStyle = theme.textSecondary;
    ctx.textAlign = 'left';
    ctx.fillText(`Merged Ranges: ${merged.length}`, 30, y - 8);

    for (let i = 0; i < merged.length; i++) {
      const range = merged[i];
      const normStart = this.normalize(range.start);
      const normEnd = this.normalize(range.end);

      const x1 = startX + normStart * lineWidth;
      const x2 = startX + normEnd * lineWidth;
      const width = Math.max(3, x2 - x1);

      // Highlight the most recently affected merged range
      const isLatest = i === merged.length - 1 &&
                       (frame.frame_type === 'merge_step' || frame.frame_type === 'final');

      if (isLatest && frame.frame_type === 'merge_step') {
        ctx.shadowColor = theme.mergedRange;
        ctx.shadowBlur = 10;
      }

      ctx.fillStyle = isLatest ? theme.mergedRange : theme.freshRange;
      ctx.globalAlpha = isLatest ? 1 : 0.8;
      ctx.beginPath();
      ctx.roundRect(x1, y, width, barHeight, 4);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  private drawFooter(frame: Frame): void {
    const ctx = this.ctx;
    const footerY = CANVAS_HEIGHT - 45;

    // Progress bar
    const barX = 30;
    const barWidth = CANVAS_WIDTH - 60;
    const barHeight = 14;

    ctx.fillStyle = theme.progressBg;
    ctx.beginPath();
    ctx.roundRect(barX, footerY, barWidth, barHeight, 7);
    ctx.fill();

    // Progress calculation based on frame type
    let progress = 0;
    if (frame.frame_type === 'initial') {
      progress = 0;
    } else if (frame.frame_type === 'sorted') {
      progress = 0.1;
    } else if (frame.frame_type === 'merge_step') {
      progress = 0.1 + 0.9 * (frame.step_index / this.rangeCount);
    } else {
      progress = 1;
    }

    const fillWidth = barWidth * clamp01(progress);
    if (fillWidth > 0) {
      const grad = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
      grad.addColorStop(0, theme.progressBar);
      grad.addColorStop(1, theme.accent);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(barX, footerY, fillWidth, barHeight, 7);
      ctx.fill();
    }

    // Stats text
    ctx.font = '13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.textPrimary;

    const statsText = frame.frame_type === 'final'
      ? `Complete! ${this.rangeCount} ranges merged into ${this.mergedCount} — Total: ${formatFullNumber(this.totalFresh)} fresh IDs`
      : `Processing ${this.rangeCount} ranges...`;
    ctx.fillText(statsText, CANVAS_WIDTH / 2, footerY + barHeight + 18);

    // Frame counter
    ctx.textAlign = 'right';
    ctx.fillStyle = theme.textSecondary;
    ctx.font = '12px monospace';
    ctx.fillText(`Frame ${this.currentFrameIndex + 1}/${this.frames.length}`, CANVAS_WIDTH - 30, footerY - 8);
  }
}

// -----------------------------------------------------------------------------
// Bootstrapping UI
// -----------------------------------------------------------------------------

const visualizer = new CafeteriaVisualizer('canvas');

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
