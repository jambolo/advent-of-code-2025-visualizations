# Emission Rules - Day 11: Reactor

## When to Emit Conceptual Steps

### Phase 1: Graph Setup
- **Emit once:** Complete graph structure (all nodes and edges)
- **Emit once:** Identification of key nodes (svr, fft, dac, out)

### Phase 2: Graph Reduction (per reduction round)
- **Emit per batch:** Nodes being pruned in each reduction iteration
- **Emit once:** Final reduced graph state for each segment analysis

### Phase 3: Path Counting
For each of the three segments (svr→fft, fft→dac, dac→out or alternate ordering):
- **Emit periodically:** Current node being explored
- **Emit periodically:** Paths found (batch updates, not every single path)
- **Emit once:** Segment completion with final count

### Phase 4: Final Result
- **Emit once:** Three segment counts and their product

## State Changes Meriting Individual Frames

### High-Value Events (always emit)
- Graph initialization complete
- Key node identification
- Start of each segment analysis
- Segment count completion
- Final multiplication result

### Medium-Value Events (sample)
- Node reduction batches (emit every N removals)
- Path exploration progress (emit every N paths found)
- Depth changes in traversal

### Low-Value Events (aggregate)
- Individual edge traversals within batched exploration
- Single path discoveries (aggregate into counts)

## Frame Sampling Rules

### Target Duration
- Maximum animation: 5 minutes (300 seconds)
- Target frame rate: 30 fps
- Maximum frames: ~9000

### Sampling Strategy

Given the enormous path count (517 trillion), direct path enumeration is impossible. Instead:

1. **Graph display:** ~60 frames (2 seconds for fade-in and layout settling)

2. **Reduction phase:** ~150 frames (5 seconds)
   - Emit batches of pruned nodes
   - Sample rate: one frame per 10-20 node removals

3. **Segment counting:** ~240 frames per segment (8 seconds each, 24 seconds total)
   - Since paths aren't enumerated but counted recursively, emit:
   - Progress through nodes in topological-ish order
   - Running subtotals as recursion returns
   - Sample: emit every 5-10 nodes visited

4. **Result display:** ~90 frames (3 seconds)
   - Show three counts
   - Animate multiplication
   - Display final result with emphasis

**Total:** ~540 frames (~18 seconds at 30fps) - well under limit

### Adaptive Sampling

If recursion depth is high:
- Emit only at depth changes of 3+ levels
- Batch node visits into groups of 10

If graph has many nodes (576 in actual input):
- Reduction frames: max 30 frames for reduction phase
- Layout: precompute, show settling in 60 frames max

## Visual Progress Indicators

### Path Counting Progress
- Glow intensity on current segment proportional to completion
- Counter display with rolling digits
- Progress bar under each segment label

### Reduction Progress
- Fading nodes show which are being pruned
- Edge disconnection animations
- Count of remaining active nodes

### Final Result
- Three segment boxes with counts
- Multiplication symbols animate between them
- Final large result with particle burst effect
- Success state: all key nodes pulse green
