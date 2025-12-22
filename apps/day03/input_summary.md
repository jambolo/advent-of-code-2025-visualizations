# Day 03 — Input Summary

## Puzzle goal
- Each input line is a bank of single-digit battery labels.
- For every bank, turn on exactly `k` batteries (Part 1: `k=2`, Part 2: `k=12`) in their original order to form the largest possible number. Sum the per-bank maxima to get the total joltage.

## Solver behavior and evolving state
- Parses each line into an array of digits.
- Uses a greedy scan to pick the lexicographically largest subsequence of length `k`:
  - Maintain an index into the remaining digits and how many picks are left.
  - At each step, look ahead far enough to ensure enough digits remain, choose the first maximum digit available within that window, advance past it, and append it to the bank’s output number.
- Accumulates the running total joltage by summing each bank’s chosen number.

## Natural visualization steps
- Bank intro: present the row of batteries for the current bank and reset selection state.
- Scan window: show the lookahead window and highlight candidate digits.
- Selection: spotlight the chosen digit, animate it “locking in” to the bank’s twelve-digit output strip.
- Skip segments: fade/sweep over digits that are bypassed when the scan jumps forward.
- Bank completion: display the fully constructed 12-digit (or 2-digit) number for that bank and add it into a totalizer.
- Finale: present the aggregate total with celebratory emphasis.

## What the viewer should see
- The battery line per bank with a moving cursor and window boundary.
- The sequence of chosen digits accumulating into a fixed-length output tray.
- Remaining picks vs. remaining digits, to explain why the greedy window stops where it does.
- Per-bank contribution and the rolling sum, culminating in the final joltage answer.
