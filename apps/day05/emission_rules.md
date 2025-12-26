# Emission Rules — Day 05: Cafeteria

## Overview

The instrumentation captures the range-merging algorithm's progression. There are 182 input ranges, which sort and merge into fewer distinct ranges.

## Phases and Events

### Phase 1: Initial State
**Emit once** before any processing.
- Capture all original ranges as parsed from input
- Include the unsorted order

### Phase 2: Sorted State
**Emit once** after sorting is complete.
- Capture all ranges in sorted order (by start value)
- This represents the state before merging begins

### Phase 3: Merge Operations
**Emit for each merge operation** during the merge loop.
- When a range overlaps with the previous merged range
- Capture: which range was processed, merge result, running statistics

### Phase 4: Final State
**Emit once** when merging is complete.
- Final list of merged ranges
- Total count of fresh ingredient IDs

## Frame Sampling Strategy

With 182 input ranges, the merge phase will have at most 182 steps. This is well under 5 minutes of animation. No sampling is needed.

**Estimated frame counts:**
- Initial: 1 frame
- Sorted: 1 frame
- Merge steps: up to 182 frames (one per processed range)
- Final: 1 frame

**Total: ~185 frames maximum**

At ~0.5 seconds per frame, this yields ~90 seconds of animation, well within limits.

## State to Track

### Per Range
- `start`: Start of range (i64)
- `end`: End of range (i64)
- `index`: Original position in input (for animation reference)

### Per Merge Step
- `step_index`: Which sorted range is being processed (0-based)
- `current_range`: The range being examined
- `action`: `"new"` (added as new merged range) or `"merged"` (combined with previous)
- `merged_ranges`: Current state of merged range list after this step
- `total_fresh`: Running sum of fresh IDs from merged ranges

### Final Summary
- `merged_count`: Number of distinct merged ranges
- `total_fresh`: Final answer (353,716,783,056,994)

## Progress Indicators

- **Sorting progress**: Binary (before/after)
- **Merge progress**: `step_index / total_ranges`
- **Coverage accumulation**: Show `total_fresh` growing

## Visual Emphasis Points

1. **Start of merge phase**: Highlight first range
2. **Merge events**: When `action == "merged"`, emphasize the combining
3. **Final result**: Prominent display of total

## Normalization for Display

Since actual IDs are in the trillions (up to ~562 trillion), the visualizer must normalize:
- Find global min/max across all ranges
- Map to display coordinates
- Preserve relative proportions

The JSON should include:
- `global_min`: Smallest start value across all ranges
- `global_max`: Largest end value across all ranges

This allows the visualizer to compute normalized positions.
