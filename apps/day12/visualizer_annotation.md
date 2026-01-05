# Visualizer Annotation - Day 12: Christmas Tree Farm

## Architecture

The visualizer follows the established pattern from previous days:

1. **Data Loading**: JSON log loaded via file input, parsed into sparse frames
2. **Frame Expansion**: Sparse frames expanded with cumulative state tracking
3. **Render Loop**: requestAnimationFrame-based playback with speed control
4. **Recording**: canvas.captureStream() + MediaRecorder for WebM output

### Key Classes

- `Day12Visualizer`: Main class handling all visualization logic
- Interfaces: `Shape`, `Region`, `Day12SparseFrame`, `Day12Frame`, `Day12LogData`

## Theme Influence

The Christmas tree farm setting drives the visual design:

### Color Palette
- **Background**: Deep forest green (#1a2f1a) - cavern atmosphere
- **Panels**: Darker pine (#0f1f0f) - wooden platform feel
- **Present shapes**: 6 distinct festive colors (red, gold, green, silver, pink, ice blue)
- **Verdicts**: Green for accepted, red for rejected, amber for undetermined

### Visual Elements
- Tree silhouettes in background create depth
- Gold corner accents on borders add festive touch
- Grid regions rendered as snow-white gift boxes viewed from above
- 3x3 slot overlay uses translucent green to show available placement zones

### Motion Style
- Gentle pulse animation on verdict badges
- Sparkle effects on summary screen
- Smooth frame transitions

## Rendering Approach

### Frame Types

1. **intro**: Displays all 6 present shapes with areas, explains decision rules
2. **regionStart**: Shows new region grid with dimensions
3. **areaCheck**: Displays area comparison calculation
4. **slotCheck**: Overlays 3x3 slot grid, shows slot vs present count
5. **verdict**: Animated verdict badge (accepted/rejected/undetermined)
6. **batchUpdate**: Quick counter updates for sampled regions
7. **summary**: Final results with sparkle celebration

### Layout

- **Left side**: Region grid visualization (scales to fit 500×350 area)
- **Right side**: Calculation panel with step-by-step analysis
- **Far right**: Running counters (accepted/rejected/undetermined)
- **Bottom**: Required presents for current region

### Grid Rendering

The region grid dynamically scales based on dimensions:
- Maximum 500×350 pixels
- Cell size calculated to fit largest dimension
- Maximum cell size capped at 15px for very small regions
- 3x3 slot overlay drawn only during slot check phase

## Resolution Choice

**1280×720 (720p)** selected because:

1. Good balance between detail and file size
2. Region grids up to 50×50 cells remain readable at scaled sizes
3. Present shapes clearly distinguishable at preview sizes
4. Calculation text remains legible
5. Matches previous day visualizers for consistency

## WebM Recording Workflow

1. User clicks "Record" button
2. `getSupportedMimeType()` probes for vp9 → vp8 → generic webm
3. `canvas.captureStream(30)` creates 30fps video stream
4. `MediaRecorder` collects chunks in `recordedChunks[]`
5. Playback auto-starts from beginning
6. On completion or manual stop, chunks assembled into Blob
7. Download triggered via temporary anchor element
8. Output: `day12-christmas-tree-farm.webm`

## Animation Timing

- Base frame duration: 33ms (30fps)
- Playback speed range: 0.5× to 5×
- Intro frame: Holds until advanced
- Region frames: ~2-3 frames per region in detail view
- Summary frame: Held at end with continuous sparkle animation

## Accessibility Considerations

- High contrast between verdict colors and background
- Text labels accompany all visual elements
- Color-blind safe: shapes distinguishable by position and pattern, not just color
- Counters use both color and numeric values
