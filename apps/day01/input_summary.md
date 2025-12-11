# Input Summary — Day 1: Secret Entrance

## Puzzle Purpose
The puzzle simulates a circular dial safe with numbers 0-99. The solver must process a sequence of rotation instructions (Left/Right with distances) to determine how many times the dial passes through or lands on position 0.

## Puzzle Parts
- **Part 1**: Count times the dial lands exactly on 0 after completing a rotation
- **Part 2**: Count all times the dial points at 0, including during rotations (passes through)

## Solver Algorithm

### Key Constants
- `STARTING_POSITION`: 50 (initial dial position)
- `P`: 100 (total positions on the dial, 0-99)

### Algorithm Flow
1. Start at position 50
2. For each rotation instruction:
   - Parse direction (L or R) and distance
   - Calculate full turns: `distance / 100` (complete circles)
   - Calculate remainder: `distance % 100` (partial rotation)
   - **Part 2 specific**: Count passes through 0 during rotation
     - Add full_turns to password (each complete circle passes 0 once)
     - Check if partial rotation crosses 0:
       - Right turn crosses 0 if: `current_position > 100 - remainder`
       - Left turn crosses 0 if: `0 < current_position < remainder`
   - Update position based on direction
   - Check if final position equals 0 and increment password
3. Output final password count

### Important Evolving State
- **current_position**: The dial's current position (0-99)
- **password**: Running count of times dial points at 0
- **rotation_number**: Which instruction is being processed
- **turn_direction**: 'L' or 'R'
- **distance**: How far the dial rotates
- **passes_during_rotation**: Times 0 is crossed during this rotation
- **lands_on_zero**: Whether rotation ends exactly on 0

## Natural Visualization Steps
1. **Initial State**: Show dial at position 50
2. **Per Rotation**:
   - Show instruction (e.g., "L47")
   - Animate dial rotation from current to next position
   - Highlight each pass through 0 during rotation
   - Show if rotation lands on 0
   - Update password counter
3. **Final State**: Display total password count (6738 for part 2)

## Key Visualization Requirements
- Must visualize the **circular nature** of the dial (0-99 wrapping)
- Must distinguish between:
  - **Passing through 0** during rotation (part 2)
  - **Landing on 0** at the end of rotation
- Must show progression of password counter
- Should handle large distances (e.g., R1000 = 10 complete circles)
- Final result: **password = 6738** (from puzzle description)

## Visualization Insights
- The dial is circular, suggesting a circular/radial visualization
- Rotations can be very large (hundreds or thousands of clicks)
- Need to show both continuous rotation and discrete landing positions
- Password accumulation is the key metric to track
- Animation should emphasize when 0 is encountered
