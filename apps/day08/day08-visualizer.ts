/**
 * Day 08 - Playground Visualizer
 *
 * Visualizes the construction of a minimum spanning tree connecting junction boxes
 * suspended in a 3D underground playground. Junction boxes are connected with light
 * strings in order of shortest distance until all form a single circuit.
 *
 * Resolution: 720p (1280x720)
 * Justification: 3D point cloud visualization with 1000 nodes needs good resolution
 * for depth perception and connection visibility. 720p balances quality with file size.
 */

export {};

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface Theme {
  background: string;
  boxDefault: string;
  boxGlow: string;
  connectionDefault: string;
  connectionGlow: string;
  finalConnection: string;
  finalGlow: string;
  textPrimary: string;
  textAccent: string;
  progressStart: string;
  progressMid: string;
  progressEnd: string;
  circuitColors: string[];
}

interface JunctionBox {
  x: number;
  y: number;
  z: number;
}

interface Connection {
  from: number;
  to: number;
  distance: number;
}

interface Frame {
  frame_type: 'initial' | 'connection' | 'final';
  connection_index: number;
  from_idx: number;
  to_idx: number;
  distance: number;
  circuits_remaining: number;
  circuit_assignments: number[];
}

interface LogData {
  boxes: JunctionBox[];
  total_connections_needed: number;
  frames: Frame[];
  final_from_idx: number;
  final_to_idx: number;
  final_from_x: number;
  final_to_x: number;
  answer: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface ProjectedBox {
  idx: number;
  screenX: number;
  screenY: number;
  depth: number;
  scale: number;
}

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

const theme: Theme = {
  background: '#0a0a1a',
  boxDefault: '#4a4a5a',
  boxGlow: '#6a6a7a40',
  connectionDefault: '#3a5a7a',
  connectionGlow: '#4a6a8a40',
  finalConnection: '#ffd700',
  finalGlow: '#ffd70080',
  textPrimary: '#f5f5dc',
  textAccent: '#00d4ff',
  progressStart: '#ff6b6b',
  progressMid: '#ffe66d',
  progressEnd: '#4ecdc4',
  circuitColors: [
    '#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3',
    '#f38181', '#aa96da', '#a8e6cf', '#ffd93d',
    '#74b9ff', '#fd79a8', '#00b894', '#e17055',
    '#0984e3', '#6c5ce7', '#00cec9', '#fab1a0',
  ],
};

// ============================================================================
// CONSTANTS
// ============================================================================

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const FPS = 60;
const FRAME_DURATION = 1000 / FPS;
const DEFAULT_PLAYBACK_SPEED = 2;

// 3D projection parameters
const CAMERA_DISTANCE = 200000;
const ROTATE_SPEED = 0.0003;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getCircuitColor(circuitId: number): string {
  return theme.circuitColors[circuitId % theme.circuitColors.length];
}

// ============================================================================
// PARTICLE SYSTEM
// ============================================================================

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
        size: 2 + Math.random() * 2,
      });
    }
  }

  emitConnection(x1: number, y1: number, x2: number, y2: number, color: string): void {
    const count = 15;
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const x = lerp(x1, x2, t);
      const y = lerp(y1, y2, t);
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 20 + Math.random() * 20,
        color,
        size: 1 + Math.random() * 2,
      });
    }
  }

  emitFinalBurst(x: number, y: number): void {
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 40 + Math.random() * 40,
        color: Math.random() > 0.5 ? theme.finalConnection : '#ffffff',
        size: 3 + Math.random() * 3,
      });
    }
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.vx *= 0.99;
      p.life -= 1 / p.maxLife;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life * 0.8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  clear(): void {
    this.particles = [];
  }
}

// ============================================================================
// STAR BACKGROUND
// ============================================================================

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

class StarField {
  private stars: Star[] = [];

