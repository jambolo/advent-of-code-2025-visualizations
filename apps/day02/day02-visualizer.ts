/**
 * Day 02 - Gift Shop Receipt Scanner Visualizer
 *
 * Resolution: 1280x720 (720p) to balance text readability for multi-digit IDs
 * while keeping recording size manageable; 480p would muddy digit boxes and
 * chunk highlights, while 1080p provides little extra clarity for this layout.
 */

export {};

type FrameType =
  | 'range_start'
  | 'scan_tick'
  | 'pattern_check'
  | 'invalid_hit'
  | 'range_end'
  | 'final_summary';

interface RangeInfo {
  index: number;
  start: number;
  end: number;
  label?: string;
}

interface Frame {
  frame_type: FrameType;
  range_index: number;
  range_start: number;
  range_end: number;
  range_progress: number; // 0..1
  number?: number;
  digits?: string;
  repeat_count?: number;
  chunk_length?: number;
  candidate_chunk?: string;
  match?: boolean;
  global_sum: number;
  global_invalids: number;
  range_invalids?: number;
  inspected?: number;
  message?: string;
}

interface LogData {
  puzzle_day: 2;
  part: 2;
  sampling_stride?: number;
  ranges: RangeInfo[];
  frames: Frame[];
  final_sum: number;
  total_invalid: number;
}

interface Theme {
  backgroundTop: string;
  backgroundBottom: string;
  paper: string;
  paperEdge: string;
  scannerStart: string;
  scannerEnd: string;
  chunkA: string;
  chunkB: string;
  chunkFail: string;
  chunkSuccess: string;
  textPrimary: string;
  textMuted: string;
  accentRed: string;
  accentMint: string;
  accentGold: string;
  panel: string;
  barTrack: string;
  barFill: string;
  textOnPaper: string;
}

const theme: Theme = {
  backgroundTop: '#120f14',
  backgroundBottom: '#0a0809',
  paper: '#fdf7ed',
  paperEdge: '#f0e1c4',
  scannerStart: '#5be7c4aa',
  scannerEnd: '#e63946aa',
  chunkA: '#e63946',
  chunkB: '#5be7c4',
  chunkFail: '#2d2a32',
  chunkSuccess: '#f6c344',
  textPrimary: '#f7f1e7',
  textMuted: '#b1a9a0',
  accentRed: '#e63946',
  accentMint: '#5be7c4',
  accentGold: '#f6c344',
  panel: '#1d1a1f',
  barTrack: '#2d2a32',
  barFill: '#f6c344',
  textOnPaper: '#1c181f',
};

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const recordBtn = document.getElementById('recordBtn') as HTMLButtonElement;
const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
const speedSelect = document.getElementById('speedSelect') as HTMLSelectElement;

const targetWidth = 1280;
const targetHeight = 720;
const targetFps = 60;
const maxDurationMs = 180000; // keep under 3 minutes even for dense logs

let logData: LogData | null = null;
let logFrames: Frame[] = [];
let sampledFrames: Frame[] = [];
let currentIndex = 0;
let playing = false;
let playbackSpeed = parseFloat(speedSelect?.value ?? '1') || 1;
let lastTimestamp = 0;
let accumulator = 0;
let frameIntervalMs = 1000 / targetFps;
let recorder: MediaRecorder | null = null;
let recordedChunks: BlobPart[] = [];
let sumFlash = 0;
let lastSum = 0;
let invalidFlash = 0;
let showStatusLabel = false;
const puzzleDayLabel = 'Day 02';
const puzzleName = 'Gift Shop Receipt Scanner';

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = targetWidth * dpr;
  canvas.height = targetHeight * dpr;
  canvas.style.width = `${targetWidth}px`;
  canvas.style.height = `${targetHeight}px`;
  ctx.scale(dpr, dpr);
}

resizeCanvas();

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function sampleFrames(raw: Frame[]): Frame[] {
  if (raw.length === 0) return [];
  const maxFrames = Math.floor((maxDurationMs / 1000) * targetFps);
  const importantTypes: FrameType[] = ['range_start', 'invalid_hit', 'range_end', 'final_summary'];
  const importantIndices = new Set<number>();
  raw.forEach((frame, idx) => {
    if (importantTypes.includes(frame.frame_type)) importantIndices.add(idx);
  });

  const stride = Math.max(1, Math.ceil(raw.length / maxFrames));
  const result: Frame[] = [];

  for (let i = 0; i < raw.length; i++) {
    const frame = raw[i];
    if (importantIndices.has(i) || i % stride === 0) {
      result.push(frame);
    }
  }

  const last = raw[raw.length - 1];
  if (result[result.length - 1] !== last) {
    result.push(last);
  }

  return result;
}

