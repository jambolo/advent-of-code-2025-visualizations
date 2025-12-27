# Input Summary - Day 7: Laboratories

## Puzzle Purpose and Goals

The puzzle simulates a **quantum tachyon manifold** used in a teleporter system. A tachyon beam enters from a source point (S) and travels downward through a grid. When the beam encounters a splitter (^), it splits into two beams going left and right.

**Part 1**: Count the total number of splitter encounters (21 in the example, 1630 for the actual input).

**Part 2** (visualized): Apply the "many-worlds interpretation" where each splitter creates a timeline fork. A single particle takes *both* paths at each splitter, creating parallel timelines. The goal is to count the total number of distinct timelines when the particle finishes all possible journeys (40 in the example, 47,857,642,990,160 for the actual input).

## Solver Algorithm (Part 2)

The algorithm processes the grid row by row:

1. **Initialize**: Find the source position (S), start with 1 timeline at that column position.
2. **Row-by-row processing**: For each row after the source:
   - Each active beam position is checked for splitters (^)
   - If a splitter is found at position x with N timelines:
     - Remove the beam at x
     - Add N timelines to position x-1 (left)
     - Add N timelines to position x+1 (right)
   - If positions overlap, their timeline counts merge (sum together)
3. **Final count**: Sum all timeline counts across all remaining beam positions.

### Evolving State

- A HashMap of column positions to timeline counts
- Each position represents "beams" at that column, with associated timeline multiplicity
- Timeline counts grow exponentially as splits accumulate
- Beams can merge when two beams reach the same column

## Natural Visualization Steps

1. **Source detection**: Highlight the starting position (S)
2. **Beam descent**: Show beams traveling downward through empty space
3. **Split events**: Animate the splitting at each ^ splitter
4. **Timeline branching**: Visualize timeline count increases at each split
5. **Beam merging**: Show when multiple timelines converge at the same position
6. **Final state**: Display all final beam positions and the total timeline count

## What the Viewer Must See

### Process Understanding
- The grid layout with splitters clearly visible
- Active beam positions with their timeline counts
- The splitting animation when beams hit splitters
- Timeline numbers growing as splits accumulate
- Visual indication of timeline merging

### Final Result
- Total number of timelines prominently displayed
- Final beam positions across the bottom
- A sense of the exponential growth that occurred