  constructor(count: number) {
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: 0.5 + Math.random() * 1.5,
        brightness: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.02 + Math.random() * 0.03,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  render(ctx: CanvasRenderingContext2D, time: number): void {
    for (const star of this.stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinklePhase);
      const alpha = star.brightness * twinkle;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fffacd';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

// ============================================================================
// VISUALIZER CLASS
// ============================================================================

class PlaygroundVisualizer {
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
  private starField: StarField;

  // 3D state
  private rotationAngle = 0;
  private projectedBoxes: ProjectedBox[] = [];
  private connections: Connection[] = [];
  private circuitAssignments: number[] = [];

  // Animation state
  private interpolationProgress = 0;
  private playbackSpeed = DEFAULT_PLAYBACK_SPEED;
  private currentConnectionIndex = 0;
  private circuitsRemaining = 0;
  private animationTime = 0;
  private showFinalCelebration = false;
  private finalCelebrationTime = 0;
  public onComplete: (() => void) | null = null;
  private endCooldown = 0;

  // Bounding box for normalization
  private minX = 0;
  private maxX = 0;
  private minY = 0;
  private maxY = 0;
  private minZ = 0;
  private maxZ = 0;
  private centerX = 0;
  private centerY = 0;
  private centerZ = 0;
  private scale = 1;

  // Popup state
  private showDescription = false;
  private showAlgorithm = false;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext('2d')!;
    this.particles = new ParticleSystem();
    this.starField = new StarField(150);
    this.startIdleLoop();
  }

  private startIdleLoop(): void {
    const idleRender = (timestamp: number): void => {
      this.animationTime = timestamp;
      if (this.animationId === null) {
        this.rotationAngle += ROTATE_SPEED * 16;
        if (this.logData) {
          this.projectBoxes();
        }
        this.render();
      }
      requestAnimationFrame(idleRender);
    };
    requestAnimationFrame(idleRender);
  }

  loadLog(data: LogData): void {
    this.logData = data;
    this.frames = data.frames;
    this.connections = [];
    this.circuitAssignments = [];

    // Compute bounding box
    this.minX = Infinity;
    this.maxX = -Infinity;
    this.minY = Infinity;
    this.maxY = -Infinity;
    this.minZ = Infinity;
    this.maxZ = -Infinity;

    for (const box of data.boxes) {
      this.minX = Math.min(this.minX, box.x);
      this.maxX = Math.max(this.maxX, box.x);
      this.minY = Math.min(this.minY, box.y);
      this.maxY = Math.max(this.maxY, box.y);
      this.minZ = Math.min(this.minZ, box.z);
      this.maxZ = Math.max(this.maxZ, box.z);
    }

    this.centerX = (this.minX + this.maxX) / 2;
    this.centerY = (this.minY + this.maxY) / 2;
    this.centerZ = (this.minZ + this.maxZ) / 2;

    const rangeX = this.maxX - this.minX;
    const rangeY = this.maxY - this.minY;
    const rangeZ = this.maxZ - this.minZ;
    const maxRange = Math.max(rangeX, rangeY, rangeZ);
    this.scale = 400 / maxRange;

    // Initialize circuit assignments
    for (let i = 0; i < data.boxes.length; i++) {
      this.circuitAssignments.push(i);
    }

    this.projectBoxes();
    console.log(`Loaded ${this.frames.length} frames, ${data.boxes.length} boxes`);
  }

  private projectBoxes(): void {
    if (!this.logData) return;

    const cosA = Math.cos(this.rotationAngle);
    const sinA = Math.sin(this.rotationAngle);
    const tiltAngle = 0.3;
    const cosT = Math.cos(tiltAngle);
    const sinT = Math.sin(tiltAngle);

    this.projectedBoxes = [];

    for (let i = 0; i < this.logData.boxes.length; i++) {
      const box = this.logData.boxes[i];

      // Center and scale
      let x = (box.x - this.centerX) * this.scale;
      let y = (box.y - this.centerY) * this.scale;
      let z = (box.z - this.centerZ) * this.scale;

      // Rotate around Y axis
      const rx = x * cosA - z * sinA;
      const rz = x * sinA + z * cosA;
      x = rx;
      z = rz;

      // Tilt around X axis
      const ry = y * cosT - z * sinT;
      z = y * sinT + z * cosT;
      y = ry;

      // Perspective projection
      const perspective = CAMERA_DISTANCE / (CAMERA_DISTANCE + z);
      const screenX = CANVAS_WIDTH / 2 + x * perspective;
      const screenY = CANVAS_HEIGHT / 2 + y * perspective;

      this.projectedBoxes.push({
        idx: i,
        screenX,
        screenY,
        depth: z,
        scale: perspective,
      });
    }

    // Sort by depth (far to near)
    this.projectedBoxes.sort((a, b) => a.depth - b.depth);
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
    this.connections = [];
    this.showFinalCelebration = false;
    this.finalCelebrationTime = 0;
    this.endCooldown = 0;

    // Initialize circuit assignments
    this.circuitAssignments = [];
    for (let i = 0; i < this.logData!.boxes.length; i++) {
      this.circuitAssignments.push(i);
    }

    const firstFrame = this.frames[0];
    this.currentConnectionIndex = firstFrame.connection_index;
    this.circuitsRemaining = firstFrame.circuits_remaining;
    if (firstFrame.circuit_assignments) {
      this.circuitAssignments = [...firstFrame.circuit_assignments];
    }

    this.lastFrameTime = performance.now();
    this.animate();
  }

  private animate = (timestamp: number = performance.now()): void => {
    const deltaTime = timestamp - this.lastFrameTime;
    this.animationTime = timestamp;

    if (deltaTime >= FRAME_DURATION) {
      this.rotationAngle += ROTATE_SPEED * deltaTime;
      this.projectBoxes();
      this.update(deltaTime);
      this.render();
      this.lastFrameTime = timestamp - (deltaTime % FRAME_DURATION);

      if (this.currentFrameIndex >= this.frames.length && this.endCooldown > 0) {
        this.endCooldown--;
      }
    }

    if (this.currentFrameIndex < this.frames.length) {
      this.animationId = requestAnimationFrame(this.animate);
    } else if (this.endCooldown > 0) {
      this.animationId = requestAnimationFrame(this.animate);
    } else {
      this.onAnimationComplete();
    }
  };

  private update(deltaTime: number): void {
    this.particles.update();

    if (this.showFinalCelebration) {
      this.finalCelebrationTime += deltaTime;
      // End animation after celebration completes (3 seconds)
      if (this.finalCelebrationTime > 3000) {
        this.onAnimationComplete();
      }
      return;
    }

    if (this.interpolationProgress >= 1.0) {
      this.currentFrameIndex++;
      if (this.currentFrameIndex >= this.frames.length) {
        if (this.endCooldown === 0) {
          this.endCooldown = 120;
        }
        return;
      }

      const frame = this.frames[this.currentFrameIndex];
      this.currentConnectionIndex = frame.connection_index;
      this.circuitsRemaining = frame.circuits_remaining;

      if (frame.circuit_assignments) {
        this.circuitAssignments = [...frame.circuit_assignments];
      }

      // Add the connection
      if (frame.frame_type === 'connection' || frame.frame_type === 'final') {
        const conn: Connection = {
          from: frame.from_idx,
          to: frame.to_idx,
          distance: frame.distance,
        };
        this.connections.push(conn);

        // Emit particles along connection
        const fromProj = this.projectedBoxes.find(p => p.idx === frame.from_idx);
        const toProj = this.projectedBoxes.find(p => p.idx === frame.to_idx);
        if (fromProj && toProj) {
          const color = getCircuitColor(this.circuitAssignments[frame.from_idx]);
          this.particles.emitConnection(
            fromProj.screenX, fromProj.screenY,
            toProj.screenX, toProj.screenY,
            color
          );
        }

        // Final celebration
        if (frame.frame_type === 'final') {
          this.showFinalCelebration = true;
          if (fromProj && toProj) {
            this.particles.emitFinalBurst(fromProj.screenX, fromProj.screenY);
            this.particles.emitFinalBurst(toProj.screenX, toProj.screenY);
          }
        }
      }

      this.interpolationProgress = 0;
    }

    const speed = 0.6 * this.playbackSpeed;
    this.interpolationProgress += speed;
    this.interpolationProgress = Math.min(this.interpolationProgress, 1.0);
  }

  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.5, Math.min(speed, 5));
  }

