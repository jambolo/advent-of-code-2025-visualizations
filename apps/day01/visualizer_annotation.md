# Visualizer Annotation — Day 01: Secret Entrance

## Overview
This document describes the architecture and implementation of the Day 01 Safe Dial Visualizer, a browser-based TypeScript application that renders an animated visualization of the Advent of Code 2025 Day 1 puzzle solution.

## Architecture

### High-Level Design
The visualizer is a single-page application consisting of:
- **TypeScript core** (`day01-visualizer.ts`): Main application logic
- **HTML interface** (`index.html`): User controls and canvas element
- **JSON log input**: Frame-by-frame state data from Rust solver

### Component Structure

```
SafeDialVisualizer (main class)
├── Canvas Rendering
│   ├── drawDial() - circular safe dial
│   ├── drawPasswordCounter() - password accumulator
│   ├── drawInstructionInfo() - current rotation details
│   └── drawProgressBar() - animation progress
├── Animation Engine
│   ├── animate() - requestAnimationFrame loop
│   ├── update() - state interpolation
│   └── render() - frame rendering
├── State Management
│   ├── Frame navigation
│   ├── Position interpolation
│   └── Visual effects (trails, flashes)
└── Recording
    └── MediaRecorder integration for WebM export
```

## How Step-1 Design Docs Guided Implementation

### From `input_summary.md`
**Guidance received:**
- Circular dial with 0-99 positions
- Two types of zero encounters: passes (during) and lands (at end)
- Password accumulation is primary metric
- Starting position is 50

**Implementation:**
- Created circular dial centered on canvas with numbers arranged radially
- Implemented `frame_type` discrimination to handle 'zero_pass' vs 'zero_land' differently
- Password counter prominently displayed at top
- Initial state sets position to 50

### From `visual_theme.md`
**Guidance received:**
- Safe/vault aesthetic with steel blue and dark backgrounds
- Gold highlighting for position 0
- Red marker for dial arrow
- Cyan for active elements
- Glowing effects for zero encounters
- Motion trails during rotation

**Implementation:**
- Applied exact color scheme from theme object
- Position 0 rendered in gold (`#ffcc00`) with larger, bold font
- Dial marker (arrow) in bright red (`#ff3366`) with glow effect
- Active position text in cyan (`#66d9ff`)
- Radial gradient glow on zero encounters using `flashIntensity`
- Trail array tracks last 15 positions with alpha fade

### From `emission_rules.md`
**Guidance received:**
- Frame types: initial, rotation_start, position_update, zero_pass, zero_land, rotation_end, final
- ~5,000 expected frames for smooth animation
- Adaptive sampling for large distances
- Progress indicator needed

**Implementation:**
- Frame interface matches all specified types
- Interpolation between frames for smooth rotation (handles sparse sampling)
- Progress bar showing `rotation_number / total_rotations`
- Adaptive animation speed via `interpolationProgress`

## Resolution Choice: 720p (1280×720)

**Justification:**
1. **Content Density**: The visualization centers on a single circular dial (~400px diameter) with surrounding text. Detail requirements are moderate.

2. **Text Readability**: Number labels on the dial (0-99) need to be clear but aren't microscopic. At 720p, 16px font for numbers is crisp. 1080p would be overkill; 480p would make small numbers harder to read.

3. **Performance**: 720p provides good balance between quality and rendering performance. 30fps is easily maintainable at this resolution for real-time canvas updates.

4. **File Size**: For a 5-minute animation, 720p WebM with VP9 keeps file size reasonable (~50-100MB) while maintaining visual fidelity.

5. **Viewport Usage**: The dial, counter, and UI elements fit comfortably in 1280×720 without wasted space. 1080p would add unnecessary canvas area.

**Conclusion**: 720p is the optimal "adequate resolution" for this visualization's needs.

## Rendering Logic

### Dial Rendering Pipeline

1. **Background Layer**
   - Solid fill with `theme.background`
   - Title text at top
   - Password counter box below title

2. **Effects Layer** (if active)
   - Radial gradient glow at position 0 when `showZeroFlash` is true
   - Intensity fades from 0.8 to 0 over several frames
   - Flash triggered by 'zero_pass' or 'zero_land' frames

3. **Dial Structure**
   - Outer ring: circle at `DIAL_RADIUS` (200px) with metallic gradient
   - Inner disc: smaller circle with darker gradient
   - Numbers: positioned at `NUMBER_RADIUS` (240px) in a circle
     - Every 5th number shown (0, 5, 10, ... 95)
     - Position 0 is always gold and larger font
     - Others are muted blue-gray

4. **Motion Trail**
   - Array of last 15 positions
   - Rendered as small circles with fading alpha
   - Creates visual motion indicator

