# Visual Theme — Day 06: Trash Compactor

## Theme Inference

The puzzle takes place in a **garbage smasher** with a family of helpful **cephalopods** (octopus/squid). Key elements:

- Underwater/alien aquatic environment
- Helpful cephalopod creatures
- Math homework worksheet
- Reading right-to-left (unusual, alien perspective)
- Star Wars garbage compactor homage

## Mood and Style

- **Deep sea mysterious**: Dark, moody underwater tones
- **Bioluminescent accents**: Glowing, ethereal highlights
- **Playful intelligence**: Cephalopods are clever creatures
- **Homework aesthetic**: Grid paper, mathematical notation

## Color Palette

```javascript
const theme = {
  background: '#0d1520',          // Deep ocean black
  backgroundAccent: '#142233',    // Slightly lighter depths
  worksheetBg: '#1a2a3d',         // Grid paper in underwater tones
  gridLine: '#2d4a6a',            // Faint blue grid lines
  digitActive: '#06d6a0',         // Bioluminescent teal (active digits)
  digitInactive: '#3d6b8c',       // Muted blue (inactive)
  operatorPlus: '#ffd166',        // Warm amber for +
  operatorMult: '#ef476f',        // Coral pink for *
  resultHighlight: '#118ab2',     // Ocean blue for results
  numberAssembly: '#73d2de',      // Light cyan for number building
  tentacle: '#7b2d8e',            // Purple tentacle accent
  textPrimary: '#e8f4f8',         // Light seafoam white
  textSecondary: '#73a9c2',       // Muted cyan text
  accent: '#06d6a0',              // Primary accent (teal)
  progressBar: '#118ab2',         // Progress fill
  progressBg: '#1a2a3d',          // Progress background
  scanDirection: '#ffd166',       // Arrow/indicator for RTL scan
};
```

## Visual Metaphor: Underwater Homework Lab

Imagine a cephalopod's underwater study desk with a glowing worksheet. The visualization shows:

- **Worksheet grid**: A translucent grid paper floating in dark water
- **Bioluminescent digits**: Numbers glow with underwater light
- **Tentacle pointer**: Visual indicator showing current reading position
- **Right-to-left flow**: Animated scan direction from right to left
- **Number bubbles**: Results appear in floating bubble-like containers

## Rendering Approach

### Layout
- **Header**: Day title, current problem indicator
- **Main area**: Worksheet grid centered, large enough to read
- **Side panel**: Current calculation display
- **Footer**: Progress bar and running total

### Worksheet Visualization
- Grid displayed as translucent columns
- Active problem columns highlighted with glow
- Inactive columns dimmed
- Current column being read pulses

### Calculation Display
- Numbers build up as digits are read
- Operator appears prominently between numbers
- Result calculation animated
- Adds to running total with visual flourish

### Animation Style
- **Scan motion**: Smooth RTL sweep across problems
- **Digit reveal**: Fade-in from top to bottom within columns
- **Number assembly**: Digits slide into position
- **Result splash**: Brief glow/ripple effect when problem solved

### Motion Design
- Gentle floating/bobbing ambient motion
- Bioluminescent pulse on active elements
- Smooth easing for all transitions
- Subtle particle effects (bubbles, light motes)

## Storytelling Elements

1. **Opening**: Worksheet fades in from darkness, grid lines appear
2. **Reading**: Scan indicator moves right-to-left
3. **Problem focus**: Current problem columns brighten
4. **Calculation**: Numbers assemble, operation highlights, result appears
5. **Accumulation**: Result adds to running total
6. **Completion**: Grand total displayed with celebratory glow

## Typography

- Sans-serif for labels and titles
- Monospace for digits and calculations
- Large, bold display for the final answer
- Numbers should be clearly legible against dark background