  private render(): void {
    const ctx = this.ctx;

    // Clear canvas
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw starfield
    this.starField.render(ctx, this.animationTime);

    // Draw connections (sorted by depth)
    this.drawConnections();

    // Draw junction boxes
    this.drawBoxes();

    // Draw particles
    this.particles.render(ctx);

    // Draw UI
    this.drawTitle();
    this.drawStats();
    this.drawProgressBar();

    // Draw final celebration overlay
    if (this.showFinalCelebration) {
      this.drawFinalCelebration();
    }

    // Draw popups
    if (this.showDescription) {
      this.drawDescriptionPopup();
    }
    if (this.showAlgorithm) {
      this.drawAlgorithmPopup();
    }
  }

  private drawConnections(): void {
    if (!this.logData) return;
    const ctx = this.ctx;

    // Group connections by depth for proper ordering
    const connectionRenders: { depth: number; render: () => void }[] = [];

    for (let i = 0; i < this.connections.length; i++) {
      const conn = this.connections[i];
      const fromProj = this.projectedBoxes.find(p => p.idx === conn.from);
      const toProj = this.projectedBoxes.find(p => p.idx === conn.to);
      if (!fromProj || !toProj) continue;

      const avgDepth = (fromProj.depth + toProj.depth) / 2;
      const isFinal = this.showFinalCelebration && i === this.connections.length - 1;

      connectionRenders.push({
        depth: avgDepth,
        render: () => {
          const alpha = Math.min(1, 0.3 + (1 - avgDepth / 500) * 0.4);

          if (isFinal) {
            // Pulsing final connection
            const pulse = 0.5 + 0.5 * Math.sin(this.animationTime * 0.01);
            ctx.save();
            ctx.globalAlpha = 0.3 + pulse * 0.3;
            ctx.strokeStyle = theme.finalGlow;
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.moveTo(fromProj.screenX, fromProj.screenY);
            ctx.lineTo(toProj.screenX, toProj.screenY);
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.globalAlpha = 0.8 + pulse * 0.2;
            ctx.strokeStyle = theme.finalConnection;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(fromProj.screenX, fromProj.screenY);
            ctx.lineTo(toProj.screenX, toProj.screenY);
            ctx.stroke();
            ctx.restore();
          } else {
            const circuitId = this.circuitAssignments[conn.from];
            const color = getCircuitColor(circuitId);

            ctx.save();
            ctx.globalAlpha = alpha * 0.3;
            ctx.strokeStyle = color;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(fromProj.screenX, fromProj.screenY);
            ctx.lineTo(toProj.screenX, toProj.screenY);
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(fromProj.screenX, fromProj.screenY);
            ctx.lineTo(toProj.screenX, toProj.screenY);
            ctx.stroke();
            ctx.restore();
          }
        },
      });
    }

    // Sort by depth and render
    connectionRenders.sort((a, b) => a.depth - b.depth);
    for (const cr of connectionRenders) {
      cr.render();
    }
  }

