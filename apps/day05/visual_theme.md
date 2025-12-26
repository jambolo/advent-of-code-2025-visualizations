# Visual Theme — Day 05: Cafeteria

## Theme Inference

The puzzle takes place in a **cafeteria kitchen** with an inventory management theme. Key elements:

- **Fresh ingredients** vs spoiled ones
- Kitchen/food service environment
- Organizational/database management
- Christmas season context

## Mood and Style

- **Warm and appetizing**: Kitchen warmth with food-safe greens
- **Clean and organized**: Reflecting inventory management
- **Playful freshness**: Fresh = good, with lively colors

## Color Palette

```javascript
const theme = {
  background: '#1a2420',        // Dark kitchen counter
  backgroundAccent: '#243028', // Slightly lighter accent
  freshRange: '#4ade80',        // Bright fresh green
  freshRangeAlt: '#22c55e',    // Alternate green for variety
  mergedRange: '#86efac',      // Light green for merged
  overlapHighlight: '#fbbf24', // Amber for overlap detection
  sortingHighlight: '#60a5fa', // Blue during sort phase
  numberLine: '#475569',       // Slate gray for axis
  textPrimary: '#f0fdf4',      // Light green-white
  textSecondary: '#86efac',    // Muted green
  accent: '#4ade80',           // Primary accent
  progressBar: '#22c55e',      // Fresh green progress
  progressBg: '#1e3a2f',       // Dark green background
};
```

## Visual Metaphor: Ingredient Freshness Timeline

Imagine a **freshness timeline** where each range represents a batch of fresh ingredients. The visualization shows:

- **Number line**: A horizontal axis representing ingredient IDs (normalized)
- **Range bars**: Green horizontal bars showing fresh ID ranges
- **Stacking**: Ranges stack vertically before sorting
- **Merging animation**: Overlapping ranges combine into single bars
- **Freshness meter**: Running count of total fresh IDs

## Rendering Approach

### Layout
- **Header**: Day title, current phase indicator
- **Main area**: Horizontal number line with range bars above/below
- **Footer**: Progress bar and running totals

### Range Visualization
- Ranges appear as rounded horizontal bars
- Color intensity indicates range size
- Overlapping regions glow amber during merge detection
- Merged ranges pulse briefly to show combination

### Animation Style
- **Sort phase**: Ranges slide smoothly to sorted positions
- **Merge phase**: Overlapping ranges blend together
- **Count phase**: Numbers cascade up as totals accumulate

### Motion Design
- Smooth easing for all transitions
- Brief pauses at key moments (merge events)
- Subtle particle effects for merge operations

## Storytelling Elements

1. **Opening**: Display all ranges scattered (as read from input)
2. **Organization**: Ranges sort by start position
3. **Consolidation**: Watch overlaps merge one by one
4. **Resolution**: Final merged ranges glow, total revealed
5. **Celebration**: Answer displays with kitchen-themed flourish

## Typography

- Sans-serif for readability
- Large, bold numbers for the final answer
- Monospace hints for ID values where shown
