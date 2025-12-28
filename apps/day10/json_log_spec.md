# JSON Log Specification - Day 10: Factory

## Top-Level Structure

```typescript
interface LogData {
  puzzleDay: number;       // Required: 10
  puzzleName: string;      // Required: "Factory"
  part: number;            // Required: 2
  frames: Frame[];         // Required: Array of animation frames
  finalAnswer: number;     // Required: Total minimum button presses (18387)
  totalMachines: number;   // Required: Number of machines (180)
}
```

## Frame Structure

```typescript
interface Frame {
  frameType: FrameType;      // Required: Type of this frame
  machineIndex: number;      // Required: Current machine index (0-based)
  machine?: Machine;         // Optional: Full machine data (for machine frames)
  activeButton?: number;     // Optional: Index of button being pressed
  pressedButtons?: number[]; // Optional: Indices of all buttons pressed so far
  currentValues?: number[];  // Optional: Current counter values
  machinesSolved: number;    // Required: Number of completed machines
  totalMachines: number;     // Required: Total machines (180)
  runningTotal: number;      // Required: Sum of min presses so far
  finalAnswer?: number;      // Optional: Only on final frame
}
```

### FrameType Enum

| Value | Description |
|-------|-------------|
| `"intro"` | Opening frame showing factory overview |
| `"machineStart"` | Machine comes into focus, shows problem setup |
| `"solving"` | ILP solver working (abstract representation) |
| `"solutionFound"` | Optimal solution revealed |
| `"buttonPress"` | Animating a button press |
| `"complete"` | Machine fully configured, marked online |
| `"final"` | All machines done, show celebration |

## Machine Structure

```typescript
interface Machine {
  id: number;                  // Required: Machine index (0-based)
  buttons: Button[];           // Required: Array of button definitions
  joltages: number[];          // Required: Target joltage values
  currentValues: number[];     // Required: Current counter values
  minPresses: number;          // Required: Minimum presses for this machine
  isComplete: boolean;         // Required: True when all counters match targets
}
```

## Button Structure

```typescript
interface Button {
  index: number;              // Required: Button index (0-based)
  affectedCounters: number[]; // Required: Indices of counters this button affects
  pressCount: number;         // Required: Optimal press count for this button
}
```

## Field Specifications

### Frame Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `frameType` | string | Yes | One of the FrameType values |
| `machineIndex` | number | Yes | Current machine being processed (0-179) |
| `machine` | Machine | No | Present for all machine-related frames |
| `activeButton` | number | No | Button index during buttonPress frames |
| `pressedButtons` | number[] | No | Accumulating list of pressed buttons |
| `currentValues` | number[] | No | Updated counter values during animation |
| `machinesSolved` | number | Yes | Count of completed machines |
| `totalMachines` | number | Yes | Always 180 |
| `runningTotal` | number | Yes | Cumulative minimum presses |
| `finalAnswer` | number | No | Only on final frame (18387) |

### Machine Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Machine identifier (0-based index) |
| `buttons` | Button[] | Yes | Array of 3-13 buttons |
| `joltages` | number[] | Yes | Target values for each counter (4-10 values) |
| `currentValues` | number[] | Yes | Current counter readings (same length as joltages) |
| `minPresses` | number | Yes | ILP solution: minimum total presses for this machine |
| `isComplete` | boolean | Yes | True when currentValues matches joltages |

### Button Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `index` | number | Yes | Button position (0-based) |
| `affectedCounters` | number[] | Yes | Which counters increment when pressed |
| `pressCount` | number | Yes | Optimal number of presses (from ILP solution) |

## Example JSON

```json
{
  "puzzleDay": 10,
  "puzzleName": "Factory",
  "part": 2,
  "totalMachines": 180,
  "finalAnswer": 18387,
  "frames": [
    {
      "frameType": "intro",
      "machineIndex": 0,
      "machinesSolved": 0,
      "totalMachines": 180,
      "runningTotal": 0
    },
    {
      "frameType": "machineStart",
      "machineIndex": 0,
      "machine": {
        "id": 0,
        "buttons": [
          {"index": 0, "affectedCounters": [0, 1], "pressCount": 8},
          {"index": 1, "affectedCounters": [0, 2, 3, 4], "pressCount": 29},
          {"index": 2, "affectedCounters": [0, 1, 4], "pressCount": 0},
          {"index": 3, "affectedCounters": [3, 4], "pressCount": 6}
        ],
        "joltages": [37, 29, 8, 20, 35],
        "currentValues": [0, 0, 0, 0, 0],
        "minPresses": 43,
        "isComplete": false
      },
      "machinesSolved": 0,
      "totalMachines": 180,
      "runningTotal": 0
    },
    {
      "frameType": "buttonPress",
      "machineIndex": 0,
      "machine": {
        "id": 0,
        "buttons": [
          {"index": 0, "affectedCounters": [0, 1], "pressCount": 8},
          {"index": 1, "affectedCounters": [0, 2, 3, 4], "pressCount": 29},
          {"index": 2, "affectedCounters": [0, 1, 4], "pressCount": 0},
          {"index": 3, "affectedCounters": [3, 4], "pressCount": 6}
        ],
        "joltages": [37, 29, 8, 20, 35],
        "currentValues": [8, 8, 0, 0, 0],
        "minPresses": 43,
        "isComplete": false
      },
      "activeButton": 0,
      "pressedButtons": [0],
      "currentValues": [8, 8, 0, 0, 0],
      "machinesSolved": 0,
      "totalMachines": 180,
      "runningTotal": 0
    },
    {
      "frameType": "complete",
      "machineIndex": 0,
      "machine": {
        "id": 0,
        "buttons": [
          {"index": 0, "affectedCounters": [0, 1], "pressCount": 8},
          {"index": 1, "affectedCounters": [0, 2, 3, 4], "pressCount": 29},
          {"index": 2, "affectedCounters": [0, 1, 4], "pressCount": 0},
          {"index": 3, "affectedCounters": [3, 4], "pressCount": 6}
        ],
        "joltages": [37, 29, 8, 20, 35],
        "currentValues": [37, 29, 8, 20, 35],
        "minPresses": 43,
        "isComplete": true
      },
      "machinesSolved": 1,
      "totalMachines": 180,
      "runningTotal": 43
    },
    {
      "frameType": "final",
      "machineIndex": 179,
      "machinesSolved": 180,
      "totalMachines": 180,
      "runningTotal": 18387,
      "finalAnswer": 18387
    }
  ]
}
```

## Emission Guidelines

### Frame Budget
- Target: ~9000 frames for 5 minutes at 30fps
- Per machine: ~50 frames average

### Recommended Emission Pattern

1. **Intro** (1 frame): Factory overview
2. **Per Machine** (~50 frames):
   - machineStart: 5 frames
   - solving: 3 frames
   - solutionFound: 5 frames
   - buttonPress: 2 frames per distinct button with pressCount > 0
   - complete: 5 frames
3. **Final** (30 frames): Celebration sequence

### Counter Value Updates
- For buttonPress frames, update `currentValues` to reflect cumulative effect of all pressed buttons so far
- Final `complete` frame should have `currentValues` equal to `joltages`

### Button Animation
- Only emit buttonPress frames for buttons with `pressCount > 0`
- Maximum 2 frames per button regardless of actual press count
- Show cumulative effect in `currentValues`
