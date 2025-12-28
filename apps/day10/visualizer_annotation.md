# Visualizer Annotation - Day 10: Factory

## Architecture

The visualizer follows the standard pattern established in previous days:

### Class Structure
- **Day10Visualizer**: Main class handling all visualization logic
  - Canvas setup and rendering
  - Frame playback control
  - WebM recording
  - Modal management

### Data Flow
1. User loads JSON recording file
2. Frames array is extracted from log data
3. Animation loop renders frames at 30fps base rate
4. Playback speed multiplier adjusts frame timing

## Theme Influence

### Industrial Factory Aesthetic
- **Color Palette**: Steel grays, copper/brass accents, LED green displays, amber warning colors
- **Typography**: Monospace fonts (Courier New) for industrial readout feel
- **Decorative Elements**: Rivets, hazard stripes, metal gradients, panel borders

### Visual Metaphor Implementation
- Machines rendered as control panels with buttons, wiring, and counters
- Buttons have 3D appearance with gradients and shadows
- Wiring drawn as bezier curves with animated pulse effects
- Counters display in LED-style with progress bars

## Rendering Approach

### Layer Order
1. Background (dark factory floor)
2. Industrial border with rivets and hazard stripes
3. Machine panel (main content area)
4. Button array with states (inactive/active/pressed)
5. Wiring diagram with animated pulses
6. Counter displays with current/target values
7. Progress indicators
8. Global stats overlay
9. Celebration effects (final frame)

### Frame Types
- **intro**: Factory overview showing all machines as offline
- **machineStart**: Machine panel slides into focus
- **solving**: Shows optimization in progress
- **solutionFound**: Reveals optimal button press counts
- **buttonPress**: Animates individual button activations
- **complete**: Machine marked online, added to total
- **final**: All machines online, celebration with final answer

### Animation Techniques
- Glow effects using canvas shadow blur
- Bezier curve wiring with traveling pulse particles
- Gradient fills for metallic button appearance
- Counter progress bars for visual feedback
- Particle system for celebration effects

## Resolution Choice

**720p (1280x720)** selected for:
- Balance between detail and file size
- Standard HD resolution widely supported
- Sufficient space for detailed machine panel plus queue and stats
- Good performance during recording

## WebM Recording Workflow

1. User clicks Record button
2. MIME type detection (vp9 → vp8 → webm fallback)
3. Canvas stream captured at 30fps
4. MediaRecorder initialized with 5Mbps bitrate
5. Animation resets to frame 0 and plays
6. Chunks collected in ondataavailable handler
7. On completion/stop: Blob created, download triggered
8. File saved as "day10-factory.webm"

## UI Components

### Controls
- File input (styled as button)
- Play/Pause/Reset buttons
- Record toggle
- Speed slider (0.5x - 5.0x)
- Puzzle description modal button
- Algorithm explanation modal button

### Modals
- Puzzle description with formatted text
- Algorithm explanation with mathematical details
- Click-outside or X button to close

## Key Rendering Functions

| Function | Purpose |
|----------|---------|
| `drawFactoryBorder()` | Industrial frame with rivets and hazard stripes |
| `drawMachinePanel()` | Main control panel layout |
| `drawButtonsSection()` | Array of interactive buttons |
| `drawWiringSection()` | Bezier curve connections with pulses |
| `drawCountersSection()` | LED-style counter displays |
| `drawMachineQueue()` | Sidebar showing upcoming machines |
| `drawGlobalStats()` | Running totals overlay |
| `drawFinalFrame()` | Celebration with particle effects |
