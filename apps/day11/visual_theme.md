# Visual Theme - Day 11: Reactor

## Theme Inference

The puzzle describes an underground reactor room with:
- A **toroidal reactor** (doughnut-shaped power source)
- Electrical conduits and cables in a tangle
- Server racks with blinking lights
- Elves rushing between equipment
- Data flowing through device networks

This evokes an industrial/sci-fi aesthetic: glowing cables, pulsing energy, control room monitors.

## Mood and Style

- **Industrial sci-fi:** Dark backgrounds with glowing neon accents
- **Energy/power theme:** Pulsing, flowing light representing data
- **Technical/schematic:** Circuit board / network diagram feel
- **Urgency:** The Elves are troubleshooting, so dynamic motion

## Theme Object

### Palette
- **Background:** Deep navy blue (#0a0e1a) - reactor room darkness
- **Primary glow:** Electric cyan (#00ffff) - data/energy flow
- **Secondary glow:** Hot magenta (#ff00ff) - active paths
- **Warning/key nodes:** Amber/gold (#ffaa00) - fft, dac highlights
- **Success:** Bright green (#00ff88) - completed paths
- **Neutral nodes:** Steel blue (#4a6fa5)
- **Edges/cables:** Dim cyan (#1a4a5a) with glow when active

### Shapes
- **Nodes:** Rounded rectangles (device modules) with subtle glow halos
- **Key nodes (svr, fft, dac, out):** Hexagonal with pulsing borders
- **Edges:** Curved bezier cables with animated dash patterns
- **Particles:** Small dots flowing along edges to show data movement

### Motion Style
- **Smooth easing:** Cubic bezier transitions for state changes
- **Particle flow:** Continuous small particles along active edges
- **Pulse effects:** Key nodes pulse when relevant to current operation
- **Ripple expansion:** When counting paths, ripples expand from source
- **Counter animations:** Numbers roll up like digital displays

## Visualization Metaphor

**Network Control Room Monitor**

The visualization presents a schematic control room display showing the reactor's device network. The viewer sees:

1. A force-directed graph layout resembling a circuit diagram
2. The toroidal reactor (out) as a glowing ring at the bottom
3. Server rack (svr) as a rectangular module at the top
4. fft and dac as prominent hexagonal checkpoints
5. Data packets (particles) flowing through cables during path counting
6. Digital readouts showing path counts accumulating

## Rendering Approach

### Graph Display
- Force-directed layout with key nodes pinned to strategic positions
- svr at top, out at bottom, fft and dac in middle band
- Edges rendered as glowing bezier curves
- Node labels displayed inside each device box

### Animation Phases
1. **Setup:** Graph fades in, key nodes pulse to introduce themselves
2. **Reduction:** Pruned nodes fade to dim, edges disconnect
3. **Segment 1:** Particles flow from svr toward fft, counter increments
4. **Segment 2:** Particles flow from fft toward dac
5. **Segment 3:** Particles flow from dac toward out
6. **Finale:** Three counters multiply with dramatic reveal

### Emphasis Techniques
- Active path segments glow brighter
- Inactive portions dim but remain visible for context
- Key nodes maintain pulsing borders throughout
- Final result displays in large, styled digital font

### Storytelling
The visualization tells the story of troubleshooting: first understanding the network, then systematically analyzing each segment to find all problematic paths that pass through both fft and dac converters.
