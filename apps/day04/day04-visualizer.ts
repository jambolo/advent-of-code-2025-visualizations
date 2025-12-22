/**
 * Day 04 - Printing Department Visualizer
 *
 * Renders the iterative erosion of paper rolls on a warehouse grid.
 * Shows each pass removing accessible rolls (those with < 4 neighbors)
 * until no more can be removed. Supports WebM recording.
 *
 * Resolution: 720p (1280x720). The grid is 140x135, requiring compact cells.
 */

export {};

type FrameType = 'initial' | 'pass_complete' | 'final';

interface Position {
  x: number;
  y: number;
}

interface Frame {
  frame_type: FrameType;
  pass_number: number;
  grid: string[];
  removed_this_pass: Position[];
  removed_count: number;
  total_removed: number;
}

interface LogData {
  day: number;
  part: number;
  width: number;
  height: number;
  initial_rolls: number;
  final_removed: number;
  frames: Frame[];
}

interface Theme {
  background: string;
  backgroundAccent: string;
  paperRoll: string;
  paperShadow: string;
  removedRoll: string;
  accessibleGlow: string;
  scanHighlight: string;
  gridLine: string;
  textPrimary: string;
  textSecondary: string;
  forkliftAccent: string;
  progressBar: string;
  progressBg: string;
}

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const REMOVAL_ANIM_DURATION = 600; // ms for removal fade animation
const DEFAULT_SPEED = 2;

