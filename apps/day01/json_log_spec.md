# JSON Log Specification — Day 01: Secret Entrance

## Overview
This document defines the exact JSON schema that the Rust solver must emit to drive the Safe Dial Visualizer. The log consists of a single JSON object containing metadata and an array of frame objects representing state snapshots throughout the puzzle solution.

## Top-Level Schema

```json
{
  "frames": Frame[],
  "total_rotations": number,
  "final_password": number
}
```

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `frames` | `Frame[]` | Yes | Array of frame objects representing state snapshots |
| `total_rotations` | `number` | Yes | Total number of rotation instructions (typically 1000) |
| `final_password` | `number` | Yes | Final password count (answer to puzzle, should be 6738 for part 2) |

## Frame Object Schema

Each frame represents a discrete state in the animation. The visualizer interpolates smoothly between frames.

```typescript
interface Frame {
  frame_type: FrameType;
  rotation_number: number;
  position: number;
  password: number;
  instruction?: string;
  distance?: number;
  direction?: Direction;
  passes_in_rotation?: number;
  lands_on_zero?: boolean;
  progress?: number;
}
```

### Frame Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `frame_type` | `string` | Yes | Type of frame event (see FrameType enum below) |
| `rotation_number` | `number` | Yes | Current rotation number (0 for initial, 1-1000 for rotations) |
| `position` | `number` | Yes | Current dial position (0-99 inclusive) |
| `password` | `number` | Yes | Current accumulated password count |
| `instruction` | `string` | No | Current rotation instruction (e.g., "L47", "R26"). Omit for initial/final frames |
| `distance` | `number` | No | Rotation distance in clicks. Omit for initial/final frames |
| `direction` | `string` | No | Rotation direction: "L" or "R". Omit for initial/final frames |
| `passes_in_rotation` | `number` | No | Number of times dial passed through 0 during current rotation (Part 2). Optional, informational |
| `lands_on_zero` | `boolean` | No | Whether current rotation ends exactly on position 0. Optional, informational |
| `progress` | `number` | No | Progress ratio (rotation_number / total_rotations), range 0.0-1.0. Used for progress bar |

### FrameType Enum

Valid values for `frame_type`:

| Value | Usage | Description |
|-------|-------|-------------|
| `"initial"` | First frame | Starting state before any rotations (position=50, password=0) |
| `"rotation_start"` | Start of rotation | Emitted before processing a rotation instruction |
| `"position_update"` | During rotation | Intermediate position during large rotation (optional, for smoothness) |
| `"zero_pass"` | Crossing zero | Dial passes through position 0 during rotation (Part 2) |
| `"zero_land"` | Landing on zero | Rotation ends exactly on position 0 |
| `"rotation_end"` | End of rotation | Emitted after completing a rotation (if not landing on zero) |
| `"final"` | Last frame | Final state after all rotations complete |

## Frame Emission Rules

### Required Frames

1. **Initial Frame**
   ```json
   {
     "frame_type": "initial",
     "rotation_number": 0,
     "position": 50,
     "password": 0,
     "progress": 0.0
   }
   ```

2. **Rotation Start** (for each instruction)
   ```json
   {
     "frame_type": "rotation_start",
     "rotation_number": 1,
     "position": 50,
     "password": 0,
     "instruction": "L47",
     "distance": 47,
     "direction": "L",
     "progress": 0.001
   }
   ```

3. **Zero Pass** (when crossing 0 mid-rotation)
   ```json
   {
     "frame_type": "zero_pass",
     "rotation_number": 1,
     "position": 0,
     "password": 1,
     "instruction": "L47",
     "distance": 47,
     "direction": "L",
     "progress": 0.001
   }
   ```

4. **Zero Land** (when ending on 0) OR **Rotation End** (when not ending on 0)
   ```json
   {
     "frame_type": "zero_land",  // or "rotation_end"
     "rotation_number": 1,
     "position": 3,
     "password": 1,
     "instruction": "L47",
     "distance": 47,
     "direction": "L",
     "lands_on_zero": false,
     "passes_in_rotation": 1,
     "progress": 0.001
   }
   ```

5. **Final Frame**
   ```json
   {
     "frame_type": "final",
     "rotation_number": 1000,
     "position": 32,
     "password": 6738,
     "progress": 1.0
   }
   ```

### Optional Frames

**Position Updates** (for very large rotations):
For rotations with distance > 200, optionally emit intermediate frames to show progress:
```json
{
  "frame_type": "position_update",
  "rotation_number": 42,
  "position": 25,
  "password": 50,
  "instruction": "R1000",
  "distance": 1000,
  "direction": "R",
  "progress": 0.042
}
```

## Example Complete Log Structure

```json
{
  "total_rotations": 1000,
  "final_password": 6738,
  "frames": [
    {
      "frame_type": "initial",
      "rotation_number": 0,
      "position": 50,
      "password": 0,
      "progress": 0.0
    },
    {
      "frame_type": "rotation_start",
      "rotation_number": 1,
      "position": 50,
      "password": 0,
      "instruction": "L47",
      "distance": 47,
      "direction": "L",
      "progress": 0.001
    },
    {
      "frame_type": "zero_pass",
      "rotation_number": 1,
      "position": 0,
      "password": 1,
      "instruction": "L47",
      "distance": 47,
      "direction": "L",
      "progress": 0.001
    },
    {
      "frame_type": "rotation_end",
      "rotation_number": 1,
      "position": 3,
      "password": 1,
      "instruction": "L47",
      "distance": 47,
      "direction": "L",
      "lands_on_zero": false,
      "passes_in_rotation": 1,
      "progress": 0.001
    },
    {
      "frame_type": "rotation_start",
      "rotation_number": 2,
      "position": 3,
      "password": 1,
      "instruction": "R26",
      "distance": 26,
      "direction": "R",
      "progress": 0.002
    },
    {
      "frame_type": "rotation_end",
      "rotation_number": 2,
      "position": 29,
      "password": 1,
      "instruction": "R26",
      "distance": 26,
      "direction": "R",
      "lands_on_zero": false,
      "passes_in_rotation": 0,
      "progress": 0.002
    },
    // ... more rotation frames ...
    {
      "frame_type": "final",
      "rotation_number": 1000,
      "position": 32,
      "password": 6738,
      "progress": 1.0
    }
  ]
}
```

