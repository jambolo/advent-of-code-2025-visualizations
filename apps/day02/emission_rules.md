### When to emit
- `range_start`: once per range with start/end and zeroed progress.
- `scan_tick`: periodic snapshots while walking the range to show motion; include current number and percent through the range.
- `pattern_check`: for any number that passes a divisibility test (length divisible by candidate repeat count); records the candidate chunk length and whether the full match succeeded.
- `invalid_hit`: whenever an ID is confirmed invalid; include the smallest repeating chunk string, repeat count, and the updated running sum.
- `range_end`: after finishing a range with counts of numbers inspected and invalid IDs found within it.
- `final_summary`: once after all ranges with total invalid count and final sum.

### What changes merit a frame
- Entering/exiting a range so the visualization can relabel the conveyor.
- Every `invalid_hit`.
- `pattern_check` only when the candidate evenly divides the length to show why it qualifies (skip non-divisible attempts).
- `scan_tick` on a fixed stride (configurable, default every 500 numbers) to communicate pace without flooding frames.
- Running sum updates (happen on `invalid_hit`) so the register display can pulse.

### Sampling strategy
- Solver should emit at most one `scan_tick` per stride and cap per-range snapshots to avoid >10k frames for the full run.
- Visualizer will further subsample the emitted frames to keep playback under 5 minutes at 60fps by skipping frames with a fixed step when necessary; `invalid_hit` frames are never skipped.
- Include `range_progress` (0.0–1.0) in every event so interpolated motion stays accurate even when frames are dropped.
- Do not emit raw per-digit attempts for every candidate; only emit the divisibility-qualified `pattern_check` and the single successful chunk for invalid IDs to keep the log compact.
