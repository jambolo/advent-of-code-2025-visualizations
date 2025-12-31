# Input Summary - Day 11: Reactor

## Puzzle Purpose and Goals

The puzzle involves analyzing a network of electrical devices connecting a server rack to a toroidal reactor. The network forms a Directed Acyclic Graph (DAG) where:
- Each device has named outputs connecting to other devices
- Data flows only forward through outputs (no backflow)
- The goal is to count paths through the network

**Part 1:** Count all paths from "you" to "out"
**Part 2:** Count paths from "svr" (server rack) to "out" that pass through both "dac" (digital-to-analog converter) and "fft" (fast Fourier transform device)

## Solver Algorithm

The solver uses a clever decomposition strategy for Part 2:

1. **Check path ordering:** Determine whether paths go fft→dac or dac→fft
2. **Graph reduction:** Remove nodes that only lead to "out" (except key checkpoints) to simplify counting
3. **Segment multiplication:** Break the problem into independent segments:
   - If fft→dac paths exist: count(svr→fft) × count(fft→dac) × count(dac→out)
   - Otherwise: count(svr→dac) × count(dac→fft) × count(fft→out)
4. **Recursive path counting:** For each segment, recursively traverse the DAG summing paths

### Evolving State

- Current position in graph traversal
- Accumulated path count for each segment
- Reduced graph state after pruning
- Which key nodes (svr, fft, dac, out) have been visited

## Natural Visualization Steps

1. **Graph layout:** Display the full network with nodes and edges
2. **Key node highlighting:** Emphasize svr, fft, dac, and out nodes
3. **Reduction visualization:** Show pruning of dead-end nodes
4. **Segment traversal:** Animate counting paths through each segment
5. **Path accumulation:** Display running totals for each segment
6. **Final multiplication:** Show the three segment counts combining

## What the Viewer Must See

### Process Understanding
- The network structure as an interconnected graph
- Data flow direction through the devices
- The key checkpoint nodes (svr, fft, dac, out)
- Graph simplification/reduction in action
- Path exploration radiating through segments
- Accumulating path counts

### Final Result
- The three segment path counts
- Their multiplication yielding 517,315,308,154,944 total valid paths
- Clear indication that this enormous number represents paths through both fft and dac
