// Day 12: Christmas Tree Farm - Visualization
// Renders present packing evaluation with festive Christmas theme

// Shape definition
interface Shape {
  id: number;
  pattern: boolean[][]; // 3x3 grid, true = filled
  area: number;
}

// Region definition
interface Region {
  index: number;
  width: number;
  height: number;
  counts: number[]; // count of each shape needed
}

// Sparse frame from JSON log
interface Day12SparseFrame {
  frameType: "intro" | "regionStart" | "areaCheck" | "slotCheck" | "verdict" | "batchUpdate" | "summary";
  regionIndex?: number;
  regionWidth?: number;
  regionHeight?: number;
  regionCounts?: number[];
  presentArea?: number;
  regionArea?: number;
  numSlots?: number;
  totalPresents?: number;
  verdict?: "accepted" | "rejected" | "undetermined";
  acceptedCount?: number;
  rejectedCount?: number;
  undeterminedCount?: number;
  message?: string;
}

// Expanded frame for rendering
interface Day12Frame {
  frameType: "intro" | "regionStart" | "areaCheck" | "slotCheck" | "verdict" | "batchUpdate" | "summary";
  regionIndex: number;
  regionWidth: number;
  regionHeight: number;
  regionCounts: number[];
  presentArea: number;
  regionArea: number;
  numSlots: number;
  totalPresents: number;
  verdict: "accepted" | "rejected" | "undetermined" | "pending";
  acceptedCount: number;
  rejectedCount: number;
  undeterminedCount: number;
  message: string;
}

interface Day12LogData {
  puzzleDay: number;
  puzzleName: string;
  part: number;
  shapes: Array<{ id: number; pattern: string[]; area: number }>;
  totalRegions: number;
  frames: Day12SparseFrame[];
  finalAnswer: number;
}

// Theme colors - festive Christmas tree farm
const DAY12_COLORS = {
  background: "#1a2f1a",
  panelBg: "#0f1f0f",
  panelBorder: "#228b22",
  gridBg: "#f5f5f0",
  gridLines: "#3d5c3d",
  shapes: ["#dc143c", "#ffd700", "#228b22", "#c0c0c0", "#ff69b4", "#87ceeb"],
  accepted: "#00ff7f",
  rejected: "#ff4444",
  undetermined: "#ffaa00",
  text: "#fffaf0",
  textDim: "#8a9a8a",
  textGold: "#ffd700",
  textRed: "#dc143c",
  counterBg: "#0a1510",
  sparkle: "#ffd700",
  slotGrid: "rgba(34, 139, 34, 0.3)",
};