5. **Dial Marker (Arrow)**
   - Rotated and positioned based on `currentPosition`
   - Drawn as triangle pointing from center toward current number
   - Red color with glow shadow effect
   - Smoothly rotates between frames via interpolation

6. **Current Position Text**
   - Displayed in center below dial hub
   - Shows numeric position in cyan

7. **Overlay Information**
   - Instruction text (e.g., "L47")
   - Rotation number
   - Special indicators for zero encounters
   - Progress bar at bottom

### Interpolation Strategy

**Problem**: Frames may be sparsely sampled (e.g., only start/end of rotation).

**Solution**: Interpolate position between frames using easing function.

```typescript
interpolatePosition(from, to, t):
  // Handle circular wraparound
  diff = to - from
  if diff > 50: diff -= 100  // Choose shorter path
  if diff < -50: diff += 100
  
  result = from + diff * easeInOutCubic(t)
  return normalize(result, 0, 99)
```

**Easing**: Cubic ease-in-out for natural mechanical feel (accelerate then decelerate).

**Progress**: `interpolationProgress` increments each frame, reaching 1.0 triggers next frame load.

### Visual Effects

**Zero Flash**:
- Triggered by frame types 'zero_pass' or 'zero_land'
- Creates radial gradient centered on position 0
- Intensity: 0.8 for landing, 0.6 for passing
- Decays by 0.05 per frame until extinguished

**Trail**:
- FIFO queue of recent positions
- Rendered with alpha based on age
- Creates "comet tail" effect during rotation

**Glow on Marker**:
- Shadow blur applied to dial arrow
- Makes marker stand out against dial

## Recording Workflow

### MediaRecorder Integration

1. **Stream Capture**:
   ```typescript
   const stream = canvas.captureStream(FPS);
   ```
   Captures canvas content at 30fps.

2. **Recorder Configuration**:
   ```typescript
   new MediaRecorder(stream, {
     mimeType: 'video/webm;codecs=vp9',
     videoBitsPerSecond: 5000000  // 5 Mbps
   });
   ```
   VP9 codec provides good compression with quality.

3. **Data Collection**:
   - `ondataavailable`: Chunks pushed to array
   - `onstop`: Chunks combined into Blob, URL created, download triggered

4. **User Flow**:
   - Click "Record WebM" → starts recorder + animation
   - Animation runs to completion
   - Recorder auto-stops at end
   - Browser downloads file as `day01-secret-entrance.webm`

### Timing Coordination

- Animation runs at 30fps via `requestAnimationFrame`
- Canvas updates synchronized with recording
- `FRAME_DURATION` ensures consistent timing (33.33ms per frame)
- Recording captures every rendered frame

## Frame Data Flow

```
JSON Log File
    ↓
User loads via file input
    ↓
Parsed into Frame[] array
    ↓
Animation loop:
  - Load next frame
  - Set target state
  - Interpolate current state
  - Render visual state
  - Check completion
    ↓
MediaRecorder captures canvas
    ↓
WebM file saved
```

## Key Implementation Details

### Circular Math
All positions are normalized to 0-99 range with wraparound:
```typescript
while (result < 0) result += 100;
while (result >= 100) result -= 100;
```

Angles calculated as: `(position / 100) * 2π - π/2` (offset so 0 is at top).

### State Synchronization
- `currentPosition`: Interpolated visual position
- `targetPosition`: Next frame's position
- `currentPassword`: Immediate update (no interpolation needed)
- `currentFrame`: Latest loaded frame for metadata

### Performance Considerations
- Trail array capped at 15 positions
- Flash effect auto-decays to avoid continuous glow checks
- Canvas cleared once per frame (no layer composition)
- Minimal object allocations in render loop

## Extension Points

Future enhancements could include:
- Speed controls (0.5×, 1×, 2× playback)
- Frame scrubbing (seek to specific rotation)
- Zoom on dial for large number visibility
- Audio cues for zero encounters
- Particle effects on zero lands
- Separate part 1 vs part 2 visualization modes

## Testing Considerations

To test the visualizer:
1. Generate sample JSON log matching schema
2. Load in browser via file input
3. Verify dial rotates correctly (clockwise=R, counter-clockwise=L)
4. Check zero position is highlighted
5. Confirm password counter increments at right moments
6. Test recording produces playable WebM file
7. Validate final password matches expected result (6738)

## Browser Compatibility

- **Canvas API**: Universal support
- **MediaRecorder**: Chrome/Edge (VP9), Firefox (VP8/VP9), Safari 14.1+
- **File API**: All modern browsers
- **Fallback**: Provide sample JSON log for testing if solver not available
