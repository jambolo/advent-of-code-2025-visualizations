/**
 * Day 07 - Laboratories Visualizer
 *
 * Visualizes a quantum tachyon manifold where a particle travels through splitters,
 * creating parallel timelines via the many-worlds interpretation. Each splitter (^)
 * forks the particle's path, and timeline counts grow exponentially.
 *
 * Resolution: 720p (1280x720)
 * Justification: The grid visualization needs to show ~143 columns clearly while
 * maintaining readable timeline counts. 720p provides good balance between detail
 * and file size. The beam effects and particle systems render well at this resolution.
 */

export {};

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface Theme {
  background: string;
  gridLine: string;
  splitter: string;
  splitterGlow: string;
  beam: string;
  beamGlow: string;
  source: string;
  timeline: string;
  timelineGlow: string;
  textPrimary: string;
  textAccent: string;
  scanLine: string;
  success: string;
}

interface BeamState {
  column: number;
  timelines: number;
}

interface SplitEvent {
  column: number;
  timelines_before: number;
  left_column: number;
  right_column: number;
}

interface Frame {
  frame_type: 'initial' | 'row_process' | 'final';
  row: number;
  beams: BeamState[];
  splits?: SplitEvent[];
  total_timelines: number;
  splits_count: number;
}

interface LogData {
  width: number;
  height: number;
  source_column: number;
  splitter_positions: [number, number][];
  frames: Frame[];
  final_timelines: number;
}

interface TrailSegment {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

const theme: Theme = {
  background: '#0a0a12',
  gridLine: '#1a2a3a',
  splitter: '#ffa500',
  splitterGlow: '#ffa50060',
  beam: '#00ffff',
  beamGlow: '#00ffff40',
  source: '#ffff00',
  timeline: '#9b59b6',
  timelineGlow: '#8e44ad60',
  textPrimary: '#e0e8f0',
  textAccent: '#00ffff',
  scanLine: '#00ffff30',
  success: '#00ff88',
};

// ============================================================================
// CONSTANTS
// ============================================================================

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const FPS = 60;
const FRAME_DURATION = 1000 / FPS;
const DEFAULT_PLAYBACK_SPEED = 2;

const GRID_MARGIN_TOP = 120;
const GRID_MARGIN_BOTTOM = 100;
const GRID_MARGIN_LEFT = 40;
const GRID_MARGIN_RIGHT = 40;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ============================================================================
// PARTICLE SYSTEM
// ============================================================================

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

class ParticleSystem {
  private particles: Particle[] = [];

  emit(x: number, y: number, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 30 + Math.random() * 30,
        color,
      });
    }
  }

  emitSplit(x: number, y: number): void {
    // Emit particles going left
    for (let i = 0; i < 5; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * 0.5;
      const speed = 4 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 15 + Math.random() * 15,
        color: theme.beam,
      });
    }
    // Emit particles going right
    for (let i = 0; i < 5; i++) {
      const angle = (Math.random() - 0.5) * 0.5;
      const speed = 4 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 15 + Math.random() * 15,
        color: theme.beam,
      });
    }
    // Emit splitter flash particles
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 12 + Math.random() * 10,
        color: theme.splitter,
      });
    }
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.life -= 1 / p.maxLife;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 + p.life * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  clear(): void {
    this.particles = [];
  }
}

// ============================================================================
// VISUALIZER CLASS
// ============================================================================

class TachyonManifoldVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private logData: LogData | null = null;
  private frames: Frame[] = [];
  private currentFrameIndex = 0;
  private animationId: number | null = null;
  private lastFrameTime = 0;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private particles: ParticleSystem;

  // Grid dimensions (computed from log data)
  private gridWidth = 0;
  private gridHeight = 0;
  private cellWidth = 0;
  private cellHeight = 0;
  private gridStartX = GRID_MARGIN_LEFT;
  private gridStartY = GRID_MARGIN_TOP;

  // Animation state
  private currentRow = 0;
  private targetRow = 0;
  private currentBeams: BeamState[] = [];
  private targetBeams: BeamState[] = [];
  private interpolationProgress = 0;
  private totalTimelines = 1;
  private splitsCount = 0;
  private playbackSpeed = DEFAULT_PLAYBACK_SPEED;
  private activeSplits: SplitEvent[] = [];
  private splitFlashIntensity = 0;
  public onComplete: (() => void) | null = null;
  private trailSegments: TrailSegment[] = [];
  private previousBeamColumns: Set<number> = new Set();
  private endCooldown = 0;

  // Description popup state
  private showDescription = false;
  private showAlgorithm = false;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext('2d')!;
    this.particles = new ParticleSystem();
    this.startIdleLoop();
  }

  private startIdleLoop(): void {
    const idleRender = (): void => {
      if (this.animationId === null) {
        this.render();
      }
      requestAnimationFrame(idleRender);
    };
    requestAnimationFrame(idleRender);
  }

  loadLog(data: LogData): void {
    this.logData = data;
    this.frames = data.frames;
    this.gridWidth = data.width;
    this.gridHeight = data.height;

    // Calculate cell dimensions
    const availableWidth = CANVAS_WIDTH - GRID_MARGIN_LEFT - GRID_MARGIN_RIGHT;
    const availableHeight = CANVAS_HEIGHT - GRID_MARGIN_TOP - GRID_MARGIN_BOTTOM;
    this.cellWidth = availableWidth / this.gridWidth;
    this.cellHeight = availableHeight / this.gridHeight;

    console.log(`Loaded ${this.frames.length} frames, grid ${this.gridWidth}x${this.gridHeight}`);
  }

  start(): void {
    if (this.frames.length === 0) {
      console.error('No frames loaded');
      return;
    }

    // Reset state
    this.currentFrameIndex = 0;
    this.interpolationProgress = 1;
    this.particles.clear();
    this.trailSegments = [];
    this.previousBeamColumns.clear();
    this.endCooldown = 0;

    const firstFrame = this.frames[0];
    this.currentRow = firstFrame.row;
    this.targetRow = firstFrame.row;
    this.currentBeams = [...firstFrame.beams];
    this.targetBeams = [...firstFrame.beams];
    this.totalTimelines = firstFrame.total_timelines;
    this.splitsCount = firstFrame.splits_count;

    // Initialize previous beam columns for trail tracking
    for (const beam of firstFrame.beams) {
      this.previousBeamColumns.add(beam.column);
    }

    this.lastFrameTime = performance.now();
    this.animate();
  }

  private animate = (timestamp: number = performance.now()): void => {
    const deltaTime = timestamp - this.lastFrameTime;

    if (deltaTime >= FRAME_DURATION) {
      this.update(deltaTime);
      this.render();
      this.lastFrameTime = timestamp - (deltaTime % FRAME_DURATION);

      // Handle end cooldown (decrement per frame, not per animation tick)
      if (this.currentFrameIndex >= this.frames.length && this.endCooldown > 0) {
        this.endCooldown--;
      }
    }

    if (this.currentFrameIndex < this.frames.length) {
      this.animationId = requestAnimationFrame(this.animate);
    } else if (this.endCooldown > 0) {
      // Continue animating during cooldown to let particles fade
      this.animationId = requestAnimationFrame(this.animate);
    } else {
      this.onAnimationComplete();
    }
  };

  private update(deltaTime: number): void {
    this.particles.update();

    // Progress through frames
    if (this.interpolationProgress >= 1.0) {
      this.currentFrameIndex++;
      if (this.currentFrameIndex >= this.frames.length) {
        // Set cooldown to allow particles to fade (about 30 frames = 0.5 seconds)
        if (this.endCooldown === 0) {
          this.endCooldown = 30;
        }
        return;
      }

      const nextFrame = this.frames[this.currentFrameIndex];
      this.currentRow = this.targetRow;
      this.targetRow = nextFrame.row;
      this.currentBeams = [...this.targetBeams];
      this.targetBeams = [...nextFrame.beams];
      this.totalTimelines = nextFrame.total_timelines;
      this.splitsCount = nextFrame.splits_count;
      this.interpolationProgress = 0;

      // Handle split events
      if (nextFrame.splits && nextFrame.splits.length > 0) {
        this.activeSplits = nextFrame.splits;
        this.splitFlashIntensity = 1;

        // Emit particles for each split
        for (const split of nextFrame.splits) {
          const x = this.gridStartX + (split.column + 0.5) * this.cellWidth;
          const y = this.gridStartY + nextFrame.row * this.cellHeight;
          this.particles.emitSplit(x, y);
        }
      }

      // Build trail segments connecting previous beam positions to current
      const currentBeamCols = new Set(nextFrame.beams.map(b => b.column));
      const splitMap = new Map<number, SplitEvent>();
      if (nextFrame.splits) {
        for (const split of nextFrame.splits) {
          splitMap.set(split.column, split);
        }
      }

      // For each previous beam, create segments to its successors
      for (const prevCol of this.previousBeamColumns) {
        const split = splitMap.get(prevCol);
        if (split) {
          // Beam split: create diagonal segments to left and right children
          this.trailSegments.push({
            fromRow: this.currentRow,
            fromCol: prevCol,
            toRow: nextFrame.row,
            toCol: split.left_column
          });
          this.trailSegments.push({
            fromRow: this.currentRow,
            fromCol: prevCol,
            toRow: nextFrame.row,
            toCol: split.right_column
          });
        } else if (currentBeamCols.has(prevCol)) {
          // Beam continues straight down
          this.trailSegments.push({
            fromRow: this.currentRow,
            fromCol: prevCol,
            toRow: nextFrame.row,
            toCol: prevCol
          });
        }
      }

      // Update previous beam columns for next iteration
      this.previousBeamColumns = currentBeamCols;
    }

    // Interpolation progress
    const speed = 0.08 * this.playbackSpeed;
    this.interpolationProgress += speed;
    this.interpolationProgress = Math.min(this.interpolationProgress, 1.0);

    // Decay split flash
    if (this.splitFlashIntensity > 0) {
      this.splitFlashIntensity -= 0.05;
      if (this.splitFlashIntensity < 0) this.splitFlashIntensity = 0;
    }
  }

  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.5, Math.min(speed, 5));
  }

  private render(): void {
    const ctx = this.ctx;

    // Clear canvas with dark background
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw subtle grid background
    this.drawGridBackground();

    // Draw beam trails (history)
    this.drawBeamTrails();

    // Draw all splitters
    this.drawSplitters();

    // Draw source
    this.drawSource();

    // Draw scan line for current row
    this.drawScanLine();

    // Draw active beams
    this.drawActiveBeams();

    // Draw split flash effects
    if (this.splitFlashIntensity > 0) {
      this.drawSplitFlash();
    }

    // Draw particles
    this.particles.render(ctx);

    // Draw UI elements
    this.drawTitle();
    this.drawStats();
    this.drawProgressBar();

    // Draw popups if active
    if (this.showDescription) {
      this.drawDescriptionPopup();
    }
    if (this.showAlgorithm) {
      this.drawAlgorithmPopup();
    }
  }

  private drawGridBackground(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = theme.gridLine;
    ctx.lineWidth = 0.5;

    // Only draw major grid lines (every 10 cells) to avoid clutter
    for (let x = 0; x <= this.gridWidth; x += 10) {
      const px = this.gridStartX + x * this.cellWidth;
      ctx.beginPath();
      ctx.moveTo(px, this.gridStartY);
      ctx.lineTo(px, this.gridStartY + this.gridHeight * this.cellHeight);
      ctx.stroke();
    }

    for (let y = 0; y <= this.gridHeight; y += 10) {
      const py = this.gridStartY + y * this.cellHeight;
      ctx.beginPath();
      ctx.moveTo(this.gridStartX, py);
      ctx.lineTo(this.gridStartX + this.gridWidth * this.cellWidth, py);
      ctx.stroke();
    }
  }

  private drawSplitters(): void {
    if (!this.logData) return;
    const ctx = this.ctx;

    for (const [row, col] of this.logData.splitter_positions) {
      const x = this.gridStartX + (col + 0.5) * this.cellWidth;
      const y = this.gridStartY + (row + 0.5) * this.cellHeight;

      // Draw splitter glow
      ctx.save();
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, this.cellWidth);
      gradient.addColorStop(0, theme.splitterGlow);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - this.cellWidth, y - this.cellHeight, this.cellWidth * 2, this.cellHeight * 2);
      ctx.restore();

      // Draw splitter chevron (^)
      ctx.save();
      ctx.strokeStyle = theme.splitter;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const size = Math.min(this.cellWidth, this.cellHeight) * 0.4;
      ctx.moveTo(x - size, y + size * 0.5);
      ctx.lineTo(x, y - size * 0.5);
      ctx.lineTo(x + size, y + size * 0.5);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawSource(): void {
    if (!this.logData) return;
    const ctx = this.ctx;

    const x = this.gridStartX + (this.logData.source_column + 0.5) * this.cellWidth;
    const y = this.gridStartY + 0.5 * this.cellHeight;

    // Source glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, this.cellWidth * 2);
    gradient.addColorStop(0, theme.source);
    gradient.addColorStop(0.5, theme.source + '40');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - this.cellWidth * 2, y - this.cellHeight * 2, this.cellWidth * 4, this.cellHeight * 4);

    // Source marker (S)
    ctx.font = `bold ${Math.max(10, this.cellWidth)}px monospace`;
    ctx.fillStyle = theme.source;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', x, y);
  }

  private drawScanLine(): void {
    const ctx = this.ctx;
    const interpolatedRow = this.currentRow + (this.targetRow - this.currentRow) * easeInOutCubic(this.interpolationProgress);
    const y = this.gridStartY + interpolatedRow * this.cellHeight;

    ctx.fillStyle = theme.scanLine;
    ctx.fillRect(this.gridStartX, y, this.gridWidth * this.cellWidth, this.cellHeight);

    // Scan line edge glow
    ctx.strokeStyle = theme.beam;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(this.gridStartX, y + this.cellHeight);
    ctx.lineTo(this.gridStartX + this.gridWidth * this.cellWidth, y + this.cellHeight);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private drawBeamTrails(): void {
    const ctx = this.ctx;

    ctx.save();
    ctx.strokeStyle = theme.beamGlow;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (const segment of this.trailSegments) {
      const x1 = this.gridStartX + (segment.fromCol + 0.5) * this.cellWidth;
      const y1 = this.gridStartY + segment.fromRow * this.cellHeight;
      const x2 = this.gridStartX + (segment.toCol + 0.5) * this.cellWidth;
      const y2 = this.gridStartY + segment.toRow * this.cellHeight;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawActiveBeams(): void {
    const ctx = this.ctx;
    const interpolatedRow = this.currentRow + (this.targetRow - this.currentRow) * easeInOutCubic(this.interpolationProgress);

    // Interpolate beam positions
    const displayBeams: BeamState[] = [];
    const currentCols = new Set(this.currentBeams.map(b => b.column));
    const targetCols = new Set(this.targetBeams.map(b => b.column));

    // Add beams that exist in both (interpolate timelines)
    for (const tb of this.targetBeams) {
      const cb = this.currentBeams.find(b => b.column === tb.column);
      if (cb) {
        const timelines = cb.timelines + (tb.timelines - cb.timelines) * this.interpolationProgress;
        displayBeams.push({ column: tb.column, timelines });
      } else {
        // New beam, fade in
        displayBeams.push({ column: tb.column, timelines: tb.timelines * this.interpolationProgress });
      }
    }

    // Draw each beam
    for (const beam of displayBeams) {
      const x = this.gridStartX + (beam.column + 0.5) * this.cellWidth;
      const y = this.gridStartY + interpolatedRow * this.cellHeight;

      // Beam glow
      const glowRadius = Math.min(20, 5 + Math.log10(beam.timelines + 1) * 3);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
      gradient.addColorStop(0, theme.beam);
      gradient.addColorStop(0.5, theme.beamGlow);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Beam core
      ctx.fillStyle = theme.beam;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawSplitFlash(): void {
    const ctx = this.ctx;

    for (const split of this.activeSplits) {
      const x = this.gridStartX + (split.column + 0.5) * this.cellWidth;
      const y = this.gridStartY + this.targetRow * this.cellHeight;

      ctx.save();
      ctx.globalAlpha = this.splitFlashIntensity * 0.6;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 40);
      gradient.addColorStop(0, theme.splitter);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - 40, y - 40, 80, 80);
      ctx.restore();
    }
  }

  private drawTitle(): void {
    const ctx = this.ctx;
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = theme.textPrimary;
    ctx.textAlign = 'center';
    ctx.fillText('Day 7: Laboratories', CANVAS_WIDTH / 2, 40);

    ctx.font = '14px monospace';
    ctx.fillStyle = theme.textAccent;
    ctx.fillText('Quantum Tachyon Manifold', CANVAS_WIDTH / 2, 60);
  }

  private drawStats(): void {
    const ctx = this.ctx;
    const statsY = 85;

    // Timeline counter (needs lots of space for large numbers)
    ctx.font = '12px monospace';
    ctx.fillStyle = theme.textAccent;
    ctx.textAlign = 'left';
    ctx.fillText('TIMELINES', 60, statsY);

    ctx.font = 'bold 20px monospace';
    const isFinal = this.currentFrameIndex >= this.frames.length - 1;
    ctx.fillStyle = isFinal ? theme.success : theme.timeline;
    ctx.fillText(formatNumber(this.totalTimelines), 60, statsY + 20);

    // Splits counter (right side)
    ctx.font = '12px monospace';
    ctx.fillStyle = theme.textAccent;
    ctx.textAlign = 'right';
    ctx.fillText('SPLITS', CANVAS_WIDTH - 60, statsY);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = theme.splitter;
    ctx.fillText(this.splitsCount.toLocaleString(), CANVAS_WIDTH - 60, statsY + 18);

    // Current row (center-right)
    ctx.font = '12px monospace';
    ctx.fillStyle = theme.textAccent;
    ctx.textAlign = 'right';
    ctx.fillText('ROW', CANVAS_WIDTH - 180, statsY);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = theme.textPrimary;
    ctx.fillText(`${Math.floor(this.targetRow)} / ${this.gridHeight}`, CANVAS_WIDTH - 180, statsY + 18);
  }

  private drawProgressBar(): void {
    const ctx = this.ctx;
    const barWidth = 300;
    const barHeight = 12;
    const x = CANVAS_WIDTH / 2 - barWidth / 2;
    const y = CANVAS_HEIGHT - 35;

    const progress = Math.min(1, this.currentFrameIndex / Math.max(1, this.frames.length - 1));

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Progress fill
    const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
    gradient.addColorStop(0, theme.beam);
    gradient.addColorStop(1, theme.timeline);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth * progress, barHeight);

    // Border
    ctx.strokeStyle = theme.textAccent;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Percentage
    ctx.font = '11px monospace';
    ctx.fillStyle = theme.textPrimary;
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(progress * 100)}%`, CANVAS_WIDTH / 2, y + barHeight + 15);
  }

  private drawDescriptionPopup(): void {
    const ctx = this.ctx;
    const popupWidth = 700;
    const popupHeight = 580;
    const x = CANVAS_WIDTH / 2 - popupWidth / 2;
    const y = CANVAS_HEIGHT / 2 - popupHeight / 2;

    // Dim background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Popup background
    ctx.fillStyle = '#1a2332';
    ctx.fillRect(x, y, popupWidth, popupHeight);

    // Border
    ctx.strokeStyle = theme.textAccent;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, popupWidth, popupHeight);

    // Title
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = theme.textAccent;
    ctx.textAlign = 'center';
    ctx.fillText('--- Day 7: Laboratories ---', CANVAS_WIDTH / 2, y + 30);

    // Content
    ctx.font = '12px monospace';
    ctx.fillStyle = theme.textPrimary;
    ctx.textAlign = 'left';
    let lineY = y + 55;
    const lineHeight = 16;
    const leftMargin = x + 20;

    const descriptionLines = [
      'You find yourself in a teleporter lab. The teleporter is broken with',
      'error code 0H-N0 - an issue with one of the tachyon manifolds.',
      '',
      'A tachyon beam enters the manifold at position S and moves downward.',
      'Beams pass freely through empty space (.). When a beam hits a',
      'splitter (^), it stops and two new beams continue from the left',
      'and right of the splitter.',
      '',
      '--- Part One ---',
      'Count how many times the beam is split. Answer: 1,630 splits.',
      '',
      '--- Part Two ---',
      'The manifold is actually a QUANTUM tachyon manifold. Only a single',
      'tachyon particle is sent through, but it takes BOTH paths at each',
      'splitter using the many-worlds interpretation.',
      '',
      'Each time a particle reaches a splitter, time itself splits:',
      '  • In one timeline, the particle went left',
      '  • In another timeline, the particle went right',
      '',
      'The particle exists across all possible timelines simultaneously.',
      'Count the total number of timelines after the particle completes',
      'all possible journeys through the manifold.',
      '',
      'Answer: 47,857,642,990,160 timelines',
    ];

    for (const line of descriptionLines) {
      if (line.startsWith('---')) {
        ctx.fillStyle = theme.splitter;
        ctx.font = 'bold 12px monospace';
      } else if (line.startsWith('Answer:')) {
        ctx.fillStyle = theme.success;
        ctx.font = 'bold 12px monospace';
      } else if (line.startsWith('  •')) {
        ctx.fillStyle = theme.beam;
        ctx.font = '12px monospace';
      } else {
        ctx.fillStyle = theme.textPrimary;
        ctx.font = '12px monospace';
      }
      ctx.fillText(line, leftMargin, lineY);
      lineY += lineHeight;
    }

    // Close hint
    ctx.font = '12px monospace';
    ctx.fillStyle = theme.textAccent;
    ctx.textAlign = 'center';
    ctx.fillText('Click button again to close', CANVAS_WIDTH / 2, y + popupHeight - 15);
  }

  private drawAlgorithmPopup(): void {
    this.drawPopup(
      'Algorithm Summary',
      [
        '1. Start with 1 timeline at the source column',
        '2. Process each row from top to bottom:',
        '   - For each beam at position x with N timelines:',
        '   - If there\'s a splitter at x:',
        '     • Remove the beam at x',
        '     • Add N timelines to position x-1 (left)',
        '     • Add N timelines to position x+1 (right)',
        '   - Beams at the same column merge (sum timelines)',
        '3. Sum all timeline counts at the end',
        '',
        'Timeline counts grow exponentially with splits!',
      ]
    );
  }

  private drawPopup(title: string, lines: string[]): void {
    const ctx = this.ctx;
    const popupWidth = 500;
    const popupHeight = 280;
    const x = CANVAS_WIDTH / 2 - popupWidth / 2;
    const y = CANVAS_HEIGHT / 2 - popupHeight / 2;

    // Dim background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Popup background
    ctx.fillStyle = '#1a2332';
    ctx.fillRect(x, y, popupWidth, popupHeight);

    // Border
    ctx.strokeStyle = theme.textAccent;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, popupWidth, popupHeight);

    // Title
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = theme.textAccent;
    ctx.textAlign = 'center';
    ctx.fillText(title, CANVAS_WIDTH / 2, y + 30);

    // Content
    ctx.font = '13px monospace';
    ctx.fillStyle = theme.textPrimary;
    ctx.textAlign = 'left';
    let lineY = y + 60;
    for (const line of lines) {
      ctx.fillText(line, x + 20, lineY);
      lineY += 20;
    }

    // Close hint
    ctx.font = '12px monospace';
    ctx.fillStyle = theme.textAccent;
    ctx.textAlign = 'center';
    ctx.fillText('Click button again to close', CANVAS_WIDTH / 2, y + popupHeight - 15);
  }

  toggleDescription(): void {
    this.showDescription = !this.showDescription;
    if (this.showDescription) this.showAlgorithm = false;
  }

  toggleAlgorithm(): void {
    this.showAlgorithm = !this.showAlgorithm;
    if (this.showAlgorithm) this.showDescription = false;
  }

  private onAnimationComplete(): void {
    console.log('Animation complete');
    this.animationId = null;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.onComplete) {
      this.onComplete();
    }
  }

  private getSupportedMimeType(): string | null {
    const candidates = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm;codecs=h264',
      'video/webm',
    ];

    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return null;
  }

  startRecording(): void {
    const mimeType = this.getSupportedMimeType();
    if (!mimeType) {
      console.error('MediaRecorder: no supported WebM mime types found');
      return;
    }

    const stream = this.canvas.captureStream(FPS);
    try {
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000,
      });
    } catch (err) {
      console.error('Failed to start MediaRecorder', err);
      return;
    }

    this.recordedChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'day07-laboratories.webm';
      a.click();
      console.log('Recording saved');
    };

    this.mediaRecorder.start();
    console.log('Recording started');
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

let visualizer: TachyonManifoldVisualizer;

window.addEventListener('DOMContentLoaded', () => {
  visualizer = new TachyonManifoldVisualizer('canvas');

  const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
  const recordBtn = document.getElementById('recordBtn') as HTMLButtonElement;
  const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  const speedSelect = document.getElementById('speedSelect') as HTMLSelectElement;

  fileInput.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const text = await file.text();
      const data: LogData = JSON.parse(text);
      visualizer.loadLog(data);
      startBtn.disabled = false;
      recordBtn.disabled = false;
    }
  });

  speedSelect.addEventListener('change', () => {
    const value = parseFloat(speedSelect.value);
    visualizer.setPlaybackSpeed(value);
  });

  startBtn.addEventListener('click', () => {
    visualizer.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  });

  recordBtn.addEventListener('click', () => {
    visualizer.startRecording();
    visualizer.start();
    recordBtn.disabled = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
  });

  stopBtn.addEventListener('click', () => {
    visualizer.stop();
    startBtn.disabled = false;
    recordBtn.disabled = false;
    stopBtn.disabled = true;
  });

  visualizer.onComplete = () => {
    startBtn.disabled = false;
    recordBtn.disabled = false;
    stopBtn.disabled = true;
  };

  const descriptionBtn = document.getElementById('descriptionBtn') as HTMLButtonElement;
  const algorithmBtn = document.getElementById('algorithmBtn') as HTMLButtonElement;

  descriptionBtn.addEventListener('click', () => {
    visualizer.toggleDescription();
  });

  algorithmBtn.addEventListener('click', () => {
    visualizer.toggleAlgorithm();
  });
});
