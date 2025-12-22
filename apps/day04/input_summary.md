# Input Summary — Day 04: Printing Department

## Puzzle Purpose

Paper rolls (`@`) are arranged on a grid. Forklifts can only access a roll if it has **fewer than 4 adjacent rolls** in the 8 neighboring positions. Part 1 counts accessible rolls; Part 2 iteratively removes accessible rolls until no more can be removed.

## Solver Algorithm

### Part 1
- Scan every cell containing `@`.
- Count neighbors (8-directional) that are also `@`.
- If count < 4, the roll is accessible.
- Sum all accessible rolls.

### Part 2 (Visualized)
- Clone the grid.
- Loop:
  1. Scan all cells.
  2. For each `@` with < 4 `@` neighbors, mark it as removed (change to `.`), increment count.
  3. If no removals occurred this pass, stop.
- Report total removed.

This is an iterative erosion process: removing exposed rolls exposes more rolls, which are then removed in subsequent passes.

## State Transitions

| Event | Description |
|-------|-------------|
| Pass start | Begin a new scan of the grid |
| Cell scan | Check a cell's neighbor count |
| Remove | A roll is removed (exposed) |
| Pass end | Summarize removals this pass |
| Final | No more removals possible |

## Visualization Steps

1. **Grid display** — Show the 2D grid of rolls and empty spaces.
2. **Pass iteration** — Highlight cells being evaluated each pass.
3. **Removal animation** — Animate rolls being lifted/removed when they become accessible.
4. **Progress tracking** — Show running total of removed rolls and current pass number.
5. **Final state** — Display the remaining stable core of rolls.

## What the Viewer Must See

- The initial dense grid of paper rolls.
- Each pass sweeping through and identifying exposed rolls.
- Rolls disappearing in waves from the edges inward.
- The gradual erosion revealing the stable interior.
- Final count (8890) and the remaining unreachable rolls.
