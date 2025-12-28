# Input Summary — Day 9: Movie Theater

## Puzzle Purpose and Goals

The puzzle takes place in a North Pole movie theater with a tile floor grid. The goal is to find the largest rectangle that can be formed using red tiles as opposite corners.

**Part 1**: Given a list of red tile coordinates forming a closed loop, find the largest rectangle where any two red tiles serve as opposite corners.

**Part 2**: The red tiles are connected by green tiles forming a closed polygon. Any rectangle must be fully contained within (or on the boundary of) this red-green region. Find the largest such rectangle using red tiles as opposite corners.

## Input Structure

- 496 coordinate pairs defining red tile positions
- Coordinates range from approximately (1537, 1542) to (98121, 98218)
- The red tiles form a closed loop (first connects to last)
- Adjacent tiles in the list share either the same row or column (rectilinear polygon)

## Solver Algorithm

1. **Parse corners**: Load all red tile coordinates from input
2. **Build edges**: Create edges connecting consecutive corners (wrapping from last to first)
3. **Normalize edges**: Order vertices so smaller coordinate comes first
4. **Separate horizontal edges**: Filter edges where y-coordinates are equal
5. **Generate candidate rectangles**: For each pair of corners (i, j), form a potential rectangle
6. **Part 2 containment check**:
   - Verify no polygon edge crosses through the rectangle interior
   - Use ray-casting to confirm rectangle interior is inside the polygon
7. **Find maximum**: Sort rectangles by area and return the largest

## Evolving State

- Current pair of corners being evaluated
- Whether the rectangle is valid (Part 2: containment check)
- Computed area for valid rectangles
- Current best rectangle and its area
- Progress through all corner pairs

## Natural Visualization Steps

1. **Initial display**: Show the polygon formed by all red corners and green edges
2. **Pair evaluation**: Highlight the current corner pair being tested
3. **Rectangle formation**: Draw the candidate rectangle
4. **Containment test** (Part 2): Show the test point and ray-casting result
5. **Validity indication**: Color the rectangle based on pass/fail
6. **Best tracking**: Highlight when a new best rectangle is found
7. **Final result**: Emphasize the winning rectangle and its area

## What the Viewer Must See

- The full polygon boundary (red corners, green connecting edges)
- The interior region (green tiles)
- Each candidate rectangle as it's evaluated
- Clear visual feedback for valid vs. invalid rectangles
- The current best rectangle highlighted distinctly
- Running count of rectangles tested
- The final answer (largest area) prominently displayed
- Progress indicator showing completion percentage
