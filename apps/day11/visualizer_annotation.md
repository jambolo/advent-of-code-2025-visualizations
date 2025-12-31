# Visualizer Annotation - Day 11: Reactor

## Architecture

The Day 11 visualizer is a single-page TypeScript application that renders an animated network graph visualization to an HTML5 canvas.

### Components

1. **Day11Visualizer Class**: Main controller handling:
   - JSON log loading and parsing
   - Frame sequencing and playback
   - Canvas rendering
   - MediaRecorder integration for WebM export

2. **Node Position Computation**: Uses BFS-based layer assignment with key nodes (svr, fft, dac, out) pinned to fixed positions

3. **Modal System**: Pop-up windows for puzzle description and algorithm explanation

### Data Flow

```
recording.json → loadJSON() → computeNodePositions() → frames[]
                                                          ↓
                                                   renderFrame()
                                                          ↓
                                              canvas.captureStream()
                                                          ↓
                                                MediaRecorder → WebM
```

## Theme Influence

The industrial sci-fi reactor theme shapes every visual element:

### Color Palette
- **Background**: Deep navy (#0a0e1a) - underground reactor room darkness
- **Primary accent**: Electric cyan (#00ffff) - data flow, energy pulses
- **Secondary accent**: Hot magenta (#ff00ff) - active elements, current node
- **Highlight**: Amber gold (#ffaa00) - key nodes (svr, fft, dac, out)
- **Success**: Bright green (#00ff88) - completed segments

### Visual Elements
- **Grid pattern**: Subtle cyan lines suggesting technical schematic
- **Glowing borders**: Dual-color gradient (cyan/magenta) reactor containment feel
- **Hexagonal key nodes**: Distinct from circular regular nodes, suggesting importance
- **Bezier edge curves**: Cables and conduits rather than straight lines
- **Particle effects**: Data packets flowing along active edges

### Motion Style
- Pulsing glow effects on active elements (sinusoidal oscillation)
- Continuous particle flow along edges during counting phases
- Celebration particles on victory screen

## Rendering Approach

### Graph Layout

1. **Key Node Positioning**: Fixed positions create visual hierarchy
   - svr: Top center (640, 80) - data source
   - fft/dac: Middle band, left/right (450/830, 300) - checkpoints
   - out: Bottom center (640, 620) - destination reactor

2. **Layer Assignment**: BFS from svr assigns depth levels
3. **Horizontal Distribution**: Nodes spread across layers with deterministic jitter
4. **Edge Rendering**: Quadratic bezier curves with subtle offset for visual interest

### Frame Types

| Frame Type | Rendering |
|------------|-----------|
| intro | Toroidal reactor illustration, network stats |
| graphDisplay | Full network with key nodes highlighted |
| reduction | Fading pruned nodes, disconnecting edges |
| counting | Particle flow, active edge highlighting, running totals |
| multiply | Three segment boxes with counts, multiplication symbols |
| final | Victory overlay with celebration particles |

### Performance Considerations

- Node positions computed once on JSON load, cached in Map
- Edges drawn before nodes (z-ordering)
- Particle positions calculated per-frame using phase accumulator
- Canvas cleared and redrawn each frame (no incremental updates)

## Resolution Choice: 720p (1280x720)

**Justification:**
- Graph with 576 nodes needs sufficient space for legibility
- Node labels readable at 11px font
- Reasonable file size for WebM recordings (~5-10 MB typical)
- Balances detail with performance on mid-range hardware
- Matches most AoC visualization conventions

## WebM Recording Workflow

1. **Codec Detection**: `MediaRecorder.isTypeSupported()` tries vp9 → vp8 → generic
2. **Stream Capture**: `canvas.captureStream(30)` at 30 fps
3. **Recording**: Chunks collected via `ondataavailable`
4. **Export**: Blob created with appropriate MIME type, downloaded as `day11-reactor.webm`

### Recording Flow

```
recordBtn click
    → reset() to frame 0
    → startRecording()
        → MediaRecorder.start()
        → play()
    → ... animation runs ...
    → last frame reached
        → stopRecording()
            → MediaRecorder.stop()
            → blob download triggered
```

### Bitrate

5 Mbps (`videoBitsPerSecond: 5000000`) chosen for:
- Good quality for detailed graph rendering
- Reasonable file sizes (< 50 MB for 5-minute animation)
- Compatibility with common playback software

## Interactive Features

- **Playback controls**: Play, Pause, Reset
- **Speed control**: 0.5x to 5x via range slider
- **Recording toggle**: Start/stop WebM capture
- **Modal pop-ups**: Puzzle description and algorithm explanation

## File Structure

```
apps/day11/
├── day11-visualizer.ts   # Main TypeScript visualizer
├── index.html            # HTML shell with controls and modals
├── input_summary.md      # Puzzle analysis
├── visual_theme.md       # Theme definition
├── emission_rules.md     # Frame emission guidelines
├── json_log_spec.md      # JSON format specification
├── visualizer_annotation.md  # This document
└── recording.json        # Generated by instrumented Rust solver
```
