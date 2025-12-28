# Visualizer Annotation — Day 9: Movie Theater

## Architecture

The visualizer is a single-page TypeScript application with the following components:

### Core Classes

- **Day09Visualizer**: Main controller class managing canvas rendering, playback, and recording

### Data Flow

1. User loads `recording.json` via file input
2. JSON is parsed into `LogData` structure with typed frames
3. Viewport bounds are calculated from corner coordinates
4. Frames are rendered sequentially during playback

## Theme Influence

The "Movie Theater" theme directly influences all visual elements:

### Color Palette

- **Deep burgundy background** (#2D1B2E): Evokes theater carpet/curtains
- **Gold polygon interior** (#C9A227): Premium seating area aesthetic
- **Ruby red corners** (#B22234): Architectural marker points
- **Cream boundary lines** (#F5E6C8): Clean theater floor tile edges

### Visual Metaphor

The polygon represents a theater floor plan viewed from above. The search for the largest rectangle becomes "finding the best screen placement" in the multiplex.

### Decorative Elements

- **Film strip border**: Black strips with sprocket holes at top and bottom
- **Art deco corner accents**: Gold corner flourishes on the stats panel
- **Tile grid pattern**: Subtle grid inside the polygon suggesting floor tiles

## Rendering Approach

### Layer Order (back to front)

1. Background fill (burgundy)
2. Film strip decorations
3. Polygon interior (gold gradient with tile pattern)
4. Polygon boundary (cream edges)
5. Current best rectangle (gold glow)
6. Candidate rectangle (pink/green/gray based on validity)
7. Corner markers (red diamonds, highlighted for active candidates)
8. Stats panel (semi-transparent with deco accents)
9. Progress bar
10. Title text

### Canvas Techniques

- **Gradient fills**: Linear gradient for polygon interior, radial for spotlight
- **Clipping paths**: Tile pattern clipped to polygon boundary
- **Shadow effects**: Glow on best rectangle and active corners
- **Rounded rectangles**: Soft corners on candidate rectangles

## Resolution Choice

**720p (1280×720)** was selected for these reasons:

1. **Balance**: Good quality while keeping file sizes reasonable
2. **Aspect ratio**: 16:9 fits modern screens well
3. **Performance**: Smooth 30fps recording without dropped frames
4. **Polygon visibility**: Large coordinate range (1500-98000) needs adequate resolution

## WebM Recording Workflow

### MIME Type Detection

```typescript
const types = [
  "video/webm;codecs=vp9",  // Best quality
  "video/webm;codecs=vp8",  // Fallback
  "video/webm",              // Generic
];
```

The visualizer tests each type and uses the first supported one.

### Recording Process

1. User clicks "Record" button
2. Canvas stream is captured at 30fps
3. MediaRecorder starts with 5Mbps bitrate
4. Animation plays from beginning
5. Chunks are collected in array
6. On completion, Blob is assembled and downloaded

### Output

- Filename: `day09-movie-theater.webm`
- Frame rate: 30fps
- Bitrate: 5Mbps

## Animation Timing

- **Base frame duration**: 33.3ms (30fps)
- **Speed control**: 0.5x to 5x multiplier
- **Spotlight animation**: Sinusoidal pulse at 0.15 radians/frame
- **Glow animation**: Continuous sine wave for best rectangle

## UI Components

### Playback Controls

- Play/Pause/Reset buttons
- Speed slider (0.5x - 5x)
- Record button (toggles recording state)

### Modal Dialogs

- **Puzzle button**: Shows full puzzle description with examples
- **Algorithm button**: Explains the solving approach

### Status Display

- Current operation feedback
- Frame count after loading
- Recording state indication
