# Visualizer Annotation - Day 7: Laboratories

## Architecture

The visualizer follows a frame-based animation architecture with interpolation for smooth transitions.

### Core Components

1. **TachyonManifoldVisualizer Class**
   - Manages canvas rendering, animation loop, and state
   - Loads JSON log data and processes frames sequentially
   - Handles MediaRecorder for WebM capture

2. **ParticleSystem Class**
   - Manages visual particle effects for split events
   - Particles emit from splitters when beams split
   - Includes directional particles (left/right) and flash particles

3. **State Management**
   - Tracks current/target row for smooth vertical movement
   - Maintains beam positions with timeline counts
   - Records beam trails for path visualization

### Animation Loop

```
animate() → update() → render()
    ↓          ↓          ↓
 timing    state     drawing
           change    operations
```

## Theme Influence

### Color Palette Application
- **Background (#0a0a12)**: Deep space black creates contrast for beam visibility
- **Tachyon beams (#00ffff)**: Electric cyan draws attention to particle positions
- **Splitters (#ffa500)**: Warm amber chevrons stand out against cool tones
- **Timeline counts (#9b59b6)**: Purple badges indicate quantum multiplicity
- **Scan line**: Semi-transparent cyan highlights current processing row

### Visual Metaphor Realization
- Grid rendered as a crystalline manifold structure
- Splitters appear as glowing prisms (chevron shape)
- Beam trails show historical paths as fading lines
- Particles burst on splits to emphasize fork events
- Timeline counts displayed as floating badges

## Rendering Approach

### Layer Order (bottom to top)
1. Background fill
2. Grid lines (subtle, every 10 cells)
3. Beam trails (historical paths)
4. Splitters (all ^ positions)
5. Source marker (S)
6. Scan line (current row highlight)
7. Active beams with glow effects
8. Split flash effects
9. Particle system
10. UI elements (title, stats, progress bar)
11. Popup overlays (description/algorithm)

### Performance Considerations
- Only major grid lines drawn (every 10 cells) to reduce draw calls
- Splitters pre-rendered based on log data positions
- Beam trails use simple line segments
- Particle count limited per split event

## Resolution Choice: 720p (1280×720)

### Justification
- **Grid density**: 143 columns fit well at 720p with ~8.4 pixels per cell
- **Readability**: Timeline count badges need minimum font size; 720p provides enough space
- **File size**: WebM output stays manageable for web delivery
- **Performance**: Canvas operations remain smooth with particle effects
- **Comparison**: 480p would make the grid too dense; 1080p unnecessary for this visualization style

### Cell Dimensions
- Available width: 1280 - 40 (left margin) - 40 (right margin) = 1200px
- Cell width: 1200 / 143 ≈ 8.4px
- This provides adequate space for beam markers and small text

## WebM Recording Workflow

1. **Initialization**
   - Detect supported MIME type (vp9 → vp8 → h264 → generic)
   - Create MediaRecorder with canvas.captureStream(60fps)
   - Configure 5Mbps bitrate for quality

2. **Recording**
   - MediaRecorder.start() begins capture
   - Animation loop renders frames normally
   - Data collected via ondataavailable events

3. **Completion**
   - Animation end triggers MediaRecorder.stop()
   - Blob created from recorded chunks
   - Auto-download initiated with day07-laboratories.webm filename

## Interactive Features

### Popup System
- **D key**: Toggle puzzle description overlay
- **A key**: Toggle algorithm summary overlay
- Popups dim background and display centered modal
- Includes close hint text

### Speed Control
- Range: 0.5x to 5x playback speed
- Affects interpolation progress rate
- Default 2x for reasonable viewing time

## Frame Interpolation

Smooth animation achieved through:
- Linear interpolation of row positions
- Easing function (easeInOutCubic) for natural motion
- Beam position interpolation during transitions
- Flash intensity decay for split effects
