// Day 11: Reactor - Visualization
// Renders network graph path counting with industrial sci-fi theme

// Sparse frame format from JSON log
interface Day11SparseFrame {
  frameType: "intro" | "graphDisplay" | "reduction" | "segmentStart" | "counting" | "segmentComplete" | "multiply" | "final";
  activeNodes?: string[];
  activeEdges?: [string, string][];
  prunedNodes?: string[];
  prunedEdges?: [string, string][];
  currentNode?: string;
  activeSegment?: string;
  segmentCounts?: [number, number, number];
  segmentComplete?: [boolean, boolean, boolean];
  segmentLabels?: [string, string, string];
  message?: string;
  finalAnswer?: number;
}

// Expanded frame for rendering
interface Day11Frame {
  frameType: "intro" | "graphDisplay" | "reduction" | "segmentStart" | "counting" | "segmentComplete" | "multiply" | "final";
  currentNode?: string;
  activeSegment?: string;
  activeNodes: Set<string>;
  activeEdges: Set<string>; // "from->to" format
  prunedNodes: Set<string>;
  prunedEdges: Set<string>; // "from->to" format
  segmentCounts: {
    segment1: { label: string; count: number; complete: boolean };
    segment2: { label: string; count: number; complete: boolean };
    segment3: { label: string; count: number; complete: boolean };
  };
  message?: string;
  finalAnswer?: number;
}

interface Day11LogData {
  puzzleDay: number;
  puzzleName: string;
  part: number;
  frames: Day11SparseFrame[];
  finalAnswer: number;
  graph: {
    nodes: string[];
    edges: Array<{ from: string; to: string }>;
  };
}

// Theme colors - industrial sci-fi reactor room
const DAY11_COLORS = {
  background: "#0a0e1a",
  panelBg: "#1a2035",
  panelBorder: "#00ffff",
  nodeDefault: "#4a6fa5",
  nodeKey: "#ffaa00",
  nodeActive: "#ff00ff",
  nodePruned: "#2a3a4a",
  edgeDefault: "#1a4a5a",
  edgeActive: "#00ffff",
  edgePruned: "#1a2a3a",
  glowCyan: "#00ffff",
  glowMagenta: "#ff00ff",
  glowGold: "#ffaa00",
  success: "#00ff88",
  text: "#e0f0ff",
  textDim: "#6a8aa0",
  textGold: "#ffd700",
  counterBg: "#0a1525",
  particle: "#00ffff",
};

