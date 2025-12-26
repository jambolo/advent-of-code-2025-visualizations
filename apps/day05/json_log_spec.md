# JSON Log Specification — Day 05: Cafeteria

## Overview

The Rust solver emits a JSON file capturing the range-merging process for Part 2. The visualizer consumes this to animate sorting and merging of fresh ingredient ranges.

## Top-Level Structure

```json
{
  "day": 5,
  "part": 2,
  "range_count": 182,
  "global_min": 1007718178712,
  "global_max": 562068246267502,
  "total_fresh": 353716783056994,
  "merged_count": 95,
  "frames": [ ... ]
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `day` | number | Yes | Puzzle day (always 5) |
| `part` | number | Yes | Puzzle part (always 2) |
| `range_count` | number | Yes | Number of input ranges (182) |
| `global_min` | string | Yes | Smallest start value (as string for i64) |
| `global_max` | string | Yes | Largest end value (as string for i64) |
| `total_fresh` | string | Yes | Final answer (as string for i64) |
| `merged_count` | number | Yes | Number of merged ranges in final result |
| `frames` | Frame[] | Yes | Array of frame objects |

**Note**: Large integers (i64) are serialized as strings to preserve precision in JavaScript.

## Frame Structure

Each frame represents a step in the algorithm.

```json
{
  "frame_type": "merge_step",
  "step_index": 5,
  "ranges": [ ... ],
  "current_index": 5,
  "action": "merged",
  "merged_ranges": [ ... ],
  "running_total": "12345678901234"
}
```

### Frame Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `frame_type` | string | Yes | One of: `"initial"`, `"sorted"`, `"merge_step"`, `"final"` |
| `step_index` | number | Yes | Step number (0 for initial/sorted, 1+ for merge steps) |
| `ranges` | Range[] | Yes | All ranges in current order |
| `current_index` | number | No | Index of range being processed (merge_step only) |
| `action` | string | No | `"new"` or `"merged"` (merge_step only) |
| `merged_ranges` | Range[] | Yes | Current list of merged ranges |
| `running_total` | string | Yes | Current sum of fresh IDs (as string) |

### Frame Types

| Type | When Emitted | Description |
|------|--------------|-------------|
| `initial` | Before processing | Original unsorted ranges |
| `sorted` | After sorting | Ranges sorted by start value |
| `merge_step` | Each merge iteration | Processing one sorted range |
| `final` | After all merges | Final merged ranges |

## Range Structure

```json
{
  "start": "6599865270709",
  "end": "7145917173963",
  "original_index": 0
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `start` | string | Yes | Range start value (as string for i64) |
| `end` | string | Yes | Range end value (as string for i64) |
| `original_index` | number | Yes | Original position in input (0-based) |

## Example Log

```json
{
  "day": 5,
  "part": 2,
  "range_count": 4,
  "global_min": "3",
  "global_max": "20",
  "total_fresh": "14",
  "merged_count": 2,
  "frames": [
    {
      "frame_type": "initial",
      "step_index": 0,
      "ranges": [
        {"start": "3", "end": "5", "original_index": 0},
        {"start": "10", "end": "14", "original_index": 1},
        {"start": "16", "end": "20", "original_index": 2},
        {"start": "12", "end": "18", "original_index": 3}
      ],
      "merged_ranges": [],
      "running_total": "0"
    },
    {
      "frame_type": "sorted",
      "step_index": 0,
      "ranges": [
        {"start": "3", "end": "5", "original_index": 0},
        {"start": "10", "end": "14", "original_index": 1},
        {"start": "12", "end": "18", "original_index": 3},
        {"start": "16", "end": "20", "original_index": 2}
      ],
      "merged_ranges": [],
      "running_total": "0"
    },
    {
      "frame_type": "merge_step",
      "step_index": 1,
      "ranges": [
        {"start": "3", "end": "5", "original_index": 0},
        {"start": "10", "end": "14", "original_index": 1},
        {"start": "12", "end": "18", "original_index": 3},
        {"start": "16", "end": "20", "original_index": 2}
      ],
      "current_index": 0,
      "action": "new",
      "merged_ranges": [
        {"start": "3", "end": "5", "original_index": 0}
      ],
      "running_total": "3"
    },
    {
      "frame_type": "merge_step",
      "step_index": 2,
      "ranges": [
        {"start": "3", "end": "5", "original_index": 0},
        {"start": "10", "end": "14", "original_index": 1},
        {"start": "12", "end": "18", "original_index": 3},
        {"start": "16", "end": "20", "original_index": 2}
      ],
      "current_index": 1,
      "action": "new",
      "merged_ranges": [
        {"start": "3", "end": "5", "original_index": 0},
        {"start": "10", "end": "14", "original_index": 1}
      ],
      "running_total": "8"
    },
    {
      "frame_type": "merge_step",
      "step_index": 3,
      "ranges": [
        {"start": "3", "end": "5", "original_index": 0},
        {"start": "10", "end": "14", "original_index": 1},
        {"start": "12", "end": "18", "original_index": 3},
        {"start": "16", "end": "20", "original_index": 2}
      ],
      "current_index": 2,
      "action": "merged",
      "merged_ranges": [
        {"start": "3", "end": "5", "original_index": 0},
        {"start": "10", "end": "18", "original_index": 1}
      ],
      "running_total": "12"
    },
    {
      "frame_type": "merge_step",
      "step_index": 4,
      "ranges": [
        {"start": "3", "end": "5", "original_index": 0},
        {"start": "10", "end": "14", "original_index": 1},
        {"start": "12", "end": "18", "original_index": 3},
        {"start": "16", "end": "20", "original_index": 2}
      ],
      "current_index": 3,
      "action": "merged",
      "merged_ranges": [
        {"start": "3", "end": "5", "original_index": 0},
        {"start": "10", "end": "20", "original_index": 1}
      ],
      "running_total": "14"
    },
    {
      "frame_type": "final",
      "step_index": 5,
      "ranges": [
        {"start": "3", "end": "5", "original_index": 0},
        {"start": "10", "end": "14", "original_index": 1},
        {"start": "12", "end": "18", "original_index": 3},
        {"start": "16", "end": "20", "original_index": 2}
      ],
      "merged_ranges": [
        {"start": "3", "end": "5", "original_index": 0},
        {"start": "10", "end": "20", "original_index": 1}
      ],
      "running_total": "14"
    }
  ]
}
```

## Implementation Notes for Rust

1. **Parse ranges** and assign `original_index` based on input order.
2. **Emit initial frame** with ranges in original order.
3. **Sort ranges** by start value.
4. **Emit sorted frame** with ranges in sorted order.
5. **Merge loop**: For each sorted range:
   - Determine if it merges with previous or starts new
   - Update merged_ranges list
   - Calculate running_total from merged_ranges
   - Emit merge_step frame
6. **Emit final frame** with complete merged_ranges.
7. **Serialize i64 as strings** to preserve precision in JSON.

## Validation

The visualizer expects:
- `frames` array is non-empty
- First frame has `frame_type: "initial"`
- Second frame has `frame_type: "sorted"`
- Last frame has `frame_type: "final"`
- `running_total` in final frame equals `total_fresh`
- All `start` and `end` values are valid string representations of integers
