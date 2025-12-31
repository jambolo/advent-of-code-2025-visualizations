# JSON Log Specification - Day 11: Reactor

This document defines the exact JSON format that the instrumented Rust solver must emit for the Day 11 visualizer.

## Design Principle: Sparse Data

To minimize JSON size, frames use **sparse representations**:
- Node positions are computed by the visualizer from the graph structure (not included in frames)
- Key nodes (svr, fft, dac, out) are identified by the visualizer (not flagged per-frame)
- Only nodes/edges that are **active** or **pruned** are listed (others default to inactive/unpruned)
- Unchanged segment counts can be omitted from frames

## Top-Level Structure

```json
{
  "puzzleDay": 11,
  "puzzleName": "Reactor",
  "part": 2,
  "frames": [...],
  "finalAnswer": 517315308154944,
  "graph": {
    "nodes": [...],
    "edges": [...]
  }
}
```

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `puzzleDay` | number | Yes | Always `11` |
| `puzzleName` | string | Yes | Always `"Reactor"` |
| `part` | number | Yes | Puzzle part, typically `2` |
| `frames` | array | Yes | Array of `Frame` objects |
| `finalAnswer` | number | Yes | The final path count (517315308154944) |
| `graph` | object | Yes | Full graph structure for layout computation |

### Graph Object

```json
{
  "nodes": ["svr", "fft", "dac", "out", "aaa", "bbb", ...],
  "edges": [
    { "from": "svr", "to": "aaa" },
    { "from": "svr", "to": "bbb" },
    ...
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nodes` | string[] | Yes | All node IDs in the graph |
| `edges` | Edge[] | Yes | All directed edges |

### Edge Object (in graph)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | string | Yes | Source node ID |
| `to` | string | Yes | Target node ID |

## Frame Structure

Each frame uses a **sparse representation** - only include fields that have meaningful values.

```json
{
  "frameType": "counting",
  "activeNodes": ["abc", "def"],
  "activeEdges": [["abc", "def"], ["def", "ghi"]],
  "prunedNodes": ["xyz"],
  "prunedEdges": [["xyz", "out"]],
  "currentNode": "abc",
  "activeSegment": "svr→fft",
  "segmentCounts": [1234, 0, 0],
  "segmentComplete": [false, false, false],
  "message": "Counting paths in segment 1",
  "finalAnswer": 517315308154944
}
```

### Frame Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `frameType` | string | Yes | One of: `"intro"`, `"graphDisplay"`, `"reduction"`, `"segmentStart"`, `"counting"`, `"segmentComplete"`, `"multiply"`, `"final"` |
| `activeNodes` | string[] | No | Node IDs currently active (glowing). Omit if none. |
| `activeEdges` | [string, string][] | No | Active edges as `[from, to]` pairs. Omit if none. |
| `prunedNodes` | string[] | No | Node IDs that have been pruned. Cumulative across frames. |
| `prunedEdges` | [string, string][] | No | Pruned edges as `[from, to]` pairs. Cumulative across frames. |
| `currentNode` | string | No | Node currently being processed (highlighted differently) |
| `activeSegment` | string | No | Label of segment being counted (e.g., `"svr→fft"`) |
| `segmentCounts` | [number, number, number] | No | Path counts for segments 1, 2, 3. Omit if unchanged. |
| `segmentComplete` | [boolean, boolean, boolean] | No | Completion status for segments 1, 2, 3. Omit if unchanged. |
| `segmentLabels` | [string, string, string] | No | Labels for segments. Only needed in first frame. |
| `message` | string | No | Status message to display |
| `finalAnswer` | number | No | Final answer (only for `"final"` and `"multiply"` frames) |

### Frame Types

| Type | Description | Typical Fields |
|------|-------------|----------------|
| `intro` | Initial view showing network overview | segmentLabels, segmentCounts, segmentComplete |
| `graphDisplay` | Display full graph with key nodes highlighted | (minimal) |
| `reduction` | Graph reduction animation | prunedNodes, prunedEdges, message |
| `segmentStart` | Beginning of a segment count | activeSegment, message |
| `counting` | Active path counting | currentNode, activeNodes, activeEdges, segmentCounts |
| `segmentComplete` | Segment finished counting | segmentCounts, segmentComplete |
| `multiply` | Show multiplication of segments | segmentCounts, finalAnswer |
| `final` | Victory screen with result | segmentCounts, segmentComplete, finalAnswer |

## Data Omission Rules

The visualizer applies these defaults when fields are omitted:

