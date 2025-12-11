# Emission Rules — Day 1: Secret Entrance

## Overview
The solver processes 1000 rotation instructions. Each rotation may involve:
- Multiple complete circles (distance / 100)
- A partial rotation (distance % 100)
- Multiple passes through position 0
- A potential landing on position 0

To create a ≤5-minute animation at 30fps, we need intelligent frame emission.

## Conceptual Steps Requiring Emission

### 1. Initial State
**When**: At the very start
**What to emit**: 
- Starting position (50)
- Initial password count (0)
- Rotation 0 of N total

### 2. Start of Each Rotation
**When**: Before processing each instruction
**What to emit**:
- Current dial position
- Instruction being processed (direction + distance)
- Current password count
- Rotation number
- Preview: expected passes and landing

### 3. Zero Passes During Rotation
**When**: Dial crosses position 0 mid-rotation
**What to emit**:
- Current position (0 or approximate)
- Pass event flag
- Updated password count
- Rotation progress

### 4. End of Each Rotation
**When**: After completing rotation, before next instruction
**What to emit**:
- Final position after rotation
- Whether it landed on 0
- Updated password count
- Summary: passes during this rotation

### 5. Final State
**When**: After all rotations complete
**What to emit**:
- Final dial position
- Final password count (6738)
- Total rotations processed
- Completion flag

## Frame Emission Strategy

### Frame Types

#### Type A: Full Detail Frames
For rotations with "interesting" events:
- Lands on 0
- Passes through 0
- Small distances (< 50) where every click can be shown
- First 50 rotations (establish pattern)
- Last 50 rotations (build to conclusion)

**Emit**: Start frame + pass frames + end frame

#### Type B: Summarized Frames
For routine rotations:
- No zero encounters
- Medium distances (50-200)

**Emit**: Start frame + end frame only

#### Type C: Heavily Sampled Frames
For very large rotations:
- Distances > 200
- Multiple complete circles

**Emit**: Start frame + sampled positions (show progress) + end frame

### Sampling Strategy

**Target**: 5 minutes × 60 seconds × 30fps = 9,000 frames maximum

**Input analysis**:
- 1000 rotations total
- Average ~6-7 frames per rotation needed
- Some rotations need more detail (zero encounters), some need less

**Adaptive Sampling Algorithm**:

```
For each rotation:
  frames_for_this_rotation = calculate_frame_budget(rotation)
  
  calculate_frame_budget(rotation):
    base = 2  // start + end
    
    if lands_on_zero:
      base += 2  // emphasis
    
    if distance < 50:
      return base + (distance / 10)  // show more clicks
    
    if distance < 200:
      return base + passes_through_zero
    
    if distance >= 200:
      full_circles = distance / 100
      return base + min(full_circles, 5) + passes_through_zero
    
    return base
```

**Expected frame count**:
- Initial state: 1 frame
- ~1000 rotations × ~5 frames average: ~5,000 frames
- Final state: 1 frame
- **Total: ~5,000 frames** (well under 9,000 limit)

### Changes That Merit a Frame

1. **Position change crossing 0**: Always emit
2. **Landing on 0**: Emit + hold for emphasis (2-3 frames)
3. **Significant position change**: Every 10-20 clicks for large distances
4. **State transitions**: Start/end of rotation
5. **Counter updates**: When password increments

### Changes That Don't Need Individual Frames

1. Single click movements when distance > 100
2. Positions far from 0 during routine rotations
3. Intermediate positions between milestones in large rotations

## Progression Toward Final Result

### Early Animation (Rotations 1-100)
- Show more detail to establish the mechanism
- Viewer learns how passes vs. lands work
- Build understanding of the pattern

### Middle Animation (Rotations 101-900)
- Efficient sampling
- Focus on zero encounters
- Show accumulation of password count

### Late Animation (Rotations 901-1000)
- Increase detail again
- Build suspense toward final answer
- Show password approaching 6738

### Final Frame(s)
- Hold on final position
- Highlight password: **6738**
- Show completion: "1000/1000 rotations"
- Optional: Brief celebration effect

## Metadata to Include in Each Frame

Every frame should contain:
- `frame_type`: "rotation_start" | "position_update" | "zero_pass" | "zero_land" | "rotation_end" | "final"
- `rotation_number`: Current rotation (1-1000)
- `position`: Current dial position (0-99)
- `password`: Current password count
- `instruction`: Current rotation instruction (e.g., "L47")
- `distance`: Rotation distance
- `direction`: "L" or "R"

Additional for specific frame types:
- `passes_in_rotation`: Number of times 0 was passed in current rotation
- `lands_on_zero`: Boolean for current rotation
- `progress`: Rotation number / 1000 (for progress bar)

## Implementation Notes for Rust Solver

The solver should emit frames at these key moments:
1. Initial state before any rotations
2. Before each rotation (show instruction)
3. Each time dial passes 0 during rotation (may be multiple per rotation)
4. After each rotation completes (show final position)
5. Final state after all rotations

For large distances, sample passes through 0 but emit all of them (visualizer will handle display speed).

The JSON log should be a sequence of frame objects, each representing a state snapshot. The visualizer will interpolate smooth animations between frames.
