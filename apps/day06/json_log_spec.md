# JSON Log Specification — Day 06: Trash Compactor

## Overview

The Rust solver emits a JSON file capturing the cephalopod math processing for Part 2. The visualizer consumes this to animate right-to-left column reading and problem solving.

## Top-Level Structure

```json
{
  "day": 6,
  "part": 2,
  "grid": ["123 328  51 64 ", " 45 64  387 23 ", ...],
  "rows": 4,
  "cols": 16,
  "problem_count": 4,
  "grand_total": "10227753257799",
  "frames": [ ... ]
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `day` | number | Yes | Puzzle day (always 6) |
| `part` | number | Yes | Puzzle part (always 2) |
| `grid` | string[] | Yes | Worksheet as array of row strings (original input lines) |
| `rows` | number | Yes | Number of rows in the worksheet |
| `cols` | number | Yes | Number of columns in the worksheet |
| `problem_count` | number | Yes | Total number of problems in the worksheet |
| `grand_total` | string | Yes | Final answer (as string for i64) |
| `frames` | Frame[] | Yes | Array of frame objects |

## Frame Structure

Each frame represents a step in the algorithm.

```json
{
  "frame_type": "problem",
  "problem_index": 0,
  "column_start": 14,
  "column_end": 16,
  "numbers": ["4", "431", "623"],
  "operator": "+",
  "result": "1058",
  "running_total": "1058"
}
```

### Frame Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `frame_type` | string | Yes | One of: `"initial"`, `"problem"`, `"final"` |
| `problem_index` | number | No | Problem number from right (0-indexed), for "problem" type |
| `column_start` | number | No | Starting column of this problem (inclusive) |
| `column_end` | number | No | Ending column of this problem (inclusive) |
| `numbers` | string[] | No | Numbers extracted from this problem (as strings) |
| `operator` | string | No | `"+"` or `"*"` for this problem |
| `result` | string | No | Result of this problem (as string) |
| `running_total` | string | Yes | Current sum of all results so far (as string) |

### Frame Types

| Type | When Emitted | Description |
|------|--------------|-------------|
| `initial` | Before processing | Shows worksheet, no problems processed yet |
| `problem` | Each problem solved | One problem has been read and calculated |
| `final` | After all problems | Grand total complete |

## Example Log

```json
{
  "day": 6,
  "part": 2,
  "grid": [
    "123 328  51 64 ",
    " 45 64  387 23 ",
    "  6 98  215 314",
    "*   +   *   +  "
  ],
  "rows": 4,
  "cols": 16,
  "problem_count": 4,
  "grand_total": "3263827",
  "frames": [
    {
      "frame_type": "initial",
      "running_total": "0"
    },
    {
      "frame_type": "problem",
      "problem_index": 0,
      "column_start": 12,
      "column_end": 15,
      "numbers": ["4", "431", "623"],
      "operator": "+",
      "result": "1058",
      "running_total": "1058"
    },
    {
      "frame_type": "problem",
      "problem_index": 1,
      "column_start": 8,
      "column_end": 10,
      "numbers": ["175", "581", "32"],
      "operator": "*",
      "result": "3253600",
      "running_total": "3254658"
    },
    {
      "frame_type": "problem",
      "problem_index": 2,
      "column_start": 4,
      "column_end": 6,
      "numbers": ["8", "248", "369"],
      "operator": "+",
      "result": "625",
      "running_total": "3255283"
    },
    {
      "frame_type": "problem",
      "problem_index": 3,
      "column_start": 0,
      "column_end": 2,
      "numbers": ["356", "24", "1"],
      "operator": "*",
      "result": "8544",
      "running_total": "3263827"
    },
    {
      "frame_type": "final",
      "running_total": "3263827"
    }
  ]
}
```

## Implementation Notes for Rust

1. **Parse the worksheet** into a 2D character grid.
2. **Emit initial frame** with the grid displayed.
3. **Identify problem boundaries**: Scan for blank columns (all spaces) that separate problems.
4. **Process right-to-left**: Start from the rightmost problem.
5. **For each problem**:
   - Identify column range
   - Read each column top-to-bottom to extract digit sequence
   - Reconstruct number from digits (MSD at top)
   - Extract operator from bottom row
   - Calculate result
   - Update running total
   - Emit problem frame
6. **Emit final frame** with grand total.
7. **Serialize i64 as strings** to preserve precision in JSON.

### Column Reading Algorithm

For a problem spanning columns C1 to C2:
- Process columns right-to-left within the problem
- For each column, read characters from top to bottom (excluding operator row)
- Digits form the number for that column (e.g., column with '1', '4', '6' = 146)
- Skip blank/space characters in the column

## Validation

The visualizer expects:
- `frames` array is non-empty
- First frame has `frame_type: "initial"`
- Last frame has `frame_type: "final"`
- `running_total` in final frame equals `grand_total`
- All numeric values are valid string representations of integers
- `grid` array has exactly `rows` elements
- Each grid row has exactly `cols` characters