  private drawBoxes(): void {
    if (!this.logData) return;
    const ctx = this.ctx;

    for (const proj of this.projectedBoxes) {
      const circuitId = this.circuitAssignments[proj.idx];
      const color = getCircuitColor(circuitId);
      const size = 2 + proj.scale * 3;
      const alpha = Math.min(1, 0.4 + proj.scale * 0.6);

      // Check if this is one of the final boxes
      const isFinalBox = this.showFinalCelebration && this.logData &&
        (proj.idx === this.logData.final_from_idx || proj.idx === this.logData.final_to_idx);

      if (isFinalBox) {
        // Pulsing glow for final boxes
        const pulse = 0.5 + 0.5 * Math.sin(this.animationTime * 0.01);
        const glowSize = size * 4 + pulse * 10;
        const gradient = ctx.createRadialGradient(
          proj.screenX, proj.screenY, 0,
          proj.screenX, proj.screenY, glowSize
        );
        gradient.addColorStop(0, theme.finalConnection);
        gradient.addColorStop(0.5, theme.finalGlow);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(proj.screenX, proj.screenY, glowSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(proj.screenX, proj.screenY, size * 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Normal glow
        ctx.save();
        ctx.globalAlpha = alpha * 0.3;
        const gradient = ctx.createRadialGradient(
          proj.screenX, proj.screenY, 0,
          proj.screenX, proj.screenY, size * 3
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(proj.screenX, proj.screenY, size * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Box core
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(proj.screenX, proj.screenY, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  private drawTitle(): void {
    const ctx = this.ctx;
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = theme.textPrimary;
    ctx.textAlign = 'center';
    ctx.fillText('Day 8: Playground', CANVAS_WIDTH / 2, 40);

    ctx.font = '14px monospace';
    ctx.fillStyle = theme.textAccent;
    ctx.fillText('Christmas Light Network', CANVAS_WIDTH / 2, 60);
  }

  private drawStats(): void {
    const ctx = this.ctx;
    const statsY = 85;

    // Connections counter
    ctx.font = '12px monospace';
    ctx.fillStyle = theme.textAccent;
    ctx.textAlign = 'left';
    ctx.fillText('CONNECTIONS', 60, statsY);

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = theme.textPrimary;
    const totalNeeded = this.logData?.total_connections_needed || 999;
    ctx.fillText(`${this.connections.length} / ${totalNeeded}`, 60, statsY + 20);

    // Circuits counter
    ctx.font = '12px monospace';
    ctx.fillStyle = theme.textAccent;
    ctx.textAlign = 'right';
    ctx.fillText('CIRCUITS', CANVAS_WIDTH - 60, statsY);

    ctx.font = 'bold 18px monospace';
    const circuitColor = this.circuitsRemaining === 1 ? '#4ecdc4' : theme.textPrimary;
    ctx.fillStyle = circuitColor;
    ctx.fillText(formatNumber(this.circuitsRemaining), CANVAS_WIDTH - 60, statsY + 20);
  }

  private drawProgressBar(): void {
    const ctx = this.ctx;
    const barWidth = 300;
    const barHeight = 12;
    const x = CANVAS_WIDTH / 2 - barWidth / 2;
    const y = CANVAS_HEIGHT - 35;

    const totalNeeded = this.logData?.total_connections_needed || 999;
    const progress = Math.min(1, this.connections.length / totalNeeded);

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Progress gradient
    const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
    gradient.addColorStop(0, theme.progressStart);
    gradient.addColorStop(0.5, theme.progressMid);
    gradient.addColorStop(1, theme.progressEnd);
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

  private drawFinalCelebration(): void {
    if (!this.logData) return;
    const ctx = this.ctx;

    // Semi-transparent overlay
    const overlayAlpha = Math.min(0.7, this.finalCelebrationTime / 2000);
    ctx.fillStyle = `rgba(10, 10, 26, ${overlayAlpha})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Pulsing glow
    const pulse = 0.5 + 0.5 * Math.sin(this.animationTime * 0.005);

    // Answer display
    const textAlpha = Math.min(1, this.finalCelebrationTime / 1000);
    ctx.save();
    ctx.globalAlpha = textAlpha;

    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = theme.finalConnection;
    ctx.textAlign = 'center';
    ctx.fillText('NETWORK COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

    ctx.font = '16px monospace';
    ctx.fillStyle = theme.textPrimary;
    ctx.fillText(
      `Final connection: Box ${this.logData.final_from_idx} ↔ Box ${this.logData.final_to_idx}`,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 25
    );

    ctx.font = '14px monospace';
    ctx.fillStyle = theme.textAccent;
    ctx.fillText(
      `X coordinates: ${formatNumber(this.logData.final_from_x)} × ${formatNumber(this.logData.final_to_x)}`,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5
    );

    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = `rgb(255, ${Math.floor(215 + pulse * 40)}, ${Math.floor(pulse * 100)})`;
    ctx.fillText(`Answer: ${formatNumber(this.logData.answer)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

    ctx.restore();
  }

  private drawDescriptionPopup(): void {
    const ctx = this.ctx;
    const popupWidth = 720;
    const popupHeight = 520;
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
    ctx.fillText('--- Day 8: Playground ---', CANVAS_WIDTH / 2, y + 30);

    // Content
    ctx.font = '12px monospace';
    ctx.fillStyle = theme.textPrimary;
    ctx.textAlign = 'left';
    let lineY = y + 55;
    const lineHeight = 16;
    const leftMargin = x + 20;

    const lines = [
      'You rematerialize in a vast underground space containing a giant playground!',
      '',
      'Elves are setting up Christmas decorations by suspending junction boxes',
      'and connecting them with strings of lights. When two boxes are connected,',
      'electricity can flow between them.',
      '',
      'The Elves want to connect all boxes so electricity reaches everywhere,',
      'while using as little string as possible (connecting nearest pairs first).',
      '',
      '--- Part One ---',
      'Connect the 1000 closest pairs of junction boxes.',
      'Multiply the sizes of the three largest circuits.',
      'Answer: 123,420',
      '',
      '--- Part Two ---',
      'Keep connecting until all boxes form ONE circuit.',
      'The final connection determines the extension cable length.',
      '',
      'Find the product of the X coordinates of the last two boxes connected.',
      '',
      'Answer: 673,096,646',
    ];

    for (const line of lines) {
      if (line.startsWith('---')) {
        ctx.fillStyle = theme.progressMid;
        ctx.font = 'bold 12px monospace';
      } else if (line.startsWith('Answer:')) {
        ctx.fillStyle = '#4ecdc4';
        ctx.font = 'bold 12px monospace';
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
    const ctx = this.ctx;
    const popupWidth = 600;
    const popupHeight = 380;
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
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = theme.textAccent;
    ctx.textAlign = 'center';
    ctx.fillText('Algorithm: Minimum Spanning Tree (Kruskal)', CANVAS_WIDTH / 2, y + 30);

    // Content
    ctx.font = '12px monospace';
    ctx.fillStyle = theme.textPrimary;
    ctx.textAlign = 'left';
    let lineY = y + 60;
    const lineHeight = 18;
    const leftMargin = x + 20;

    const lines = [
      '1. Parse all junction box 3D coordinates',
      '2. Compute Euclidean distances between all pairs',
      '3. Sort edges by distance (shortest first)',
      '4. Initialize each box in its own circuit (Union-Find)',
      '5. For each edge in sorted order:',
      '   • If boxes are in DIFFERENT circuits → connect them',
      '   • If boxes are in SAME circuit → skip (would create cycle)',
      '6. Continue until all boxes are in ONE circuit',
      '',
      'This builds a Minimum Spanning Tree connecting all boxes',
      'with the minimum total wire length.',
      '',
      'The FINAL connection is the one that merges the last',
      'two separate circuits into a single network.',
      '',
      'Time complexity: O(E log E) where E = n(n-1)/2 edges',
    ];

    for (const line of lines) {
      if (line.startsWith('   •')) {
        ctx.fillStyle = theme.textAccent;
      } else if (line.includes('FINAL') || line.includes('DIFFERENT') || line.includes('SAME')) {
        ctx.fillStyle = theme.progressMid;
      } else {
        ctx.fillStyle = theme.textPrimary;
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
      a.download = 'day08-playground.webm';
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

let visualizer: PlaygroundVisualizer;

window.addEventListener('DOMContentLoaded', () => {
  visualizer = new PlaygroundVisualizer('canvas');

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