class Day11Visualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private logData: Day11LogData | null = null;
  private sparseFrames: Day11SparseFrame[] = [];
  private expandedFrames: Day11Frame[] = [];
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
  private particlePhase = 0;
  private glowPhase = 0;
  private segmentCompleteDelay = 0; // Frames to hold on segmentComplete

  // Cached node positions for stable layout
  private nodePositions: Map<string, { x: number; y: number }> = new Map();

  // Cached segment labels
  private segmentLabels: [string, string, string] = ["segment1", "segment2", "segment3"];

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
    this.logData = JSON.parse(text) as Day11LogData;
    this.sparseFrames = this.logData.frames;
    this.currentFrameIndex = 0;
    this.computeNodePositions();
    this.expandFrames();
    this.renderFrame(this.expandedFrames[0]);
    this.updateStatus("Loaded: " + this.expandedFrames.length + " frames");
  }

  private expandFrames(): void {
    this.expandedFrames = [];

    // Track cumulative state
    let prunedNodes = new Set<string>();
    let prunedEdges = new Set<string>();
    let segmentCounts: [number, number, number] = [0, 0, 0];
    let segmentComplete: [boolean, boolean, boolean] = [false, false, false];

    for (const sparse of this.sparseFrames) {
      // Update segment labels if provided
      if (sparse.segmentLabels) {
        this.segmentLabels = sparse.segmentLabels;
      }

      // Update cumulative pruned state
      if (sparse.prunedNodes) {
        for (const node of sparse.prunedNodes) {
          prunedNodes.add(node);
        }
      }
      if (sparse.prunedEdges) {
        for (const [from, to] of sparse.prunedEdges) {
          prunedEdges.add(`${from}->${to}`);
        }
      }

      // Update segment counts if provided
      if (sparse.segmentCounts) {
        segmentCounts = [...sparse.segmentCounts];
      }
      if (sparse.segmentComplete) {
        segmentComplete = [...sparse.segmentComplete];
      }

      // Build active sets for this frame
      const activeNodes = new Set<string>(sparse.activeNodes || []);
      const activeEdges = new Set<string>();
      if (sparse.activeEdges) {
        for (const [from, to] of sparse.activeEdges) {
          activeEdges.add(`${from}->${to}`);
        }
      }

      // Create expanded frame
      const expanded: Day11Frame = {
        frameType: sparse.frameType,
        currentNode: sparse.currentNode,
        activeSegment: sparse.activeSegment,
        activeNodes,
        activeEdges,
        prunedNodes: new Set(prunedNodes),
        prunedEdges: new Set(prunedEdges),
        segmentCounts: {
          segment1: { label: this.segmentLabels[0], count: segmentCounts[0], complete: segmentComplete[0] },
          segment2: { label: this.segmentLabels[1], count: segmentCounts[1], complete: segmentComplete[1] },
          segment3: { label: this.segmentLabels[2], count: segmentCounts[2], complete: segmentComplete[2] },
        },
        message: sparse.message,
        finalAnswer: sparse.finalAnswer,
      };

      this.expandedFrames.push(expanded);
    }
  }

  private computeNodePositions(): void {
    if (!this.logData) return;

    const nodes = this.logData.graph.nodes;
    const edges = this.logData.graph.edges;
    this.nodePositions.clear();

    // Key nodes get fixed positions
    const keyPositions: Record<string, { x: number; y: number }> = {
      svr: { x: 640, y: 80 },
      fft: { x: 450, y: 300 },
      dac: { x: 830, y: 300 },
      out: { x: 640, y: 620 },
    };

    // Assign key nodes first
    for (const [key, pos] of Object.entries(keyPositions)) {
      if (nodes.includes(key)) {
        this.nodePositions.set(key, pos);
      }
    }

    // Build adjacency for layout hints
    const adjacency: Map<string, Set<string>> = new Map();
    for (const node of nodes) {
      adjacency.set(node, new Set());
    }
    for (const edge of edges) {
      adjacency.get(edge.from)?.add(edge.to);
    }

    // Compute depth levels using BFS from svr
    const depths: Map<string, number> = new Map();
    const queue: string[] = ["svr"];
    depths.set("svr", 0);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDepth = depths.get(current)!;
      for (const neighbor of adjacency.get(current) || []) {
        if (!depths.has(neighbor)) {
          depths.set(neighbor, currentDepth + 1);
          queue.push(neighbor);
        }
      }
    }

    // Group nodes by depth
    const maxDepth = Math.max(...Array.from(depths.values()), 0);
    const depthGroups: Map<number, string[]> = new Map();

    for (const [node, depth] of depths) {
      if (this.nodePositions.has(node)) continue;
      if (!depthGroups.has(depth)) {
        depthGroups.set(depth, []);
      }
      depthGroups.get(depth)!.push(node);
    }

    // Position remaining nodes in layers
    const graphLeft = 100;
    const graphRight = 1180;
    const graphTop = 100;
    const graphBottom = 600;
    const graphWidth = graphRight - graphLeft;
    const graphHeight = graphBottom - graphTop;

    for (const [depth, group] of depthGroups) {
      const y = graphTop + (depth / Math.max(maxDepth, 1)) * graphHeight;
      const count = group.length;

      group.forEach((node, i) => {
        // Spread horizontally with some randomization for visual interest
        const baseX = graphLeft + ((i + 0.5) / count) * graphWidth;
        // Add deterministic offset based on node name hash
        const hash = this.hashString(node);
        const offsetX = ((hash % 40) - 20);
        const offsetY = ((hash >> 8) % 30) - 15;

        this.nodePositions.set(node, {
          x: Math.max(graphLeft, Math.min(graphRight, baseX + offsetX)),
          y: Math.max(graphTop, Math.min(graphBottom, y + offsetY)),
        });
      });
    }

    // Handle any nodes not reached by BFS
    let unpositioned = nodes.filter((n) => !this.nodePositions.has(n));
    const centerY = (graphTop + graphBottom) / 2;

    unpositioned.forEach((node, i) => {
      const hash = this.hashString(node);
      this.nodePositions.set(node, {
        x: graphLeft + ((i + 0.5) / Math.max(unpositioned.length, 1)) * graphWidth,
        y: centerY + ((hash % 100) - 50),
      });
    });
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private drawInitialState(): void {
    const ctx = this.ctx;
    ctx.fillStyle = DAY11_COLORS.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawReactorBorder();
    this.drawTitle("Day 11: Reactor", "Load a recording.json to begin");
  }

  private drawReactorBorder(): void {
    const ctx = this.ctx;

    // Glowing border effect
    const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, 0);
    gradient.addColorStop(0, DAY11_COLORS.glowCyan);
    gradient.addColorStop(0.5, DAY11_COLORS.glowMagenta);
    gradient.addColorStop(1, DAY11_COLORS.glowCyan);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, this.canvas.width - 10, this.canvas.height - 10);

    // Inner shadow line
    ctx.strokeStyle = "rgba(0, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, this.canvas.width - 20, this.canvas.height - 20);
  }

  private drawTitle(title: string, subtitle: string): void {
    const ctx = this.ctx;
    ctx.textAlign = "center";

    ctx.font = "bold 48px 'Courier New', monospace";
    ctx.fillStyle = DAY11_COLORS.glowCyan;
    ctx.shadowColor = DAY11_COLORS.glowCyan;
    ctx.shadowBlur = 20;
    ctx.fillText(title, this.canvas.width / 2, this.canvas.height / 2 - 20);
    ctx.shadowBlur = 0;

    ctx.font = "24px 'Courier New', monospace";
    ctx.fillStyle = DAY11_COLORS.text;
    ctx.fillText(subtitle, this.canvas.width / 2, this.canvas.height / 2 + 30);
  }

  private renderFrame(frame: Day11Frame): void {
    const ctx = this.ctx;
    this.pulsePhase += 0.1;
    this.glowPhase += 0.08;
    this.particlePhase += 0.05;

    // Clear and draw background
    ctx.fillStyle = DAY11_COLORS.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawReactorBorder();
    this.drawGridPattern();

    // Draw based on frame type
    switch (frame.frameType) {
      case "intro":
        this.drawIntroFrame(frame);
        break;
      case "final":
        this.drawFinalFrame(frame);
        break;
      case "multiply":
        this.drawMultiplyFrame(frame);
        break;
      default:
        this.drawNetworkFrame(frame);
        break;
    }

    this.drawPuzzleTitle();
    this.drawSegmentCounters(frame);
    this.drawProgressBar();
  }

  private drawGridPattern(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = "rgba(0, 255, 255, 0.05)";
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < this.canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < this.canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
  }

  private drawIntroFrame(frame: Day11Frame): void {
    const ctx = this.ctx;

    // Draw toroidal reactor representation
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Outer ring
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 200, 100, 0, 0, Math.PI * 2);
    ctx.strokeStyle = DAY11_COLORS.glowCyan;
    ctx.lineWidth = 4;
    ctx.shadowColor = DAY11_COLORS.glowCyan;
    ctx.shadowBlur = 30;
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 120, 60, 0, 0, Math.PI * 2);
    ctx.strokeStyle = DAY11_COLORS.glowMagenta;
    ctx.lineWidth = 3;
    ctx.shadowColor = DAY11_COLORS.glowMagenta;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Text
    ctx.textAlign = "center";
    ctx.font = "bold 32px 'Courier New', monospace";
    ctx.fillStyle = DAY11_COLORS.textGold;
    ctx.fillText("REACTOR NETWORK ANALYSIS", centerX, 100);

    ctx.font = "20px 'Courier New', monospace";
    ctx.fillStyle = DAY11_COLORS.text;
    ctx.fillText("Analyzing device connections from svr to out", centerX, 140);
    ctx.fillText("Finding paths through both fft and dac", centerX, 170);

    // Network stats
    if (this.logData) {
      ctx.font = "16px 'Courier New', monospace";
      ctx.fillStyle = DAY11_COLORS.textDim;
      ctx.fillText(`${this.logData.graph.nodes.length} devices`, centerX - 100, this.canvas.height - 80);
      ctx.fillText(`${this.logData.graph.edges.length} connections`, centerX + 100, this.canvas.height - 80);
    }
  }

  private drawNetworkFrame(frame: Day11Frame): void {
    if (!this.logData) return;
    const ctx = this.ctx;

    // Draw edges first (behind nodes)
    for (const edge of this.logData.graph.edges) {
      this.drawEdge(edge.from, edge.to, frame);
    }

    // Draw particles on active edges
    if (frame.frameType === "counting") {
      this.drawDataParticles(frame);
    }

    // Draw nodes
    for (const nodeId of this.logData.graph.nodes) {
      this.drawNode(nodeId, frame);
    }

    // Draw message if present
    if (frame.message) {
      ctx.textAlign = "center";
      ctx.font = "bold 18px 'Courier New', monospace";
      ctx.fillStyle = DAY11_COLORS.textGold;
      ctx.fillText(frame.message, this.canvas.width / 2, 50);
    }
  }

  private drawNode(nodeId: string, frame: Day11Frame): void {
    const ctx = this.ctx;
    const pos = this.nodePositions.get(nodeId);
    if (!pos) return;

    const { x, y } = pos;
    const isKey = ["svr", "fft", "dac", "out"].includes(nodeId);
    const isCurrent = frame.currentNode === nodeId;
    const isActive = frame.activeNodes.has(nodeId);
    const isPruned = frame.prunedNodes.has(nodeId);

    // Determine node appearance
    let fillColor = DAY11_COLORS.nodeDefault;
    let strokeColor = DAY11_COLORS.edgeDefault;
    let radius = 8;
    let glowColor = "";

    if (isPruned) {
      fillColor = DAY11_COLORS.nodePruned;
      strokeColor = DAY11_COLORS.edgePruned;
    } else if (isKey) {
      fillColor = DAY11_COLORS.nodeKey;
      strokeColor = DAY11_COLORS.glowGold;
      radius = 14;
      glowColor = DAY11_COLORS.glowGold;
    }

    if (isActive || isCurrent) {
      fillColor = DAY11_COLORS.nodeActive;
      strokeColor = DAY11_COLORS.glowMagenta;
      glowColor = DAY11_COLORS.glowMagenta;
    }

    // Draw glow for key/active nodes
    if (glowColor && !isPruned) {
      const pulseIntensity = 0.5 + Math.sin(this.pulsePhase) * 0.3;
      ctx.beginPath();
      if (isKey) {
        this.drawHexagon(ctx, x, y, radius + 8);
      } else {
        ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
      }
      ctx.fillStyle = glowColor;
      ctx.globalAlpha = 0.3 * pulseIntensity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Draw node shape
    ctx.beginPath();
    if (isKey) {
      this.drawHexagon(ctx, x, y, radius);
    } else {
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    }
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw label for key nodes or current node
    if (isKey || isCurrent) {
      ctx.textAlign = "center";
      ctx.font = "bold 11px 'Courier New', monospace";
      ctx.fillStyle = isPruned ? DAY11_COLORS.textDim : DAY11_COLORS.text;
      ctx.fillText(nodeId.toUpperCase(), x, y + radius + 16);
    }
  }

  private drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
    ctx.moveTo(x + radius, y);
    for (let i = 1; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
    }
    ctx.closePath();
  }

  private drawEdge(from: string, to: string, frame: Day11Frame): void {
    const ctx = this.ctx;
    const fromPos = this.nodePositions.get(from);
    const toPos = this.nodePositions.get(to);
    if (!fromPos || !toPos) return;

    const edgeKey = `${from}->${to}`;
    const isPruned = frame.prunedEdges.has(edgeKey);
    const isActive = frame.activeEdges.has(edgeKey);

    let strokeColor = DAY11_COLORS.edgeDefault;
    let lineWidth = 1;
    let alpha = 0.4;

    if (isPruned) {
      strokeColor = DAY11_COLORS.edgePruned;
      alpha = 0.2;
    } else if (isActive) {
      strokeColor = DAY11_COLORS.edgeActive;
      lineWidth = 2;
      alpha = 1;
    }

    ctx.beginPath();
    ctx.moveTo(fromPos.x, fromPos.y);

    // Draw curved edge
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2;
    const offsetX = (toPos.y - fromPos.y) * 0.1;
    const offsetY = (fromPos.x - toPos.x) * 0.1;

    ctx.quadraticCurveTo(midX + offsetX, midY + offsetY, toPos.x, toPos.y);

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Draw arrow head
    if (!isPruned) {
      const angle = Math.atan2(toPos.y - midY - offsetY, toPos.x - midX - offsetX);
      const arrowSize = 6;
      ctx.beginPath();
      ctx.moveTo(toPos.x, toPos.y);
      ctx.lineTo(
        toPos.x - arrowSize * Math.cos(angle - Math.PI / 6),
        toPos.y - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        toPos.x - arrowSize * Math.cos(angle + Math.PI / 6),
        toPos.y - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = strokeColor;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  private drawDataParticles(frame: Day11Frame): void {
    if (!this.logData) return;
    const ctx = this.ctx;

    // Find active edges from the graph
    for (const edge of this.logData.graph.edges) {
      const edgeKey = `${edge.from}->${edge.to}`;
      if (!frame.activeEdges.has(edgeKey)) continue;

      const fromPos = this.nodePositions.get(edge.from);
      const toPos = this.nodePositions.get(edge.to);
      if (!fromPos || !toPos) continue;

      // Multiple particles per edge
      for (let i = 0; i < 3; i++) {
        const t = ((this.particlePhase * 2 + i * 0.33) % 1);
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = (fromPos.y + toPos.y) / 2;
        const offsetX = (toPos.y - fromPos.y) * 0.1;
        const offsetY = (fromPos.x - toPos.x) * 0.1;

        // Quadratic bezier interpolation
        const mt = 1 - t;
        const x = mt * mt * fromPos.x + 2 * mt * t * (midX + offsetX) + t * t * toPos.x;
        const y = mt * mt * fromPos.y + 2 * mt * t * (midY + offsetY) + t * t * toPos.y;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = DAY11_COLORS.particle;
        ctx.shadowColor = DAY11_COLORS.particle;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  private drawSegmentCounters(frame: Day11Frame): void {
    const ctx = this.ctx;
    const segments = frame.segmentCounts;
    if (!segments) return;

    const panelX = 20;
    const panelY = 80;
    const panelWidth = 180;
    const panelHeight = 200;

    // Panel background
    ctx.fillStyle = DAY11_COLORS.panelBg;
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = DAY11_COLORS.panelBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Title
    ctx.textAlign = "center";
    ctx.font = "bold 12px 'Courier New', monospace";
    ctx.fillStyle = DAY11_COLORS.textGold;
    ctx.fillText("PATH SEGMENTS", panelX + panelWidth / 2, panelY + 20);

    // Draw each segment counter
    const segmentList = [segments.segment1, segments.segment2, segments.segment3];
    segmentList.forEach((seg, i) => {
      const y = panelY + 45 + i * 50;
      this.drawSegmentCounter(panelX + 10, y, panelWidth - 20, seg, frame.activeSegment === seg.label);
    });
  }

  private drawSegmentCounter(
    x: number,
    y: number,
    width: number,
    segment: { label: string; count: number; complete: boolean },
    isActive: boolean
  ): void {
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = isActive ? "rgba(255, 0, 255, 0.2)" : DAY11_COLORS.counterBg;
    ctx.fillRect(x, y, width, 40);

    // Border
    ctx.strokeStyle = segment.complete
      ? DAY11_COLORS.success
      : isActive
      ? DAY11_COLORS.glowMagenta
      : DAY11_COLORS.edgeDefault;
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.strokeRect(x, y, width, 40);

    // Label
    ctx.textAlign = "left";
    ctx.font = "10px 'Courier New', monospace";
    ctx.fillStyle = segment.complete ? DAY11_COLORS.success : DAY11_COLORS.text;
    ctx.fillText(segment.label, x + 5, y + 14);

    // Count
    ctx.textAlign = "right";
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillStyle = segment.complete ? DAY11_COLORS.textGold : DAY11_COLORS.glowCyan;

    // Format large numbers
    const countStr = segment.count.toLocaleString();
    ctx.fillText(countStr, x + width - 5, y + 32);

    // Status indicator
    if (segment.complete) {
      ctx.textAlign = "left";
      ctx.fillStyle = DAY11_COLORS.success;
      ctx.fillText("✓", x + 5, y + 32);
    } else if (isActive) {
      const dots = ".".repeat(1 + Math.floor(this.pulsePhase) % 3);
      ctx.textAlign = "left";
      ctx.fillStyle = DAY11_COLORS.glowMagenta;
      ctx.fillText(dots, x + 5, y + 32);
    }
  }

  private drawMultiplyFrame(frame: Day11Frame): void {
    const ctx = this.ctx;
    const segments = frame.segmentCounts;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Draw multiplication visualization
    ctx.textAlign = "center";
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.fillStyle = DAY11_COLORS.textGold;
    ctx.fillText("COMPUTING TOTAL PATHS", centerX, 100);

    // Draw three segment boxes
    const boxWidth = 280;
    const boxHeight = 120;
    const gap = 60;
    const totalWidth = boxWidth * 3 + gap * 2;
    const startX = centerX - totalWidth / 2;

    const segmentList = [segments.segment1, segments.segment2, segments.segment3];

    segmentList.forEach((seg, i) => {
      const x = startX + i * (boxWidth + gap);
      const y = centerY - 80;

      // Box
      ctx.fillStyle = DAY11_COLORS.panelBg;
      ctx.fillRect(x, y, boxWidth, boxHeight);
      ctx.strokeStyle = DAY11_COLORS.glowCyan;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, boxWidth, boxHeight);

      // Label
      ctx.textAlign = "center";
      ctx.font = "14px 'Courier New', monospace";
      ctx.fillStyle = DAY11_COLORS.text;
      ctx.fillText(seg.label, x + boxWidth / 2, y + 30);

      // Count
      ctx.font = "bold 24px 'Courier New', monospace";
      ctx.fillStyle = DAY11_COLORS.glowCyan;
      ctx.fillText(seg.count.toLocaleString(), x + boxWidth / 2, y + 70);

      // Multiplication symbol
      if (i < 2) {
        ctx.font = "bold 36px 'Courier New', monospace";
        ctx.fillStyle = DAY11_COLORS.glowMagenta;
        ctx.fillText("×", x + boxWidth + gap / 2, y + boxHeight / 2 + 10);
      }
    });

    // Equals line
    const equalsY = centerY + 80;
    ctx.strokeStyle = DAY11_COLORS.glowGold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 200, equalsY);
    ctx.lineTo(centerX + 200, equalsY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX - 200, equalsY + 10);
    ctx.lineTo(centerX + 200, equalsY + 10);
    ctx.stroke();

    // Result
    if (frame.finalAnswer) {
      ctx.font = "bold 48px 'Courier New', monospace";
      ctx.fillStyle = DAY11_COLORS.textGold;
      ctx.shadowColor = DAY11_COLORS.glowGold;
      ctx.shadowBlur = 20;
      ctx.fillText(frame.finalAnswer.toLocaleString(), centerX, equalsY + 70);
      ctx.shadowBlur = 0;
    }
  }

  private drawFinalFrame(frame: Day11Frame): void {
    if (!this.logData) return;
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Draw network faded in background
    ctx.globalAlpha = 0.2;
    for (const edge of this.logData.graph.edges) {
      const edgeKey = `${edge.from}->${edge.to}`;
      if (!frame.prunedEdges.has(edgeKey)) {
        const fromPos = this.nodePositions.get(edge.from);
        const toPos = this.nodePositions.get(edge.to);
        if (fromPos && toPos) {
          ctx.beginPath();
          ctx.moveTo(fromPos.x, fromPos.y);
          ctx.lineTo(toPos.x, toPos.y);
          ctx.strokeStyle = DAY11_COLORS.success;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    // Victory overlay
    ctx.fillStyle = "rgba(10, 14, 26, 0.85)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Glowing success banner
    ctx.textAlign = "center";
    ctx.font = "bold 36px 'Courier New', monospace";
    ctx.fillStyle = DAY11_COLORS.success;
    ctx.shadowColor = DAY11_COLORS.success;
    ctx.shadowBlur = 30;
    ctx.fillText("★ ANALYSIS COMPLETE ★", centerX, centerY - 100);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = "20px 'Courier New', monospace";
    ctx.fillStyle = DAY11_COLORS.text;
    ctx.fillText("Paths from svr to out visiting both fft and dac:", centerX, centerY - 40);

    // Final answer
    ctx.font = "bold 64px 'Courier New', monospace";
    ctx.fillStyle = DAY11_COLORS.textGold;
    ctx.shadowColor = DAY11_COLORS.glowGold;
    ctx.shadowBlur = 40;
    ctx.fillText(frame.finalAnswer?.toLocaleString() ?? "N/A", centerX, centerY + 50);
    ctx.shadowBlur = 0;

    // Segment breakdown
    const segments = frame.segmentCounts;
    if (segments) {
      ctx.font = "16px 'Courier New', monospace";
      ctx.fillStyle = DAY11_COLORS.textDim;
      const breakdown = `${segments.segment1.label}: ${segments.segment1.count.toLocaleString()} × ${segments.segment2.label}: ${segments.segment2.count.toLocaleString()} × ${segments.segment3.label}: ${segments.segment3.count.toLocaleString()}`;
      ctx.fillText(breakdown, centerX, centerY + 110);
    }

    // Celebration particles
    this.drawCelebrationParticles();
  }

  private drawCelebrationParticles(): void {
    const ctx = this.ctx;
    const particleCount = 60;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + this.particlePhase;
      const radius = 180 + Math.sin(this.particlePhase * 2 + i * 0.5) * 80;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius * 0.6;

      ctx.beginPath();
      ctx.arc(x, y, 3 + Math.sin(this.particlePhase + i) * 1.5, 0, Math.PI * 2);

      const colors = [DAY11_COLORS.glowCyan, DAY11_COLORS.glowMagenta, DAY11_COLORS.glowGold, DAY11_COLORS.success];
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.5 + Math.sin(this.particlePhase * 2 + i) * 0.3;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawPuzzleTitle(): void {
    const ctx = this.ctx;
    ctx.font = "bold 20px 'Courier New', monospace";
    ctx.fillStyle = DAY11_COLORS.glowCyan;
    ctx.textAlign = "left";
    ctx.fillText("Day 11: Reactor", 30, 40);

    ctx.font = "14px 'Courier New', monospace";
    ctx.fillStyle = DAY11_COLORS.text;
    ctx.fillText("Part 2 - Network Path Analysis", 30, 60);
  }

  private drawProgressBar(): void {
    if (!this.expandedFrames.length) return;

    const ctx = this.ctx;
    const barHeight = 6;
    const barY = this.canvas.height - 15;
    const barX = 20;
    const barWidth = this.canvas.width - 40;

    // Background track
    ctx.fillStyle = DAY11_COLORS.panelBg;
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.strokeStyle = DAY11_COLORS.edgeDefault;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Progress fill
    const progress = (this.currentFrameIndex + 1) / this.expandedFrames.length;
    const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth * progress, 0);
    gradient.addColorStop(0, DAY11_COLORS.glowCyan);
    gradient.addColorStop(1, DAY11_COLORS.glowMagenta);
    ctx.fillStyle = gradient;
    ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * progress, barHeight - 2);

    // Frame counter text
    ctx.font = "10px 'Courier New', monospace";
    ctx.fillStyle = DAY11_COLORS.textDim;
    ctx.textAlign = "right";
    ctx.fillText(`${this.currentFrameIndex + 1} / ${this.expandedFrames.length}`, barX + barWidth, barY - 3);
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
    this.segmentCompleteDelay = 0;
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
      // Handle delay for segmentComplete frames
      if (this.segmentCompleteDelay > 0) {
        this.segmentCompleteDelay--;
        this.renderFrame(this.expandedFrames[this.currentFrameIndex]); // Re-render with animation updates
        this.lastFrameTime = now;
        this.animationId = requestAnimationFrame(() => this.animate());
        return;
      }

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

      const frame = this.expandedFrames[this.currentFrameIndex];
      this.renderFrame(frame);

      // Add delay after segmentComplete frames (30 frames = ~1 second at 30fps)
      if (frame.frameType === "segmentComplete") {
        this.segmentCompleteDelay = 30;
      }

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
      a.download = "day11-reactor.webm";
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
  new Day11Visualizer();
});
