# Visual Theme - Day 10: Factory

## Theme Inference

The puzzle describes an **elf factory** with:
- Machines that need initialization
- Buttons and wiring schematics
- Joltage levels (electrical theme)
- Industrial/mechanical setting with whimsical elf elements

**Mood:** Industrial-whimsical, retro-futuristic control panels, steampunk-meets-Christmas-workshop

## Theme Object

### Palette
| Role | Color | Hex |
|------|-------|-----|
| Background | Deep factory gray-blue | #1a1d23 |
| Machine panel | Warm brass/copper | #b87333 |
| Button inactive | Muted steel | #4a5568 |
| Button active | Glowing amber | #f59e0b |
| Counter display | LED green | #10b981 |
| Wiring | Electric blue | #3b82f6 |
| Target reached | Golden spark | #fcd34d |
| Accent | Christmas red | #dc2626 |
| Text | Warm ivory | #fef3c7 |

### Shapes
- **Machines:** Rounded rectangles with riveted edges, resembling vintage control panels
- **Buttons:** Circular with beveled edges, glowing halos when pressed
- **Counters:** Seven-segment LED display style
- **Wiring:** Curved bezier paths connecting buttons to counters
- **Progress indicators:** Industrial gauge/meter style

### Motion Style
- **Button presses:** Quick bounce with ripple effect
- **Counter increments:** Flip-counter animation (mechanical odometer feel)
- **Wiring pulses:** Electric pulse traveling along wires when button affects counter
- **Machine transitions:** Slide in from right, solved machines slide out left
- **Celebration:** Sparks and glow when machine reaches target configuration

## Visualization Metaphor

**Control Panel Dashboard**

Each machine is visualized as a vintage factory control panel:
- Top section: Machine identifier and status indicator
- Left side: Array of physical buttons with glowing indicators
- Center: Wiring diagram showing button-to-counter connections
- Right side: LED counter displays showing current/target values
- Bottom: Progress bar for this machine

The overall view shows:
- Current machine panel in focus (large, center)
- Queue of upcoming machines (thumbnails, right side)
- Completed machines counter (top left)
- Running total display (industrial 7-segment style, top right)

## Theme and Metaphor Guidance

### Rendering
- Use gradients to give buttons and panels a 3D metallic appearance
- Draw wiring as glowing bezier curves with animated pulse particles
- Counter displays use segmented LED font rendering
- Add subtle noise texture to metal surfaces
- Rivets and screws as decorative elements on panel borders

### Motion
- Button presses: Scale down briefly (0.9x), then bounce back with glow expansion
- Wire pulses: Animated dots traveling from button to affected counters
- Counter updates: Individual digits flip up like mechanical counters
- Machine completion: Panel glows gold, then fades as it "powers on"

### Emphasis
- Active button: Bright amber glow with shadow
- Affected counters: Wire paths illuminate, counters flash on increment
- Target reached: Counter turns gold, sparkle particles
- Best solution found: Celebratory spark burst around the machine

### Storytelling
- Begin with factory overview showing all machines offline (dim)
- Zoom into each machine as solver works on it
- Show the ILP solving as rapid button testing visualization
- Reveal optimal solution with satisfying button-press sequence
- Running total prominently displayed as factory "production counter"
- End with all machines online, final total celebration
