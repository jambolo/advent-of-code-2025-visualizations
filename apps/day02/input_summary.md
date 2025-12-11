### Puzzle goal
- Identify product IDs within given ranges that are made of a digit chunk repeated across the entire number. Part 1 accepts exactly two repeats; Part 2 (the visualization target) accepts any repeat count >= 2. Sum every invalid ID discovered.

### Solver algorithm (conceptual)
- Parse the single-line input into `(start, end)` ranges.
- For each range, iterate every integer from `start` to `end` inclusive.
- Convert the current number to a string and test repetition:
  - Part 1: split into 2 equal parts and check if both parts match.
  - Part 2: try every possible repeat count `n` from 2 up to the string length; if the length divides evenly by `n`, verify all `n` chunks are identical.
- When a number qualifies as a repeated-chunk ID, add it to a running sum.
- Important evolving state: active range, current number, candidate repeat count, whether a repeat was found, running sum of invalid IDs.

### Natural visualization steps
- Range context change (enter/exit a range).
- Number scan ticks showing the active ID and its digit chunks being tested.
- Detection moments where a repeat count passes/fails.
- Invalid-ID hits that increment the accumulated total.
- Completion summary per range and final sum reveal.

### What must be visualized
- The progression through ranges and how far along each range the scan has reached.
- Digit-chunk matching for the current ID, with emphasis on the smallest repeating chunk that proves invalidity.
- Moments where the running sum changes and which ID caused it.
- Final total alongside the list/count of invalid IDs found.
