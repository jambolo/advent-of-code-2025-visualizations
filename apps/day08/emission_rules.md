# Emission Rules — Day 8: Playground

## When to Emit Frames

### Frame Types

1. **Initial Frame**: Emit once at start with all junction boxes in their initial positions and individual circuits

2. **Connection Frames**: Emit when two junction boxes are successfully connected (circuits merge)
   - Include: the pair indices, the distance, the resulting circuit membership

3. **Final Frame**: Emit when the last connection creates a single unified circuit
   - Include: final pair indices, X coordinates, computed product (answer)

### What NOT to Emit

- **Skipped connections**: When both boxes are already in the same circuit, do not emit a frame (these are redundant and would bloat the log)
- **Distance computation steps**: These are preprocessing and not visually interesting

## Frame Sampling Strategy

### Total Connection Events

- 1000 junction boxes require exactly 999 connections to form a single tree
- Each connection frame represents a meaningful state change

### Animation Length Constraints

- Target: Under 5 minutes total
- At 30 FPS playback, 5 minutes = 9000 frames
- 999 connection events + initial + final ≈ 1001 logical frames

### Sampling Approach

- **No sampling needed**: 999 connection events is manageable
- Each connection gets rendered with interpolated animation frames
- Playback speed control (0.5x–5x) allows user to adjust pacing

### Animation Timing per Connection

- **Fast phase (first 900 connections)**: ~100ms per connection = 90 seconds
- **Slow phase (last 99 connections)**: ~300ms per connection = 30 seconds
- **Final connection**: 2 seconds with celebration
- **Total estimated**: ~2.5 minutes at 1x speed

## Progress Visualization

### Metrics to Display

- **Connection counter**: "Connection 523 / 999"
- **Circuit counter**: "Circuits remaining: 477"
- **Current edge distance**: "Distance: 1234.56"

### Progress Indicators

- Progress bar fills from 0% to 100% as connections complete
- Color gradient: red (start) → gold (middle) → green (complete)

## Visual State Per Frame

Each emitted frame must contain:

1. **All junction box positions** (static, in initial frame only to save space)
2. **All connections made so far** (list of index pairs)
3. **Current circuit assignments** (which box belongs to which circuit)
4. **The new connection being made** (highlighted edge)
5. **Frame metadata**: connection index, distance, timestamp

## Final Result Emphasis

The final frame should trigger:

1. **Pause**: Hold on the pre-final state briefly
2. **Zoom**: Camera focuses on the two final junction boxes
3. **Connection animation**: Slow-motion light string formation
4. **Burst**: Radial glow from both endpoints
5. **Network pulse**: All connections flash in sequence
6. **Answer display**:
   - Box A position and X coordinate
   - Box B position and X coordinate
   - Product calculation shown
   - Final answer in large, golden text
