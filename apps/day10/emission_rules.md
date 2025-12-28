# Emission Rules - Day 10: Factory

## When to Emit Conceptual Steps

### Machine-Level Events
1. **Machine Start:** When solver begins processing a new machine
2. **Solution Found:** When ILP solver returns optimal button press counts
3. **Machine Complete:** After solution is displayed and added to total

### Animation Events (per machine)
1. **Button Press Sequence:** Emit each button press as the solution is "executed"
2. **Counter Updates:** Emit as counters increment from button presses
3. **Target Reached:** Emit when all counters match requirements

## Frame-Worthy State Changes

### High-Priority (always emit)
- New machine selected
- Optimal solution found for a machine
- Machine configuration complete (all counters at target)
- Final total calculated

### Medium-Priority (sample as needed)
- Individual button press animation frames
- Counter increment steps
- Wire pulse animations

### Low-Priority (aggressive sampling)
- Idle frames between machines
- Celebration particle frames

## Frame Sampling Strategy

### Constraints
- 180 machines to process
- Target: under 5 minutes at 30fps = max 9000 frames
- Budget: ~50 frames per machine average

### Sampling Rules

**Per Machine (budget: 40-60 frames)**
1. Machine intro: 5 frames (slide in, highlight)
2. Problem display: 10 frames (show buttons, wiring, targets)
3. Solution reveal: 5 frames (show optimal press counts)
4. Button animation: 10-20 frames (sample button presses, max 2 frames per distinct button)
5. Counter animation: 5-10 frames (show final counter values reaching targets)
6. Completion: 5 frames (success indicator, add to total)

**Adaptive Sampling**
- Machines with fewer buttons (< 5): Full animation, ~40 frames
- Machines with many buttons (> 8): Compressed animation, ~50 frames
- Machines with high press counts (> 20 total): Show summary instead of individual presses

**Global Events**
- Opening sequence: 30 frames (factory overview)
- Closing sequence: 60 frames (all machines lit, final answer reveal)

### Total Frame Estimate
- 180 machines × 50 avg = 9000 frames
- Opening + closing = 90 frames
- Total: ~9090 frames = ~5 minutes at 30fps

If over budget, reduce per-machine animation frames to 35-40.

## Progress Visualization

### Per-Machine Progress
- Horizontal progress bar below machine panel
- Fills as button presses are animated
- Turns gold when configuration matches target

### Global Progress
- Industrial production counter (top-right)
- Shows: "Machines: XX/180"
- Running total of button presses

### Visual Cues for Completion
- Individual machine: Panel border glows gold, "ONLINE" indicator lights
- All machines: Factory-wide glow pulse, celebratory particles
- Final answer: Large 7-segment display animation counting up to 18387
