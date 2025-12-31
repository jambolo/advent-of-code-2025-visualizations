# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## General Instructions for Claude

### Token Discipline

- Be concise by default.
- No explanations unless explicitly requested.
- No restating the question.
- No summaries at the end.
- Use bullet points only when clarity improves.
- Prefer short sentences.
- Assume reader is expert.

### Output Rules

- Answer the question directly.
- Do not add context, background, or alternatives unless asked.
- If uncertain, say "unknown" or ask one clarifying question.

### Code

- Output code only, no commentary.
- Prefer minimal, idiomatic solutions.
- Except when explicitly instructed otherwise, limit comments to very brief descriptions of what the code does. Do not describe why changes were made.

### Interaction

- Ask at most one clarifying question.
- Never suggest next steps unless requested.

## Project Overview

This repository creates browser-based visualizations for Advent of Code 2025 puzzle solutions. Each puzzle gets its own visualization app in `apps/dayNN/` that reads a JSON log emitted by an instrumented Rust solver and renders an animated WebM video.

## Commands

```bash
pnpm run build        # Compile TypeScript and copy support files to dist/
pnpm test             # Run Jest tests
pnpm run test:coverage # Run tests with coverage
cd ~/projects/advent-of-code-2025-visualizations && pnpm dlx serve dist/apps/dayNN # Serve day NN (required to run from project root)
pnpm build # Build the app and publish to dist folder
```

## Architecture

### Workflow (see process.md)

1. Rust solvers live in `advent-of-code-2025/` submodule
2. LLM generates design docs (`input_summary.md`, `visual_theme.md`, `emission_rules.md`) and `json_log_spec.md`
3. LLM generates `dayNN-visualizer.ts` + `index.html` that consume a JSON log
4. Human and LLM instrument the Rust solver per `json_log_spec.md` (see `instrumentation_prompt.md`)
5. Instrumented solver outputs JSON to `recording.json`
6. Visualizer loads JSON and records animation to WebM

### Per-Day Structure (`apps/dayNN/`)

- `dayNN-visualizer.ts` - TypeScript visualizer (canvas rendering, MediaRecorder)
- `index.html` - Browser entry point with controls
- `recording.json` - JSON log from instrumented Rust solver
- Design docs: `input_summary.md`, `visual_theme.md`, `emission_rules.md`, `json_log_spec.md`

### Visualizer Pattern

Each visualizer follows a common pattern:

- Loads JSON log via file input
- Renders to canvas using puzzle-specific theme
- Supports playback speed control (0.5x-5x)
- Records to WebM using `canvas.captureStream()` + `MediaRecorder`
- Detects supported MIME types (vp9 → vp8 → generic WebM)

### Key Prompts

- `implementation_prompt.md` - Instructions for generating visualizer code and design docs
- `instrumentation_prompt.md` - Instructions for adding JSON logging to Rust solvers (feature-gated with `#[cfg(feature = "instrumented")]`)
