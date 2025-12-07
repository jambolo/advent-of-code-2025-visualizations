import {
  LogFile,
  Frame,
  sampleFrames,
  chooseAccentColor,
  backgroundColor,
  foregroundColor,
  fontFamily,
} from "../shared/logTypes";

type UIElements = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  loadInput: HTMLInputElement;
  loadStatus: HTMLElement;
  playButton: HTMLButtonElement;
  recordButton: HTMLButtonElement;
  downloadLink: HTMLAnchorElement;
  fpsLabel: HTMLElement;
  strideLabel: HTMLElement;
};

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function formatTrackValues(values: (string | number)[]): string {
  return values
    .map((value) => (typeof value === "number" ? value.toString() : value))
    .join(" | ");
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  themeColors: { bg: string; fg: string; accent: string },
  font: string,
  width: number,
  height: number
): void {
  ctx.fillStyle = themeColors.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = themeColors.fg;
  ctx.font = `16px ${font}`;

  const headerY = 30;
  ctx.fillText(`Step ${frame.step}${frame.phase ? ` · ${frame.phase}` : ""}`, 20, headerY);

  const laneHeight = 60;
  const margin = 20;
  const labelWidth = 140;
  const valueX = margin + labelWidth;
  const startY = headerY + 20;

  frame.tracks.forEach((track, index) => {
    const y = startY + index * laneHeight;
    const labelY = y + 24;
    ctx.fillStyle = themeColors.accent;
    ctx.fillText(track.label, margin, labelY);

    ctx.fillStyle = themeColors.fg;
    ctx.fillText(formatTrackValues(track.values), valueX, labelY);

    ctx.strokeStyle = themeColors.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, y + laneHeight - 12);
    ctx.lineTo(width - margin, y + laneHeight - 12);
    ctx.stroke();
  });
}

async function renderAndRecord(log: LogFile, ui: UIElements): Promise<void> {
  const { sampled, stride } = sampleFrames(log);
  if (sampled.length === 0) {
    ui.loadStatus.textContent = "No frames available in timeline.";
    return;
  }

  const themeColors = {
    bg: backgroundColor(log.theme),
    fg: foregroundColor(log.theme),
    accent: chooseAccentColor(log.theme),
  };
  const font = fontFamily(log.theme);

  const stream = ui.canvas.captureStream(log.config.fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp9",
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const framesPerSecond = log.config.fps;
  const frameDurationMs = 1000 / framesPerSecond;

  const renderPromise = new Promise<void>((resolve) => {
    let index = 0;
    const drawNext = () => {
      if (index >= sampled.length) {
        recorder.stop();
        resolve();
        return;
      }
      drawFrame(ui.context, sampled[index], themeColors, font, ui.canvas.width, ui.canvas.height);
      index += 1;
      setTimeout(drawNext, frameDurationMs);
    };
    recorder.start();
    drawNext();
  });

  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  await renderPromise;

  const blob = new Blob(chunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);
  ui.downloadLink.href = url;
  ui.downloadLink.download = "animation.webm";
  ui.downloadLink.style.display = "inline-block";
  ui.downloadLink.textContent = "Download animation.webm";

  ui.loadStatus.textContent = `Rendered ${sampled.length} frames (stride ${stride}).`;
  ui.strideLabel.textContent = stride.toString();
}

function attachUI(): UIElements {
  const canvas = document.getElementById("visualizer-canvas") as HTMLCanvasElement;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas could not be initialized");
  }

  return {
    canvas,
    context,
    loadInput: document.getElementById("log-file") as HTMLInputElement,
    loadStatus: document.getElementById("load-status") as HTMLElement,
    playButton: document.getElementById("play-button") as HTMLButtonElement,
    recordButton: document.getElementById("record-button") as HTMLButtonElement,
    downloadLink: document.getElementById("download-link") as HTMLAnchorElement,
    fpsLabel: document.getElementById("fps-value") as HTMLElement,
    strideLabel: document.getElementById("stride-value") as HTMLElement,
  };
}

function wireEvents(ui: UIElements): void {
  let loadedLog: LogFile | null = null;

  ui.loadInput.addEventListener("change", async (event) => {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) {
      return;
    }
    const file = files[0];
    ui.loadStatus.textContent = `Loading ${file.name}...`;
    try {
      const text = await readFileAsText(file);
      loadedLog = JSON.parse(text) as LogFile;
      const { sampled, stride } = sampleFrames(loadedLog);
      ui.loadStatus.textContent = `Loaded ${loadedLog.timeline.length} frames (sampled ${sampled.length} with stride ${stride}).`;
      ui.fpsLabel.textContent = loadedLog.config.fps.toString();
      ui.strideLabel.textContent = stride.toString();
    } catch (error) {
      console.error(error);
      ui.loadStatus.textContent = "Failed to parse log.json. See console for details.";
    }
  });

  ui.playButton.addEventListener("click", () => {
    if (!loadedLog) {
      ui.loadStatus.textContent = "Load a log.json file before playing.";
      return;
    }
    const themeColors = {
      bg: backgroundColor(loadedLog.theme),
      fg: foregroundColor(loadedLog.theme),
      accent: chooseAccentColor(loadedLog.theme),
    };
    const font = fontFamily(loadedLog.theme);
    const { sampled } = sampleFrames(loadedLog);

    if (sampled.length === 0) {
      ui.loadStatus.textContent = "No frames to display.";
      return;
    }
    let index = 0;
    const renderNext = () => {
      if (index >= sampled.length) return;
      drawFrame(ui.context, sampled[index], themeColors, font, ui.canvas.width, ui.canvas.height);
      index += 1;
      requestAnimationFrame(renderNext);
    };
    renderNext();
    ui.loadStatus.textContent = "Preview complete. Use Record to capture video.";
  });

  ui.recordButton.addEventListener("click", async () => {
    if (!loadedLog) {
      ui.loadStatus.textContent = "Load a log.json file before recording.";
      return;
    }
    ui.downloadLink.style.display = "none";
    await renderAndRecord(loadedLog, ui);
  });
}

function bootstrap() {
  const ui = attachUI();
  wireEvents(ui);
}

document.addEventListener("DOMContentLoaded", bootstrap);
