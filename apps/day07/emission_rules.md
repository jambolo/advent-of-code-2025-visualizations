# Emission Rules - Day 7: Laboratories

## When to Emit Conceptual Steps

### Initial State Frame
- Emit once at the start with the complete grid layout
- Include source position (S) and all splitter positions (^)
- Provides context for the entire animation

### Row Processing Frames
- Emit a frame for each row that contains at least one splitter being hit
- Empty rows (no splitter encounters) should be batched together
- Each frame captures the state after processing that row

### Split Events
- When a beam hits a splitter, emit details about:
  - The column position of the split
  - Timeline count before the split
  - Resulting left and right positions
  - Any merges that occurred

### Final State Frame
- Emit once when all rows are processed
- Include final beam positions and timeline counts
- Include the total timeline sum

## State Changes Meriting Individual Frames

1. **Beam position changes**: When beams move to new columns
2. **Timeline count changes**: When splits increase timeline multiplicity
3. **Beam merges**: When two beams occupy the same column
4. **Beam exits**: When beams reach edges and can't split further
5. **Milestone rows**: Every N rows for visual pacing

## Frame-Sampling Rules

### Animation Length Target
- Maximum 5 minutes (300 seconds)
- At 30 FPS, maximum ~9000 rendered frames
- Target 2-3 minutes for comfortable viewing

### Input Analysis
- Grid dimensions: 143 columns × 143 rows (from input)
- Approximately 71 rows contain splitters (odd rows after source)
- Each splitter row may have multiple split events

### Sampling Strategy
1. **Always emit**:
   - Initial state frame
   - Final state frame
   - Rows with splits

2. **Batch empty rows**:
   - Group consecutive empty rows into single transition frames
   - Show beams "descending" through empty space in one step

3. **Frame rate control**:
   - If total logged frames exceed 1000, sample evenly
   - Keep all split events but reduce intermediate frames
   - Visualizer should interpolate between sampled frames

### Estimated Frame Budget
- ~70 split-containing rows
- ~70 corresponding frames minimum
- With empty row batching: ~100-150 total frames
- At 0.5-1 second per frame: 50-150 seconds of animation
- Well within 5-minute limit

## Visual Progress Indication

1. **Row progress bar**: Show current row / total rows
2. **Timeline counter**: Running count of total timelines
3. **Scan line**: Horizontal line showing current processing row
4. **Trail effect**: Dim previous beam paths to show history
5. **Split counter**: Number of splits encountered so far

## Timeline Count Display

Given the final answer is ~47 trillion, use scientific notation or abbreviated form:
- Show exact counts while manageable (< 1 million)
- Switch to "1.2M", "3.4B", "47.8T" format for large numbers
- Individual beam timeline counts can be abbreviated earlier
- Final total displayed prominently in scientific notation
