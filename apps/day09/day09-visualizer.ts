// Day 9: Movie Theater - Visualization
// Renders the search for the largest rectangle within a polygon

interface Corner {
  x: number;
  y: number;
  index: number;
}

interface Rectangle {
  corner1: Corner;
  corner2: Corner;
  area: number;
  isValid: boolean;
  isNewBest: boolean;
}

interface Frame {
  frameType: "initial" | "candidate" | "newBest" | "final";
  corners: Corner[];
  edges: Array<{ from: Corner; to: Corner }>;
  candidate?: Rectangle;
  bestRectangle?: Rectangle;
  pairsTested: number;
  totalPairs: number;
  validCount: number;
  bestArea: number;
}

interface LogData {
  puzzleDay: number;
  puzzleName: string;
  part: number;
  frames: Frame[];
  finalAnswer: number;
}

// Theme colors
const COLORS = {
  background: "#2D1B2E",
  polygonInterior: "#C9A227",
  polygonBoundary: "#F5E6C8",
  redCorners: "#B22234",
  candidateRect: "#E8B4B8",
  validRect: "#2E8B57",
  invalidRect: "#4A4A4A",
  bestRect: "#FFD700",
  text: "#FFFFF0",
  accent: "#C0C0C0",
  filmStrip: "#1a1a1a",
};

