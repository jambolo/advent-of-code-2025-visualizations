// Day 10: Factory - Visualization
// Renders factory machines being configured via button presses to reach joltage targets

interface Day10Button {
  index: number;
  affectedCounters: number[];
  pressCount: number;
}

interface Day10Machine {
  id: number;
  buttons: Day10Button[];
  joltages: number[];
  currentValues: number[];
  minPresses: number;
  isComplete: boolean;
}

interface Day10Frame {
  frameType: "intro" | "machineStart" | "solving" | "solutionFound" | "buttonPress" | "complete" | "final";
  machineIndex: number;
  machine?: Day10Machine;
  activeButton?: number;
  pressedButtons?: number[];
  currentValues?: number[];
  machinesSolved: number;
  totalMachines: number;
  runningTotal: number;
  finalAnswer?: number;
}

interface Day10LogData {
  puzzleDay: number;
  puzzleName: string;
  part: number;
  frames: Day10Frame[];
  finalAnswer: number;
  totalMachines: number;
}

// Theme colors
const DAY10_COLORS = {
  background: "#1a1d23",
  panelBg: "#2d3748",
  panelBorder: "#b87333",
  buttonInactive: "#4a5568",
  buttonActive: "#f59e0b",
  buttonGlow: "#fbbf24",
  counterBg: "#1a1d23",
  counterText: "#10b981",
  counterTarget: "#fcd34d",
  wiring: "#3b82f6",
  wiringPulse: "#60a5fa",
  accent: "#dc2626",
  text: "#fef3c7",
  textDim: "#9ca3af",
  success: "#10b981",
  gold: "#fcd34d",
  rivet: "#78716c",
};

