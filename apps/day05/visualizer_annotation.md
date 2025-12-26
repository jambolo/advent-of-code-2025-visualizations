# Visualizer Annotation — Day 05: Cafeteria

## Architecture

The visualizer is a single TypeScript class (`CafeteriaVisualizer`) that:

1. Loads a JSON log containing range-merging algorithm steps
2. Renders frames to an HTML canvas at 720p resolution
3. Supports playback speed control (0.5x to 5x)
4. Records to WebM using `canvas.captureStream()` and `MediaRecorder`

## Resolution Choice: 720p (1280x720)

720p was selected because:

- **Range density**: 182 ranges need vertical stacking; 720p provides adequate height
- **Number precision**: Large numbers (trillions) need legible text
- **Performance**: Smooth 60fps playback without taxing the GPU
- **Recording quality**: Good balance of file size and clarity for WebM output

## Theme Influence

The kitchen/cafeteria theme drives the visual design:

- **Fresh green palette**: Evokes freshness, health, and "good" ingredients
- **Dark background**: Suggests a commercial kitchen environment
- **Clean grid pattern**: Reflects inventory management/organization
- **Progress indicators**: Show the accumulation of fresh ingredient counts

## Rendering Approach

### Layout Structure

```
┌─────────────────────────────────────────────┐
│  Header: Title, phase indicator, running    │
│  total of fresh IDs                         │
├─────────────────────────────────────────────┤
│                                             │
│  Range Area: Original/sorted ranges as      │
│  horizontal bars stacked vertically         │
│  (up to 25 rows visible at once)            │
│                                             │
├─────────────────────────────────────────────┤
│  Number Line: Normalized axis from          │
│  global_min to global_max                   │
├─────────────────────────────────────────────┤
│  Merged Area: Resulting merged ranges       │
├─────────────────────────────────────────────┤
│  Footer: Progress bar and statistics        │
└─────────────────────────────────────────────┘
```

### Animation Phases

1. **Initial**: Display all ranges in original (unsorted) order
2. **Sorted**: Ranges transition to sorted order
3. **Merge steps**: Step through each range, highlighting:
   - Blue: New range being added to merged list
   - Orange: Range merging with previous merged range
4. **Final**: Complete merged ranges with total displayed prominently

### Number Normalization

Since ingredient IDs span ~1T to ~562T, all positions are normalized:

```typescript
normalize(value) = (value - globalMin) / (globalMax - globalMin)
```

This maps the trillion-scale values to 0-1 for display coordinates.

### Large Number Display

- `formatLargeNumber()`: Shows compact form (e.g., "353.72T")
- `formatFullNumber()`: Shows full number with locale formatting
- All i64 values stored as strings in JSON to preserve precision

## WebM Recording Workflow

1. User clicks "Record WebM"
2. Create `MediaStream` from canvas at 60fps
3. Detect supported codec: VP9 → VP8 → generic WebM
4. Start `MediaRecorder` and begin playback
5. Collect chunks in `ondataavailable`
6. When playback ends or user stops, call `mediaRecorder.stop()`
7. `onstop` handler creates blob and triggers download

## Frame Timing

- Default frame duration: 400ms
- Adjusted by playback speed: `400ms / speed`
- At 2x speed: ~200ms per frame, yielding ~37 seconds for 185 frames

## Key Visual Elements

| Element | Purpose |
|---------|---------|
| Range bars | Show individual fresh ID ranges |
| Color alternation | Distinguish adjacent ranges |
| Current highlight | Indicate which range is being processed |
| Merged bar section | Show progressive consolidation |
| Running total | Real-time count of fresh IDs |
| Progress bar | Overall algorithm completion |

## Dependencies

- No external libraries beyond standard DOM APIs
- Uses `BigInt` for precise large integer handling
- Uses `roundRect` for modern rounded rectangle rendering
