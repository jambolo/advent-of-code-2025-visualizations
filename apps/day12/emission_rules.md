# Emission Rules - Day 12: Christmas Tree Farm

## When to Emit Frames

### Initialization Frame
- Emit once at start with all 6 present shape definitions
- Contains shape patterns and their areas

### Region Evaluation Frames
For each of the 1000 regions, emit frames at these decision points:

1. **Region Start**: New region with dimensions and required present counts
2. **Area Check**: Present area total vs region area comparison
3. **Verdict**: One of:
   - **Rejected**: If present area > region area
   - **Slot Check**: If not rejected, show slot calculation
   - **Accepted**: If present count ≤ slot count
   - **Undetermined**: If neither condition met

### Summary Frame
- Final frame with complete tallies

## Frame Sampling Strategy

With 1000 regions, showing every region in detail would create an excessively long animation.

### Sampling Rules

**Target**: ~5 minutes max at default playback speed (assuming ~30fps effective rate)

**Strategy**: Adaptive sampling based on verdict type

1. **Early detailed phase** (regions 1-20): Show all frames for each region to establish the pattern
2. **Sampled phase** (regions 21-980):
   - Show every 10th region in detail
   - For skipped regions, emit only verdict frames (batch updates to counters)
3. **Final phase** (regions 981-1000): Show all frames for dramatic conclusion

### Frame Types and Rates

| Frame Type | Estimated Count | Notes |
|------------|-----------------|-------|
| Init (shapes) | 1 | Show all 6 shapes |
| Region detail | ~140 | 20 + 96 + 20 detailed regions × ~1 frame |
| Verdict only | ~860 | Skipped regions batch into periodic counter updates |
| Summary | 1 | Final results |

**Estimated total frames**: ~200 key frames, each displayed for configurable duration

## Progress Visualization

- **Counter display**: Accepted/Rejected/Undetermined counts always visible
- **Progress bar**: Shows region index / total regions
- **Current region highlight**: When showing detailed view

## Visual Timing Suggestions

- Shape introduction: 2 seconds total
- Detailed region evaluation: 1-2 seconds
- Verdict flash: 0.5 seconds
- Batch counter update: 0.3 seconds
- Final summary: 3 seconds hold

At 1x speed, this yields approximately 3-4 minutes of animation.
