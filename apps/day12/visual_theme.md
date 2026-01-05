# Visual Theme - Day 12: Christmas Tree Farm

## Theme and Mood

The puzzle is set in a festive Christmas tree farm cavern where elves are frantically decorating before a deadline. The mood is:
- **Festive and warm**: Christmas colors, cozy atmosphere
- **Playful tension**: Racing against time to fit presents
- **Magical**: The cavern is "well-lit" suggesting warm glowing lights

## Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Background | Deep forest green | #1a2f1a |
| Region grid | Soft snow white | #f5f5f0 |
| Grid lines | Light pine | #3d5c3d |
| Present shape 0 | Crimson red | #dc143c |
| Present shape 1 | Royal gold | #ffd700 |
| Present shape 2 | Pine green | #228b22 |
| Present shape 3 | Silver | #c0c0c0 |
| Present shape 4 | Candy cane pink | #ff69b4 |
| Present shape 5 | Ice blue | #87ceeb |
| Accepted indicator | Bright green glow | #00ff7f |
| Rejected indicator | Warm red | #ff4444 |
| Undetermined | Amber warning | #ffaa00 |
| Text | Warm white | #fffaf0 |
| Accent/highlights | Twinkling gold | #ffd700 |

## Visualization Metaphor

**Gift-Wrapping Station**: The visualization represents a magical gift-sorting station where presents slide onto conveyor regions under trees.

- **Regions** appear as wooden gift boxes/platforms viewed from above
- **Present shapes** are colorful wrapped gifts with distinct patterns
- **Acceptance** shows presents glowing with approval, a checkmark ribbon appears
- **Rejection** shows a gentle "X" with presents fading back
- **Slot grid** appears as a helpful guide grid (like wrapping paper lines)

## Motion Style

- **Smooth easing**: Presents slide in with ease-out motion
- **Gentle pulses**: Accepted regions pulse with warm glow
- **Fade transitions**: Rejected regions fade with a slight shake
- **Tally counters**: Numbers increment with a satisfying "click" animation
- **Sparkles**: Occasional particle effects for festive feel

## Rendering Approach

- Grid-based rendering for regions and shapes
- Each present shape rendered with its signature color and subtle pattern
- Drop shadows for depth on present shapes
- Rounded corners on grid cells for softer look
- Area/slot comparisons shown as animated bar charts or numeric displays

## Emphasis and Storytelling

1. **Introduction**: Brief display of all present shapes with their colors
2. **Per-region drama**: Build tension with area calculation, release with verdict
3. **Progress tracking**: Side panel showing running totals
4. **Finale**: All three counters displayed prominently with the answer highlighted