const theme: Theme = {
  background: '#1a1410',
  backgroundAccent: '#2a2218',
  paperRoll: '#f5e6d3',
  paperShadow: '#c4b5a3',
  removedRoll: '#8b7355',
  accessibleGlow: '#ff9f43',
  scanHighlight: '#ffd93d',
  gridLine: '#3d3225',
  textPrimary: '#f5e6d3',
  textSecondary: '#9a8b7a',
  forkliftAccent: '#e74c3c',
  progressBar: '#27ae60',
  progressBg: '#1e2d23',
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutQuad(t: number): number {
  return t * (2 - t);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

class WarehouseVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private frames: Frame[] = [];
  private currentFrameIndex = 0;
  private lastTimestamp = 0;
  private frameElapsed = 0;
  private playing = false;
  private playbackSpeed = DEFAULT_SPEED;
  private width = 0;
  private height = 0;
  private initialRolls = 0;
  private finalRemoved = 0;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recording = false;

  // Grid rendering state
  private cellSize = 4;
  private gridOffsetX = 0;
  private gridOffsetY = 0;

  // Animation state for current pass
  private isRemoving = false;
  private removalElapsed = 0;
  private removalProgress = 0;
  private removingPositions: Position[] = [];
  private previousGrid: string[] = []; // Grid before removal for fade effect

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
    this.width = data.width;
    this.height = data.height;
    this.initialRolls = data.initial_rolls;
    this.finalRemoved = data.final_removed;
    this.frames = data.frames ?? [];
    if (this.frames.length === 0) {
      throw new Error('Log contains no frames.');
    }
    this.calculateGridLayout();
    this.currentFrameIndex = 0;
    this.frameElapsed = 0;
    this.playing = false;
    this.isRemoving = false;
    this.removalElapsed = 0;
    this.removalProgress = 0;
    this.removingPositions = [];
    this.previousGrid = [];
  }

  private calculateGridLayout(): void {
    const headerHeight = 80;
    const footerHeight = 60;
    const padding = 20;
    const availableWidth = CANVAS_WIDTH - padding * 2;
    const availableHeight = CANVAS_HEIGHT - headerHeight - footerHeight - padding * 2;

    const cellW = Math.floor(availableWidth / this.width);
    const cellH = Math.floor(availableHeight / this.height);
    this.cellSize = Math.max(2, Math.min(cellW, cellH, 8));

    const gridWidth = this.width * this.cellSize;
    const gridHeight = this.height * this.cellSize;
    this.gridOffsetX = (CANVAS_WIDTH - gridWidth) / 2;
    this.gridOffsetY = headerHeight + (availableHeight - gridHeight) / 2 + padding;
  }

  start(): void {
    if (this.frames.length === 0) return;
    this.currentFrameIndex = 0;
    this.frameElapsed = 0;
    this.playing = true;
    this.startFrameAnimation();
  }

  // Initialize animation state for current frame
  private startFrameAnimation(): void {
    const frame = this.frames[this.currentFrameIndex];
    this.removingPositions = frame.removed_this_pass ?? [];
    this.removalElapsed = 0;

    // If there are removals, animate them fading out
    if (this.removingPositions.length > 0 && frame.frame_type !== 'initial') {
      this.isRemoving = true;
      this.removalProgress = 0;
      // Store the grid with rolls still present (before removal)
      this.previousGrid = this.buildPreRemovalGrid(frame);
    } else {
      this.isRemoving = false;
      this.removalProgress = 1;
      this.previousGrid = [];
    }
  }

  // Reconstruct grid state before removals (add back the removed rolls)
  private buildPreRemovalGrid(frame: Frame): string[] {
    const grid = frame.grid.map((row) => row.split(''));
    for (const pos of frame.removed_this_pass ?? []) {
      if (pos.y < grid.length && pos.x < grid[pos.y].length) {
        grid[pos.y][pos.x] = '@';
      }
    }
    return grid.map((row) => row.join(''));
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
    a.download = 'day04-printing-department.webm';
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
    const removalDuration = REMOVAL_ANIM_DURATION / this.playbackSpeed;

    this.frameElapsed += delta;
    this.removalElapsed += delta;

    if (this.isRemoving) {
      // Update removal fade progress
      this.removalProgress = clamp01(this.removalElapsed / removalDuration);

      // When removal animation completes, advance to next frame immediately
      if (this.removalElapsed >= removalDuration) {
        this.isRemoving = false;
        this.removalProgress = 1;
        this.previousGrid = [];

        // Advance to next frame
        if (this.currentFrameIndex < this.frames.length - 1) {
          this.currentFrameIndex++;
          this.frameElapsed = 0;
          this.startFrameAnimation();
        }
      }
    } else {
      // No removal animation, advance immediately
      if (this.currentFrameIndex < this.frames.length - 1) {
        this.currentFrameIndex++;
        this.frameElapsed = 0;
        this.startFrameAnimation();
      }
    }

    // Check for end of animation
    if (this.currentFrameIndex >= this.frames.length - 1 && !this.isRemoving) {
      this.playing = false;
      this.stopRecording();
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
    this.drawHeader(frame);
    this.drawGrid(frame);
    this.drawFooter(frame);
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    // Base gradient
    const grad = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH
    );
    grad.addColorStop(0, theme.backgroundAccent);
    grad.addColorStop(1, theme.background);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle floor texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
      ctx.fillRect(0, i, CANVAS_WIDTH, 1);
    }
  }

  private drawEmptyState(): void {
    const ctx = this.ctx;
    ctx.fillStyle = theme.textSecondary;
    ctx.font = '18px "Trebuchet MS", "Futura", "Gill Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Load a JSON log to visualize the paper roll removal.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }

  private drawHeader(frame: Frame): void {
    const ctx = this.ctx;

    // Title
    ctx.fillStyle = theme.textPrimary;
    ctx.font = 'bold 26px "Trebuchet MS", "Futura", "Gill Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Day 04 — Printing Department', 30, 40);

    // Pass counter
    ctx.font = '16px "Trebuchet MS", "Futura", "Gill Sans", sans-serif';
    ctx.fillStyle = theme.textSecondary;
    const passText = frame.frame_type === 'initial'
      ? 'Initial State'
      : frame.frame_type === 'final'
        ? `Final — Pass ${frame.pass_number}`
        : `Pass ${frame.pass_number}`;
    ctx.fillText(passText, 30, 65);

    // Right side stats
    ctx.textAlign = 'right';
    ctx.fillStyle = theme.textSecondary;
    ctx.fillText('Rolls Removed', CANVAS_WIDTH - 30, 35);
    ctx.font = 'bold 28px "Trebuchet MS", "Futura", "Gill Sans", sans-serif';
    ctx.fillStyle = theme.accessibleGlow;
    ctx.fillText(frame.total_removed.toLocaleString(), CANVAS_WIDTH - 30, 65);
  }

  private drawGrid(frame: Frame): void {
    const ctx = this.ctx;
    const removedSet = new Set(
      (frame.removed_this_pass ?? []).map((p) => `${p.x},${p.y}`)
    );

    // During removal animation, use previousGrid to show rolls before they fade
    // Otherwise, use frame.grid (rolls already removed)
    const displayGrid = this.isRemoving && this.previousGrid.length > 0
      ? this.previousGrid
      : frame.grid;

    // Draw cells
    for (let y = 0; y < displayGrid.length; y++) {
      const row = displayGrid[y];
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        const px = this.gridOffsetX + x * this.cellSize;
        const py = this.gridOffsetY + y * this.cellSize;
        const key = `${x},${y}`;

        if (char === '@') {
          // Check if this roll is being removed in animation
          if (this.isRemoving && removedSet.has(key)) {
            this.drawRemovingRoll(px, py);
          } else {
            this.drawPaperRoll(px, py);
          }
        } else if (char === '.' && this.cellSize >= 3) {
          // Empty floor - just show grid line hint
          ctx.fillStyle = theme.gridLine;
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }

    // Grid border
    const gridWidth = this.width * this.cellSize;
    const gridHeight = this.height * this.cellSize;
    ctx.strokeStyle = theme.gridLine;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.gridOffsetX - 2, this.gridOffsetY - 2, gridWidth + 4, gridHeight + 4);
  }

  private drawPaperRoll(x: number, y: number): void {
    const ctx = this.ctx;
    const size = this.cellSize;

    if (size <= 3) {
      // Simple rectangle for small cells
      ctx.fillStyle = theme.paperRoll;
      ctx.fillRect(x, y, size - 1, size - 1);
    } else {
      // Circular roll for larger cells
      const cx = x + size / 2;
      const cy = y + size / 2;
      const r = (size - 2) / 2;

      // Shadow
      ctx.fillStyle = theme.paperShadow;
      ctx.beginPath();
      ctx.arc(cx + 1, cy + 1, r, 0, Math.PI * 2);
      ctx.fill();

      // Paper roll
      ctx.fillStyle = theme.paperRoll;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawRemovingRoll(x: number, y: number): void {
    const ctx = this.ctx;
    const size = this.cellSize;
    const t = easeOutQuad(this.removalProgress);

    // Fade out and lift up
    const alpha = 1 - t;
    const lift = t * 8;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (size <= 3) {
      // Glow effect
      ctx.fillStyle = theme.accessibleGlow;
      ctx.fillRect(x - 1, y - 1 - lift, size + 1, size + 1);
      // Roll
      ctx.fillStyle = theme.paperRoll;
      ctx.fillRect(x, y - lift, size - 1, size - 1);
    } else {
      const cx = x + size / 2;
      const cy = y + size / 2 - lift;
      const r = (size - 2) / 2;

      // Glow
      ctx.shadowColor = theme.accessibleGlow;
      ctx.shadowBlur = 8;

      ctx.fillStyle = theme.paperRoll;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawFooter(frame: Frame): void {
    const ctx = this.ctx;
    const footerY = CANVAS_HEIGHT - 50;

    // Progress bar background
    const barX = 30;
    const barWidth = CANVAS_WIDTH - 60;
    const barHeight = 16;

    ctx.fillStyle = theme.progressBg;
    ctx.beginPath();
    ctx.roundRect(barX, footerY, barWidth, barHeight, 8);
    ctx.fill();

    // Progress fill
    const progress = clamp01(frame.total_removed / Math.max(1, this.finalRemoved));
    const fillWidth = barWidth * progress;

    if (fillWidth > 0) {
      const grad = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
      grad.addColorStop(0, theme.progressBar);
      grad.addColorStop(1, '#2ecc71');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(barX, footerY, fillWidth, barHeight, 8);
      ctx.fill();
    }

    // Progress text
    ctx.fillStyle = theme.textPrimary;
    ctx.font = '14px "Trebuchet MS", "Futura", "Gill Sans", sans-serif';
    ctx.textAlign = 'center';
    const percent = Math.round(progress * 100);
    ctx.fillText(`${percent}% — ${frame.total_removed.toLocaleString()} / ${this.finalRemoved.toLocaleString()} rolls removed`,
      CANVAS_WIDTH / 2, footerY + barHeight + 20);

    // This pass info
    if (frame.frame_type !== 'initial' && frame.removed_count > 0) {
      ctx.textAlign = 'left';
      ctx.fillStyle = theme.textSecondary;
      ctx.fillText(`This pass: ${frame.removed_count} removed`, 30, footerY - 10);
    }

    // Final message
    if (frame.frame_type === 'final') {
      ctx.textAlign = 'center';
      ctx.font = 'bold 18px "Trebuchet MS", "Futura", "Gill Sans", sans-serif';
      ctx.fillStyle = theme.accessibleGlow;
      ctx.fillText(`Complete! Total removed: ${this.finalRemoved.toLocaleString()}`, CANVAS_WIDTH / 2, footerY - 10);
    }
  }
}

// -----------------------------------------------------------------------------
// Bootstrapping UI
// -----------------------------------------------------------------------------

const visualizer = new WarehouseVisualizer('canvas');

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
