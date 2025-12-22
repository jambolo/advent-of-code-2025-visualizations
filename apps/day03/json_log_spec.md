# JSON Log Specification — Day 03: Lobby Battery Banks

## Overview
The log is a single JSON object that describes the greedy selection of digits for each battery bank (Part 2: pick exactly 12). Frames capture the scan window, cursor, locked-in digits, per-bank outputs, and the running total. Only the fields listed here are consumed by the visualizer.

## Top-Level Schema

```json
{
  "day": 3,
  "part": 2,
  "digits_to_pick": 12,
  "total_banks": number,
  "final_total": number,
  "frames": Frame[]
}
```

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `day` | `number` | Yes | Day number (must be 3) |
| `part` | `number` | Yes | Puzzle part (must be 2) |
| `digits_to_pick` | `number` | Yes | Required digit count per bank (12 for Part 2) |
| `total_banks` | `number` | Yes | Number of banks (input lines) in the log |
| `final_total` | `number` | Yes | Sum of all per-bank maximums (answer) |
| `frames` | `Frame[]` | Yes | Ordered list of frames describing the process |

## Frame Object

```typescript
type FrameType = 'bank_start' | 'scan_window' | 'pick' | 'skip' | 'bank_complete' | 'final';

interface Frame {
  frame_type: FrameType;
  bank_index: number;       // 0-based
  bank_digits: string;      // raw digit string for the bank
  window_start: number;     // inclusive index of the lookahead window start
  window_end: number;       // inclusive index of the lookahead window end
  cursor: number;           // index currently inspected / chosen
  remaining_picks: number;  // how many digits are still needed for this bank
  chosen_so_far: string;    // digits locked so far (left to right)
  locked_indices: number[]; // indices already chosen in this bank
  running_total: number;    // cumulative joltage after this frame
  bank_value?: number;      // final numeric value for this bank (only on bank_complete/final)
  bank_output?: string;     // same as bank_value but preserved as string (keeps 12 digits)
  banks_completed?: number; // banks fully processed so far (used for progress bar)
  skip_count?: number;      // count of digits skipped in a compressed hop (skip frames only)
}
```

### Field meanings

| Field | Usage | Description |
|-------|-------|-------------|
| `frame_type` | All frames | Event classification (see FrameType) |
| `bank_index` | All | Which bank is currently being processed (0-based) |
| `bank_digits` | All | Full digit string of the current bank; unchanged within the bank |
| `window_start` / `window_end` | Scan, pick, skip | Lookahead window boundaries after the last movement |
| `cursor` | Scan, pick | Index of the probe: for `pick`, it is the chosen digit index; for `scan_window`/`skip`, it marks the window’s right edge |
| `remaining_picks` | All | Digits still needed to reach `digits_to_pick` |
| `chosen_so_far` | All | Concatenated digits already locked for the bank, in order |
| `locked_indices` | All | Positions of digits that are already selected; used to highlight locked cells in the bank row |
| `running_total` | All | Sum of completed bank values so far (or current value if on a `pick`) |
| `bank_value` / `bank_output` | bank_complete, final | Completed bank value; include both numeric and string so leading digits stay obvious |
| `banks_completed` | bank_complete, final (optional elsewhere) | Count of banks fully finished; defaults to `bank_index + 1` on `bank_complete` |
| `skip_count` | skip | Number of digits skipped when collapsing a hop; omit otherwise |

### FrameType values

| Value | When emitted | Required fields |
|-------|--------------|-----------------|
| `bank_start` | Before scanning a bank | All non-optional fields; `remaining_picks = digits_to_pick`; `chosen_so_far = ""`; `locked_indices = []` |
| `scan_window` | After shifting the lookahead window (no pick yet) | Same as bank_start plus updated `window_start`, `window_end`, `cursor` |
| `pick` | When a digit is selected | Same as scan_window plus updated `chosen_so_far`, `locked_indices`, `remaining_picks` |
| `skip` | When skipping a chunk of digits (>2) | Same as scan_window plus `skip_count` describing the hop |
| `bank_complete` | After selecting the 12th digit | Include `bank_value`, `bank_output`, `banks_completed` (bank_index + 1) |
| `final` | After the last bank | Same as bank_complete, with `banks_completed = total_banks` and `running_total = final_total` |

## Example (abridged)

```json
{
  "day": 3,
  "part": 2,
  "digits_to_pick": 12,
  "total_banks": 2,
  "final_total": 987654321111,
  "frames": [
    {
      "frame_type": "bank_start",
      "bank_index": 0,
      "bank_digits": "987654321111111",
      "window_start": 0,
      "window_end": 3,
      "cursor": 1,
      "remaining_picks": 12,
      "chosen_so_far": "",
      "locked_indices": [],
      "running_total": 0
    },
    {
      "frame_type": "pick",
      "bank_index": 0,
      "bank_digits": "987654321111111",
      "window_start": 0,
      "window_end": 3,
      "cursor": 0,
      "remaining_picks": 11,
      "chosen_so_far": "9",
      "locked_indices": [0],
      "running_total": 0
    },
    {
      "frame_type": "bank_complete",
      "bank_index": 0,
      "bank_digits": "987654321111111",
      "window_start": 12,
      "window_end": 14,
      "cursor": 13,
      "remaining_picks": 0,
      "chosen_so_far": "987654321111",
      "locked_indices": [0,1,2,3,4,5,6,7,8,10,11,12],
      "running_total": 987654321111,
      "bank_value": 987654321111,
      "bank_output": "987654321111",
      "banks_completed": 1
    },
    {
      "frame_type": "final",
      "bank_index": 1,
      "bank_digits": "811111111111119",
      "window_start": 0,
      "window_end": 14,
      "cursor": 14,
      "remaining_picks": 12,
      "chosen_so_far": "",
      "locked_indices": [],
      "running_total": 987654321111,
      "bank_value": 987654321111,
      "bank_output": "987654321111",
      "banks_completed": 2
    }
  ]
}
```
