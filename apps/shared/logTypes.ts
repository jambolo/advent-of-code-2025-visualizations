export interface Track {
  id: string;
  label: string;
  values: (string | number)[];
}

export interface Frame {
  step: number;
  phase?: string;
  tracks: Track[];
}

export interface Theme {
  primaryMood: string;
  accentMood?: string;
  backgroundStyle: "dark" | "light";
  fontStyle: "mono" | "serif" | "sans";
  accentColorHint?: string;
}

export interface LogFile {
  puzzle: {
    title: string;
    description: string;
  };
  theme: Theme;
  config: {
    fps: number;
    maxDurationSec: number;
  };
  timeline: Frame[];
}

export interface SampledFrames {
  sampled: Frame[];
  stride: number;
}

export function sampleFrames(log: LogFile): SampledFrames {
  const maxFrames = log.config.fps * log.config.maxDurationSec;
  const total = log.timeline.length;
  if (total === 0) {
    return { sampled: [], stride: 1 };
  }
  if (total <= maxFrames) {
    return { sampled: log.timeline, stride: 1 };
  }
  const stride = Math.ceil(total / maxFrames);
  const sampled: Frame[] = [];
  for (let i = 0; i < total; i += stride) {
    sampled.push(log.timeline[i]);
  }
  if ((total - 1) % stride !== 0) {
    sampled.push(log.timeline[total - 1]);
  }
  return { sampled, stride };
}

export function chooseAccentColor(theme: Theme): string {
  if (theme.accentColorHint) {
    return theme.accentColorHint;
  }
  if (theme.accentMood === "danger") return "#ff4d6d";
  if (theme.accentMood === "calm") return "#5bc0de";
  if (theme.accentMood === "energy") return "#f39c12";
  return theme.backgroundStyle === "dark" ? "#9b59b6" : "#2c3e50";
}

export function backgroundColor(theme: Theme): string {
  return theme.backgroundStyle === "dark" ? "#0b1021" : "#fdfdfd";
}

export function foregroundColor(theme: Theme): string {
  return theme.backgroundStyle === "dark" ? "#f3f6ff" : "#1b1b1b";
}

export function fontFamily(theme: Theme): string {
  switch (theme.fontStyle) {
    case "mono":
      return "'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
    case "serif":
      return "'Merriweather', 'Times New Roman', serif";
    default:
      return "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
  }
}
