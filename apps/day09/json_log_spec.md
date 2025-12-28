# JSON Log Specification — Day 9: Movie Theater

## Overview

This document defines the exact JSON format that the instrumented Rust solver must emit for the Day 9 visualization.

## Top-Level Structure

```json
{
  "puzzleDay": 9,
  "puzzleName": "Movie Theater",
  "part": 2,
  "frames": [...],
  "finalAnswer": 1562459680
}
```

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `puzzleDay` | `number` | Yes | Always `9` |
| `puzzleName` | `string` | Yes | Always `"Movie Theater"` |
| `part` | `number` | Yes | `1` or `2` |
| `frames` | `Frame[]` | Yes | Array of animation frames |
| `finalAnswer` | `number` | Yes | The largest rectangle area found |

## Frame Object

```json
{
  "frameType": "candidate",
  "corners": [...],
  "edges": [...],
  "candidate": {...},
  "bestRectangle": {...},
  "pairsTested": 5000,
  "totalPairs": 122760,
  "validCount": 250,
  "bestArea": 1500000000
}
```

### Frame Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `frameType` | `string` | Yes | One of: `"initial"`, `"candidate"`, `"newBest"`, `"final"` |
| `corners` | `Corner[]` | Yes | All red tile corner positions |
| `edges` | `Edge[]` | Yes | Polygon boundary edges |
| `candidate` | `Rectangle` | No | Current rectangle being evaluated (omit for initial/final if none) |
| `bestRectangle` | `Rectangle` | No | Current best rectangle found (omit if none yet) |
| `pairsTested` | `number` | Yes | Number of corner pairs evaluated so far |
| `totalPairs` | `number` | Yes | Total number of pairs to test: N*(N-1)/2 |
| `validCount` | `number` | Yes | Number of valid rectangles found so far |
| `bestArea` | `number` | Yes | Area of best rectangle (0 if none yet) |

### frameType Values

| Value | When to Emit |
|-------|--------------|
| `"initial"` | First frame, before any evaluation |
| `"candidate"` | Standard candidate evaluation (sampled) |
| `"newBest"` | When a new maximum area is discovered |
| `"final"` | Last frame, showing final result |

## Corner Object

```json
{
  "x": 97633,
  "y": 50169,
  "index": 0
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x` | `number` | Yes | X coordinate of the corner |
| `y` | `number` | Yes | Y coordinate of the corner |
| `index` | `number` | Yes | Index in the original corner list (0-based) |

## Edge Object

```json
{
  "from": { "x": 97633, "y": 50169, "index": 0 },
  "to": { "x": 97633, "y": 51388, "index": 1 }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | `Corner` | Yes | Start corner of the edge |
| `to` | `Corner` | Yes | End corner of the edge |

## Rectangle Object

```json
{
  "corner1": { "x": 97633, "y": 50169, "index": 0 },
  "corner2": { "x": 97124, "y": 62268, "index": 18 },
  "area": 6150351,
  "isValid": true,
  "isNewBest": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `corner1` | `Corner` | Yes | First corner (lower index) |
| `corner2` | `Corner` | Yes | Second corner (higher index) |
| `area` | `number` | Yes | Rectangle area: `(|x2-x1|+1) * (|y2-y1|+1)` |
| `isValid` | `boolean` | Yes | True if rectangle passes Part 2 containment check |
| `isNewBest` | `boolean` | Yes | True if this is a new maximum area |

## Emission Rules Summary

### When to Emit Frames

1. **Initial frame**: Once at start with all corners and edges, no candidate
2. **First 50 candidates**: Emit every candidate (valid or invalid)
3. **Middle phase**: Sample every 50th valid, every 500th invalid
4. **New best**: Always emit with `frameType: "newBest"`
5. **Final frame**: Once at end with `frameType: "final"` and best rectangle

### Frame Count Targets

- Maximum ~8000 frames for <5 minute animation at 30fps
- Always emit "new best" discoveries regardless of sampling

## Example Complete Log

```json
{
  "puzzleDay": 9,
  "puzzleName": "Movie Theater",
  "part": 2,
  "frames": [
    {
      "frameType": "initial",
      "corners": [
        { "x": 97633, "y": 50169, "index": 0 },
        { "x": 97633, "y": 51388, "index": 1 }
      ],
      "edges": [
        {
          "from": { "x": 97633, "y": 50169, "index": 0 },
          "to": { "x": 97633, "y": 51388, "index": 1 }
        }
      ],
      "pairsTested": 0,
      "totalPairs": 122760,
      "validCount": 0,
      "bestArea": 0
    },
    {
      "frameType": "candidate",
      "corners": [...],
      "edges": [...],
      "candidate": {
        "corner1": { "x": 97633, "y": 50169, "index": 0 },
        "corner2": { "x": 97633, "y": 51388, "index": 1 },
        "area": 1220,
        "isValid": true,
        "isNewBest": true
      },
      "bestRectangle": {
        "corner1": { "x": 97633, "y": 50169, "index": 0 },
        "corner2": { "x": 97633, "y": 51388, "index": 1 },
        "area": 1220,
        "isValid": true,
        "isNewBest": false
      },
      "pairsTested": 1,
      "totalPairs": 122760,
      "validCount": 1,
      "bestArea": 1220
    },
    {
      "frameType": "final",
      "corners": [...],
      "edges": [...],
      "bestRectangle": {
        "corner1": { "x": 2518, "y": 58326, "index": 233 },
        "corner2": { "x": 42631, "y": 96980, "index": 137 },
        "area": 1562459680,
        "isValid": true,
        "isNewBest": false
      },
      "pairsTested": 122760,
      "totalPairs": 122760,
      "validCount": 15420,
      "bestArea": 1562459680
    }
  ],
  "finalAnswer": 1562459680
}
```

## Notes for Instrumentation

1. **Corners array**: Emit once per frame (can be identical across frames)
2. **Edges array**: Emit once per frame (can be identical across frames)
3. **Index preservation**: The `index` field in Corner objects must match the original input order
4. **Area calculation**: Use `(|x2-x1|+1) * (|y2-y1|+1)` as in the original solver
5. **Sampling counters**: Track candidates tested and valid rectangles for sampling decisions
