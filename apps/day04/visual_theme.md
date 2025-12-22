# Visual Theme — Day 04: Printing Department

## Theme Concept

The puzzle describes a **printing department warehouse** with large rolls of paper and forklifts. The visualization evokes an industrial paper mill or warehouse with warm, earthy tones contrasted against the mechanical nature of forklifts.

### Mood
- **Industrial warmth** — A busy warehouse preparing for Christmas.
- **Organized chaos** — Dense stacks of paper rolls being systematically cleared.
- **Satisfying erosion** — Watching complexity simplify in waves.

### Style
- Top-down warehouse view.
- Paper rolls as cylindrical icons (viewed from above as circles or rounded rectangles).
- Clean grid layout representing warehouse floor.
- Warm lighting suggesting interior workspace.

## Color Palette

| Role | Hex | Description |
|------|-----|-------------|
| Background | `#1a1410` | Dark warehouse floor |
| Background accent | `#2a2218` | Slightly lighter warehouse area |
| Paper roll | `#f5e6d3` | Cream/off-white paper color |
| Paper roll shadow | `#c4b5a3` | Depth on paper rolls |
| Removed roll | `#8b7355` | Faded cardboard/removed |
| Accessible highlight | `#ff9f43` | Orange glow for accessible rolls |
| Scanning highlight | `#ffd93d` | Yellow for current scan position |
| Grid lines | `#3d3225` | Subtle warehouse floor grid |
| Text primary | `#f5e6d3` | Cream text |
| Text secondary | `#9a8b7a` | Muted info text |
| Accent (forklift) | `#e74c3c` | Red forklift indicators |
| Progress bar | `#27ae60` | Green progress fill |

## Visualization Metaphor

### Paper Rolls as Circles
Each `@` is rendered as a paper roll viewed from above — a cream-colored circle with a subtle shadow to suggest depth. Empty spaces are dark warehouse floor.

### Forklift Scan Beam
Each pass is visualized as a scanning beam (like a warehouse scanner or forklift headlights) sweeping across the grid. When the beam finds an accessible roll, it pulses with an orange glow.

### Removal Animation
When a roll is removed:
1. It glows orange (accessible).
2. A forklift icon or lifting animation appears briefly.
3. The roll fades out, leaving dark floor behind.

### Erosion Waves
The progressive removal creates a visual "erosion" effect — rolls vanish in waves from corners and edges, gradually revealing the stable core that cannot be reached.

## Motion Style

| Element | Motion |
|---------|--------|
| Scan beam | Horizontal sweep per row, repeating each pass |
| Accessible detection | Quick pulse/glow on discovery |
| Removal | Fade out with slight upward motion (lifted away) |
| Pass transition | Brief pause with pass counter increment |
| Final reveal | Gentle pulse on remaining rolls |

## Layout

```
+--------------------------------------------------+
|  Day 04: Printing Department          Pass: 12   |
|                                     Removed: 890 |
+--------------------------------------------------+
|                                                  |
|          [ Grid of paper rolls ]                 |
|          [ 140 x 135 cells ]                     |
|                                                  |
+--------------------------------------------------+
|  Progress: [===========>            ] 43/100     |
|  Total removed: 8890                             |
+--------------------------------------------------+
```

## Theme Guidance

- Use warm, muted colors to evoke a cozy warehouse.
- Paper rolls should look soft and rounded, not harsh.
- The removal process should feel satisfying — like watching puzzle pieces click away.
- The scanning beam adds dynamism without being overwhelming.
- Final state shows the "stable core" with a subtle celebratory glow.
