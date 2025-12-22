# Visualizer Annotation — Day 04: Printing Department

## Architecture

The visualizer is a single TypeScript class (`WarehouseVisualizer`) that:

1. Loads a JSON log file containing frame data.
2. Renders frames onto a 720p canvas using `requestAnimationFrame`.
3. Supports playback controls (play, stop, speed adjustment).
4. Records to WebM using `MediaRecorder`.

### File Structure

```
apps/day04/
├── index.html           # Main HTML page with UI and dialogs
├── day04-visualizer.ts  # TypeScript visualizer (compiles to .js)
├── input_summary.md     # Algorithm analysis
├── visual_theme.md      # Theme specification
├── emission_rules.md    # Frame emission rules
├── visualizer_annotation.md  # This file
└── json_log_spec.md     # JSON schema for solver output
```

## Theme Influence

The warehouse/printing department theme drives visual choices:

- **Color palette**: Warm earth tones (browns, creams) evoke a paper warehouse.
- **Paper rolls as circles**: Viewed from above, rolls appear as cream-colored circles.
- **Orange glow for removal**: Accessible rolls glow before disappearing.
- **Dark floor**: Empty spaces are dark warehouse flooring.
- **Progress bar**: Green fill shows erosion progress.

## Rendering Approach

### Grid Layout

The 140x135 grid is rendered with dynamically calculated cell sizes:

```typescript
cellSize = Math.max(2, Math.min(cellW, cellH, 8));
```

This ensures cells fit within the available canvas area while remaining visible.

### Cell Rendering

- **Size <= 3px**: Simple filled rectangles for performance.
- **Size > 3px**: Circular paper rolls with shadow for depth.

### Removal Animation

When rolls are removed:
1. Calculate animation progress (0 to 1) over 600ms.
2. Apply easing function for smooth motion.
3. Fade alpha from 1 to 0.
4. Lift position upward by 8 pixels.
5. Add orange glow shadow.

### Frame Interpolation

Each frame represents a complete pass. The visualizer:
1. Displays the grid state from the current frame.
2. Animates removals listed in `removed_this_pass`.
3. Advances to the next frame after `BASE_FRAME_DURATION`.

## Resolution Choice: 720p (1280x720)

720p was chosen because:

1. **Grid density**: 140x135 cells require compact rendering. At 720p, each cell is ~4-6 pixels, providing adequate visibility.
2. **Text readability**: Headers, counters, and progress text remain crisp.
3. **Recording size**: WebM files stay manageable for sharing.
4. **Performance**: Lower resolution allows smooth 60fps playback and recording.

1080p would provide slightly larger cells but increase file size significantly with minimal visual benefit given the dense grid.

## WebM Recording Workflow

1. User clicks "Record WebM".
2. `canvas.captureStream(60)` creates a 60fps video stream.
3. `MediaRecorder` is initialized with codec preference (vp9 > vp8 > generic).
4. Playback starts automatically if not already playing.
5. On stop or animation end, chunks are combined into a Blob.
6. Browser prompts download of `day04-printing-department.webm`.

## UI Components

### Controls Panel

- **File input**: Load JSON log.
- **Speed select**: 0.5x to 5x playback speed.
- **Play button**: Start from beginning.
- **Record button**: Start recording and playback.
- **Stop button**: Stop playback and recording.

### Dialogs

- **Description**: Full puzzle description with formatting.
- **How It Works**: Explanation of the erosion algorithm.

Both use native `<dialog>` elements with modal backdrop.

## Performance Considerations

1. **Grid rendering**: Only active cells are drawn; empty cells use minimal fill.
2. **Removal tracking**: `Set` lookup for O(1) position checking.
3. **Animation frame budget**: All drawing completes within 16ms for 60fps.
4. **Memory**: Grid stored as string array, not object per cell.

## Dependencies

- No external libraries.
- Modern browser features: `canvas.captureStream`, `MediaRecorder`, `dialog` element.
- TypeScript compiled to ES modules.
