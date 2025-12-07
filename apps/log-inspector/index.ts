import { LogFile, sampleFrames } from "../shared/logTypes";

type InspectorUI = {
  fileInput: HTMLInputElement;
  summary: HTMLElement;
  frames: HTMLElement;
  errors: HTMLElement;
};

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function renderSummary(container: HTMLElement, log: LogFile) {
  const { sampled, stride } = sampleFrames(log);
  container.innerHTML = `
    <p><strong>Puzzle:</strong> ${log.puzzle.title}</p>
    <p>${log.puzzle.description}</p>
    <p><strong>Timeline:</strong> ${log.timeline.length} frames (${sampled.length} sampled, stride ${stride})</p>
    <p><strong>Theme:</strong> ${log.theme.primaryMood} · background ${log.theme.backgroundStyle}, font ${log.theme.fontStyle}
      ${log.theme.accentMood ? ` · accent mood ${log.theme.accentMood}` : ""}
    </p>
    <p><strong>Config:</strong> ${log.config.fps} fps, max ${log.config.maxDurationSec}s</p>
  `;
}

function renderFrames(container: HTMLElement, log: LogFile) {
  const { sampled } = sampleFrames(log);
  if (sampled.length === 0) {
    container.textContent = "No frames to display.";
    return;
  }

  const list = document.createElement("ol");
  list.start = 1;
  list.style.display = "grid";
  list.style.gridTemplateColumns = "repeat(auto-fit, minmax(280px, 1fr))";
  list.style.gap = "12px";

  sampled.slice(0, 12).forEach((frame) => {
    const item = document.createElement("li");
    item.style.background = "#0f172a";
    item.style.color = "#e2e8f0";
    item.style.border = "1px solid #334155";
    item.style.borderRadius = "8px";
    item.style.padding = "12px";
    item.style.listStyle = "none";

    const header = document.createElement("div");
    header.innerHTML = `<strong>Step ${frame.step}</strong>${frame.phase ? ` · ${frame.phase}` : ""}`;
    item.appendChild(header);

    const trackList = document.createElement("ul");
    trackList.style.paddingLeft = "16px";
    frame.tracks.forEach((track) => {
      const trackItem = document.createElement("li");
      trackItem.innerHTML = `<strong>${track.label}</strong>: ${track.values.join(" | ")}`;
      trackList.appendChild(trackItem);
    });

    item.appendChild(trackList);
    list.appendChild(item);
  });

  container.innerHTML = "";
  container.appendChild(list);

  if (log.timeline.length > sampled.length) {
    const note = document.createElement("p");
    note.textContent = `Showing first ${sampled.length} sampled frames. Original timeline has ${log.timeline.length}.`;
    container.appendChild(note);
  }
}

function attach(): InspectorUI {
  return {
    fileInput: document.getElementById("inspector-file") as HTMLInputElement,
    summary: document.getElementById("inspector-summary") as HTMLElement,
    frames: document.getElementById("inspector-frames") as HTMLElement,
    errors: document.getElementById("inspector-errors") as HTMLElement,
  };
}

function start(ui: InspectorUI) {
  ui.fileInput.addEventListener("change", async (event) => {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) {
      return;
    }
    const file = files[0];
    ui.errors.textContent = "";
    try {
      const text = await readFile(file);
      const log = JSON.parse(text) as LogFile;
      renderSummary(ui.summary, log);
      renderFrames(ui.frames, log);
    } catch (error) {
      console.error(error);
      ui.errors.textContent = "Failed to read log file. Ensure it is valid JSON.";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const ui = attach();
  start(ui);
});
