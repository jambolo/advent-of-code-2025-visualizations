# JSON Log Specification - Day 7: Laboratories

This document defines the exact JSON format the instrumented Rust solver must emit for the Day 7 visualizer.

## Top-Level Structure

```json
{
  "width": <number>,
  "height": <number>,
  "source_column": <number>,
  "splitter_positions": [[<row>, <column>], ...],
  "frames": [<Frame>, ...],
  "final_timelines": <number>
}
```

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `width` | number | Yes | Number of columns in the grid |
| `height` | number | Yes | Number of rows in the grid |
| `source_column` | number | Yes | Column index (0-based) of the source 'S' |
| `splitter_positions` | array | Yes | Array of [row, column] pairs for all '^' positions |
| `frames` | array | Yes | Array of Frame objects representing animation states |
| `final_timelines` | number | Yes | The final answer (total timeline count) |

## Frame Object

```json
{
  "frame_type": "<string>",
  "row": <number>,
  "beams": [<BeamState>, ...],
  "splits": [<SplitEvent>, ...],
  "total_timelines": <number>,
  "splits_count": <number>
}
```

### Frame Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `frame_type` | string | Yes | One of: "initial", "row_process", "final" |
| `row` | number | Yes | Current row being processed (0-based) |
| `beams` | array | Yes | Array of BeamState objects for active beams |
| `splits` | array | No | Array of SplitEvent objects (only for rows with splits) |
| `total_timelines` | number | Yes | Sum of all timeline counts across all beams |
| `splits_count` | number | Yes | Cumulative count of splits encountered so far |

### Frame Types

- **"initial"**: First frame, emitted after finding the source. Shows starting state.
- **"row_process"**: Emitted after processing a row that contains at least one splitter hit.
- **"final"**: Last frame, emitted when all rows are processed. Shows final state.

## BeamState Object

```json
{
  "column": <number>,
  "timelines": <number>
}
```

### BeamState Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `column` | number | Yes | Column index (0-based) where this beam is located |
| `timelines` | number | Yes | Number of timelines represented by this beam |

## SplitEvent Object

```json
{
  "column": <number>,
  "timelines_before": <number>,
  "left_column": <number>,
  "right_column": <number>
}
```

### SplitEvent Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `column` | number | Yes | Column where the split occurred |
| `timelines_before` | number | Yes | Timeline count before the split |
| `left_column` | number | Yes | Column of the left output beam (column - 1) |
| `right_column` | number | Yes | Column of the right output beam (column + 1) |

## Emission Rules

### When to Emit Frames

1. **Initial Frame**: Emit once after finding the source 'S' with:
   - `frame_type`: "initial"
   - `row`: row index of the source
   - `beams`: single beam at source column with 1 timeline
   - `total_timelines`: 1
   - `splits_count`: 0

2. **Row Process Frames**: Emit after processing each row that contains at least one split:
   - `frame_type`: "row_process"
   - `row`: the row just processed
   - `beams`: current beam states after processing
   - `splits`: list of splits that occurred in this row
   - `total_timelines`: sum of all beam timeline counts
   - `splits_count`: cumulative splits so far

3. **Final Frame**: Emit once after all rows are processed:
   - `frame_type`: "final"
   - `row`: last row index (height - 1)
   - `beams`: final beam positions
   - `total_timelines`: the puzzle answer
   - `splits_count`: total splits encountered

### Frame Sampling

To keep animation under 5 minutes:
- Skip rows with no splitter encounters (do not emit frames for empty traversal)
- Only emit when state meaningfully changes (splits occur)
- Expected frame count: ~70 frames (one per splitter row)

## Example Log

```json
{
  "width": 15,
  "height": 16,
  "source_column": 7,
  "splitter_positions": [
    [2, 7],
    [4, 6], [4, 8],
    [6, 5], [6, 7], [6, 9]
  ],
  "frames": [
    {
      "frame_type": "initial",
      "row": 0,
      "beams": [{"column": 7, "timelines": 1}],
      "total_timelines": 1,
      "splits_count": 0
    },
    {
      "frame_type": "row_process",
      "row": 2,
      "beams": [
        {"column": 6, "timelines": 1},
        {"column": 8, "timelines": 1}
      ],
      "splits": [
        {"column": 7, "timelines_before": 1, "left_column": 6, "right_column": 8}
      ],
      "total_timelines": 2,
      "splits_count": 1
    },
    {
      "frame_type": "row_process",
      "row": 4,
      "beams": [
        {"column": 5, "timelines": 1},
        {"column": 7, "timelines": 2},
        {"column": 9, "timelines": 1}
      ],
      "splits": [
        {"column": 6, "timelines_before": 1, "left_column": 5, "right_column": 7},
        {"column": 8, "timelines_before": 1, "left_column": 7, "right_column": 9}
      ],
      "total_timelines": 4,
      "splits_count": 3
    },
    {
      "frame_type": "final",
      "row": 15,
      "beams": [
        {"column": 0, "timelines": 3},
        {"column": 2, "timelines": 5},
        {"column": 4, "timelines": 8}
      ],
      "total_timelines": 40,
      "splits_count": 21
    }
  ],
  "final_timelines": 40
}
```

## Notes for Instrumentation

1. **Column indices are 0-based** matching the Rust vec indexing.
2. **Row indices are 0-based** where row 0 is the first row of the grid.
3. **Splitter positions** should be collected during initial grid parsing.
4. **Beam merging**: When two splits output to the same column, the beams array should contain a single entry with summed timelines.
5. **Edge handling**: If a split would go off the grid (column < 0 or >= width), that beam is not created.
6. **Timeline counts use i64** in Rust; JavaScript handles these as numbers (safe up to 2^53).

## Validation Checklist

- [ ] `width` and `height` match grid dimensions
- [ ] `source_column` is within [0, width)
- [ ] All splitter positions are within grid bounds
- [ ] Frames are ordered by increasing row number
- [ ] `total_timelines` in final frame matches `final_timelines`
- [ ] `splits_count` increments correctly across frames
- [ ] No duplicate columns in `beams` array (merged beams combined)
