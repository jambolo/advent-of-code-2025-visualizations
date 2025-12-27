# JSON Log Specification — Day 8: Playground

This document defines the exact JSON format the instrumented Rust solver must emit for the Day 8 visualizer.

## Top-Level Structure

```typescript
interface LogData {
  boxes: JunctionBox[];           // Required: All junction box positions
  total_connections_needed: number; // Required: Number of edges to form MST (n-1)
  frames: Frame[];                // Required: Animation frames
  final_from_idx: number;         // Required: Index of first box in final connection
  final_to_idx: number;           // Required: Index of second box in final connection
  final_from_x: number;           // Required: X coordinate of first final box
  final_to_x: number;             // Required: X coordinate of second final box
  answer: number;                 // Required: Product of X coordinates (Part 2 answer)
}
```

## Junction Box

```typescript
interface JunctionBox {
  x: number;  // Required: X coordinate (integer, 0-100000 range)
  y: number;  // Required: Y coordinate (integer, 0-100000 range)
  z: number;  // Required: Z coordinate (integer, 0-100000 range)
}
```

## Frame Types

```typescript
interface Frame {
  frame_type: 'initial' | 'connection' | 'final';  // Required: Type of frame
  connection_index: number;      // Required: Number of connections made so far
  from_idx: number;              // Required: Index of source junction box
  to_idx: number;                // Required: Index of destination junction box
  distance: number;              // Required: Euclidean distance of this connection
  circuits_remaining: number;    // Required: Number of distinct circuits after this frame
  circuit_assignments: number[]; // Required: Circuit ID for each box (length = num boxes)
}
```

### Frame Type Descriptions

| Type | Description |
|------|-------------|
| `initial` | First frame before any connections. `from_idx` and `to_idx` should be 0. |
| `connection` | A successful connection that merges two circuits. |
| `final` | The last connection that unifies all boxes into one circuit. |

## Field Details

### `boxes` (required)
- Array of all junction box positions
- Order matches the indices used in `from_idx`, `to_idx`, and `circuit_assignments`
- Must contain exactly 1000 elements (or match puzzle input count)

### `total_connections_needed` (required)
- Integer: `boxes.length - 1`
- For 1000 boxes, this is 999

### `frames` (required)
- Array of frames representing each connection event
- First frame should be `initial` type
- Last frame should be `final` type
- Only emit frames for successful connections (skip when both boxes already in same circuit)
- Expected count: 1000 frames (1 initial + 998 connection + 1 final)

### `circuit_assignments` (required in each frame)
- Array of integers, same length as `boxes`
- `circuit_assignments[i]` = circuit ID for box `i`
- Initially, each box is in its own circuit: `[0, 1, 2, ..., 999]`
- After merging circuits, all boxes in the merged circuit share the same ID
- The specific ID value doesn't matter, only that boxes in the same circuit share an ID

### `final_from_idx`, `final_to_idx` (required)
- Indices of the two boxes connected in the final frame
- Used to highlight these boxes in the celebration

### `final_from_x`, `final_to_x` (required)
- X coordinates of the final two boxes
- Displayed in the result overlay

### `answer` (required)
- `final_from_x * final_to_x`
- The Part 2 puzzle answer

## Example JSON

```json
{
  "boxes": [
    {"x": 8558, "y": 1355, "z": 27987},
    {"x": 51828, "y": 64554, "z": 61771},
    {"x": 21092, "y": 96778, "z": 69513}
  ],
  "total_connections_needed": 2,
  "frames": [
    {
      "frame_type": "initial",
      "connection_index": 0,
      "from_idx": 0,
      "to_idx": 0,
      "distance": 0,
      "circuits_remaining": 3,
      "circuit_assignments": [0, 1, 2]
    },
    {
      "frame_type": "connection",
      "connection_index": 1,
      "from_idx": 0,
      "to_idx": 2,
      "distance": 45678.12,
      "circuits_remaining": 2,
      "circuit_assignments": [0, 1, 0]
    },
    {
      "frame_type": "final",
      "connection_index": 2,
      "from_idx": 1,
      "to_idx": 2,
      "distance": 52341.89,
      "circuits_remaining": 1,
      "circuit_assignments": [0, 0, 0]
    }
  ],
  "final_from_idx": 1,
  "final_to_idx": 2,
  "final_from_x": 51828,
  "final_to_x": 21092,
  "answer": 1093168176
}
```

## Emission Rules Summary

1. **Initial frame**: Emit once at start with all boxes in separate circuits
2. **Connection frames**: Emit only when a connection merges two different circuits
3. **Skip redundant edges**: Do NOT emit frames when both boxes are already in the same circuit
4. **Final frame**: Mark the last connection as `final` type
5. **Circuit assignments**: Update after each merge to reflect the new circuit structure

## Notes for Instrumentation

- Use Union-Find data structure for efficient circuit tracking
- When merging circuits, update all boxes in the smaller circuit to point to the larger circuit's ID
- The `distance` field should be the Euclidean distance: `sqrt((x2-x1)^2 + (y2-y1)^2 + (z2-z1)^2)`
- Emit frames in the order connections are made (sorted by distance)
