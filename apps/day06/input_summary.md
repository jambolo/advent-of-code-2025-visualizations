# Input Summary — Day 06: Trash Compactor

## Puzzle Purpose

You've fallen into a garbage smasher and encounter a family of cephalopods. While waiting for them to open the sealed door, you help the youngest cephalopod with her math homework worksheet.

## Part 2 Goal

Cephalopod math is written right-to-left in columns. Each number occupies a single column, with the most significant digit at the top and least significant at the bottom. Problems are separated by blank columns, with the operation (+/*) at the bottom.

Reading the worksheet correctly using cephalopod reading rules, calculate each problem and sum all results.

**Answer: 10,227,753,257,799**

## Solver Algorithm

The Part 2 algorithm:

1. **Parse columns**: Read the worksheet character by character, grouping into columns
2. **Identify problems**: Separate problems by blank columns
3. **Read right-to-left**: Process problems from rightmost to leftmost
4. **Reconstruct numbers**: For each column within a problem, digits read top-to-bottom form the number (MSD at top)
5. **Extract operation**: The bottom row contains the operator (+/*)
6. **Calculate**: Apply operation to all numbers in the problem
7. **Sum**: Add all problem results for the grand total

### Evolving State

- **Raw worksheet**: 2D grid of characters
- **Parsed columns**: Identified column groupings
- **Current problem**: Numbers and operator being processed
- **Problem result**: Calculated answer for current problem
- **Running total**: Accumulating sum of all problem results

## Visualization Steps

1. **Initial State**: Display the worksheet grid with columns visible
2. **Right-to-Left Scan**: Highlight current problem being read (from right side)
3. **Column Reading**: Show digits being extracted from each column (top to bottom)
4. **Number Assembly**: Animate digits combining into numbers
5. **Operation Display**: Show the operator and calculation
6. **Result**: Display problem result, add to running total
7. **Final State**: Show grand total prominently

## What the Viewer Must See

- The worksheet as a grid of characters
- Visual grouping of problems (separated by blank columns)
- Right-to-left reading direction indicated
- Numbers being assembled from column digits
- Each calculation and its result
- Running total accumulating
- Final answer: 10,227,753,257,799
