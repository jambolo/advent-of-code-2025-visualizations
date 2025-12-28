# Emission Rules — Day 9: Movie Theater

## When to Emit Frames

### Frame Categories

1. **Initial frame**: Emit once at start with polygon structure
2. **Candidate evaluation frames**: Emit for sampled rectangle tests
3. **New best frames**: Always emit when a new maximum is found
4. **Final frame**: Emit once showing the winning rectangle

## State Changes Meriting Frames

### High Priority (Always Emit)

- Discovery of a new best rectangle (new maximum area)
- Initial polygon setup
- Final result

### Medium Priority (Sample)

- Valid rectangle that isn't the new best
- First few invalid rectangles (for demonstration)

### Low Priority (Sparse Sample)

- Invalid rectangles after initial examples
- Routine progress updates

## Frame Sampling Strategy

### Problem Scale Analysis

- 496 corners → 496 × 495 / 2 = 122,760 potential pairs
- Part 2 filters many pairs, but still potentially thousands of valid ones
- Target: Maximum 5 minutes at 30fps = 9,000 frames

### Sampling Rules

1. **Initial phase** (first 50 candidates):
   - Emit every candidate to show the evaluation process
   - Include both valid and invalid examples

2. **Middle phase** (candidates 51 to N-100):
   - Emit every 50th valid candidate
   - Emit every 500th invalid candidate
   - Always emit new best discoveries

3. **Final phase** (last 100 candidates):
   - Emit every 10th candidate for acceleration effect
   - Always emit new best discoveries

4. **Special emissions**:
   - Every new best rectangle: always emit
   - Milestone progress: every 10% of total pairs checked

### Frame Rate Targets

| Animation Phase | Target Duration | Frame Count |
|-----------------|-----------------|-------------|
| Opening (polygon reveal) | 3 seconds | 90 frames |
| Search phase | 4 minutes | ~7,200 frames |
| Final reveal | 15 seconds | 450 frames |
| **Total** | ~4.5 minutes | ~7,740 frames |

## Progress Visualization

### Numeric Progress

- Pairs tested: current / total
- Valid rectangles found: count
- Current best area: value
- Percentage complete: 0-100%

### Visual Progress

- Progress bar filling across bottom of screen
- Intensity of background lighting increases as best area grows
- Corner markers dim after being fully evaluated

## Animation Timing

### Frame Display Duration

- Standard candidate: 2 frames (66ms at 30fps)
- Valid rectangle: 4 frames (133ms)
- New best: 15 frames (500ms) with spotlight animation
- Final result: 90 frames (3 seconds)

### Transitions

- Fade duration for candidates: 100ms
- Spotlight pulse duration: 400ms
- Best rectangle glow: continuous subtle animation