class Day10Visualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private logData: Day10LogData | null = null;
  private frames: Day10Frame[] = [];
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
  private glowPhase = 0;
  private particlePhase = 0;

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
    this.logData = JSON.parse(text) as Day10LogData;
    this.frames = this.logData.frames;
    this.currentFrameIndex = 0;
    this.renderFrame(this.frames[0]);
    this.updateStatus("Loaded: " + this.frames.length + " frames");
  }

  private drawInitialState(): void {
    const ctx = this.ctx;
    ctx.fillStyle = DAY10_COLORS.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawFactoryBorder();
    this.drawTitle("Day 10: Factory", "Load a recording.json to begin");
  }

  private drawFactoryBorder(): void {
    const ctx = this.ctx;
    const borderWidth = 20;

    // Top and bottom industrial strips
    const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, 0);
    gradient.addColorStop(0, "#3d3d3d");
    gradient.addColorStop(0.5, "#5a5a5a");
    gradient.addColorStop(1, "#3d3d3d");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, borderWidth);
    ctx.fillRect(0, this.canvas.height - borderWidth, this.canvas.width, borderWidth);

    // Rivets
    ctx.fillStyle = DAY10_COLORS.rivet;
    const rivetSpacing = 50;
    for (let x = 25; x < this.canvas.width; x += rivetSpacing) {
      this.drawRivet(x, borderWidth / 2);
      this.drawRivet(x, this.canvas.height - borderWidth / 2);
    }

    // Hazard stripes on corners
    this.drawHazardStripes(0, 0, 100, borderWidth);
    this.drawHazardStripes(this.canvas.width - 100, 0, 100, borderWidth);
    this.drawHazardStripes(0, this.canvas.height - borderWidth, 100, borderWidth);
    this.drawHazardStripes(this.canvas.width - 100, this.canvas.height - borderWidth, 100, borderWidth);
  }

  private drawRivet(x: number, y: number): void {
    const ctx = this.ctx;
    const radius = 4;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = DAY10_COLORS.rivet;
    ctx.fill();

    // Highlight
    ctx.beginPath();
    ctx.arc(x - 1, y - 1, radius / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#9ca3af";
    ctx.fill();
  }

  private drawHazardStripes(x: number, y: number, width: number, height: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    const stripeWidth = 10;
    ctx.fillStyle = "#f59e0b";
    for (let sx = x - height; sx < x + width + height; sx += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx + height, y + height);
      ctx.lineTo(sx + height + stripeWidth, y + height);
      ctx.lineTo(sx + stripeWidth, y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawTitle(title: string, subtitle: string): void {
    const ctx = this.ctx;
    ctx.textAlign = "center";

    ctx.font = "bold 48px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.gold;
    ctx.fillText(title, this.canvas.width / 2, this.canvas.height / 2 - 20);

    ctx.font = "24px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.text;
    ctx.fillText(subtitle, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }

  private renderFrame(frame: Day10Frame): void {
    const ctx = this.ctx;
    this.pulsePhase += 0.1;
    this.glowPhase += 0.08;
    this.particlePhase += 0.05;

    // Clear and draw background
    ctx.fillStyle = DAY10_COLORS.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawFactoryBorder();

    // Draw based on frame type
    switch (frame.frameType) {
      case "intro":
        this.drawIntroFrame(frame);
        break;
      case "final":
        this.drawFinalFrame(frame);
        break;
      default:
        this.drawMachineFrame(frame);
        break;
    }

    // Always draw global stats
    this.drawGlobalStats(frame);
    this.drawPuzzleTitle();
  }

  private drawIntroFrame(frame: Day10Frame): void {
    const ctx = this.ctx;

    ctx.textAlign = "center";
    ctx.font = "bold 36px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.gold;
    ctx.fillText("FACTORY INITIALIZATION", this.canvas.width / 2, 200);

    ctx.font = "24px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.text;
    ctx.fillText(`${frame.totalMachines} machines awaiting configuration`, this.canvas.width / 2, 260);

    // Draw mini machine icons
    const cols = 18;
    const rows = 10;
    const iconSize = 50;
    const startX = (this.canvas.width - cols * iconSize) / 2;
    const startY = 300;

    for (let i = 0; i < Math.min(frame.totalMachines, cols * rows); i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * iconSize + iconSize / 2;
      const y = startY + row * iconSize + iconSize / 2;

      this.drawMiniMachine(x, y, false);
    }
  }

  private drawMiniMachine(x: number, y: number, isOnline: boolean): void {
    const ctx = this.ctx;
    const size = 40;

    // Panel
    ctx.fillStyle = isOnline ? DAY10_COLORS.panelBorder : DAY10_COLORS.panelBg;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);

    // Border
    ctx.strokeStyle = isOnline ? DAY10_COLORS.gold : DAY10_COLORS.buttonInactive;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - size / 2, y - size / 2, size, size);

    // Status light
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = isOnline ? DAY10_COLORS.success : DAY10_COLORS.accent;
    ctx.fill();

    if (isOnline) {
      ctx.shadowColor = DAY10_COLORS.success;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  private drawMachineFrame(frame: Day10Frame): void {
    if (!frame.machine) return;

    const machine = frame.machine;
    const panelX = 60;
    const panelY = 80;
    const panelWidth = 900;
    const panelHeight = 520;

    // Draw main machine panel
    this.drawMachinePanel(panelX, panelY, panelWidth, panelHeight, machine, frame);

    // Draw machine queue on the right
    this.drawMachineQueue(panelX + panelWidth + 30, panelY, frame);
  }

  private drawMachinePanel(
    x: number,
    y: number,
    width: number,
    height: number,
    machine: Day10Machine,
    frame: Day10Frame
  ): void {
    const ctx = this.ctx;

    // Panel background with gradient
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, "#3d4555");
    gradient.addColorStop(0.5, "#2d3748");
    gradient.addColorStop(1, "#1f2937");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);

    // Panel border with copper/brass effect
    ctx.strokeStyle = DAY10_COLORS.panelBorder;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, width, height);

    // Corner rivets
    const corners = [
      [x + 15, y + 15],
      [x + width - 15, y + 15],
      [x + 15, y + height - 15],
      [x + width - 15, y + height - 15],
    ];
    for (const [cx, cy] of corners) {
      this.drawRivet(cx, cy);
    }

    // Machine ID plate
    this.drawNameplate(x + width / 2, y + 30, `MACHINE #${machine.id + 1}`);

    // Status indicator
    const isComplete = frame.frameType === "complete" || machine.isComplete;
    this.drawStatusIndicator(x + width - 80, y + 25, isComplete);

    // Draw buttons section
    const buttonsX = x + 40;
    const buttonsY = y + 80;
    this.drawButtonsSection(buttonsX, buttonsY, machine.buttons, frame);

    // Draw wiring diagram
    const wiringX = x + 280;
    const wiringY = y + 80;
    this.drawWiringSection(wiringX, wiringY, machine, frame);

    // Draw counters section
    const countersX = x + 560;
    const countersY = y + 80;
    this.drawCountersSection(countersX, countersY, machine, frame);

    // Draw progress bar
    this.drawMachineProgress(x + 40, y + height - 50, width - 80, machine, frame);
  }

  private drawNameplate(x: number, y: number, text: string): void {
    const ctx = this.ctx;
    const padding = 15;

    ctx.font = "bold 18px 'Courier New', monospace";
    const textWidth = ctx.measureText(text).width;

    // Plate background
    ctx.fillStyle = "#b87333";
    ctx.fillRect(x - textWidth / 2 - padding, y - 12, textWidth + padding * 2, 28);

    // Plate border
    ctx.strokeStyle = "#8b5a2b";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - textWidth / 2 - padding, y - 12, textWidth + padding * 2, 28);

    // Text
    ctx.fillStyle = "#1a1d23";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y + 6);
  }

  private drawStatusIndicator(x: number, y: number, isOnline: boolean): void {
    const ctx = this.ctx;

    // Indicator housing
    ctx.fillStyle = "#1a1d23";
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = DAY10_COLORS.panelBorder;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Light
    const glowIntensity = isOnline ? 0.5 + Math.sin(this.glowPhase) * 0.3 : 0;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = isOnline ? DAY10_COLORS.success : DAY10_COLORS.accent;
    ctx.fill();

    if (isOnline) {
      ctx.shadowColor = DAY10_COLORS.success;
      ctx.shadowBlur = 15 * glowIntensity;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Label
    ctx.font = "10px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.textDim;
    ctx.textAlign = "center";
    ctx.fillText(isOnline ? "ONLINE" : "OFFLINE", x, y + 30);
  }

  private drawButtonsSection(x: number, y: number, buttons: Day10Button[], frame: Day10Frame): void {
    const ctx = this.ctx;

    // Section label
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.text;
    ctx.textAlign = "left";
    ctx.fillText("BUTTONS", x, y);

    const buttonSize = 45;
    const spacing = 55;
    const cols = 4;
    const startY = y + 20;

    buttons.forEach((button, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = x + col * spacing + buttonSize / 2;
      const by = startY + row * spacing + buttonSize / 2;

      const isActive = frame.activeButton === i;
      const isPressed = frame.pressedButtons?.includes(i) ?? false;

      this.drawButton(bx, by, buttonSize, button, isActive, isPressed);
    });
  }

  private drawButton(
    x: number,
    y: number,
    size: number,
    button: Day10Button,
    isActive: boolean,
    isPressed: boolean
  ): void {
    const ctx = this.ctx;
    const radius = size / 2;

    // Button shadow
    ctx.beginPath();
    ctx.arc(x, y + 3, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1d23";
    ctx.fill();

    // Button body
    const buttonGradient = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, radius);
    if (isActive || isPressed) {
      buttonGradient.addColorStop(0, DAY10_COLORS.buttonGlow);
      buttonGradient.addColorStop(0.7, DAY10_COLORS.buttonActive);
      buttonGradient.addColorStop(1, "#b45309");
    } else {
      buttonGradient.addColorStop(0, "#6b7280");
      buttonGradient.addColorStop(0.7, DAY10_COLORS.buttonInactive);
      buttonGradient.addColorStop(1, "#374151");
    }

    ctx.beginPath();
    ctx.arc(x, y, radius - 2, 0, Math.PI * 2);
    ctx.fillStyle = buttonGradient;
    ctx.fill();

    // Glow effect for active button
    if (isActive) {
      ctx.shadowColor = DAY10_COLORS.buttonGlow;
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Button rim
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = isActive ? DAY10_COLORS.gold : "#6b7280";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Press count badge
    if (button.pressCount > 0) {
      const badgeX = x + radius - 5;
      const badgeY = y - radius + 5;

      ctx.beginPath();
      ctx.arc(badgeX, badgeY, 10, 0, Math.PI * 2);
      ctx.fillStyle = DAY10_COLORS.accent;
      ctx.fill();

      ctx.font = "bold 10px 'Courier New', monospace";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText(String(button.pressCount), badgeX, badgeY + 4);
    }

    // Button index
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillStyle = isActive ? "#1a1d23" : DAY10_COLORS.text;
    ctx.textAlign = "center";
    ctx.fillText(String(button.index + 1), x, y + 5);
  }

  private drawWiringSection(x: number, y: number, machine: Day10Machine, frame: Day10Frame): void {
    const ctx = this.ctx;

    // Section label
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.text;
    ctx.textAlign = "left";
    ctx.fillText("WIRING", x, y);

    const width = 250;
    const height = 350;
    const startY = y + 20;

    // Wiring panel background
    ctx.fillStyle = "#1a1d23";
    ctx.fillRect(x, startY, width, height);
    ctx.strokeStyle = DAY10_COLORS.panelBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, startY, width, height);

    // Calculate dynamic spacing based on number of items
    const numButtons = machine.buttons.length;
    const numCounters = machine.joltages.length;
    const maxItems = Math.max(numButtons, numCounters);
    const availableHeight = height - 40; // Padding top and bottom
    const maxSpacing = 35;
    const minSpacing = 18;
    const spacing = Math.max(minSpacing, Math.min(maxSpacing, availableHeight / (maxItems + 1)));

    const buttonStartY = startY + 20 + (availableHeight - (numButtons - 1) * spacing) / 2;
    const counterStartY = startY + 20 + (availableHeight - (numCounters - 1) * spacing) / 2;

    machine.buttons.forEach((button, bi) => {
      const bx = x + 30;
      const by = buttonStartY + bi * spacing;

      // Button node
      ctx.beginPath();
      ctx.arc(bx, by, 8, 0, Math.PI * 2);
      ctx.fillStyle = frame.activeButton === bi ? DAY10_COLORS.buttonActive : DAY10_COLORS.buttonInactive;
      ctx.fill();

      // Draw wires to affected counters
      button.affectedCounters.forEach((ci) => {
        const cx = x + width - 30;
        const cy = counterStartY + ci * spacing;

        const isActive = frame.activeButton === bi;

        ctx.beginPath();
        ctx.moveTo(bx + 8, by);
        // Bezier curve for wire
        const midX = x + width / 2;
        ctx.bezierCurveTo(midX, by, midX, cy, cx - 8, cy);

        ctx.strokeStyle = isActive ? DAY10_COLORS.wiringPulse : DAY10_COLORS.wiring;
        ctx.lineWidth = isActive ? 3 : 1.5;
        ctx.globalAlpha = isActive ? 1 : 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Animated pulse on active wire
        if (isActive) {
          const t = (Math.sin(this.pulsePhase * 2) + 1) / 2;
          const px = this.bezierPoint(bx + 8, midX, midX, cx - 8, t);
          const py = this.bezierPoint(by, by, cy, cy, t);

          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = DAY10_COLORS.gold;
          ctx.shadowColor = DAY10_COLORS.gold;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
    });

    // Counter nodes
    machine.joltages.forEach((_, ci) => {
      const cx = x + width - 30;
      const cy = counterStartY + ci * spacing;

      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = DAY10_COLORS.counterText;
      ctx.fill();
    });
  }

  private bezierPoint(p0: number, p1: number, p2: number, p3: number, t: number): number {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
  }

  private drawCountersSection(x: number, y: number, machine: Day10Machine, frame: Day10Frame): void {
    const ctx = this.ctx;

    // Section label
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.text;
    ctx.textAlign = "left";
    ctx.fillText("JOLTAGE COUNTERS", x, y);

    const startY = y + 20;
    const counterWidth = 280;
    const availableHeight = 370; // Match wiring section height
    const numCounters = machine.joltages.length;

    // Calculate dynamic sizing
    const maxCounterHeight = 40;
    const minCounterHeight = 28;
    const maxSpacing = 45;
    const minSpacing = 32;

    // Calculate spacing to fit all counters
    const totalNeeded = numCounters * maxSpacing;
    let spacing: number;
    let counterHeight: number;

    if (totalNeeded <= availableHeight) {
      spacing = maxSpacing;
      counterHeight = maxCounterHeight;
    } else {
      spacing = Math.max(minSpacing, availableHeight / numCounters);
      counterHeight = Math.max(minCounterHeight, spacing - 4);
    }

    const currentValues = frame.currentValues || machine.currentValues;

    machine.joltages.forEach((target, i) => {
      const cy = startY + i * spacing;
      const current = currentValues[i] ?? 0;
      const isComplete = current >= target;

      this.drawCounter(x, cy, counterWidth, counterHeight, current, target, isComplete, i);
    });
  }

  private drawCounter(
    x: number,
    y: number,
    width: number,
    height: number,
    current: number,
    target: number,
    isComplete: boolean,
    index: number
  ): void {
    const ctx = this.ctx;

    // Counter housing
    ctx.fillStyle = DAY10_COLORS.counterBg;
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = isComplete ? DAY10_COLORS.gold : DAY10_COLORS.panelBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Counter index
    ctx.font = "bold 12px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.textDim;
    ctx.textAlign = "left";
    ctx.fillText(`#${index + 1}`, x + 5, y + height / 2 + 4);

    // Current value (LED style)
    ctx.font = "bold 24px 'Courier New', monospace";
    ctx.fillStyle = isComplete ? DAY10_COLORS.gold : DAY10_COLORS.counterText;
    ctx.textAlign = "right";

    if (isComplete) {
      ctx.shadowColor = DAY10_COLORS.gold;
      ctx.shadowBlur = 10;
    }
    ctx.fillText(String(current), x + width / 2 + 20, y + height / 2 + 8);
    ctx.shadowBlur = 0;

    // Separator
    ctx.fillStyle = DAY10_COLORS.textDim;
    ctx.textAlign = "center";
    ctx.font = "20px 'Courier New', monospace";
    ctx.fillText("/", x + width / 2 + 40, y + height / 2 + 8);

    // Target value
    ctx.font = "bold 24px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.counterTarget;
    ctx.textAlign = "left";
    ctx.fillText(String(target), x + width / 2 + 55, y + height / 2 + 8);

    // Progress bar under counter
    const progress = target > 0 ? Math.min(current / target, 1) : (current === 0 ? 1 : 1);
    const barY = y + height - 6;
    const barHeight = 4;

    ctx.fillStyle = "#374151";
    ctx.fillRect(x + 2, barY, width - 4, barHeight);

    const barGradient = ctx.createLinearGradient(x, 0, x + (width - 4) * progress, 0);
    barGradient.addColorStop(0, DAY10_COLORS.counterText);
    barGradient.addColorStop(1, isComplete ? DAY10_COLORS.gold : DAY10_COLORS.wiringPulse);
    ctx.fillStyle = barGradient;
    ctx.fillRect(x + 2, barY, (width - 4) * progress, barHeight);
  }

  private drawMachineProgress(x: number, y: number, width: number, machine: Day10Machine, frame: Day10Frame): void {
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = "#1a1d23";
    ctx.fillRect(x, y, width, 20);
    ctx.strokeStyle = DAY10_COLORS.panelBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, 20);

    // Calculate progress
    const currentValues = frame.currentValues || machine.currentValues;
    const totalTarget = machine.joltages.reduce((a, b) => a + b, 0);
    const totalCurrent = currentValues.reduce((a, b) => a + b, 0);
    const progress = totalTarget > 0 ? Math.min(totalCurrent / totalTarget, 1) : (totalCurrent === 0 ? 1 : 1);

    // Progress fill
    const gradient = ctx.createLinearGradient(x, 0, x + width * progress, 0);
    gradient.addColorStop(0, DAY10_COLORS.counterText);
    gradient.addColorStop(1, machine.isComplete ? DAY10_COLORS.gold : DAY10_COLORS.buttonActive);
    ctx.fillStyle = gradient;
    ctx.fillRect(x + 2, y + 2, (width - 4) * progress, 16);

    // Min presses label
    ctx.font = "bold 12px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.text;
    ctx.textAlign = "right";
    ctx.fillText(`Min Presses: ${machine.minPresses}`, x + width - 10, y - 8);
  }

  private drawMachineQueue(x: number, y: number, frame: Day10Frame): void {
    const ctx = this.ctx;

    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.text;
    ctx.textAlign = "left";
    ctx.fillText("QUEUE", x, y);

    const itemHeight = 35;
    const itemWidth = 200;
    const startY = y + 20;
    const visibleCount = 12;

    // Show machines around current
    const startIdx = Math.max(0, frame.machineIndex - 2);
    const endIdx = Math.min(frame.totalMachines, startIdx + visibleCount);

    for (let i = startIdx; i < endIdx; i++) {
      const iy = startY + (i - startIdx) * itemHeight;
      const isCurrent = i === frame.machineIndex;
      const isSolved = i < frame.machinesSolved;

      // Item background
      ctx.fillStyle = isCurrent ? DAY10_COLORS.panelBorder : DAY10_COLORS.panelBg;
      ctx.globalAlpha = isCurrent ? 1 : 0.7;
      ctx.fillRect(x, iy, itemWidth, itemHeight - 5);

      // Border
      ctx.strokeStyle = isSolved ? DAY10_COLORS.success : isCurrent ? DAY10_COLORS.gold : DAY10_COLORS.buttonInactive;
      ctx.lineWidth = isCurrent ? 2 : 1;
      ctx.strokeRect(x, iy, itemWidth, itemHeight - 5);

      ctx.globalAlpha = 1;

      // Status icon
      ctx.font = "14px monospace";
      ctx.fillStyle = isSolved ? DAY10_COLORS.success : isCurrent ? DAY10_COLORS.buttonActive : DAY10_COLORS.textDim;
      ctx.textAlign = "left";
      ctx.fillText(isSolved ? "✓" : isCurrent ? "▶" : "○", x + 10, iy + 20);

      // Machine label
      ctx.font = "12px 'Courier New', monospace";
      ctx.fillStyle = isCurrent ? "#1a1d23" : DAY10_COLORS.text;
      ctx.fillText(`Machine #${i + 1}`, x + 30, iy + 20);
    }

    // Scroll indicator
    if (frame.totalMachines > visibleCount) {
      ctx.font = "10px 'Courier New', monospace";
      ctx.fillStyle = DAY10_COLORS.textDim;
      ctx.textAlign = "center";
      ctx.fillText(`${frame.machineIndex + 1} / ${frame.totalMachines}`, x + itemWidth / 2, startY + visibleCount * itemHeight + 10);
    }
  }

  private drawGlobalStats(frame: Day10Frame): void {
    const ctx = this.ctx;
    const x = this.canvas.width - 280;
    const y = 450;

    // Stats panel
    ctx.fillStyle = "rgba(26, 29, 35, 0.9)";
    ctx.fillRect(x, y, 250, 130);
    ctx.strokeStyle = DAY10_COLORS.panelBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 250, 130);

    // Title
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.gold;
    ctx.textAlign = "left";
    ctx.fillText("PRODUCTION STATS", x + 15, y + 25);

    // Machines solved
    ctx.font = "12px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.textDim;
    ctx.fillText("Machines:", x + 15, y + 55);
    ctx.fillStyle = DAY10_COLORS.counterText;
    ctx.textAlign = "right";
    ctx.fillText(`${frame.machinesSolved} / ${frame.totalMachines}`, x + 235, y + 55);

    // Running total
    ctx.textAlign = "left";
    ctx.fillStyle = DAY10_COLORS.textDim;
    ctx.fillText("Total Presses:", x + 15, y + 80);

    // Large running total
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.gold;
    ctx.textAlign = "center";
    ctx.fillText(frame.runningTotal.toLocaleString(), x + 125, y + 115);
  }

  private drawPuzzleTitle(): void {
    const ctx = this.ctx;
    ctx.font = "bold 20px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.gold;
    ctx.textAlign = "left";
    ctx.fillText("Day 10: Factory", 60, 50);

    ctx.font = "14px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.text;
    ctx.fillText("Part 2 - Joltage Configuration", 60, 70);
  }

  private drawFinalFrame(frame: Day10Frame): void {
    const ctx = this.ctx;

    // Draw all machines as online
    const cols = 18;
    const iconSize = 50;
    const startX = (this.canvas.width - cols * iconSize) / 2;
    const startY = 150;

    for (let i = 0; i < frame.totalMachines; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * iconSize + iconSize / 2;
      const y = startY + row * iconSize + iconSize / 2;

      this.drawMiniMachine(x, y, true);
    }

    // Victory overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Celebratory banner
    const bannerY = this.canvas.height / 2;

    ctx.font = "bold 36px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.gold;
    ctx.textAlign = "center";
    ctx.shadowColor = DAY10_COLORS.gold;
    ctx.shadowBlur = 20;
    ctx.fillText("★ ALL MACHINES ONLINE ★", this.canvas.width / 2, bannerY - 40);
    ctx.shadowBlur = 0;

    ctx.font = "24px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.text;
    ctx.fillText("Minimum Total Button Presses:", this.canvas.width / 2, bannerY + 10);

    ctx.font = "bold 56px 'Courier New', monospace";
    ctx.fillStyle = DAY10_COLORS.gold;
    ctx.shadowColor = DAY10_COLORS.gold;
    ctx.shadowBlur = 25;
    ctx.fillText(frame.finalAnswer?.toLocaleString() ?? frame.runningTotal.toLocaleString(), this.canvas.width / 2, bannerY + 80);
    ctx.shadowBlur = 0;

    // Particle effects
    this.drawCelebrationParticles();
  }

  private drawCelebrationParticles(): void {
    const ctx = this.ctx;
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + this.particlePhase;
      const radius = 200 + Math.sin(this.particlePhase * 2 + i) * 50;
      const x = this.canvas.width / 2 + Math.cos(angle) * radius;
      const y = this.canvas.height / 2 + Math.sin(angle) * radius * 0.5;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? DAY10_COLORS.gold : DAY10_COLORS.success;
      ctx.globalAlpha = 0.6 + Math.sin(this.particlePhase + i) * 0.4;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
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

      // Check if we've gone past the last frame
      if (this.currentFrameIndex >= this.frames.length) {
        // Keep showing the last frame
        this.currentFrameIndex = this.frames.length - 1;
        this.renderFrame(this.frames[this.currentFrameIndex]);
        this.pause();
        if (this.isRecording) {
          this.stopRecording();
        }
        return;
      }

      this.renderFrame(this.frames[this.currentFrameIndex]);
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
      a.download = "day10-factory.webm";
      a.click();
      URL.revokeObjectURL(url);
    };

    this.isRecording = true;
    this.mediaRecorder.start();

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
  new Day10Visualizer();
});
