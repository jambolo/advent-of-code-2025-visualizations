/**
 * Day 06 - Trash Compactor Visualizer
 *
 * Renders the cephalopod math worksheet processing algorithm.
 * Shows right-to-left column reading and problem solving.
 * Supports WebM recording.
 *
 * Resolution: 720p (1280x720)
 */

export {};

type FrameType = 'initial' | 'problem' | 'final';
type Operator = '+' | '*';

interface Frame {
  frame_type: FrameType;
  problem_index?: number;
  column_start?: number;
  column_end?: number;
  numbers?: string[];
  operator?: Operator;
  result?: string;
  running_total: string;
}

interface LogData {
  day: number;
  part: number;
  grid: string[];
  rows: number;
  cols: number;
  problem_count: number;
  grand_total: string;
  frames: Frame[];
}

interface Theme {
  background: string;
  backgroundAccent: string;
  worksheetBg: string;
  gridLine: string;
  digitActive: string;
  digitInactive: string;
  operatorPlus: string;
  operatorMult: string;
  resultHighlight: string;
  numberAssembly: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  progressBar: string;
  progressBg: string;
  scanDirection: string;
}

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const FRAME_DURATION = 600;
const DEFAULT_SPEED = 2;

const theme: Theme = {
  background: '#0d1520',
  backgroundAccent: '#142233',
  worksheetBg: '#1a2a3d',
  gridLine: '#2d4a6a',
  digitActive: '#06d6a0',
  digitInactive: '#3d6b8c',
  operatorPlus: '#ffd166',
  operatorMult: '#ef476f',
  resultHighlight: '#118ab2',
  numberAssembly: '#73d2de',
  textPrimary: '#e8f4f8',
  textSecondary: '#73a9c2',
  accent: '#06d6a0',
  progressBar: '#118ab2',
  progressBg: '#1a2a3d',
  scanDirection: '#ffd166',
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function formatNumber(numStr: string): string {
  return BigInt(numStr).toLocaleString();
}

class TrashCompactorVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private frames: Frame[] = [];
  private currentFrameIndex = 0;
  private lastTimestamp = 0;
  private frameElapsed = 0;
  private playing = false;
  private playbackSpeed = DEFAULT_SPEED;
  private grid: string[] = [];
  private rows = 0;
  private cols = 0;
  private problemCount = 0;
  private grandTotal = '0';
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recording = false;

  // Layout constants
  private readonly HEADER_HEIGHT = 80;
  private readonly FOOTER_HEIGHT = 90;
  private readonly PADDING = 30;
  private readonly CALC_PANEL_WIDTH = 320;
  private readonly MIN_CELL_WIDTH = 18; // Minimum width for legible digits
  private readonly TARGET_CELL_HEIGHT = 40;

  // Viewport state for scrolling
  private viewportStart = 0; // First visible column
  private viewportCols = 0; // Number of visible columns

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
    this.grid = data.grid ?? [];
    this.rows = data.rows;
    this.cols = data.cols;
    this.problemCount = data.problem_count;
    this.grandTotal = data.grand_total;
    this.frames = data.frames ?? [];
    if (this.frames.length === 0) {
      throw new Error('Log contains no frames.');
    }
    this.currentFrameIndex = 0;
    this.frameElapsed = 0;
    this.playing = false;
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
    a.download = 'day06-trash-compactor.webm';
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
    this.drawWorksheet(frame, progress);
    this.drawCalculationPanel(frame, progress);
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

    // Underwater particle effect
    ctx.fillStyle = 'rgba(6, 214, 160, 0.03)';
    const time = Date.now() / 1000;
    for (let i = 0; i < 30; i++) {
      const x = ((i * 97 + time * 20) % CANVAS_WIDTH);
      const y = ((i * 73 + Math.sin(time + i) * 20) % CANVAS_HEIGHT);
      const size = 2 + Math.sin(time * 2 + i) * 1;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawEmptyState(): void {
    const ctx = this.ctx;
    ctx.fillStyle = theme.textSecondary;
    ctx.font = '18px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Load a JSON log to visualize cephalopod math.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }

  private drawHeader(frame: Frame): void {
    const ctx = this.ctx;

    // Title
    ctx.fillStyle = theme.textPrimary;
    ctx.font = 'bold 28px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Day 06 — Trash Compactor', 30, 40);

    // Phase indicator
    ctx.font = '16px "Trebuchet MS", sans-serif';
    ctx.fillStyle = theme.textSecondary;
    let phaseText = '';
    switch (frame.frame_type) {
      case 'initial':
        phaseText = 'Cephalopod Math Worksheet';
        break;
      case 'problem':
        phaseText = `Problem ${(frame.problem_index ?? 0) + 1} of ${this.problemCount} (reading right-to-left)`;
        break;
      case 'final':
        phaseText = 'All Problems Complete!';
        break;
    }
    ctx.fillText(phaseText, 30, 65);

    // Running total on right
    ctx.textAlign = 'right';
    ctx.fillStyle = theme.textSecondary;
    ctx.font = '14px "Trebuchet MS", sans-serif';
    ctx.fillText('Grand Total', CANVAS_WIDTH - 30, 30);
    ctx.font = 'bold 28px "Trebuchet MS", sans-serif';
    ctx.fillStyle = theme.accent;
    ctx.fillText(formatNumber(frame.running_total), CANVAS_WIDTH - 30, 60);
  }

  private drawWorksheet(frame: Frame, progress: number): void {
    const ctx = this.ctx;

    const worksheetX = this.PADDING;
    const worksheetY = this.HEADER_HEIGHT + 10;
    const worksheetWidth = CANVAS_WIDTH - this.CALC_PANEL_WIDTH - this.PADDING * 2 - 20;
    const worksheetHeight = CANVAS_HEIGHT - this.HEADER_HEIGHT - this.FOOTER_HEIGHT - 20;

    // Calculate cell dimensions for legibility
    const cellWidth = this.MIN_CELL_WIDTH;
    const cellHeight = Math.min(this.TARGET_CELL_HEIGHT, (worksheetHeight - 40) / this.rows);

    // Calculate how many columns fit in the viewport
    this.viewportCols = Math.floor((worksheetWidth - 20) / cellWidth);

    // Determine viewport position based on current frame
    let targetCenter = this.cols - 1; // Default to rightmost (initial)
    if (frame.frame_type === 'problem' && frame.column_start !== undefined && frame.column_end !== undefined) {
      targetCenter = Math.floor((frame.column_start + frame.column_end) / 2);
    } else if (frame.frame_type === 'final') {
      targetCenter = 0; // Show leftmost at end
    }

    // Calculate viewport start, keeping target centered
    const halfViewport = Math.floor(this.viewportCols / 2);
    this.viewportStart = Math.max(0, Math.min(this.cols - this.viewportCols, targetCenter - halfViewport));

    // Calculate visible columns
    const visibleCols = Math.min(this.viewportCols, this.cols);

    // Center the grid within worksheet area
    const gridWidth = cellWidth * visibleCols;
    const gridHeight = cellHeight * this.rows;
    const gridX = worksheetX + (worksheetWidth - gridWidth) / 2;
    const gridY = worksheetY + (worksheetHeight - gridHeight) / 2;

    // Worksheet background
    ctx.fillStyle = theme.worksheetBg;
    ctx.beginPath();
    ctx.roundRect(worksheetX, worksheetY, worksheetWidth, worksheetHeight, 12);
    ctx.fill();

    // Draw grid lines
    ctx.strokeStyle = theme.gridLine;
    ctx.lineWidth = 0.5;
    for (let vc = 0; vc <= visibleCols; vc++) {
      ctx.beginPath();
      ctx.moveTo(gridX + vc * cellWidth, gridY);
      ctx.lineTo(gridX + vc * cellWidth, gridY + gridHeight);
      ctx.stroke();
    }
    for (let r = 0; r <= this.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(gridX, gridY + r * cellHeight);
      ctx.lineTo(gridX + gridWidth, gridY + r * cellHeight);
      ctx.stroke();
    }

    // Highlight active problem columns (adjusted for viewport)
    if (frame.frame_type === 'problem' && frame.column_start !== undefined && frame.column_end !== undefined) {
      const visibleStart = Math.max(frame.column_start, this.viewportStart);
      const visibleEnd = Math.min(frame.column_end, this.viewportStart + visibleCols - 1);

      if (visibleStart <= visibleEnd) {
        const highlightX = gridX + (visibleStart - this.viewportStart) * cellWidth;
        const highlightWidth = (visibleEnd - visibleStart + 1) * cellWidth;

        // Glow effect
        ctx.shadowColor = theme.accent;
        ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(6, 214, 160, 0.15)';
        ctx.fillRect(highlightX, gridY, highlightWidth, gridHeight);
        ctx.shadowBlur = 0;

        // Border
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(highlightX, gridY, highlightWidth, gridHeight);
      }
    }

    // Draw characters (only visible columns)
    ctx.font = `bold ${Math.min(cellHeight * 0.6, 18)}px "Consolas", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let r = 0; r < this.rows && r < this.grid.length; r++) {
      const row = this.grid[r];
      for (let vc = 0; vc < visibleCols; vc++) {
        const c = this.viewportStart + vc; // Actual column index
        if (c >= row.length) continue;

        const char = row[c];
        if (char === ' ') continue;

        const x = gridX + vc * cellWidth + cellWidth / 2;
        const y = gridY + r * cellHeight + cellHeight / 2;

        // Determine color based on character and state
        const isInActiveProblem = frame.frame_type === 'problem' &&
          frame.column_start !== undefined && frame.column_end !== undefined &&
          c >= frame.column_start && c <= frame.column_end;

        if (char === '+') {
          ctx.fillStyle = theme.operatorPlus;
        } else if (char === '*') {
          ctx.fillStyle = theme.operatorMult;
        } else if (isInActiveProblem) {
          ctx.fillStyle = theme.digitActive;
          ctx.shadowColor = theme.digitActive;
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = theme.digitInactive;
        }

        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;
      }
    }

    // Column position indicator
    ctx.fillStyle = theme.textSecondary;
    ctx.font = '12px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Columns ${this.viewportStart + 1}–${Math.min(this.viewportStart + visibleCols, this.cols)} of ${this.cols}`,
      gridX + gridWidth / 2,
      gridY + gridHeight + 18
    );

    // RTL scan direction indicator
    if (frame.frame_type !== 'final') {
      ctx.fillStyle = theme.scanDirection;
      ctx.font = '14px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('← Reading right-to-left', gridX + gridWidth, gridY - 8);

      // Arrow on left side indicating scroll direction
      const arrowY = gridY + gridHeight / 2;
      const arrowX = gridX - 25;
      ctx.beginPath();
      ctx.moveTo(arrowX + 20, arrowY);
      ctx.lineTo(arrowX, arrowY);
      ctx.lineTo(arrowX + 8, arrowY - 6);
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX + 8, arrowY + 6);
      ctx.strokeStyle = theme.scanDirection;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  private drawCalculationPanel(frame: Frame, progress: number): void {
    const ctx = this.ctx;

    const panelX = CANVAS_WIDTH - this.CALC_PANEL_WIDTH - this.PADDING;
    const panelY = this.HEADER_HEIGHT + 10;
    const panelWidth = this.CALC_PANEL_WIDTH;
    const panelHeight = CANVAS_HEIGHT - this.HEADER_HEIGHT - this.FOOTER_HEIGHT - 20;

    // Panel background
    ctx.fillStyle = 'rgba(26, 42, 61, 0.8)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 12);
    ctx.fill();

    // Panel border
    ctx.strokeStyle = theme.gridLine;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Title
    ctx.fillStyle = theme.textPrimary;
    ctx.font = 'bold 18px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Current Calculation', panelX + panelWidth / 2, panelY + 30);

    if (frame.frame_type === 'initial') {
      ctx.fillStyle = theme.textSecondary;
      ctx.font = '14px "Trebuchet MS", sans-serif';
      ctx.fillText('Waiting to start...', panelX + panelWidth / 2, panelY + panelHeight / 2);
      return;
    }

    if (frame.frame_type === 'final') {
      // Show grand total celebration
      ctx.fillStyle = theme.accent;
      ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
      ctx.fillText('Grand Total', panelX + panelWidth / 2, panelY + 80);

      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = 15;
      ctx.font = 'bold 32px "Trebuchet MS", sans-serif';
      ctx.fillText(formatNumber(this.grandTotal), panelX + panelWidth / 2, panelY + 130);
      ctx.shadowBlur = 0;

      ctx.fillStyle = theme.textSecondary;
      ctx.font = '14px "Trebuchet MS", sans-serif';
      ctx.fillText(`${this.problemCount} problems solved!`, panelX + panelWidth / 2, panelY + 170);
      return;
    }

    // Problem frame - show calculation
    if (frame.numbers && frame.operator && frame.result) {
      const numbers = frame.numbers;
      const operator = frame.operator;
      const opColor = operator === '+' ? theme.operatorPlus : theme.operatorMult;

      let yPos = panelY + 60;
      const lineHeight = 36;

      // Numbers
      ctx.font = 'bold 24px "Consolas", monospace';
      ctx.textAlign = 'right';
      const numX = panelX + panelWidth - 40;

      for (let i = 0; i < numbers.length; i++) {
        // Operator symbol (except before first number)
        if (i > 0) {
          ctx.fillStyle = opColor;
          ctx.textAlign = 'left';
          ctx.fillText(operator, panelX + 30, yPos);
        }

        ctx.fillStyle = theme.numberAssembly;
        ctx.textAlign = 'right';
        ctx.fillText(formatNumber(numbers[i]), numX, yPos);
        yPos += lineHeight;
      }

      // Equals line
      yPos += 5;
      ctx.strokeStyle = theme.textSecondary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(panelX + 30, yPos);
      ctx.lineTo(numX + 10, yPos);
      ctx.stroke();
      yPos += 25;

      // Result
      ctx.fillStyle = theme.resultHighlight;
      ctx.shadowColor = theme.resultHighlight;
      ctx.shadowBlur = 10;
      ctx.font = 'bold 28px "Consolas", monospace';
      ctx.fillText(formatNumber(frame.result), numX, yPos);
      ctx.shadowBlur = 0;

      // Running total section
      yPos += 50;
      ctx.fillStyle = theme.textSecondary;
      ctx.font = '14px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Running Total', panelX + panelWidth / 2, yPos);

      yPos += 30;
      ctx.fillStyle = theme.accent;
      ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
      ctx.fillText(formatNumber(frame.running_total), panelX + panelWidth / 2, yPos);
    }
  }

  private drawFooter(frame: Frame): void {
    const ctx = this.ctx;
    const footerY = CANVAS_HEIGHT - 50;

    // Progress bar
    const barX = 30;
    const barWidth = CANVAS_WIDTH - 60;
    const barHeight = 14;

    ctx.fillStyle = theme.progressBg;
    ctx.beginPath();
    ctx.roundRect(barX, footerY, barWidth, barHeight, 7);
    ctx.fill();

    // Progress calculation
    let progress = 0;
    if (frame.frame_type === 'initial') {
      progress = 0;
    } else if (frame.frame_type === 'problem') {
      progress = ((frame.problem_index ?? 0) + 1) / this.problemCount;
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
      ? `Complete! Grand Total: ${formatNumber(this.grandTotal)}`
      : `Processing ${this.problemCount} problems...`;
    ctx.fillText(statsText, CANVAS_WIDTH / 2, footerY + barHeight + 20);

    // Frame counter
    ctx.textAlign = 'right';
    ctx.fillStyle = theme.textSecondary;
    ctx.font = '12px monospace';
    ctx.fillText(`Frame ${this.currentFrameIndex + 1}/${this.frames.length}`, CANVAS_WIDTH - 30, footerY - 10);
  }
}

// -----------------------------------------------------------------------------
// Bootstrapping UI
// -----------------------------------------------------------------------------

const visualizer = new TrashCompactorVisualizer('canvas');

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
