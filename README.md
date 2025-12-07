# Advent of Code 2025 Visualizations

![Build Status](https://github.com/jambolo/advent-of-code-2025-visualizations/actions/workflows/ci.yml/badge.svg)
![Coverage Status](https://coveralls.io/repos/github/jambolo/advent-of-code-2025-visualizations/badge.svg?branch=main)

This repository contains multiple TypeScript browser applications that support turning an Advent of Code 2025 solver into a recorded visualization.

## Purpose

The goal of this repo is to provide interactive visualizations that illustrate how each Advent of Code 2025 puzzle solution works. Each application focuses on demonstrating the algorithm, logic, and problem-solving steps for its specific AoC challenge.

## Repository layout

* `apps/shared` – shared TypeScript utilities and interfaces for the JSON log contract (tracks, frames, themes, sampling helpers).
* `apps/visualizer-player` – browser player that loads `log.json`, previews sampled frames, and records the animation to `animation.webm` using the canvas + `MediaRecorder` pipeline.
* `apps/log-inspector` – browser inspector to sanity-check `log.json` metadata and a sampled subset of frames before recording.
* `puzzles/template` – a scaffold for per-puzzle artifacts (`src/main.rs`, `puzzle_description.txt`, `example_input.txt`, `log.json`, and slots for the generated visualizer files).

Run `npm install` once, then build all TypeScript apps with:

```bash
npm run build
```

After building, open the HTML files for each app directly from the `apps/**` folders; they reference the compiled JavaScript in `dist/` via relative module paths.

## Workflow support

The repository is structured around the visualization process described in the Advent of Code animation workflow:

1. **Solve the puzzle in Rust** – place your solver in `puzzles/<puzzle-name>/src/main.rs` (copy from `puzzles/template`).
2. **Send artifacts to the LLM** – include `puzzle_description.txt`, `src/main.rs`, `example_input.txt`, and a description of your visualization goals.
3. **Receive JSON contract + theme** – the LLM’s schema matches the interfaces in `apps/shared/logTypes.ts`.
4. **Instrument the solver** – emit `log.json` following the contract and drop it into `puzzles/<puzzle-name>/`.
5. **Generate the visualizer** – place the LLM-produced `visualizer.ts` and `visualizer.html` next to `log.json` (or use `apps/visualizer-player` directly).
6. **Build and preview** – run `npm run build`, open `apps/log-inspector/index.html` to verify the log, and `apps/visualizer-player/visualizer.html` to preview frames.
7. **Record** – use the player to record and download `animation.webm`, then publish it alongside the puzzle write-up.

Both browser apps work entirely offline once built and rely only on the structured `log.json` files produced by your instrumented solvers.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for more details.
