# Emission Rules — Day 06: Trash Compactor

## Overview

The instrumentation captures the right-to-left column-reading algorithm for cephalopod math. The worksheet contains multiple problems, each solved by reading columns from right to left.

## Phases and Events

### Phase 1: Initial State
**Emit once** before any processing.
- Capture the raw worksheet as a 2D character grid
- Include dimensions (rows, columns)
- List all problems with their column ranges

### Phase 2: Problem Processing
**Emit for each problem** as it is processed (right-to-left order).
- Problem index (counting from right, starting at 0)
- Column range for this problem
- Numbers extracted from columns
- Operation for this problem
- Calculated result
- Running total after this problem

### Phase 3: Final State
**Emit once** when all problems are complete.
- Final grand total
- Total problem count
- Summary statistics

## Frame Sampling Strategy

The number of problems depends on the input width. Assuming ~50-100 problems, this yields a manageable frame count.

**Estimated frame counts:**
- Initial: 1 frame
- Problem steps: ~50-100 frames (one per problem)
- Final: 1 frame

**Total: ~52-102 frames**

At ~0.5 seconds per frame at 2x speed, this yields ~25-50 seconds of animation.

If there are significantly more problems:
- Sample every Nth problem to keep under 150 frames
- Always include first and last problem
- Emit intermediate problems at regular intervals

## State to Track

### Per Worksheet
- `grid`: 2D array of characters
- `rows`: Number of rows
- `cols`: Number of columns
- `problem_count`: Total problems identified

### Per Problem
- `problem_index`: Index from right (0 = rightmost)
- `column_start`: Starting column (inclusive)
- `column_end`: Ending column (inclusive)
- `numbers`: Array of extracted numbers (as strings for i64)
- `operator`: "+" or "*"
- `result`: Calculated result (as string)
- `running_total`: Sum so far (as string)

### Final Summary
- `grand_total`: Final answer (10,227,753,257,799)
- `problem_count`: Total problems solved

## Progress Indicators

- **Problem progress**: `current_problem_index / total_problems`
- **Column position**: Visual scan position from right to left
- **Running total**: Displayed and growing

## Visual Emphasis Points

1. **Current problem highlight**: Columns being read glow
2. **RTL direction**: Arrow or indicator showing scan direction
3. **Number assembly**: Digits coalescing into numbers
4. **Operation emphasis**: + or * prominently displayed
5. **Result reveal**: Answer appears with emphasis
6. **Grand total**: Final answer with celebration effect

## Normalization for Display

The worksheet should be displayed at a readable size:
- If too wide, use horizontal scrolling/panning
- Keep font size legible
- Highlight active region prominently

The JSON should include:
- `grid_display_width`: Suggested display width
- `visible_start_col`: For panning display