## Field Value Constraints

### position
- **Type**: Integer
- **Range**: 0-99 inclusive
- **Wrapping**: Values wrap (100 → 0, -1 → 99)

### password
- **Type**: Integer
- **Range**: 0 to final_password
- **Monotonic**: Never decreases
- **Part 2 expected final**: 6738

### rotation_number
- **Type**: Integer
- **Range**: 0 to total_rotations
- **Sequence**: Sequential (0, 1, 2, ..., 1000)

### direction
- **Type**: String literal
- **Values**: "L" (left/counter-clockwise) or "R" (right/clockwise)

### distance
- **Type**: Integer
- **Range**: Positive integers (typically 1-1000+)
- **Meaning**: Number of clicks to rotate

### progress
- **Type**: Float
- **Range**: 0.0 to 1.0
- **Calculation**: `rotation_number / total_rotations`

### lands_on_zero
- **Type**: Boolean
- **True when**: `position === 0` at end of rotation
- **False when**: `position !== 0` at end of rotation

### passes_in_rotation
- **Type**: Integer
- **Range**: 0 to `distance / 100` + 1
- **Meaning**: Count of times dial crossed 0 during the rotation (Part 2 specific)

## Emission Guidelines for Rust Solver

### Minimal Valid Log
At minimum, emit:
1. Initial frame
2. For each rotation: rotation_start, zero_pass (if occurs), rotation_end
3. Final frame

This produces approximately: 1 + 1000×2 + (zero encounters) + 1 ≈ 2,000-5,000 frames

### Recommended for Smooth Animation
For better visual quality:
- Emit position_update frames for rotations with distance > 200
- Sample every ~50 clicks during large rotations
- Always emit all zero_pass events (critical for correctness)

### Performance Considerations
- Target 5,000-9,000 total frames for ≤5 minute animation at 30fps
- JSON file size ~500KB to 2MB (acceptable)
- Parsing is fast; visualizer handles interpolation

## Validation Checklist

A valid JSON log must:
- ✅ Be valid JSON syntax
- ✅ Have top-level `frames`, `total_rotations`, `final_password` fields
- ✅ Have at least one frame with `frame_type: "initial"`
- ✅ Have at least one frame with `frame_type: "final"`
- ✅ Have `rotation_number` sequential and non-decreasing
- ✅ Have `password` non-decreasing
- ✅ Have `position` in range 0-99
- ✅ Have matching `final_password` between top-level and final frame
- ✅ Have frames array length > 0

## Usage by Visualizer

The visualizer:
1. Parses JSON into `LogData` object
2. Validates required fields exist
3. Iterates through `frames` array sequentially
4. Interpolates `position` between frames for smooth animation
5. Uses `frame_type` to trigger visual effects:
   - `zero_pass`: Brief gold flash
   - `zero_land`: Sustained glow + emphasis
   - `final`: Success color on password counter
6. Updates UI elements from frame metadata
7. Drives progress bar from `progress` field

## Example Rust Emission Pattern

```rust
// Pseudocode - not actual implementation
fn emit_initial(position: i32) {
    println!("{{");
    println!("  \"frame_type\": \"initial\",");
    println!("  \"rotation_number\": 0,");
    println!("  \"position\": {},", position);
    println!("  \"password\": 0,");
    println!("  \"progress\": 0.0");
    println!("}},");
}

fn emit_rotation_start(rotation: i32, position: i32, password: i32, instruction: &str, distance: i32, direction: char, total: i32) {
    println!("{{");
    println!("  \"frame_type\": \"rotation_start\",");
    println!("  \"rotation_number\": {},", rotation);
    println!("  \"position\": {},", position);
    println!("  \"password\": {},", password);
    println!("  \"instruction\": \"{}\",", instruction);
    println!("  \"distance\": {},", distance);
    println!("  \"direction\": \"{}\",", direction);
    println!("  \"progress\": {}", rotation as f64 / total as f64);
    println!("}},");
}

fn emit_zero_pass(rotation: i32, password: i32, instruction: &str, distance: i32, direction: char, total: i32) {
    println!("{{");
    println!("  \"frame_type\": \"zero_pass\",");
    println!("  \"rotation_number\": {},", rotation);
    println!("  \"position\": 0,");
    println!("  \"password\": {},", password);
    println!("  \"instruction\": \"{}\",", instruction);
    println!("  \"distance\": {},", distance);
    println!("  \"direction\": \"{}\",", direction);
    println!("  \"progress\": {}", rotation as f64 / total as f64);
    println!("}},");
}

// Similar functions for rotation_end, final, etc.
```

## Notes

- **JSON Formatting**: Pretty-printing recommended for readability but not required
- **Trailing Commas**: Avoid trailing comma after last frame in array
- **String Escaping**: Not needed for this puzzle (no special characters in instructions)
- **Float Precision**: 3-4 decimal places sufficient for `progress`
- **File Output**: Solver should write to stdout or file (e.g., `day01-log.json`)