1. **activeNodes/activeEdges**: Empty array (nothing highlighted)
2. **prunedNodes/prunedEdges**: Inherits from previous frame (pruning is cumulative)
3. **segmentCounts**: Inherits from previous frame
4. **segmentComplete**: Inherits from previous frame
5. **currentNode**: No node highlighted as current
6. **message**: No message displayed

## Segment Labels

Segment labels should be provided once in the first frame via `segmentLabels`:

```json
{
  "frameType": "intro",
  "segmentLabels": ["svr→fft", "fft→dac", "dac→out"],
  "segmentCounts": [0, 0, 0],
  "segmentComplete": [false, false, false]
}
```

The visualizer caches these labels for all subsequent frames.

## Emission Guidelines

### Frame Sequence

1. **Intro frame** (1 frame): Show network overview
2. **Graph display** (5-10 frames): Fade in network, highlight key nodes
3. **Reduction frames** (10-30 frames per segment): Show graph simplification
4. **Segment 1 counting** (50-100 frames): svr→fft path counting
5. **Segment 1 complete** (1 frame): Mark segment 1 done, visualizer adds brief pause
6. **Segment 2 counting** (50-100 frames): fft→dac path counting
7. **Segment 2 complete** (1 frame): Mark segment 2 done, visualizer adds brief pause
8. **Segment 3 counting** (50-100 frames): dac→out path counting
9. **Segment 3 complete** (1 frame): Mark segment 3 done, visualizer adds brief pause
10. **Multiply frames** (30 frames): Show multiplication animation
11. **Final frame** (60 frames): Victory screen with answer

Note: The visualizer automatically adds a short visual delay when displaying segment completion frames. The Rust solver should emit only a single `segmentComplete` frame per segment.

### Sampling Rules

Since the actual Rust solver doesn't enumerate paths:
- Emit counting frames based on nodes visited during recursive counting
- Sample every 5-10 node visits to keep frame count manageable
- Update `segmentCounts` with partial progress based on completed subtrees

### Active Edges Requirements

**IMPORTANT:** For edges to be visually highlighted during path counting, they must be explicitly included in `activeEdges`.

When counting paths for a segment (e.g., fft→dac):

- Include the **segment start node** (e.g., `fft`) in `activeNodes`
- Include **all edges being traversed** in `activeEdges`, starting from the segment's source node
- Example: When exploring from `fft`, include edges like `["fft", "xyz"]` in `activeEdges`

```json
{
  "frameType": "counting",
  "activeSegment": "fft→dac",
  "currentNode": "xyz",
  "activeNodes": ["fft", "xyz"],
  "activeEdges": [["fft", "xyz"]],
  "segmentCounts": [3952, 500, 0]
}
```

Without explicit `activeEdges`, no edges will be highlighted—they default to the dim/inactive state. The visualizer does NOT automatically infer active edges from `currentNode` or `activeNodes`.

### Node Positions

The visualizer computes node positions automatically from the graph structure using BFS-based layering. Key nodes have fixed positions:
- svr: top center
- fft: left middle
- dac: right middle
- out: bottom center

**Do NOT include x, y, or isKey in frame data.**

## Example Minimal Log

```json
{
  "puzzleDay": 11,
  "puzzleName": "Reactor",
  "part": 2,
  "graph": {
    "nodes": ["svr", "aaa", "fft", "dac", "out"],
    "edges": [
      {"from": "svr", "to": "aaa"},
      {"from": "aaa", "to": "fft"},
      {"from": "fft", "to": "dac"},
      {"from": "dac", "to": "out"}
    ]
  },
  "frames": [
    {
      "frameType": "intro",
      "segmentLabels": ["svr→fft", "fft→dac", "dac→out"],
      "segmentCounts": [0, 0, 0],
      "segmentComplete": [false, false, false]
    },
    {
      "frameType": "counting",
      "currentNode": "aaa",
      "activeNodes": ["svr", "aaa"],
      "activeEdges": [["svr", "aaa"]],
      "activeSegment": "svr→fft",
      "segmentCounts": [1, 0, 0]
    },
    {
      "frameType": "segmentComplete",
      "segmentCounts": [1, 0, 0],
      "segmentComplete": [true, false, false]
    },
    {
      "frameType": "final",
      "segmentCounts": [1, 1, 1],
      "segmentComplete": [true, true, true],
      "finalAnswer": 1
    }
  ],
  "finalAnswer": 1
}
```

## Size Comparison

For a graph with 576 nodes and 1400 edges:

| Format | Per-frame size | 300 frames |
|--------|---------------|------------|
| Full nodes/edges | ~50 KB | ~15 MB |
| Sparse (this spec) | ~200 bytes | ~60 KB |

The sparse format reduces JSON size by **99%+**.
