# Input Summary - Day 10: Factory

## Puzzle Purpose and Goals

The puzzle involves configuring factory machines by pressing buttons to achieve target joltage levels. Each machine has:
- A set of **buttons**, where each button affects specific joltage counters
- A set of **joltage requirements** (target values for each counter)
- Counters start at zero; goal is to reach exact target values

**Part 2 Goal:** Find the minimum total button presses across all machines to configure their joltage counters to match requirements.

## Solver Algorithm

The solver uses **Integer Linear Programming (ILP)** via the coin_cbc solver:

1. **Parse Input:** Each line defines a machine with buttons and joltage requirements
2. **Model as Matrix Equation:** XB = J
   - X: vector of button press counts (unknowns, must be non-negative integers)
   - B: button matrix (m buttons × n counters), binary values indicating which counters each button affects
   - J: joltage requirement vector (target values)
3. **Minimize:** Sum of all elements in X (total button presses)
4. **Solve:** Use ILP to find optimal X for each machine
5. **Aggregate:** Sum minimum presses across all 180 machines

### Evolving State

- Per-machine: Current joltage levels, button press counts
- Global: Running total of minimum presses, machines solved

## Natural Visualization Steps

1. **Machine Selection:** Highlight the current machine being solved
2. **Problem Setup:** Display the button matrix and joltage requirements
3. **ILP Solving:** Show the optimization process (abstractly, as finding optimal button combination)
4. **Solution Found:** Reveal optimal button presses, animate joltage counters reaching targets
5. **Machine Complete:** Show final button press count, add to running total
6. **Final Result:** Display total minimum presses (18387)

## Viewer Must See

### Process Understanding
- How buttons map to joltage counters (the wiring)
- Button press counts being optimized
- Counters incrementing toward targets
- Multiple machines being processed sequentially

### Final Result
- Per-machine minimum press count
- Running total across all machines
- Final answer prominently displayed
