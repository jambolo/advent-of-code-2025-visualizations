# Input Summary — Day 05: Cafeteria

## Puzzle Purpose

The Elves in the kitchen need to determine how many ingredient IDs are considered fresh. The puzzle input is a database consisting of:

1. **Fresh ingredient ID ranges** (first section): Lines like `3-5` meaning IDs 3, 4, and 5 are fresh
2. **Available ingredient IDs** (second section, Part 1 only): Individual IDs to check

## Part 2 Goal

For Part 2, ignore the individual ingredient IDs. Instead, count the **total number of unique fresh ingredient IDs** covered by all the ranges. Since ranges can overlap, overlapping IDs should only be counted once.

**Answer: 353,716,783,056,994** unique fresh ingredient IDs.

## Solver Algorithm

The Part 2 algorithm performs **range merging**:

1. **Sort ranges** by their start value
2. **Merge overlapping ranges**: If the current range's start is within the previous range's end, extend the previous range
3. **Sum the sizes** of all merged ranges to get the total count

### Evolving State

- **Input ranges**: 182 ranges with very large values (trillions scale)
- **Sorted ranges**: Same ranges reordered by start value
- **Merged ranges**: Fewer ranges after combining overlaps
- **Final count**: Sum of (end - start + 1) for each merged range

## Visualization Steps

1. **Initial State**: Show all 182 input ranges as unsorted segments
2. **Sorting Phase**: Animate ranges rearranging by start position
3. **Merging Phase**: Step through sorted ranges, merging overlaps
   - Highlight current range being processed
   - Show merge operations when overlaps occur
   - Display running count of merged ranges
4. **Summation Phase**: Calculate and display final total
5. **Final Result**: Show the answer prominently

## What the Viewer Must See

- The conceptual number line (normalized for display)
- Individual ranges as segments on this line
- The sorting transformation
- Each merge operation clearly animated
- Overlapping regions highlighted during merge
- Running total of fresh IDs
- Final answer: 353,716,783,056,994
