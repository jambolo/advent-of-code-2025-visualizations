# Emission Rules — Day 04: Printing Department

## Overview

The solver performs iterative erosion passes. Each pass scans the entire grid and removes all rolls with fewer than 4 neighbors. The visualization must show this process without exceeding reasonable animation length.

## Grid Dimensions

From the input:
- Width: 140 characters
- Height: 135 rows
- Total cells: 18,900
- Initial rolls: ~10,000+ `@` characters
- Final removed: 8,890

## Conceptual Steps to Emit

### 1. Initial State
- Emit once at start.
- Contains the full grid state before any removals.

### 2. Pass Summary
- Emit at the end of each pass.
- Contains: pass number, grid state after pass, count removed this pass, running total.
- This is the primary frame type for visualization.

### 3. Final State
- Emit once when no more removals occur.
- Contains final grid and total count.

## Frame Sampling Strategy

### Challenge
- The example shows ~10 passes removing ~43 rolls.
- Real input likely has many more passes (estimated 50-200 passes based on grid size).
- At 8,890 removals, showing each individual removal would be excessive.

### Solution: Pass-Level Frames
- Emit one frame per pass completion (not per cell removal).
- Each frame contains the complete grid state after that pass.
- The visualizer interpolates or batch-displays the removals.

### Estimated Frame Count
- ~100-200 passes maximum.
- Well under 5-minute animation at reasonable speeds.

## Emission Rules

| Event | Emit? | Content |
|-------|-------|---------|
| Solver start | Yes | Initial grid, dimensions, total rolls |
| Each pass complete | Yes | Pass number, grid snapshot, removals this pass, total removed |
| No removals (final) | Yes | Final grid, total removed, pass count |

## Progress Visualization

The visualizer should show:
1. **Pass progress**: Current pass number / estimated total.
2. **Removal progress**: Removed so far / total removable (8,890).
3. **Scan animation**: Optional animated scan beam within each pass frame.

## Animation Timing

| Phase | Duration |
|-------|----------|
| Initial display | 1-2 seconds |
| Per pass | 0.5-2 seconds (adjustable by user) |
| Final reveal | 2-3 seconds |
| Total estimate | 2-5 minutes depending on speed |

## Data Reduction

To keep JSON log manageable:
- Store grid as array of strings (one per row) rather than cell-by-cell.
- Include delta info: list of (x, y) positions removed this pass.
- Visualizer reconstructs intermediate states from deltas.

## Summary

- ~100-200 frames total (one per pass).
- Each frame has full grid state or delta list.
- Visualizer handles sub-pass animation internally.
- Total animation < 5 minutes at 1x speed.
