# **Process Description**

## **Overview**

Each visualization is **independent** and based solely on its puzzle’s materials:

* Puzzle description
* Rust solver source
* Puzzle input
* Solver output

No visualization depends on any other puzzle.
Visualizers may reuse **generic animation/recording utilities**, but all puzzle-specific data formats, rendering logic, and theme decisions are unique per puzzle.

A coding-capable LLM (Codex) performs all analysis and generates TypeScript visualization code.
The LLM **never** generates Rust code.
You implement Rust logging manually according to the puzzle-specific specification.

---

# **1. Rust Solver Location**

All solvers are located in the Git submodule `advent-of-code-2025/`

Each solver is implemented in Rust and produces the correct puzzle output.
At this stage, no visualization logic or logging exists.

---

# **2. Provide Puzzle Materials to the LLM**

Inputs provided to Codex:

* Puzzle description
* Rust solver source for the puzzle within the submodule
* Puzzle input
* The overall visualization goal

Codex uses only these puzzle-specific items.

---

# **3. LLM Phase 1 — Algorithm Analysis**

Codex analyzes the solver and input and produces:

* A description of the algorithm
* Identification of state transitions and key data structures
* A definition of “visualization steps”

No Rust code is produced.

---

# **4. LLM Phase 2 — Theme Derivation**

Codex interprets the puzzle description and generates:

* A theme concept (mood, style, colors, fonts)
* Guidance for how the theme appears in the animation

Theme is puzzle-specific.

---

# **7. LLM Phase 3 — Visualization Application Generation**

Codex generates a complete visualization design **before** logging is implemented.

Outputs:

1. **Puzzle-specific logging specification**

   * Defines the exact structure and meaning of the step records the solver must produce.
   * Specifies what to record and when.
   * Does **not** include Rust code.

2. **Puzzle-specific visualization application** (TypeScript + HTML)

   * Loads the puzzle’s log.
   * Performs time-bounded frame sampling.
   * Renders the algorithm step-by-step on a canvas using the puzzle’s theme.
   * Records the animation to a `.webm` video using MediaRecorder.

3. May reference reusable rendering/recording helpers, but all puzzle logic, layouts, and data formats are unique.

---

# **5. Implement Logging in Rust**

Using the puzzle-specific specification from Step 7:

* You manually add logging to the puzzle’s Rust solver.
* You ensure the solver emits the exact structure Codex requires.
* No Rust code is generated or recommended by the LLM.

---

# **6. Run the Instrumented Solver**

* Run the solver in the submodule to produce the puzzle’s log file.
* Confirm correct puzzle answer and correct log format.

Each puzzle has its own log format and is not shared across puzzles.

---

# **8. Run the Visualization Application**

* Open the generated `visualizer.html` in a browser.
* Load the puzzle’s log file.
* The application renders all sampled steps and records a `.webm` animation.
* Save the final video.

---

# **9. Publish**

Publish the `.webm` animation for Advent of Code participants.

---

# **10. Summary**

1. Solver exists in `advent-of-code-2025/`.
2. Provide solver, input, and description to Codex.
3. Codex analyzes algorithm.
4. Codex extracts theme.
5. Codex generates visualization design and logging specification.
6. You implement logging in Rust according to that specification.
7. Run solver to generate log.
8. Run LLM-produced visualizer to generate `.webm`.
9. Publish.

Each visualization application is **self-contained, puzzle-specific, and independent**, with optional reuse of generic animation infrastructure only.
