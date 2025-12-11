# Visual Theme — Day 1: Secret Entrance

## Theme Derivation from Puzzle
The puzzle describes a **safe with a circular dial** at the secret entrance to the North Pole base. Key imagery:
- Security/safe cracking
- Circular dial with numbers 0-99
- Physical rotation mechanism with clicking sounds
- North Pole winter setting
- Secret entrance with decoy security

## Theme Object

### Colors
```
background: #0a0f1a (deep night blue - secure vault interior)
dialOuter: #2a3f5f (steel blue - safe metal)
dialInner: #1a2332 (darker center)
dialMarker: #ff3366 (bright red - the arrow indicator)
numberActive: #66d9ff (bright cyan - active position)
numberNormal: #4a5f7f (muted blue-gray - inactive numbers)
zero: #ffcc00 (gold - the target, like treasure)
trail: #ff336680 (semi-transparent red - rotation path)
passGlow: #ffcc0040 (gold glow - when passing/landing on 0)
textPrimary: #e0e8f0 (light blue-white)
textAccent: #66d9ff (cyan)
highlight: #ff3366 (red accent)
success: #00ff88 (bright green - achievement)
```

### Style
- **Clean, technical aesthetic** like a security interface
- **Glowing effects** for active elements and 0-crossings
- **Motion blur or trails** during rapid rotations
- **Monospace font** for technical readability
- **Subtle shadows** for depth
- **Radial gradients** on the dial for metallic appearance

### Mood
- Precise and mechanical
- Suspenseful (cracking a safe)
- Technical/analytical
- Satisfying click-by-click progress
- Triumphant when reaching 0

## Visualization Metaphor

### Primary: **Circular Dial Combination Lock**
A top-down view of a circular safe dial, reminiscent of a combination lock or rotary phone.

**Components**:
1. **Outer Ring**: Numbers 0-99 arranged in a circle
2. **Center Dial**: Rotating element with an arrow/marker
3. **Zero Position**: At the "top" (12 o'clock), highlighted in gold
4. **Rotation Animation**: Smooth rotation showing direction (L/R)
5. **Trail Effect**: Visual path showing recent rotation
6. **Glow/Flash**: When dial passes or lands on 0

### Secondary Elements:
- **Counter Display**: Large, prominent password counter
- **Instruction Display**: Current rotation command (e.g., "L47")
- **Stats Panel**: Rotation number, total rotations, progress
- **Pass Indicator**: Visual cue when crossing 0 mid-rotation
- **Land Indicator**: Special effect when ending exactly on 0

## How Theme + Metaphor Guide Rendering

### Layout
```
┌─────────────────────────────────────┐
│  Day 1: Secret Entrance             │
│                                     │
│     [Password: 1234] ← Large!       │
│                                     │
│        ┌─────────┐                  │
│        │    0    │ ← Gold highlight │
│     99 │    ↓    │ 1                │
│        │  ●━━━   │   ← Dial center  │
│     98 │         │ 2    with arrow  │
│        │         │                  │
│        └─────────┘                  │
│                                     │
│  Instruction: R26                   │
│  Rotation: 42 / 1000                │
│  Passes: 5  Lands: 2                │
└─────────────────────────────────────┘
```

### Rendering Decisions

1. **Dial Rotation**: 
   - Animate arrow smoothly from old to new position
   - Use easing for natural mechanical feel
   - Show direction clearly (clockwise = R, counter-clockwise = L)

2. **Zero Encounters**:
   - **Pass through**: Brief gold flash/glow on the 0 marker
   - **Land on**: Sustained glow + particle burst effect
   - Increment counter with visual feedback

3. **Large Distances**:
   - For distances > 200, show accelerated rotation with motion blur
   - Display "×10 revolutions" or similar for very large distances
   - Maintain clear visual of each 0-crossing despite speed

4. **Color Application**:
   - Background: dark vault interior
   - Dial: metallic with gradient
   - Active number: bright cyan highlight
   - Zero: always gold, glows on contact
   - Arrow: bright red for visibility

5. **Typography**:
   - Password counter: Large, bold, monospace
   - Instruction: Medium, clear
   - Stats: Smaller, informational

### Animation Principles
- **Smooth rotation**: Use interpolation for fluid dial movement
- **Emphasized moments**: Slow down or pause when landing on 0
- **Visual rhythm**: Match the "clicking" nature of the dial
- **Clear progression**: Password counter updates are obvious
- **Satisfying feedback**: Each 0-encounter feels rewarding
