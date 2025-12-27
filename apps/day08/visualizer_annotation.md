# Visualizer Annotation — Day 8: Playground

## Architecture

### Class Structure

- **`PlaygroundVisualizer`**: Main orchestrator class
  - Manages canvas rendering, animation loop, and state
  - Handles 3D projection of junction boxes
  - Tracks connections and circuit assignments
  - Controls MediaRecorder for WebM export

- **`ParticleSystem`**: Visual effects
  - Emits particles along new connections
  - Creates celebration bursts for the final connection

- **`StarField`**: Background ambiance
  - Renders twinkling stars in the cavern ceiling
  - Creates depth and atmosphere

### Data Flow

1. JSON log loaded via file input
2. Box positions normalized to fit canvas with bounding box calculation
3. Frames processed sequentially, each adding one connection
4. Circuit assignments updated per frame to track merging
5. 3D positions continuously rotated and projected to 2D

## Theme Influence

### Color Scheme

The underground Christmas playground theme influences every visual element:

- **Background**: Deep cavern blue-black (`#0a0a1a`) with subtle twinkling stars
- **Junction boxes**: Colored by circuit membership using warm Christmas palette (reds, teals, golds, mints)
- **Connections**: Match circuit color with glow effects
- **Final connection**: Brilliant gold pulsing to celebrate completion

### Motion and Animation

- **3D rotation**: Slow continuous rotation shows depth and spatial relationships
- **Connection formation**: Particles trace the path of new light strings
- **Circuit merges**: Colors propagate as circuits combine
- **Final celebration**: Burst particles, pulsing glow, overlay with answer

## Rendering Approach

### 3D Projection

- Simple perspective projection: `screenX = canvasCenter + x * (cameraDistance / (cameraDistance + z))`
- Y-axis rotation for continuous spin
- X-axis tilt for viewing angle
- Depth-based rendering order (painters algorithm)
- Size and opacity scale with depth for distance cues

### Layered Rendering Order

1. Background fill
2. Star field (twinkling background)
3. Connections (sorted by depth, far to near)
4. Junction boxes (sorted by depth, far to near)
5. Particles (on top of scene)
6. UI overlay (title, stats, progress bar)
7. Final celebration overlay (when complete)
8. Popup dialogs (description/algorithm)

### Performance Considerations

- All 1000 boxes rendered each frame with simple circle primitives
- Connections drawn as lines with glow (separate pass for glow layer)
- Particle count limited (~15 per connection, up to 50 for final burst)
- Depth sorting done once per frame before rendering

## Resolution Choice: 720p (1280×720)

### Justification

- **Point cloud clarity**: 1000 junction boxes need adequate resolution to remain distinguishable
- **3D depth perception**: Higher resolution improves subtle depth cues from size/opacity scaling
- **Connection visibility**: Thin light strings remain visible without aliasing
- **File size balance**: 720p provides good quality while keeping WebM files reasonable
- **Text readability**: Stats, labels, and final answer display clearly

## WebM Recording Workflow

### Recording Process

1. User clicks "Record WebM" button
2. `startRecording()` initializes MediaRecorder with best available codec
3. `start()` begins animation from frame 0
4. Canvas stream captured at 60 FPS
5. Chunks accumulated in `recordedChunks` array
6. Animation completes → 2-second cooldown for final celebration
7. `onstop` creates blob and triggers download

### Codec Selection

```typescript
const candidates = [
  'video/webm;codecs=vp9',   // Best quality
  'video/webm;codecs=vp8',   // Widely supported
  'video/webm;codecs=h264',  // Fallback
  'video/webm',              // Generic fallback
];
```

### Timing

- ~999 connection frames at variable speed (0.5x–5x)
- Typical recording at 2x speed: ~1.5 minutes
- Final celebration adds ~2 seconds
- End cooldown: 120 frames (~2 seconds) for particle fadeout