function validateLog(data: any): data is LogData {
  return (
    data &&
    data.puzzle_day === 2 &&
    data.part === 2 &&
    Array.isArray(data.frames) &&
    Array.isArray(data.ranges)
  );
}

function loadLog(file: File) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result as string);
      if (!validateLog(parsed)) {
        alert('Invalid log format for Day 02.');
        return;
      }
      logData = parsed;
      logFrames = parsed.frames;
      sampledFrames = sampleFrames(logFrames);
      currentIndex = 0;
      playing = false;
      lastTimestamp = 0;
      accumulator = 0;
      frameIntervalMs = 1000 / targetFps;
      lastSum = sampledFrames[0]?.global_sum ?? 0;
      sumFlash = 0;
      showStatusLabel = false;
      startBtn.disabled = false;
      recordBtn.disabled = false;
      stopBtn.disabled = true;
      renderCurrentFrame();
    } catch (err) {
      console.error(err);
      alert('Failed to parse JSON log.');
    }
  };
  reader.readAsText(file);
}

fileInput.addEventListener('change', (e) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    loadLog(file);
  }
});

speedSelect.addEventListener('change', () => {
  playbackSpeed = parseFloat(speedSelect.value);
});

startBtn.addEventListener('click', () => {
  if (!sampledFrames.length) return;
  if (playing) return;
  showStatusLabel = true;
  playing = true;
  stopBtn.disabled = false;
  lastTimestamp = 0;
  accumulator = 0;
  requestAnimationFrame(loop);
});

recordBtn.addEventListener('click', () => {
  if (!sampledFrames.length || recorder) return;
  recordedChunks = [];
  const stream = canvas.captureStream(targetFps);
  const options: MediaRecorderOptions = {};
  const mimeType = pickRecordingMimeType();
  if (mimeType) {
    options.mimeType = mimeType;
  } else {
    console.warn('No supported WebM codec found for MediaRecorder; using browser default.');
  }

  try {
    recorder = new MediaRecorder(stream, options);
  } catch (err) {
    console.error('Failed to start MediaRecorder', err);
    alert('Recording is not supported in this browser.');
    return;
  }
  recorder.ondataavailable = (evt) => {
    if (evt.data.size > 0) recordedChunks.push(evt.data);
  };
  recorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'day02-visualization.webm';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Restart from the beginning for a clean recording.
  showStatusLabel = true;
  currentIndex = 0;
  playing = true;
  lastTimestamp = 0;
  accumulator = 0;
  recorder.start();
  stopBtn.disabled = false;
  requestAnimationFrame(loop);
});

function pickRecordingMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return undefined;
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

stopBtn.addEventListener('click', () => {
  playing = false;
  if (recorder) {
    recorder.stop();
    recorder = null;
  }
  stopBtn.disabled = true;
});

function loop(timestamp: number) {
  if (!playing) return;
  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = (timestamp - lastTimestamp) * playbackSpeed;
  lastTimestamp = timestamp;
  accumulator += delta;

  while (accumulator >= frameIntervalMs) {
    accumulator -= frameIntervalMs;
    if (currentIndex < sampledFrames.length - 1) {
      currentIndex += 1;
    } else {
      playing = false;
      if (recorder) {
        recorder.stop();
        recorder = null;
      }
      stopBtn.disabled = true;
      break;
    }
  }

  renderCurrentFrame();
  requestAnimationFrame(loop);
}

function renderCurrentFrame() {
  if (!sampledFrames.length || !ctx) return;
  const frame = sampledFrames[currentIndex];
  const next = sampledFrames[Math.min(currentIndex + 1, sampledFrames.length - 1)];
  const t = Math.min(1, accumulator / frameIntervalMs);

  const interpProgress = lerp(frame.range_progress, next.range_progress, t);
  const interpSum = lerp(frame.global_sum, next.global_sum, t);

  if (frame.global_sum !== lastSum) {
    // Only the number should flash on invalid hits; keep other UI steady.
    sumFlash = frame.frame_type === 'invalid_hit' ? 0 : 1;
    lastSum = frame.global_sum;
  } else {
    sumFlash = Math.max(0, sumFlash - 0.05);
  }

  if (frame.frame_type === 'invalid_hit') {
    invalidFlash = 1;
  } else {
    invalidFlash = Math.max(0, invalidFlash - 0.06);
  }

  drawScene(frame, interpProgress, interpSum);
}

