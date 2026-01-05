# JSON Log Specification - Day 12: Christmas Tree Farm

## Top-Level Structure

```json
{
  "puzzleDay": 12,
  "puzzleName": "Christmas Tree Farm",
  "part": 1,
  "shapes": [...],
  "totalRegions": 1000,
  "frames": [...],
  "finalAnswer": 583
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| puzzleDay | number | Yes | Always 12 |
| puzzleName | string | Yes | "Christmas Tree Farm" |
| part | number | Yes | 1 for part 1 |
| shapes | Shape[] | Yes | Array of 6 shape definitions |
| totalRegions | number | Yes | Total number of regions (1000) |
| frames | Frame[] | Yes | Array of visualization frames |
| finalAnswer | number | Yes | Final count of accepted regions |

## Shape Definition

```json
{
  "id": 0,
  "pattern": ["###", "##.", "##."],
  "area": 7
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | Yes | Shape index (0-5) |
| pattern | string[] | Yes | 3 strings of 3 chars each, '#' = filled, '.' = empty |
| area | number | Yes | Count of '#' cells in pattern |

## Frame Types

All frames share a base structure with optional fields depending on type.

### Common Frame Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| frameType | string | Yes | One of: "intro", "regionStart", "areaCheck", "slotCheck", "verdict", "batchUpdate", "summary" |
| message | string | No | Optional status message for display |

### Frame Type: "intro"

Displays all shapes and introduces the visualization.

```json
{
  "frameType": "intro",
  "message": "Analyzing 1000 regions..."
}
```

No additional fields required.

### Frame Type: "regionStart"

Begins evaluation of a new region.

```json
{
  "frameType": "regionStart",
  "regionIndex": 0,
  "regionWidth": 35,
  "regionHeight": 39,
  "regionCounts": [29, 31, 40, 35, 26, 48],
  "regionArea": 1365,
  "presentArea": 1484,
  "totalPresents": 209
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| regionIndex | number | Yes | 0-based index of current region |
| regionWidth | number | Yes | Width of region in cells |
| regionHeight | number | Yes | Height of region in cells |
| regionCounts | number[] | Yes | Array of 6 counts, one per shape |
| regionArea | number | Yes | regionWidth × regionHeight |
| presentArea | number | Yes | Sum of (shape.area × count) for all shapes |
| totalPresents | number | Yes | Sum of all counts |

### Frame Type: "areaCheck"

Shows the area comparison result.

```json
{
  "frameType": "areaCheck",
  "regionIndex": 0,
  "presentArea": 1484,
  "regionArea": 1365
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| regionIndex | number | Yes | Current region index |
| presentArea | number | Yes | Total present area |
| regionArea | number | Yes | Total region area |

### Frame Type: "slotCheck"

Shows the 3×3 slot calculation (only emitted if area check passed).

```json
{
  "frameType": "slotCheck",
  "regionIndex": 0,
  "numSlots": 156,
  "totalPresents": 209
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| regionIndex | number | Yes | Current region index |
| numSlots | number | Yes | (width ÷ 3) × (height ÷ 3), integer division |
| totalPresents | number | Yes | Total number of presents needed |

### Frame Type: "verdict"

Final verdict for a region.

```json
{
  "frameType": "verdict",
  "regionIndex": 0,
  "verdict": "rejected",
  "acceptedCount": 0,
  "rejectedCount": 1,
  "undeterminedCount": 0
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| regionIndex | number | Yes | Current region index |
| verdict | string | Yes | One of: "accepted", "rejected", "undetermined" |
| acceptedCount | number | Yes | Running total of accepted regions |
| rejectedCount | number | Yes | Running total of rejected regions |
| undeterminedCount | number | Yes | Running total of undetermined regions |

### Frame Type: "batchUpdate"

Updates counters for multiple skipped regions (used during sampling).

```json
{
  "frameType": "batchUpdate",
  "regionIndex": 50,
  "acceptedCount": 25,
  "rejectedCount": 20,
  "undeterminedCount": 5,
  "message": "Processed regions 21-50..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| regionIndex | number | Yes | Last region index in batch |
| acceptedCount | number | Yes | Current accepted total |
| rejectedCount | number | Yes | Current rejected total |
| undeterminedCount | number | Yes | Current undetermined total |
| message | string | No | Description of batch processed |

### Frame Type: "summary"

Final summary frame.

```json
{
  "frameType": "summary",
  "acceptedCount": 583,
  "rejectedCount": 400,
  "undeterminedCount": 17,
  "message": "Analysis complete!"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| acceptedCount | number | Yes | Final accepted count (the answer) |
| rejectedCount | number | Yes | Final rejected count |
| undeterminedCount | number | Yes | Final undetermined count |
| message | string | No | Completion message |

## Emission Rules Summary

### Detailed Regions
Show full sequence (regionStart → areaCheck → [slotCheck] → verdict) for:
- Regions 0-19 (first 20)
- Every 10th region from 20-979
- Regions 980-999 (last 20)

### Sampled Regions
For skipped regions, emit periodic batchUpdate frames to keep counters current.

### Frame Sequence Example

```json
[
  {"frameType": "intro"},
  {"frameType": "regionStart", "regionIndex": 0, ...},
  {"frameType": "areaCheck", "regionIndex": 0, ...},
  {"frameType": "verdict", "regionIndex": 0, "verdict": "rejected", ...},
  {"frameType": "regionStart", "regionIndex": 1, ...},
  {"frameType": "areaCheck", "regionIndex": 1, ...},
  {"frameType": "slotCheck", "regionIndex": 1, ...},
  {"frameType": "verdict", "regionIndex": 1, "verdict": "accepted", ...},
  ...
  {"frameType": "batchUpdate", "regionIndex": 50, ...},
  ...
  {"frameType": "summary", "acceptedCount": 583, ...}
]
```

## Validation

The visualizer expects:
1. Exactly 6 shapes in the shapes array
2. Each shape pattern has exactly 3 rows of 3 characters
3. regionCounts arrays have exactly 6 elements
4. Frame counters are monotonically increasing
5. Final summary counters sum to totalRegions
