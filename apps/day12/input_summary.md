# Input Summary - Day 12: Christmas Tree Farm

## Puzzle Purpose and Goals

The puzzle involves fitting oddly-shaped presents under Christmas trees. Given:
- 6 standard present shapes (each 3x3 grid with some cells filled)
- Multiple tree regions with different dimensions
- Each region specifies how many of each present shape must fit

The goal is to count how many regions can accommodate all their required presents.

## Solver Algorithm

The Rust solver uses a heuristic two-pass approach:

1. **Area-based rejection**: Calculate total area of all required presents. If it exceeds region area, the region is immediately rejected (presents cannot possibly fit).

2. **Slot-based acceptance**: Since all shapes fit within a 3x3 bounding box, count how many non-overlapping 3x3 slots exist in the region. If the number of presents ≤ number of slots, the region is accepted (each present guaranteed a home).

3. **Undetermined**: Regions that pass neither test remain undetermined (the solver doesn't fully solve the packing problem).

### Evolving State

- Counter of rejected regions
- Counter of accepted regions
- Current region being evaluated
- Comparison values (total present area vs region area, present count vs slot count)

## Natural Visualization Steps

1. **Show present shapes**: Display all 6 present shape definitions
2. **For each region**:
   - Show the empty region grid with dimensions
   - Display the required presents for this region
   - Show the area comparison (present area vs region area)
   - If rejected: animate rejection indicator
   - If not rejected: show slot calculation (3x3 grid overlay)
   - If accepted: animate acceptance indicator
   - If undetermined: show undetermined state
3. **Final tally**: Display accepted/rejected/undetermined counts

## What the Viewer Must See

- The 6 present shapes with their distinct patterns
- Each region's dimensions and required presents
- The decision logic: area comparison leading to rejection OR slot counting leading to acceptance
- Running totals of accepted/rejected/undetermined
- Final result prominently displayed
