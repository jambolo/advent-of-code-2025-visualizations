# Visual Theme — Day 9: Movie Theater

## Theme Inference

The puzzle is set in a **movie theater** with a **tile floor**. This evokes:
- Art deco cinema aesthetics from the golden age of Hollywood
- Geometric tile patterns reminiscent of grand theater lobbies
- Rich, warm colors typical of classic movie palaces
- A sense of elegance and entertainment

## Mood and Style

- **Nostalgic glamour**: Classic cinema atmosphere
- **Geometric precision**: Clean lines and sharp tile edges
- **Warm luminosity**: Theater lighting with spotlight effects
- **Playful discovery**: The excitement of finding the "best seat in the house"

## Theme Object

### Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Deep burgundy | `#2D1B2E` | Theater carpet/walls |
| Polygon interior | Warm gold | `#C9A227` | Green tiles (rendered as gold) |
| Polygon boundary | Cream white | `#F5E6C8` | Edge lines |
| Red corners | Ruby red | `#B22234` | Corner markers |
| Candidate rectangle | Soft pink | `#E8B4B8` | Current test rectangle |
| Valid rectangle | Emerald | `#2E8B57` | Passed containment |
| Invalid rectangle | Dim gray | `#4A4A4A` | Failed containment |
| Best rectangle | Brilliant gold | `#FFD700` | Current champion |
| Text | Ivory | `#FFFFF0` | Labels and stats |
| Accent | Film reel silver | `#C0C0C0` | Decorative elements |

### Shapes

- **Corners**: Diamond/rhombus shapes (like theater seat markers)
- **Polygon**: Filled region with subtle tile grid texture
- **Rectangles**: Rounded corners with soft glow
- **Decorative**: Film strip border, art deco corner flourishes

### Motion Style

- **Smooth transitions**: Ease-in-out for rectangle appearances
- **Spotlight effect**: New best rectangles get a "spotlight" pulse
- **Curtain reveal**: Final result appears with theatrical flourish
- **Steady progression**: Calm, methodical evaluation pace

## Visualization Metaphor

**"Finding the Best Screen in the Multiplex"**

The polygon represents the theater floor plan, and we're searching for the largest rectangular screen that fits within the available space. Each candidate rectangle is a potential screen being evaluated.

- Red corners = architectural support columns
- Gold interior = premium seating area
- Tested rectangles = proposed screen placements
- Best rectangle = the winning screen installation

## Rendering Approach

1. **Base layer**: Draw polygon interior with subtle tile grid pattern
2. **Boundary layer**: Cream-colored polygon outline with corner diamonds
3. **Candidate layer**: Semi-transparent rectangle being tested
4. **Best layer**: Glowing gold rectangle showing current champion
5. **UI layer**: Film-strip styled stats panel with current progress

## Motion and Emphasis

- **New candidate**: Fade in from transparent to visible
- **Valid check**: Quick pulse of green before settling
- **Invalid check**: Brief red flash then fade to gray
- **New best**: Spotlight animation radiating outward
- **Final reveal**: All other elements dim, winner pulses with golden glow

## Storytelling

1. **Opening**: Camera zooms into theater floor plan
2. **Search phase**: Methodically testing screen placements
3. **Discovery moments**: Excitement when finding larger valid screens
4. **Climax**: The largest valid rectangle is crowned
5. **Finale**: Stats display with theatrical "The End" flourish