function drawScene(frame: Frame, interpProgress: number, interpSum: number) {
  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height / (window.devicePixelRatio || 1));
  grad.addColorStop(0, theme.backgroundTop);
  grad.addColorStop(1, theme.backgroundBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  drawAmbientLines();
  drawRangeInfo(frame, interpProgress);
  drawRegister(frame, interpSum);
  drawReceipt(frame);
  drawProgressBar(interpProgress);
  drawFooter(frame);
  drawTitleBadge();
}

function drawTitleBadge() {
  const padding = 12;
  const badgeHeight = 50;
  const badgeWidth = 360;
  const x = targetWidth / 2 - badgeWidth / 2;
  const y = 18;
  ctx.save();
  ctx.fillStyle = theme.panel;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(x, y, badgeWidth, badgeHeight);
  ctx.strokeStyle = theme.accentMint;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, badgeWidth, badgeHeight);
  ctx.globalAlpha = 1;
  ctx.fillStyle = theme.accentGold;
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(puzzleDayLabel, x + padding, y + badgeHeight / 2);
  ctx.fillStyle = theme.textPrimary;
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(puzzleName, x + badgeWidth - padding, y + badgeHeight / 2);
  ctx.restore();
}

function drawAmbientLines() {
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = theme.accentRed;
  ctx.lineWidth = 1;
  for (let x = -200; x < targetWidth + 200; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 200, targetHeight);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRangeInfo(frame: Frame, progress: number) {
  ctx.save();
  ctx.fillStyle = theme.panel;
  ctx.globalAlpha = 0.8;
  ctx.fillRect(30, 24, 360, 110);
  ctx.globalAlpha = 1;

  const label =
    logData?.ranges?.find((r) => r.index === frame.range_index)?.label ??
    `Range ${frame.range_index + 1}`;

  ctx.fillStyle = theme.textPrimary;
  ctx.font = '18px "Courier New", monospace';
  ctx.fillText(label, 50, 52);
  ctx.fillStyle = theme.textMuted;
  ctx.fillText(`${frame.range_start} → ${frame.range_end}`, 50, 78);
  ctx.fillText(`Progress: ${(progress * 100).toFixed(1)}%`, 50, 104);
  ctx.restore();
}

function drawRegister(frame: Frame, interpSum: number) {
  ctx.save();
  ctx.fillStyle = theme.panel;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(targetWidth - 380, 24, 330, 110);
  ctx.globalAlpha = 1;

  ctx.fillStyle = theme.textMuted;
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillText('INVALID TOTAL', targetWidth - 360, 56);

  ctx.fillStyle = mixColor(theme.accentGold, theme.accentMint, sumFlash * 0.6);
  ctx.font = '32px "Courier New", monospace';
  ctx.fillText(Math.round(interpSum).toLocaleString(), targetWidth - 360, 92);

  ctx.fillStyle = theme.textMuted;
  const invalids = frame.global_invalids ?? 0;
  ctx.fillText(`IDs found: ${invalids}`, targetWidth - 360, 120);
  ctx.restore();
}

function drawReceipt(frame: Frame) {
  const digits = frame.digits ?? (frame.number !== undefined ? frame.number.toString() : '');
  const slipWidth = Math.min(targetWidth * 0.8, 60 * Math.max(4, digits.length));
  const slipHeight = 200;
  const x = (targetWidth - slipWidth) / 2;
  const y = (targetHeight - slipHeight) / 2;

  // Paper base
  ctx.save();
  ctx.fillStyle = theme.paper;
  ctx.strokeStyle = theme.paperEdge;
  ctx.lineWidth = 6;
  ctx.fillRect(x, y, slipWidth, slipHeight);
  ctx.strokeRect(x, y, slipWidth, slipHeight);

  // Scanner beam
  const beam = ctx.createLinearGradient(x, y + slipHeight / 2 - 12, x, y + slipHeight / 2 + 12);
  beam.addColorStop(0, theme.scannerStart);
  beam.addColorStop(1, theme.scannerEnd);
  ctx.fillStyle = beam;
  ctx.fillRect(x, y + slipHeight / 2 - 12, slipWidth, 24);

  drawDigits(digits, frame, { x, y, width: slipWidth, height: slipHeight });
  ctx.restore();
}

function drawDigits(digits: string, frame: Frame, rect: { x: number; y: number; width: number; height: number }) {
  const padding = 18;
  const availableWidth = rect.width - padding * 2;
  const digitWidth = Math.min(56, Math.max(28, availableWidth / Math.max(4, digits.length)));
  const digitHeight = 76;
  const startX = rect.x + (rect.width - digitWidth * digits.length) / 2;
  const startY = rect.y + rect.height / 2 - digitHeight / 2 + 10;

  // Chunk highlighting disabled to keep focus on digits only.
  ctx.globalAlpha = 1;

  // Digits
  const flash = invalidFlash;
  const digitColor =
    flash > 0 ? mixColor(theme.textOnPaper, theme.accentGold, Math.min(1, flash)) : theme.textOnPaper;
  const shadowBlur = 18 * flash;
  ctx.save();
  ctx.shadowColor = theme.accentRed;
  ctx.shadowBlur = shadowBlur;
  for (let i = 0; i < digits.length; i++) {
    const ch = digits[i];
    const dx = startX + i * digitWidth;
    ctx.fillStyle = digitColor;
    ctx.font = '48px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, dx + digitWidth / 2, startY + digitHeight / 2);
  }
  ctx.restore();

  // Status ribbon
  ctx.save();
  const ribbonHeight = 34;
  const ribbonY = rect.y + rect.height - ribbonHeight;
  const ribbonColor = theme.accentRed;
  ctx.fillStyle = ribbonColor;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(rect.x, ribbonY, rect.width, ribbonHeight);

  ctx.fillStyle = theme.backgroundBottom;
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = showStatusLabel ? labelForFrame(frame) : '';
  ctx.fillText(label, rect.x + rect.width / 2, ribbonY + ribbonHeight / 2);
  ctx.restore();
}

function labelForFrame(frame: Frame): string {
  switch (frame.frame_type) {
    case 'final_summary':
      return 'All ranges complete';
    default:
      return 'Scanning';
  }
}

function drawProgressBar(progress: number) {
  const width = targetWidth * 0.84;
  const height = 18;
  const x = (targetWidth - width) / 2;
  const y = targetHeight - 70;
  ctx.save();
  ctx.fillStyle = theme.barTrack;
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = theme.barFill;
  ctx.fillRect(x, y, width * progress, height);
  ctx.restore();
}

function drawFooter(frame: Frame) {
  ctx.save();
  ctx.fillStyle = theme.textMuted;
  ctx.font = '14px "Segoe UI", sans-serif';
  let text = frame.message ?? 'Drop a Day 02 log to begin the animation.';
  if (
    frame.frame_type === 'pattern_check' &&
    frame.repeat_count &&
    frame.chunk_length &&
    frame.candidate_chunk
  ) {
    text = `${frame.repeat_count} repeats of "${frame.candidate_chunk}" (${frame.chunk_length}-digit chunk) ${frame.match ? 'matched' : 'failed'}`;
  } else if (
    frame.frame_type === 'invalid_hit' &&
    frame.repeat_count &&
    frame.chunk_length &&
    frame.candidate_chunk
  ) {
    text = `Invalid ID: ${frame.repeat_count} repeats of "${frame.candidate_chunk}" → sum ${frame.global_sum}`;
  }
  ctx.fillText(text, (targetWidth - ctx.measureText(text).width) / 2, targetHeight - 32);
  ctx.restore();
}

function mixColor(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  if (!ca || !cb) return a;
  const r = Math.round(lerp(ca.r, cb.r, t));
  const g = Math.round(lerp(ca.g, cb.g, t));
  const bl = Math.round(lerp(ca.b, cb.b, t));
  return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return null;
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Initial idle render
drawScene(
  {
    frame_type: 'range_start',
    range_index: 0,
    range_start: 0,
    range_end: 0,
    range_progress: 0,
    digits: '-----',
    global_sum: 0,
    global_invalids: 0,
  },
  0,
  0,
);
