## Top-level object
- `puzzle_day` (number, required): must be `2`.
- `part` (number, required): must be `2` (visualizer only supports Part 2 rules).
- `sampling_stride` (number, optional): how many numbers were skipped between `scan_tick` frames (for reference only).
- `ranges` (array, required): list of range descriptors.
- `frames` (array, required): ordered timeline of events to animate.
- `final_sum` (number, required): sum of all invalid IDs; should match the last frame’s `global_sum`.
- `total_invalid` (number, required): total count of invalid IDs found; should match the last frame’s `global_invalids`.

## Range descriptor (`ranges[]`)
- `index` (number, required): zero-based index; referenced by frames.
- `start` (number, required): inclusive start of the range.
- `end` (number, required): inclusive end of the range.
- `label` (string, optional): friendly name shown in UI if present.

## Frame object (`frames[]`)
Common fields required for all frames:
- `frame_type` (string, required): one of `range_start`, `scan_tick`, `pattern_check`, `invalid_hit`, `range_end`, `final_summary`.
- `range_index` (number, required): index into `ranges`.
- `range_start` (number, required): start of the active range (copy for easy rendering).
- `range_end` (number, required): end of the active range.
- `range_progress` (number, required): 0–1 fraction of how far the scan is through the active range.
- `global_sum` (number, required): running total of invalid IDs discovered so far (after any additions for this frame).
- `global_invalids` (number, required): count of invalid IDs found so far (after this frame).
- `range_invalids` (number, optional): count of invalid IDs found within this range so far.
- `inspected` (number, optional): count of numbers inspected in the current range so far.
- `message` (string, optional): short note to show in the footer.

Fields used when a specific ID is being shown:
- `number` (number, optional): the ID under consideration.
- `digits` (string, optional): string form of `number`; required when highlighting digits.
- `repeat_count` (number, optional): how many times the candidate chunk repeats (2..=digits.length).
- `chunk_length` (number, optional): digit length of the candidate chunk (`digits.length / repeat_count`).
- `candidate_chunk` (string, optional): the repeated chunk string (length = `chunk_length`).
- `match` (boolean, optional): whether all repeats matched this chunk.

### Frame types
- `range_start`: emitted once per range. Set `range_progress` to 0. Include `range_start`/`range_end`. `digits`/`number` are optional and typically omitted.
- `scan_tick`: periodic heartbeat to show motion. Include `number`, `digits`, `range_progress`, and `inspected`. No `repeat_count`/`match` needed.
- `pattern_check`: emitted only when `digits.length` is divisible by the candidate `repeat_count`. Include `number`, `digits`, `repeat_count`, `chunk_length`, `candidate_chunk`, and `match` (true if every chunk equals `candidate_chunk`, false otherwise). `range_progress` should reflect the numeric position of `number` within the range.
- `invalid_hit`: emitted for every invalid ID. Must include the same fields as `pattern_check` with `match: true`, and `global_sum`/`global_invalids` values after adding this ID. Provide the first repeat count that satisfied the rule (the earliest `repeat_count` found in the solver’s search order).
- `range_end`: emitted after finishing a range. Set `range_progress` to 1. Include `range_invalids` and `inspected`. `digits`/`number` may be omitted.
- `final_summary`: last frame. Use `global_sum = final_sum` and `global_invalids = total_invalid`. Copy the final range’s `range_index`, `range_start`, and `range_end` (or repeat the last range’s values) so context panels render. Set `range_progress` to 1.

### Emission notes
- Do not emit `pattern_check` frames for candidate repeat counts where `digits.length % repeat_count !== 0`; only divisible attempts are logged.
- Every `invalid_hit` frame must be present even if additional sampling is applied elsewhere.
- `range_progress` should remain monotonic within a range (0 → 1) so progress interpolation remains smooth when the visualizer drops intermediate frames.