class Day09Visualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private logData: LogData | null = null;
  private frames: Frame[] = [];
  private currentFrameIndex = 0;
  private isPlaying = false;
  private playbackSpeed = 1;
  private animationId: number | null = null;
  private lastFrameTime = 0;
  private frameDuration = 1000 / 30; // 30fps base

  // Recording
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;

  // Viewport
  private minX = 0;
  private maxX = 100000;
  private minY = 0;
  private maxY = 100000;
  private padding = 60;

  // Animation state
  private spotlightPhase = 0;
  private glowPhase = 0;

  // UI Elements
  private descriptionModal: HTMLElement | null = null;
  private algorithmModal: HTMLElement | null = null;

  constructor() {
    this.canvas = document.getElementById("visualizer") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;
    this.setupCanvas();
    this.setupEventListeners();
    this.setupModals();
    this.drawInitialState();
  }

  private setupCanvas(): void {
    // 720p resolution
    this.canvas.width = 1280;
    this.canvas.height = 720;
  }

  private setupEventListeners(): void {
    document.getElementById("fileInput")?.addEventListener("change", (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) this.loadJSON(file);
    });

    document.getElementById("playBtn")?.addEventListener("click", () => this.play());
    document.getElementById("pauseBtn")?.addEventListener("click", () => this.pause());
    document.getElementById("resetBtn")?.addEventListener("click", () => this.reset());
    document.getElementById("recordBtn")?.addEventListener("click", () => this.toggleRecording());

    document.getElementById("speedControl")?.addEventListener("input", (e) => {
      this.playbackSpeed = parseFloat((e.target as HTMLInputElement).value);
      document.getElementById("speedValue")!.textContent = `${this.playbackSpeed.toFixed(1)}x`;
    });

    document.getElementById("descriptionBtn")?.addEventListener("click", () => {
      this.showModal(this.descriptionModal);
    });

    document.getElementById("algorithmBtn")?.addEventListener("click", () => {
      this.showModal(this.algorithmModal);
    });
  }

  private setupModals(): void {
    this.descriptionModal = document.getElementById("descriptionModal");
    this.algorithmModal = document.getElementById("algorithmModal");

    document.querySelectorAll(".modal-close").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.descriptionModal?.classList.add("hidden");
        this.algorithmModal?.classList.add("hidden");
      });
    });

    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          (modal as HTMLElement).classList.add("hidden");
        }
      });
    });
  }

  private showModal(modal: HTMLElement | null): void {
    modal?.classList.remove("hidden");
  }

  private async loadJSON(file: File): Promise<void> {
    const text = await file.text();
    this.logData = JSON.parse(text) as LogData;
    this.frames = this.logData.frames;

    // Calculate viewport bounds from corners
    if (this.frames.length > 0 && this.frames[0].corners) {
      const corners = this.frames[0].corners;
      this.minX = Math.min(...corners.map((c) => c.x));
      this.maxX = Math.max(...corners.map((c) => c.x));
      this.minY = Math.min(...corners.map((c) => c.y));
      this.maxY = Math.max(...corners.map((c) => c.y));
    }

    this.currentFrameIndex = 0;
    this.renderFrame(this.frames[0]);
    this.updateStatus("Loaded: " + this.frames.length + " frames");
  }

  private worldToScreen(x: number, y: number): { x: number; y: number } {
    const availableWidth = this.canvas.width - 2 * this.padding - 200; // Reserve space for stats
    const availableHeight = this.canvas.height - 2 * this.padding;
    const scaleX = availableWidth / (this.maxX - this.minX);
    const scaleY = availableHeight / (this.maxY - this.minY);
    const scale = Math.min(scaleX, scaleY);

    return {
      x: this.padding + (x - this.minX) * scale,
      y: this.padding + (y - this.minY) * scale,
    };
  }

  private drawInitialState(): void {
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawFilmStripBorder();
    this.drawTitle("Day 9: Movie Theater", "Load a recording.json to begin");
  }

  private drawFilmStripBorder(): void {
    const ctx = this.ctx;
    const stripHeight = 25;

    // Top strip
    ctx.fillStyle = COLORS.filmStrip;
    ctx.fillRect(0, 0, this.canvas.width, stripHeight);

    // Bottom strip
    ctx.fillRect(0, this.canvas.height - stripHeight, this.canvas.width, stripHeight);

    // Sprocket holes
    ctx.fillStyle = COLORS.background;
    const holeWidth = 15;
    const holeHeight = 12;
    const spacing = 40;

    for (let x = 10; x < this.canvas.width; x += spacing) {
      // Top holes
      ctx.fillRect(x, 6, holeWidth, holeHeight);
      // Bottom holes
      ctx.fillRect(x, this.canvas.height - 18, holeWidth, holeHeight);
    }
  }

  private drawTitle(title: string, subtitle: string): void {
    const ctx = this.ctx;
    ctx.textAlign = "center";

    // Art deco style title
    ctx.font = "bold 48px Georgia, serif";
    ctx.fillStyle = COLORS.bestRect;
    ctx.fillText(title, this.canvas.width / 2, this.canvas.height / 2 - 20);

    ctx.font = "24px Georgia, serif";
    ctx.fillStyle = COLORS.text;
    ctx.fillText(subtitle, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }

  private renderFrame(frame: Frame): void {
    const ctx = this.ctx;

    // Clear and draw background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawFilmStripBorder();

    // Draw polygon interior (filled)
    this.drawPolygonInterior(frame.corners);

    // Draw polygon edges
    this.drawPolygonEdges(frame.edges);

    // Draw corner markers
    this.drawCorners(frame.corners, frame.candidate);

    // Draw current best rectangle
    if (frame.bestRectangle) {
      this.drawRectangle(frame.bestRectangle, "best");
    }

    // Draw candidate rectangle
    if (frame.candidate) {
      const type = frame.candidate.isNewBest
        ? "newBest"
        : frame.candidate.isValid
          ? "valid"
          : "invalid";
      this.drawRectangle(frame.candidate, type);
    }

    // Draw stats panel
    this.drawStatsPanel(frame);

    // Draw progress bar
    this.drawProgressBar(frame.pairsTested, frame.totalPairs);

    // Draw title
    this.drawPuzzleTitle();

    // Final frame special treatment
    if (frame.frameType === "final") {
      this.drawFinalOverlay(frame);
    }
  }

  private drawPolygonInterior(corners: Corner[]): void {
    if (corners.length < 3) return;

    const ctx = this.ctx;
    ctx.beginPath();

    const first = this.worldToScreen(corners[0].x, corners[0].y);
    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < corners.length; i++) {
      const pt = this.worldToScreen(corners[i].x, corners[i].y);
      ctx.lineTo(pt.x, pt.y);
    }

    ctx.closePath();

    // Gradient fill for theater floor effect
    const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, COLORS.polygonInterior);
    gradient.addColorStop(0.5, "#D4AF37");
    gradient.addColorStop(1, COLORS.polygonInterior);

    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.4;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Subtle tile pattern
    this.drawTilePattern(corners);
  }

  private drawTilePattern(corners: Corner[]): void {
    const ctx = this.ctx;
    ctx.save();

    // Clip to polygon
    ctx.beginPath();
    const first = this.worldToScreen(corners[0].x, corners[0].y);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < corners.length; i++) {
      const pt = this.worldToScreen(corners[i].x, corners[i].y);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.clip();

    // Draw tile grid
    ctx.strokeStyle = COLORS.polygonInterior;
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 0.5;

    const tileSize = 20;
    for (let x = 0; x < this.canvas.width; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawPolygonEdges(edges: Array<{ from: Corner; to: Corner }>): void {
    const ctx = this.ctx;
    ctx.strokeStyle = COLORS.polygonBoundary;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    for (const edge of edges) {
      const from = this.worldToScreen(edge.from.x, edge.from.y);
      const to = this.worldToScreen(edge.to.x, edge.to.y);

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }

  private drawCorners(corners: Corner[], candidate?: Rectangle): void {
    const ctx = this.ctx;
    const size = 6;

    for (const corner of corners) {
      const pt = this.worldToScreen(corner.x, corner.y);

      // Highlight candidate corners
      const isCandidate =
        candidate &&
        (corner.index === candidate.corner1.index || corner.index === candidate.corner2.index);

      if (isCandidate) {
        // Glowing highlight
        ctx.shadowColor = COLORS.bestRect;
        ctx.shadowBlur = 15;
      }

      // Diamond shape for corners
      ctx.fillStyle = isCandidate ? COLORS.bestRect : COLORS.redCorners;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y - size);
      ctx.lineTo(pt.x + size, pt.y);
      ctx.lineTo(pt.x, pt.y + size);
      ctx.lineTo(pt.x - size, pt.y);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
    }
  }

  private drawRectangle(rect: Rectangle, type: "best" | "valid" | "invalid" | "newBest"): void {
    const ctx = this.ctx;

    const p1 = this.worldToScreen(rect.corner1.x, rect.corner1.y);
    const p2 = this.worldToScreen(rect.corner2.x, rect.corner2.y);

    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const w = Math.abs(p2.x - p1.x);
    const h = Math.abs(p2.y - p1.y);

    // Skip very thin rectangles visually
    if (w < 2 && h < 2) return;

    ctx.save();

    if (type === "best" || type === "newBest") {
      // Glowing effect for best rectangle
      this.glowPhase += 0.1;
      const glowIntensity = 10 + Math.sin(this.glowPhase) * 5;
      ctx.shadowColor = COLORS.bestRect;
      ctx.shadowBlur = glowIntensity;

      ctx.strokeStyle = COLORS.bestRect;
      ctx.lineWidth = 3;
      ctx.fillStyle = COLORS.bestRect + "40";
    } else if (type === "valid") {
      ctx.strokeStyle = COLORS.validRect;
      ctx.lineWidth = 2;
      ctx.fillStyle = COLORS.validRect + "30";
    } else {
      ctx.strokeStyle = COLORS.invalidRect;
      ctx.lineWidth = 1;
      ctx.fillStyle = COLORS.invalidRect + "20";
    }

    // Rounded rectangle
    const radius = 3;
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

    ctx.fill();
    ctx.stroke();

    // Spotlight effect for new best
    if (type === "newBest") {
      this.drawSpotlight(x + w / 2, y + h / 2);
    }

    ctx.restore();
  }

  private drawSpotlight(cx: number, cy: number): void {
    const ctx = this.ctx;
    this.spotlightPhase += 0.15;

    const maxRadius = 100;
    const radius = (Math.sin(this.spotlightPhase) + 1) * 0.5 * maxRadius;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, COLORS.bestRect + "60");
    gradient.addColorStop(0.5, COLORS.bestRect + "20");
    gradient.addColorStop(1, COLORS.bestRect + "00");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawStatsPanel(frame: Frame): void {
    const ctx = this.ctx;
    const panelX = this.canvas.width - 190;
    const panelY = 40;
    const panelWidth = 180;
    const panelHeight = 180;

    // Panel background
    ctx.fillStyle = "#1a1a1a";
    ctx.globalAlpha = 0.85;
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.globalAlpha = 1;

    // Panel border
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Art deco corner accents
    this.drawArtDecoCorner(panelX, panelY, 1, 1);
    this.drawArtDecoCorner(panelX + panelWidth, panelY, -1, 1);
    this.drawArtDecoCorner(panelX, panelY + panelHeight, 1, -1);
    this.drawArtDecoCorner(panelX + panelWidth, panelY + panelHeight, -1, -1);

    // Stats text
    ctx.font = "14px Monaco, monospace";
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "left";

    const lines = [
      `Pairs: ${frame.pairsTested.toLocaleString()}/${frame.totalPairs.toLocaleString()}`,
      `Valid: ${frame.validCount.toLocaleString()}`,
      `Best Area:`,
      `  ${frame.bestArea.toLocaleString()}`,
    ];

    lines.forEach((line, i) => {
      ctx.fillText(line, panelX + 12, panelY + 30 + i * 22);
    });

    // Progress percentage
    const pct = ((frame.pairsTested / frame.totalPairs) * 100).toFixed(1);
    ctx.font = "bold 28px Georgia, serif";
    ctx.fillStyle = COLORS.bestRect;
    ctx.textAlign = "center";
    ctx.fillText(`${pct}%`, panelX + panelWidth / 2, panelY + panelHeight - 20);
  }

  private drawArtDecoCorner(x: number, y: number, dx: number, dy: number): void {
    const ctx = this.ctx;
    const size = 10;

    ctx.strokeStyle = COLORS.bestRect;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + dy * size);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * size, y);
    ctx.stroke();
  }

  private drawProgressBar(current: number, total: number): void {
    const ctx = this.ctx;
    const barHeight = 8;
    const barY = this.canvas.height - 35;
    const barX = 50;
    const barWidth = this.canvas.width - 100;

    // Background
    ctx.fillStyle = COLORS.filmStrip;
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress
    const progress = current / total;
    const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth * progress, 0);
    gradient.addColorStop(0, COLORS.polygonInterior);
    gradient.addColorStop(1, COLORS.bestRect);
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Border
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  private drawPuzzleTitle(): void {
    const ctx = this.ctx;
    ctx.font = "bold 20px Georgia, serif";
    ctx.fillStyle = COLORS.bestRect;
    ctx.textAlign = "left";
    ctx.fillText("Day 9: Movie Theater", 50, 55);

    ctx.font = "14px Georgia, serif";
    ctx.fillStyle = COLORS.text;
    ctx.fillText("Part 2 - Finding Largest Rectangle", 50, 75);
  }

  private drawFinalOverlay(frame: Frame): void {
    const ctx = this.ctx;

    // Dim background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Final result banner
    const bannerY = this.canvas.height / 2;

    ctx.font = "bold 36px Georgia, serif";
    ctx.fillStyle = COLORS.bestRect;
    ctx.textAlign = "center";
    ctx.fillText("★ LARGEST RECTANGLE FOUND ★", this.canvas.width / 2, bannerY - 30);

    ctx.font = "bold 48px Georgia, serif";
    ctx.fillText(`Area: ${frame.bestArea.toLocaleString()}`, this.canvas.width / 2, bannerY + 30);

    ctx.font = "24px Georgia, serif";
    ctx.fillStyle = COLORS.text;
    ctx.fillText("THE END", this.canvas.width / 2, bannerY + 80);
  }

  private play(): void {
    if (!this.frames.length) return;
    this.isPlaying = true;
    this.lastFrameTime = performance.now();
    this.animate();
  }

  private pause(): void {
    this.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private reset(): void {
    this.pause();
    this.currentFrameIndex = 0;
    if (this.frames.length) {
      this.renderFrame(this.frames[0]);
    }
  }

  private animate(): void {
    if (!this.isPlaying) return;

    const now = performance.now();
    const elapsed = now - this.lastFrameTime;
    const targetDuration = this.frameDuration / this.playbackSpeed;

    if (elapsed >= targetDuration) {
      this.currentFrameIndex++;

      if (this.currentFrameIndex >= this.frames.length) {
        this.pause();
        if (this.isRecording) {
          this.stopRecording();
        }
        this.currentFrameIndex = 0;
        return;
      }

      this.renderFrame(this.frames[this.currentFrameIndex]);
      this.lastFrameTime = now;
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private getSupportedMimeType(): string {
    const types = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return "video/webm";
  }

  private toggleRecording(): void {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  private startRecording(): void {
    const mimeType = this.getSupportedMimeType();
    const stream = this.canvas.captureStream(30);

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 5000000,
    });

    this.recordedChunks = [];

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "day09-movie-theater.webm";
      a.click();
      URL.revokeObjectURL(url);
    };

    this.isRecording = true;
    this.mediaRecorder.start();

    // Reset and play
    this.reset();
    this.play();

    document.getElementById("recordBtn")!.textContent = "⏹ Stop Recording";
    this.updateStatus("Recording...");
  }

  private stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      document.getElementById("recordBtn")!.textContent = "⏺ Record";
      this.updateStatus("Recording saved");
    }
  }

  private updateStatus(message: string): void {
    const status = document.getElementById("status");
    if (status) {
      status.textContent = message;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new Day09Visualizer();
});
