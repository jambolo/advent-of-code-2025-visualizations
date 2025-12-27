# Input Summary — Day 8: Playground

## Puzzle Purpose and Goals

The puzzle involves connecting junction boxes suspended in a 3D playground space. The goal is to connect junction boxes with light strings, prioritizing the shortest distances, until all boxes form a single unified circuit.

- **Part 1**: Connect the 1000 closest pairs of junction boxes and find the product of the three largest circuit sizes.
- **Part 2**: Continue connecting until all junction boxes form one circuit; report the product of the X coordinates of the final connection's endpoints.

## Input Structure

- 1000 junction boxes, each specified as `x,y,z` coordinates in 3D space
- Coordinates range from approximately 0 to 100,000 in each dimension
- Each line represents one junction box position

## Solver Algorithm

### Algorithm Overview (Union-Find / Kruskal's MST variant)

1. **Parse Input**: Load all junction box 3D coordinates into a list
2. **Compute All Pairwise Distances**: Calculate Euclidean distances between every pair of junction boxes, storing `((i, j), distance)`
3. **Sort by Distance**: Sort all pairs by ascending distance
4. **Initialize Circuits**: Each junction box starts in its own circuit (singleton)
5. **Greedy Connection Loop**:
   - Iterate through sorted distances
   - For each pair, check if the two boxes are in different circuits
   - If different: merge the circuits (union operation)
   - If same: skip (connection would be redundant)
   - Continue until all boxes are in one circuit
6. **Record Final Connection**: The last connection that merges two circuits into one is the answer

### Evolving State

- **Circuits**: A list of sets, where each set contains junction box indices belonging to that circuit
- **Connection Count**: Number of successful connections made
- **Current Edge**: The pair being evaluated
- **Circuit Merges**: When two circuits combine, their visual representations should merge

## Natural Visualization Steps

1. **Initial State**: Display all 1000 junction boxes in 3D space as individual points, each in its own circuit (distinct colors)
2. **Distance Evaluation**: Highlight the current pair being considered
3. **Connection Events**:
   - **Successful Connection**: Draw a light string between boxes, merge circuit colors
   - **Skipped Connection**: Brief flash indicating boxes already connected (optional)
4. **Circuit Growth**: As circuits merge, their member boxes adopt a unified color
5. **Final Connection**: Dramatic highlight of the last edge that unifies all circuits
6. **Result Display**: Show the final answer prominently

## What the Viewer Must See

### Process Understanding
- Junction boxes positioned in 3D space (projected to 2D with depth cues)
- Light strings appearing between connected boxes
- Circuits growing and merging through color unification
- Progress indicator showing connections made vs. total needed

### Final Result
- The complete spanning tree of light strings
- The final connection highlighted distinctly
- The two junction boxes of the final connection emphasized
- The X coordinates and their product displayed
