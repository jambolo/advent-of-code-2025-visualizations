/**
 * Day 01 - Secret Entrance Visualizer
 * 
 * This visualizer renders a safe dial animation based on rotation instructions.
 * It shows a circular dial (0-99) being rotated left and right, highlighting when
 * the dial passes through or lands on position 0, accumulating a password count.
 * 
 * Resolution: 720p (1280x720)
 * Justification: The visualization centers on a single circular dial with surrounding
 * text elements. 720p provides crisp rendering without excessive file size. The dial
 * detail and text readability don't require 1080p, and 480p would make small numbers
 * on the dial less readable.
 * 
 * Architecture:
 * - Frame-based animation driven by JSON log
 * - Interpolation between frames for smooth rotation
 * - Adaptive playback speed based on frame sampling
 * - Canvas rendering with visual effects (glows, trails)
 * - MediaRecorder for WebM capture
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface Theme {
  background: string;
  dialOuter: string;
  dialInner: string;
  dialMarker: string;
  numberActive: string;
  numberNormal: string;
  zero: string;
  trail: string;
  passGlow: string;
  textPrimary: string;
  textAccent: string;
  highlight: string;
  success: string;
}

interface Frame {
  frame_type: 'initial' | 'rotation_start' | 'position_update' | 'zero_pass' | 'zero_land' | 'rotation_end' | 'final';
  rotation_number: number;
  position: number;
  password: number;
  instruction?: string;
  distance?: number;
  direction?: 'L' | 'R';
  passes_in_rotation?: number;
  lands_on_zero?: boolean;
  progress?: number;
}

interface LogData {
  frames: Frame[];
  total_rotations: number;
  final_password: number;
}

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

const theme: Theme = {
  background: '#0a0f1a',
  dialOuter: '#2a3f5f',
  dialInner: '#1a2332',
  dialMarker: '#ff3366',
  numberActive: '#66d9ff',
  numberNormal: '#4a5f7f',
  zero: '#ffcc00',
  trail: '#ff336680',
  passGlow: '#ffcc0040',
  textPrimary: '#e0e8f0',
  textAccent: '#66d9ff',
  highlight: '#ff3366',
  success: '#00ff88',
};

// ============================================================================
// CONSTANTS
// ============================================================================

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const FPS = 60;
const FRAME_DURATION = 1000 / FPS;
const DEFAULT_PLAYBACK_SPEED = 2; // Faster than 1x to shorten runtime

const DIAL_CENTER_X = CANVAS_WIDTH / 2;
const DIAL_CENTER_Y = CANVAS_HEIGHT / 2 + 20;
const DIAL_RADIUS = 200;
const DIAL_INNER_RADIUS = 160;
const NUMBER_RADIUS = 240;
const MARKER_LENGTH = 60;

// ============================================================================
// VISUALIZER CLASS
// ============================================================================

class SafeDialVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private frames: Frame[] = [];
  private currentFrameIndex = 0;
  private animationId: number | null = null;
  private lastFrameTime = 0;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  
  // Animation state
  private currentPosition = 50;
  private targetPosition = 50;
  private previousPosition = 50;
  private currentPassword = 0;
  private currentFrame: Frame | null = null;
  private interpolationProgress = 0;
  private showZeroFlash = false;
  private flashIntensity = 0;
  private trailPositions: number[] = [];
  private playbackSpeed = DEFAULT_PLAYBACK_SPEED;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext('2d')!;
  }

  async loadLog(url: string): Promise<void> {
    const response = await fetch(url);
    const data: LogData = await response.json();
    this.frames = data.frames;
    console.log(`Loaded ${this.frames.length} frames`);
  }

  start(): void {
    if (this.frames.length === 0) {
      console.error('No frames loaded');
      return;
    }

    // Initialize with first frame
    this.currentFrameIndex = 0;
    this.currentFrame = this.frames[0];
    this.currentPosition = this.currentFrame.position;
    this.targetPosition = this.currentFrame.position;
    this.currentPassword = this.currentFrame.password;
    
    this.lastFrameTime = performance.now();
    this.animate();
  }

  private animate = (timestamp: number = performance.now()): void => {
    const deltaTime = timestamp - this.lastFrameTime;
    
    if (deltaTime >= FRAME_DURATION) {
      this.update(deltaTime);
      this.render();
      this.lastFrameTime = timestamp - (deltaTime % FRAME_DURATION);
    }

    if (this.currentFrameIndex < this.frames.length) {
      this.animationId = requestAnimationFrame(this.animate);
    } else {
      this.onAnimationComplete();
    }
  };

  private update(deltaTime: number): void {
    // Check if we should move to next frame
    if (this.interpolationProgress >= 1.0) {
      this.currentFrameIndex++;
      if (this.currentFrameIndex >= this.frames.length) {
        return;
      }

      const nextFrame = this.frames[this.currentFrameIndex];
      this.currentFrame = nextFrame;
      this.previousPosition = this.currentPosition;
      this.targetPosition = nextFrame.position;
      this.currentPassword = nextFrame.password;
      this.interpolationProgress = 0;

      // Handle flash effects for zero encounters
      if (nextFrame.frame_type === 'zero_pass' || nextFrame.frame_type === 'zero_land') {
        this.showZeroFlash = true;
        this.flashIntensity = nextFrame.frame_type === 'zero_land' ? 1.0 : 0.6;
      }
    }

    // Interpolate position
    const speed = 0.15 * this.playbackSpeed; // Increase speed to shorten total runtime
    this.interpolationProgress += speed;
    this.interpolationProgress = Math.min(this.interpolationProgress, 1.0);

    // Use easing for smooth rotation
    const eased = this.easeInOutCubic(this.interpolationProgress);
    this.currentPosition = this.interpolatePosition(
      this.previousPosition,
      this.targetPosition,
      eased
    );

    // Update trail
    this.trailPositions.unshift(this.currentPosition);
    if (this.trailPositions.length > 15) {
      this.trailPositions.pop();
    }

    // Decay flash effect
    if (this.showZeroFlash) {
      this.flashIntensity -= 0.05;
      if (this.flashIntensity <= 0) {
        this.showZeroFlash = false;
        this.flashIntensity = 0;
      }
    }
  }

  setPlaybackSpeed(speed: number): void {
    // Clamp to a reasonable range to avoid runaway animations
    this.playbackSpeed = Math.max(0.25, Math.min(speed, 5));
  }

  private interpolatePosition(from: number, to: number, t: number): number {
    // Handle wraparound on circular dial
    let diff = to - from;
    
    // Choose shortest path around circle
    if (diff > 50) {
      diff -= 100;
    } else if (diff < -50) {
      diff += 100;
    }
    
    let result = from + diff * t;
    
    // Normalize to 0-99
    while (result < 0) result += 100;
    while (result >= 100) result -= 100;
    
    return result;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private render(): void {
    const ctx = this.ctx;

    // Clear canvas
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw title
    this.drawTitle();

    // Draw password counter
    this.drawPasswordCounter();

    // Draw dial
    this.drawDial();

    // Draw instruction info
    if (this.currentFrame) {
      this.drawInstructionInfo();
    }

    // Draw progress bar
    this.drawProgressBar();
  }

  private drawTitle(): void {
    const ctx = this.ctx;
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = theme.textPrimary;
    ctx.textAlign = 'center';
    ctx.fillText('Day 1: Secret Entrance', CANVAS_WIDTH / 2, 50);
  }

  private drawPasswordCounter(): void {
    const ctx = this.ctx;
    const boxWidth = 400;
    const boxHeight = 60;
    const boxX = CANVAS_WIDTH / 2 - boxWidth / 2;
    const boxY = 70;
    const centerY = boxY + boxHeight / 2;

    // Background box
    ctx.fillStyle = '#1a1a2e80';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = theme.textAccent;
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Label + value on the same line to keep the header compact
    const label = 'PASSWORD';
    const value = String(this.currentPassword);
    const gap = 14;

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    ctx.font = '20px monospace';
    const labelWidth = ctx.measureText(label).width;

    ctx.font = 'bold 32px monospace';
    const valueWidth = ctx.measureText(value).width;

    const totalWidth = labelWidth + gap + valueWidth;
    const startX = CANVAS_WIDTH / 2 - totalWidth / 2;

    ctx.font = '20px monospace';
    ctx.fillStyle = theme.textAccent;
    ctx.fillText(label, startX, centerY);

    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = this.currentFrame?.frame_type === 'final' ? theme.success : theme.highlight;
    ctx.fillText(value, startX + labelWidth + gap, centerY);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
  }

  private drawDial(): void {
    const ctx = this.ctx;
    const cx = DIAL_CENTER_X;
    const cy = DIAL_CENTER_Y;

    // Draw zero flash/glow if active
    if (this.showZeroFlash) {
      ctx.save();
      const zeroAngle = -Math.PI / 2; // 0 is at top
      const zeroX = cx + Math.cos(zeroAngle) * NUMBER_RADIUS;
      const zeroY = cy + Math.sin(zeroAngle) * NUMBER_RADIUS;
      
      const gradient = ctx.createRadialGradient(zeroX, zeroY, 0, zeroX, zeroY, 80);
      gradient.addColorStop(0, `rgba(255, 204, 0, ${this.flashIntensity * 0.8})`);
      gradient.addColorStop(1, 'rgba(255, 204, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(zeroX - 80, zeroY - 80, 160, 160);
      ctx.restore();
    }

    // Draw outer dial ring
    ctx.beginPath();
    ctx.arc(cx, cy, DIAL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = theme.dialOuter;
    ctx.fill();
    ctx.strokeStyle = theme.dialMarker;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw inner dial
    ctx.beginPath();
    ctx.arc(cx, cy, DIAL_INNER_RADIUS, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, DIAL_INNER_RADIUS);
    gradient.addColorStop(0, theme.dialInner);
    gradient.addColorStop(1, theme.dialOuter);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw numbers around dial
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw all numbers (every 5th number)
    for (let i = 0; i < 100; i += 5) {
      const angle = (i / 100) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * NUMBER_RADIUS;
      const y = cy + Math.sin(angle) * NUMBER_RADIUS;

      if (i === 0) {
        // Zero is special - always gold
        ctx.fillStyle = theme.zero;
        ctx.font = 'bold 24px monospace';
        ctx.fillText(String(i), x, y);
        ctx.font = 'bold 16px monospace';
      } else {
        ctx.fillStyle = theme.numberNormal;
        ctx.fillText(String(i), x, y);
      }
    }

    // Draw trail
    ctx.save();
    for (let i = 0; i < this.trailPositions.length; i++) {
      const pos = this.trailPositions[i];
      const angle = (pos / 100) * Math.PI * 2 - Math.PI / 2;
      const radius = DIAL_INNER_RADIUS - 10;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      
      const alpha = (1 - i / this.trailPositions.length) * 0.5;
      ctx.fillStyle = `rgba(255, 51, 102, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw current position marker on dial edge
    const currentAngle = (this.currentPosition / 100) * Math.PI * 2 - Math.PI / 2;
    const markerX = cx + Math.cos(currentAngle) * (DIAL_INNER_RADIUS - 20);
    const markerY = cy + Math.sin(currentAngle) * (DIAL_INNER_RADIUS - 20);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(currentAngle + Math.PI / 2);
    
    // Arrow pointing outward
    ctx.fillStyle = theme.dialMarker;
    ctx.beginPath();
    ctx.moveTo(0, -DIAL_INNER_RADIUS + 30);
    ctx.lineTo(-15, -DIAL_INNER_RADIUS + 80);
    ctx.lineTo(15, -DIAL_INNER_RADIUS + 80);
    ctx.closePath();
    ctx.fill();
    
    // Add glow
    ctx.shadowColor = theme.dialMarker;
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.restore();

    // Draw center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fillStyle = theme.dialMarker;
    ctx.fill();

    // Draw current position text in center
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = theme.numberActive;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.floor(this.currentPosition).toString(), cx, cy + 80);
  }

  private drawInstructionInfo(): void {
    if (!this.currentFrame) return;

    const ctx = this.ctx;
    const x = 100;
    const y = CANVAS_HEIGHT - 180;

    ctx.font = '18px monospace';
    ctx.fillStyle = theme.textPrimary;
    ctx.textAlign = 'left';

    if (this.currentFrame.instruction) {
      ctx.fillStyle = theme.textAccent;
      ctx.fillText(`Instruction: ${this.currentFrame.instruction}`, x, y);
    }

    ctx.fillStyle = theme.textPrimary;
    ctx.fillText(`Rotation: ${this.currentFrame.rotation_number}`, x, y + 30);

    if (this.currentFrame.frame_type === 'zero_pass') {
      ctx.fillStyle = theme.zero;
      ctx.fillText('⚠ PASSING THROUGH 0', x, y + 60);
    } else if (this.currentFrame.frame_type === 'zero_land') {
      ctx.fillStyle = theme.success;
      ctx.fillText('★ LANDED ON 0', x, y + 60);
    }
  }

  private drawProgressBar(): void {
    if (!this.currentFrame) return;

    const ctx = this.ctx;
    const barWidth = 400;
    const barHeight = 20;
    const x = CANVAS_WIDTH / 2 - barWidth / 2;
    const y = CANVAS_HEIGHT - 50;

    const progress = this.currentFrame.progress || 0;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Progress
    ctx.fillStyle = theme.textAccent;
    ctx.fillRect(x, y, barWidth * progress, barHeight);

    // Border
    ctx.strokeStyle = theme.textPrimary;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Text
    ctx.font = '14px monospace';
    ctx.fillStyle = theme.textPrimary;
    ctx.textAlign = 'center';
    ctx.fillText(
      `${Math.floor(progress * 100)}%`,
      CANVAS_WIDTH / 2,
      y + barHeight + 20
    );
  }

  private onAnimationComplete(): void {
    console.log('Animation complete');
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  /**
   * Choose the first MediaRecorder mime type the browser supports.
   * Falls back to null if nothing matches so we can bail out gracefully.
   */
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
      a.download = 'day01-secret-entrance.webm';
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

let visualizer: SafeDialVisualizer;

window.addEventListener('DOMContentLoaded', () => {
  visualizer = new SafeDialVisualizer('canvas');

  const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
  const recordBtn = document.getElementById('recordBtn') as HTMLButtonElement;
  const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;

  fileInput.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const text = await file.text();
      const data = JSON.parse(text);
      visualizer['frames'] = data.frames;
      console.log(`Loaded ${data.frames.length} frames from file`);
      startBtn.disabled = false;
      recordBtn.disabled = false;
    }
  });

  const speedSelect = document.getElementById('speedSelect') as HTMLSelectElement;
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
});
