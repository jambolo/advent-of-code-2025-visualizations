# Day 03 — Emission Rules

## Frame purposes
- Show how each bank is processed: where the scan window sits, which digit is picked, and how the 12-digit output grows.
- Keep a running sense of total joltage without logging every single skipped digit.

## When to emit
- **Bank start**: once per bank, before scanning, with bank index, digit string, picks required, and current running total.
- **Scan window**: when the lookahead window shifts to evaluate a new segment (after advancing past a chosen digit), including window start/end bounds.
- **Pick**: whenever a digit is chosen; include cursor position, chosen digit, remaining picks, the partial output string, and the set of indices already locked in.
- **Skip chunk**: when advancing over a span of ignored digits longer than 2; compress the hop into one frame noting the skipped count.
- **Bank complete**: once the required digits are selected; include the final 12-digit bank value and updated running total.
- **Final**: after all banks; include total joltage and a summary of banks processed.

## Sampling rules (≤ 5 minutes total)
- Limit frames per bank to: 1 start + up to 12 picks + up to 12 window shifts + up to 6 skip chunks + 1 complete ≈ 32 frames/bank.
- If a bank has more than 200 digits, coalesce skip chunks into at most 4 windows by merging adjacent skips; still emit every pick.
- Play back at 60 FPS but advance frames every 2–4 ticks depending on speed control; default playback speed set to 2× so long logs finish quickly.
- For extremely large inputs, cap total frames at 6000 by merging consecutive skip chunks globally while preserving all pick frames; the visualizer can drop non-pick skip frames if needed to stay under the cap.

## Visual progress cues
- Scan window slides to each new evaluation point; skipped spans get a fading sweep.
- Chosen digits pop upward into the “power rail” with a coral spark and remain lit.
- Bank completion triggers a pulse along the escalator spine and updates the totalizer.
- Final frame floods the escalator with light and displays the total joltage prominently.