class Day12Visualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private logData: Day12LogData | null = null;
  private shapes: Shape[] = [];
  private sparseFrames: Day12SparseFrame[] = [];
  private expandedFrames: Day12Frame[] = [];
  private currentFrameIndex = 0;
  private isPlaying = false;
  private playbackSpeed = 1;
  private animationId: number | null = null;
  private lastFrameTime = 0;
  private frameDuration = 1000 / 30;

  // Recording
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;

  // Animation state
  private pulsePhase = 0;
  private sparklePhase = 0;
  private verdictAnimPhase = 0;

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
    this.logData = JSON.parse(text) as Day12LogData;
    this.sparseFrames = this.logData.frames;
    this.currentFrameIndex = 0;
    this.parseShapes();
    this.expandFrames();
    this.renderFrame(this.expandedFrames[0]);
    this.updateStatus("Loaded: " + this.expandedFrames.length + " frames");
  }

  private parseShapes(): void {
    if (!this.logData) return;
    this.shapes = this.logData.shapes.map((s) => ({
      id: s.id,
      pattern: s.pattern.map((row) => row.split("").map((c) => c === "#")),
      area: s.area,
    }));
  }

  private expandFrames(): void {
    this.expandedFrames = [];

    // Track cumulative state
    let acceptedCount = 0;
    let rejectedCount = 0;
    let undeterminedCount = 0;
    let lastRegionIndex = 0;
    let lastRegionWidth = 0;
    let lastRegionHeight = 0;
    let lastRegionCounts: number[] = [];
    let lastPresentArea = 0;
    let lastRegionArea = 0;
    let lastNumSlots = 0;
    let lastTotalPresents = 0;
    let lastVerdict: "accepted" | "rejected" | "undetermined" | "pending" = "pending";

    for (const sparse of this.sparseFrames) {
      // Update cumulative counters
      if (sparse.acceptedCount !== undefined) acceptedCount = sparse.acceptedCount;
      if (sparse.rejectedCount !== undefined) rejectedCount = sparse.rejectedCount;
      if (sparse.undeterminedCount !== undefined) undeterminedCount = sparse.undeterminedCount;

      // Update region info
      if (sparse.regionIndex !== undefined) lastRegionIndex = sparse.regionIndex;
      if (sparse.regionWidth !== undefined) lastRegionWidth = sparse.regionWidth;
      if (sparse.regionHeight !== undefined) lastRegionHeight = sparse.regionHeight;
      if (sparse.regionCounts !== undefined) lastRegionCounts = sparse.regionCounts;
      if (sparse.presentArea !== undefined) lastPresentArea = sparse.presentArea;
      if (sparse.regionArea !== undefined) lastRegionArea = sparse.regionArea;
      if (sparse.numSlots !== undefined) lastNumSlots = sparse.numSlots;
      if (sparse.totalPresents !== undefined) lastTotalPresents = sparse.totalPresents;
      if (sparse.verdict !== undefined) lastVerdict = sparse.verdict;

      // Reset verdict for new region
      if (sparse.frameType === "regionStart") {
        lastVerdict = "pending";
      }

      const expanded: Day12Frame = {
        frameType: sparse.frameType,
        regionIndex: lastRegionIndex,
        regionWidth: lastRegionWidth,
        regionHeight: lastRegionHeight,
        regionCounts: [...lastRegionCounts],
        presentArea: lastPresentArea,
        regionArea: lastRegionArea,
        numSlots: lastNumSlots,
        totalPresents: lastTotalPresents,
        verdict: lastVerdict,
        acceptedCount,
        rejectedCount,
        undeterminedCount,
        message: sparse.message || "",
      };

      this.expandedFrames.push(expanded);
    }
  }

  private drawInitialState(): void {
    const ctx = this.ctx;
    ctx.fillStyle = DAY12_COLORS.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawFestiveBorder();
    this.drawTitle("Day 12: Christmas Tree Farm", "Load a recording.json to begin");
  }

  private drawFestiveBorder(): void {
    const ctx = this.ctx;

    // Pine green border with gold accents
    ctx.strokeStyle = DAY12_COLORS.panelBorder;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, this.canvas.width - 8, this.canvas.height - 8);

    // Gold corner accents
    ctx.strokeStyle = DAY12_COLORS.textGold;
    ctx.lineWidth = 2;
    const cornerSize = 30;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(10, 10 + cornerSize);
    ctx.lineTo(10, 10);
    ctx.lineTo(10 + cornerSize, 10);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(this.canvas.width - 10 - cornerSize, 10);
    ctx.lineTo(this.canvas.width - 10, 10);
    ctx.lineTo(this.canvas.width - 10, 10 + cornerSize);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(10, this.canvas.height - 10 - cornerSize);
    ctx.lineTo(10, this.canvas.height - 10);
    ctx.lineTo(10 + cornerSize, this.canvas.height - 10);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(this.canvas.width - 10 - cornerSize, this.canvas.height - 10);
    ctx.lineTo(this.canvas.width - 10, this.canvas.height - 10);
    ctx.lineTo(this.canvas.width - 10, this.canvas.height - 10 - cornerSize);
    ctx.stroke();
  }

  private drawTitle(title: string, subtitle: string): void {
    const ctx = this.ctx;
    ctx.textAlign = "center";

    ctx.font = "bold 48px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.textGold;
    ctx.shadowColor = DAY12_COLORS.textGold;
    ctx.shadowBlur = 20;
    ctx.fillText(title, this.canvas.width / 2, this.canvas.height / 2 - 20);
    ctx.shadowBlur = 0;

    ctx.font = "24px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.text;
    ctx.fillText(subtitle, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }

  private renderFrame(frame: Day12Frame): void {
    const ctx = this.ctx;
    this.pulsePhase += 0.1;
    this.sparklePhase += 0.05;
    this.verdictAnimPhase += 0.15;

    // Clear and draw background
    ctx.fillStyle = DAY12_COLORS.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawFestiveBorder();
    this.drawTreePattern();

    // Draw based on frame type
    switch (frame.frameType) {
      case "intro":
        this.drawIntroFrame();
        break;
      case "summary":
        this.drawSummaryFrame(frame);
        break;
      default:
        this.drawRegionFrame(frame);
        break;
    }

    this.drawPuzzleTitle();
    this.drawCounters(frame);
    this.drawProgressBar(frame);
  }

  private drawTreePattern(): void {
    const ctx = this.ctx;
    // Subtle tree silhouettes in background
    ctx.fillStyle = "rgba(34, 80, 34, 0.1)";

    for (let i = 0; i < 5; i++) {
      const x = 100 + i * 280;
      const y = this.canvas.height - 50;
      this.drawTreeSilhouette(x, y, 60 + Math.sin(i * 1.5) * 20);
    }
  }

  private drawTreeSilhouette(x: number, y: number, size: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    // Triangle tree shape
    ctx.moveTo(x, y - size * 2);
    ctx.lineTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.closePath();
    ctx.fill();
  }

  private drawIntroFrame(): void {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;

    // Title
    ctx.textAlign = "center";
    ctx.font = "bold 32px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.textGold;
    ctx.fillText("PRESENT SHAPES", centerX, 80);

    ctx.font = "18px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.text;
    ctx.fillText("6 standard shapes to fit under the Christmas trees", centerX, 115);

    // Draw all 6 shapes in a row
    const shapeSize = 25;
    const shapeSpacing = 180;
    const startX = centerX - (shapeSpacing * 2.5);
    const shapeY = 200;

    this.shapes.forEach((shape, i) => {
      const x = startX + i * shapeSpacing;
      this.drawShapePreview(x, shapeY, shape, shapeSize, true);
    });

    // Show what we're checking
    ctx.font = "24px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.text;
    ctx.fillText("Checking 1000 regions...", centerX, 420);

    ctx.font = "18px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.textDim;
    ctx.fillText("Can the required presents fit under each tree?", centerX, 460);

    // Decision rules
    ctx.textAlign = "left";
    ctx.font = "16px 'Courier New', monospace";

    ctx.fillStyle = DAY12_COLORS.rejected;
    ctx.fillText("REJECT: Present area > Region area", centerX - 250, 520);

    ctx.fillStyle = DAY12_COLORS.accepted;
    ctx.fillText("ACCEPT: Present count ≤ 3x3 slots", centerX - 250, 555);

    ctx.fillStyle = DAY12_COLORS.undetermined;
    ctx.fillText("UNDETERMINED: Needs deeper analysis", centerX - 250, 590);
  }

  private drawShapePreview(
    x: number,
    y: number,
    shape: Shape,
    cellSize: number,
    showLabel: boolean
  ): void {
    const ctx = this.ctx;
    const color = DAY12_COLORS.shapes[shape.id % 6];

    // Draw 3x3 grid
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cellX = x + col * cellSize - (cellSize * 1.5);
        const cellY = y + row * cellSize - (cellSize * 1.5);

        if (shape.pattern[row] && shape.pattern[row][col]) {
          // Filled cell
          ctx.fillStyle = color;
          ctx.fillRect(cellX, cellY, cellSize - 2, cellSize - 2);

          // Highlight
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          ctx.fillRect(cellX, cellY, cellSize - 2, (cellSize - 2) / 3);
        } else {
          // Empty cell - subtle outline
          ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
          ctx.lineWidth = 1;
          ctx.strokeRect(cellX, cellY, cellSize - 2, cellSize - 2);
        }
      }
    }

    if (showLabel) {
      // Shape label
      ctx.textAlign = "center";
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.fillStyle = color;
      ctx.fillText(`Shape ${shape.id}`, x, y + cellSize * 2);

      ctx.font = "12px 'Courier New', monospace";
      ctx.fillStyle = DAY12_COLORS.textDim;
      ctx.fillText(`(${shape.area} cells)`, x, y + cellSize * 2 + 18);
    }
  }

  private drawRegionFrame(frame: Day12Frame): void {
    const ctx = this.ctx;

    // Left side: Region visualization
    this.drawRegionGrid(frame);

    // Right side: Calculation details
    this.drawCalculationPanel(frame);

    // Draw required presents below region
    this.drawRequiredPresents(frame);
  }

  private drawRegionGrid(frame: Day12Frame): void {
    const ctx = this.ctx;
    const gridX = 80;
    const gridY = 120;
    const maxGridWidth = 500;
    const maxGridHeight = 350;

    // Calculate cell size to fit
    const cellSize = Math.min(
      maxGridWidth / frame.regionWidth,
      maxGridHeight / frame.regionHeight,
      15
    );

    const actualWidth = frame.regionWidth * cellSize;
    const actualHeight = frame.regionHeight * cellSize;

    // Region label
    ctx.textAlign = "left";
    ctx.font = "bold 18px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.textGold;
    ctx.fillText(`Region ${frame.regionIndex + 1}`, gridX, gridY - 30);

    ctx.font = "14px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.text;
    ctx.fillText(`${frame.regionWidth} × ${frame.regionHeight} = ${frame.regionArea} cells`, gridX, gridY - 10);

    // Draw grid background
    ctx.fillStyle = DAY12_COLORS.gridBg;
    ctx.fillRect(gridX, gridY, actualWidth, actualHeight);

    // Draw grid lines
    ctx.strokeStyle = DAY12_COLORS.gridLines;
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= frame.regionWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(gridX + x * cellSize, gridY);
      ctx.lineTo(gridX + x * cellSize, gridY + actualHeight);
      ctx.stroke();
    }

    for (let y = 0; y <= frame.regionHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(gridX, gridY + y * cellSize);
      ctx.lineTo(gridX + actualWidth, gridY + y * cellSize);
      ctx.stroke();
    }

    // Draw 3x3 slot overlay for slot check
    if (frame.frameType === "slotCheck" || (frame.frameType === "verdict" && frame.verdict === "accepted")) {
      this.drawSlotOverlay(gridX, gridY, frame.regionWidth, frame.regionHeight, cellSize);
    }

    // Border
    ctx.strokeStyle = DAY12_COLORS.panelBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(gridX, gridY, actualWidth, actualHeight);
  }

  private drawSlotOverlay(
    gridX: number,
    gridY: number,
    width: number,
    height: number,
    cellSize: number
  ): void {
    const ctx = this.ctx;
    const slotsX = Math.floor(width / 3);
    const slotsY = Math.floor(height / 3);

    ctx.fillStyle = DAY12_COLORS.slotGrid;
    ctx.strokeStyle = DAY12_COLORS.accepted;
    ctx.lineWidth = 2;

    for (let sy = 0; sy < slotsY; sy++) {
      for (let sx = 0; sx < slotsX; sx++) {
        const x = gridX + sx * 3 * cellSize;
        const y = gridY + sy * 3 * cellSize;
        const slotWidth = 3 * cellSize;
        const slotHeight = 3 * cellSize;

        ctx.fillRect(x, y, slotWidth, slotHeight);
        ctx.strokeRect(x, y, slotWidth, slotHeight);
      }
    }
  }

  private drawCalculationPanel(frame: Day12Frame): void {
    const ctx = this.ctx;
    const panelX = 620;
    const panelY = 120;
    const panelWidth = 350;
    const panelHeight = 280;

    // Panel background
    ctx.fillStyle = DAY12_COLORS.panelBg;
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = DAY12_COLORS.panelBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Title
    ctx.textAlign = "center";
    ctx.font = "bold 16px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.textGold;
    ctx.fillText("ANALYSIS", panelX + panelWidth / 2, panelY + 25);

    ctx.textAlign = "left";
    const textX = panelX + 20;
    let textY = panelY + 60;

    // Area calculation
    ctx.font = "14px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.text;
    ctx.fillText("Area Check:", textX, textY);
    textY += 25;

    ctx.fillStyle = DAY12_COLORS.textDim;
    ctx.fillText(`  Region area: ${frame.regionArea}`, textX, textY);
    textY += 20;
    ctx.fillText(`  Present area: ${frame.presentArea}`, textX, textY);
    textY += 25;

    // Area result
    const areaPass = frame.presentArea <= frame.regionArea;
    ctx.fillStyle = areaPass ? DAY12_COLORS.accepted : DAY12_COLORS.rejected;
    ctx.fillText(`  ${frame.presentArea} ${areaPass ? "≤" : ">"} ${frame.regionArea} → ${areaPass ? "PASS" : "REJECT"}`, textX, textY);
    textY += 40;

    // Slot calculation (only show if area passed)
    if (areaPass && (frame.frameType === "slotCheck" || frame.frameType === "verdict")) {
      ctx.fillStyle = DAY12_COLORS.text;
      ctx.fillText("Slot Check:", textX, textY);
      textY += 25;

      ctx.fillStyle = DAY12_COLORS.textDim;
      ctx.fillText(`  3×3 slots: ${frame.numSlots}`, textX, textY);
      textY += 20;
      ctx.fillText(`  Total presents: ${frame.totalPresents}`, textX, textY);
      textY += 25;

      const slotPass = frame.totalPresents <= frame.numSlots;
      ctx.fillStyle = slotPass ? DAY12_COLORS.accepted : DAY12_COLORS.undetermined;
      ctx.fillText(`  ${frame.totalPresents} ${slotPass ? "≤" : ">"} ${frame.numSlots} → ${slotPass ? "ACCEPT" : "UNDETERMINED"}`, textX, textY);
    }

    // Verdict display
    if (frame.frameType === "verdict" || frame.verdict !== "pending") {
      this.drawVerdictBadge(panelX + panelWidth / 2, panelY + panelHeight - 40, frame.verdict);
    }
  }

  private drawVerdictBadge(x: number, y: number, verdict: string): void {
    const ctx = this.ctx;

    let color: string;
    let text: string;

    switch (verdict) {
      case "accepted":
        color = DAY12_COLORS.accepted;
        text = "✓ ACCEPTED";
        break;
      case "rejected":
        color = DAY12_COLORS.rejected;
        text = "✗ REJECTED";
        break;
      case "undetermined":
        color = DAY12_COLORS.undetermined;
        text = "? UNDETERMINED";
        break;
      default:
        return;
    }

    // Animated glow
    const pulseIntensity = 0.5 + Math.sin(this.verdictAnimPhase) * 0.3;

    ctx.textAlign = "center";
    ctx.font = "bold 20px 'Courier New', monospace";
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15 * pulseIntensity;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
  }

  private drawRequiredPresents(frame: Day12Frame): void {
    const ctx = this.ctx;
    const startX = 80;
    const y = 520;

    ctx.textAlign = "left";
    ctx.font = "14px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.text;
    ctx.fillText("Required presents:", startX, y);

    // Draw mini shapes with counts
    const shapeSize = 12;
    let x = startX;

    frame.regionCounts.forEach((count, i) => {
      if (count > 0 && this.shapes[i]) {
        const shape = this.shapes[i];
        const color = DAY12_COLORS.shapes[i % 6];

        // Draw mini shape
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            if (shape.pattern[row] && shape.pattern[row][col]) {
              const cellX = x + col * shapeSize;
              const cellY = y + 15 + row * shapeSize;
              ctx.fillStyle = color;
              ctx.fillRect(cellX, cellY, shapeSize - 1, shapeSize - 1);
            }
          }
        }

        // Count label
        ctx.fillStyle = DAY12_COLORS.text;
        ctx.font = "bold 12px 'Courier New', monospace";
        ctx.fillText(`×${count}`, x + 40, y + 35);

        x += 80;
      }
    });
  }

  private drawCounters(frame: Day12Frame): void {
    const ctx = this.ctx;
    const panelX = 1000;
    const panelY = 120;
    const panelWidth = 250;
    const panelHeight = 200;

    // Panel background
    ctx.fillStyle = DAY12_COLORS.panelBg;
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = DAY12_COLORS.panelBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Title
    ctx.textAlign = "center";
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.textGold;
    ctx.fillText("RESULTS", panelX + panelWidth / 2, panelY + 25);

    // Counters
    const counters = [
      { label: "Accepted", value: frame.acceptedCount, color: DAY12_COLORS.accepted },
      { label: "Rejected", value: frame.rejectedCount, color: DAY12_COLORS.rejected },
      { label: "Undetermined", value: frame.undeterminedCount, color: DAY12_COLORS.undetermined },
    ];

    counters.forEach((counter, i) => {
      const y = panelY + 55 + i * 50;
      this.drawCounter(panelX + 15, y, panelWidth - 30, counter.label, counter.value, counter.color);
    });
  }

  private drawCounter(x: number, y: number, width: number, label: string, value: number, color: string): void {
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = DAY12_COLORS.counterBg;
    ctx.fillRect(x, y, width, 40);

    // Border
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, 40);

    // Label
    ctx.textAlign = "left";
    ctx.font = "12px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.textDim;
    ctx.fillText(label, x + 10, y + 16);

    // Value
    ctx.textAlign = "right";
    ctx.font = "bold 18px 'Courier New', monospace";
    ctx.fillStyle = color;
    ctx.fillText(value.toLocaleString(), x + width - 10, y + 30);
  }

  private drawSummaryFrame(frame: Day12Frame): void {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Victory overlay
    ctx.fillStyle = "rgba(15, 31, 15, 0.9)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Sparkles
    this.drawSparkles();

    // Success banner
    ctx.textAlign = "center";
    ctx.font = "bold 36px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.accepted;
    ctx.shadowColor = DAY12_COLORS.accepted;
    ctx.shadowBlur = 30;
    ctx.fillText("★ ANALYSIS COMPLETE ★", centerX, centerY - 120);
    ctx.shadowBlur = 0;

    // Final counts
    ctx.font = "20px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.text;
    ctx.fillText("Regions that can fit all presents:", centerX, centerY - 60);

    // Big answer
    ctx.font = "bold 72px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.textGold;
    ctx.shadowColor = DAY12_COLORS.textGold;
    ctx.shadowBlur = 40;
    ctx.fillText(frame.acceptedCount.toLocaleString(), centerX, centerY + 30);
    ctx.shadowBlur = 0;

    // Breakdown
    ctx.font = "18px 'Courier New', monospace";
    const breakdownY = centerY + 90;

    ctx.fillStyle = DAY12_COLORS.accepted;
    ctx.fillText(`Accepted: ${frame.acceptedCount}`, centerX - 200, breakdownY);

    ctx.fillStyle = DAY12_COLORS.rejected;
    ctx.fillText(`Rejected: ${frame.rejectedCount}`, centerX, breakdownY);

    ctx.fillStyle = DAY12_COLORS.undetermined;
    ctx.fillText(`Undetermined: ${frame.undeterminedCount}`, centerX + 200, breakdownY);

    // Total
    ctx.fillStyle = DAY12_COLORS.textDim;
    ctx.font = "14px 'Courier New', monospace";
    const total = frame.acceptedCount + frame.rejectedCount + frame.undeterminedCount;
    ctx.fillText(`Total regions analyzed: ${total}`, centerX, breakdownY + 40);
  }

  private drawSparkles(): void {
    const ctx = this.ctx;
    const sparkleCount = 40;

    for (let i = 0; i < sparkleCount; i++) {
      const angle = (i / sparkleCount) * Math.PI * 2 + this.sparklePhase;
      const radius = 200 + Math.sin(this.sparklePhase * 2 + i * 0.5) * 100;
      const x = this.canvas.width / 2 + Math.cos(angle) * radius;
      const y = this.canvas.height / 2 + Math.sin(angle) * radius * 0.6;

      const size = 2 + Math.sin(this.sparklePhase + i) * 1.5;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);

      const colors = [DAY12_COLORS.textGold, DAY12_COLORS.accepted, DAY12_COLORS.textRed];
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.5 + Math.sin(this.sparklePhase * 2 + i) * 0.3;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawPuzzleTitle(): void {
    const ctx = this.ctx;
    ctx.font = "bold 20px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.textGold;
    ctx.textAlign = "left";
    ctx.fillText("Day 12: Christmas Tree Farm", 30, 40);

    ctx.font = "14px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.text;
    ctx.fillText("Part 1 - Present Packing", 30, 60);
  }

  private drawProgressBar(frame: Day12Frame): void {
    if (!this.expandedFrames.length) return;

    const ctx = this.ctx;
    const barHeight = 6;
    const barY = this.canvas.height - 15;
    const barX = 20;
    const barWidth = this.canvas.width - 40;

    // Background track
    ctx.fillStyle = DAY12_COLORS.panelBg;
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.strokeStyle = DAY12_COLORS.gridLines;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Progress fill
    const progress = (this.currentFrameIndex + 1) / this.expandedFrames.length;
    const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth * progress, 0);
    gradient.addColorStop(0, DAY12_COLORS.panelBorder);
    gradient.addColorStop(1, DAY12_COLORS.textGold);
    ctx.fillStyle = gradient;
    ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * progress, barHeight - 2);

    // Frame counter
    ctx.font = "10px 'Courier New', monospace";
    ctx.fillStyle = DAY12_COLORS.textDim;
    ctx.textAlign = "right";

    if (this.logData) {
      const regionProgress = `Region ${frame.regionIndex + 1} / ${this.logData.totalRegions}`;
      ctx.fillText(regionProgress, barX + barWidth, barY - 3);
    }
  }

  private play(): void {
    if (!this.expandedFrames.length) return;
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
    if (this.expandedFrames.length) {
      this.renderFrame(this.expandedFrames[0]);
    }
  }

  private animate(): void {
    if (!this.isPlaying) return;

    const now = performance.now();
    const elapsed = now - this.lastFrameTime;
    const targetDuration = this.frameDuration / this.playbackSpeed;

    if (elapsed >= targetDuration) {
      this.currentFrameIndex++;

      if (this.currentFrameIndex >= this.expandedFrames.length) {
        this.currentFrameIndex = this.expandedFrames.length - 1;
        this.renderFrame(this.expandedFrames[this.currentFrameIndex]);
        this.pause();
        if (this.isRecording) {
          this.stopRecording();
        }
        return;
      }

      this.renderFrame(this.expandedFrames[this.currentFrameIndex]);
      this.lastFrameTime = now;
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private getSupportedMimeType(): string {
    const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];

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
      a.download = "day12-christmas-tree-farm.webm";
      a.click();
      URL.revokeObjectURL(url);
    };

    this.isRecording = true;
    this.mediaRecorder.start();

    this.reset();
    this.play();

    document.getElementById("recordBtn")!.textContent = "Stop Recording";
    this.updateStatus("Recording...");
  }

  private stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      document.getElementById("recordBtn")!.textContent = "Record";
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
  new Day12Visualizer();
});
