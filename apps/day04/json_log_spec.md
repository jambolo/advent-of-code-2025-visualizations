# JSON Log Specification — Day 04: Printing Department

## Overview

The Rust solver must emit a JSON file that the visualizer consumes. The log contains metadata about the grid and a sequence of frames representing each erosion pass.

## Top-Level Structure

```json
{
  "day": 4,
  "part": 2,
  "width": 140,
  "height": 135,
  "initial_rolls": 10234,
  "final_removed": 8890,
  "frames": [ ... ]
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `day` | number | Yes | Puzzle day (always 4) |
| `part` | number | Yes | Puzzle part (always 2 for visualization) |
| `width` | number | Yes | Grid width in characters |
| `height` | number | Yes | Grid height in rows |
| `initial_rolls` | number | Yes | Count of `@` characters in initial grid |
| `final_removed` | number | Yes | Total rolls removed (puzzle answer: 8890) |
| `frames` | Frame[] | Yes | Array of frame objects |

## Frame Structure

Each frame represents the state after a pass (or initial/final state).

```json
{
  "frame_type": "pass_complete",
  "pass_number": 5,
  "grid": [
    "..@@.@@@@.",
    "@@@.@.@.@@",
    ...
  ],
  "removed_this_pass": [
    {"x": 2, "y": 0},
    {"x": 3, "y": 0},
    ...
  ],
  "removed_count": 12,
  "total_removed": 45
}
```

### Frame Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `frame_type` | string | Yes | One of: `"initial"`, `"pass_complete"`, `"final"` |
| `pass_number` | number | Yes | Pass iteration (0 for initial, 1+ for passes) |
| `grid` | string[] | Yes | Current grid state (array of row strings) |
| `removed_this_pass` | Position[] | Yes | Positions removed in this pass |
| `removed_count` | number | Yes | Count of removals this pass |
| `total_removed` | number | Yes | Cumulative removals so far |

### Frame Types

| Type | When Emitted |
|------|--------------|
| `initial` | Before any erosion, showing original grid |
| `pass_complete` | After each erosion pass that removed at least one roll |
| `final` | After the last pass when no more removals occur |

## Position Structure

```json
{
  "x": 42,
  "y": 17
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x` | number | Yes | Column index (0-based, left to right) |
| `y` | number | Yes | Row index (0-based, top to bottom) |

## Grid Encoding

- Each row is a string of characters.
- `@` represents a paper roll present.
- `.` represents an empty cell (roll removed or never present).
- The grid array has `height` elements.
- Each string has `width` characters.

## Example Log

```json
{
  "day": 4,
  "part": 2,
  "width": 10,
  "height": 10,
  "initial_rolls": 60,
  "final_removed": 43,
  "frames": [
    {
      "frame_type": "initial",
      "pass_number": 0,
      "grid": [
        "..@@.@@@@.",
        "@@@.@.@.@@",
        "@@@@@.@.@@",
        "@.@@@@..@.",
        "@@.@@@@.@@",
        ".@@@@@@@.@",
        ".@.@.@.@@@",
        "@.@@@.@@@@",
        ".@@@@@@@@.",
        "@.@.@@@.@."
      ],
      "removed_this_pass": [],
      "removed_count": 0,
      "total_removed": 0
    },
    {
      "frame_type": "pass_complete",
      "pass_number": 1,
      "grid": [
        "....@@@..",
        ".@@.@.@.@@",
        "@@@@@...@@",
        "..@@@@..@.",
        ".@.@@@@.@.",
        ".@@@@@@@.@",
        ".@.@.@.@@@",
        "..@@@.@@@@",
        ".@@@@@@@@.",
        "....@@@..."
      ],
      "removed_this_pass": [
        {"x": 2, "y": 0},
        {"x": 3, "y": 0},
        {"x": 5, "y": 0},
        {"x": 6, "y": 0},
        {"x": 8, "y": 0},
        {"x": 0, "y": 1}
      ],
      "removed_count": 13,
      "total_removed": 13
    },
    {
      "frame_type": "final",
      "pass_number": 9,
      "grid": [
        "..........",
        "..........",
        "....@.....",
        "...@@@....",
        "...@@@@...",
        "...@@@@@..",
        "...@.@.@@.",
        "...@@.@@@.",
        "...@@@@@..",
        "....@@@..."
      ],
      "removed_this_pass": [
        {"x": 3, "y": 3}
      ],
      "removed_count": 1,
      "total_removed": 43
    }
  ]
}
```

## Implementation Notes for Rust

1. **Emit initial frame** before the erosion loop starts.
2. **Track removals**: During each pass, collect positions of removed rolls.
3. **Emit pass_complete** after each pass that removes at least one roll.
4. **Emit final** when a pass removes zero rolls.
5. **Grid as strings**: Convert `Vec<Vec<char>>` to `Vec<String>` for JSON serialization.
6. **Position coordinates**: Use 0-based indexing with x=column, y=row.

## Validation

The visualizer expects:
- `frames` array is non-empty.
- First frame has `frame_type: "initial"`.
- Last frame has `frame_type: "final"`.
- All grid rows have the same length (`width`).
- `total_removed` in final frame equals `final_removed`.
