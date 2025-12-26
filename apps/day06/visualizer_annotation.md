# Visualizer Annotation — Day 06: Trash Compactor

## Architecture

The visualizer is built as a single TypeScript module that:
1. Loads a JSON log file containing the cephalopod math processing steps
2. Renders each frame to a 720p canvas
3. Supports playback speed control and WebM recording

### Class Structure

- `TrashCompactorVisualizer`: Main class handling rendering and animation
  - Maintains frame state and playback position
  - Handles canvas rendering with themed visuals
  - Manages MediaRecorder for WebM export

## Theme Influence

The underwater/cephalopod theme drives several visual decisions:

- **Color palette**: Deep ocean blues (#0d1520, #142233) with bioluminescent teal accents (#06d6a0)
- **Particle effects**: Subtle floating particles suggest underwater environment
- **Glow effects**: Active elements have soft glow reminiscent of bioluminescence
- **Operator colors**: Plus is warm amber (#ffd166), multiply is coral (#ef476f) — distinct underwater tones

## Rendering Approach

### Layout
- **Header** (80px): Title, phase indicator, running total
- **Main area**: Split between worksheet grid (left) and calculation panel (right)
- **Footer** (90px): Progress bar and stats

### Worksheet Display
- Character grid with visible cell boundaries
- Active problem columns highlighted with glow effect
- Right-to-left reading indicator (arrow and text)
- Operators colored distinctly from digits

### Calculation Panel
- Shows current problem's numbers stacked vertically
- Operator displayed between numbers
- Result with emphasis glow
- Running total tracking

## Resolution Choice

**720p (1280x720)** selected for:
- Adequate space for worksheet grid even with many columns
- Clear text legibility for digits and calculations
- Good balance of detail and file size for WebM
- Matches previous day visualizers for consistency

## WebM Recording Workflow

1. User clicks "Record WebM" button
2. Canvas stream captured at 60fps
3. MediaRecorder initialized with vp9 → vp8 → generic WebM fallback
4. Playback starts automatically if not already playing
5. On completion, recording blob is saved as `day06-trash-compactor.webm`

## Frame Timing

- Base frame duration: 600ms (slower than Day 5 to allow reading)
- Adjustable via speed selector (0.5x to 5x)
- Default speed: 2x for comfortable viewing
