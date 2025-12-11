# **Implementation Prompt**

You are acting as an expert Rust analyst, TypeScript engineer, and visualization designer.

Your job for a single Advent-of-Code-style puzzle has three steps:

1) Analyze the solver code, puzzle input, and puzzle description, and produce markdown design documents.  
2) Using those markdown files as your design guidance, create a complete browser-based visualizer app that renders an animation from a JSON log and records it to WebM.  
3) Define the precise JSON schema that the Rust solver must emit to drive the visualizer.
4) All output goes in the apps/dayNN folder, where NN is the the two-digit day of the puzzle.

You must not write or modify any Rust code.

────────────────
INPUTS PROVIDED
────────────────

• dayNN-description.txt (The puzzle description) The puzzle consists of two parts, and the description describe each of them. Only Part 2 is to be visualized; however, the description of Part 1 contains information relevant to part 2. The description also contains the final result of the puzzle.
• dayNN-input.txt (puzzle input)
• main.rs (the completed solver, written in Rust)  

Your analysis, design, application, and schema must all be puzzle-specific.

────────────────
STEP 1 — DESIGN DOCS
────────────────

Produce three markdown files. These are **your internal design documents** that **must guide your implementation in Step 2**.

input_summary.md  
• Summarize puzzle purpose and goals.  
• Describe the solver algorithm conceptually and identify important evolving state.  
• Define natural visualization steps.  
• Identify what must be visualized to understand the result.

visual_theme.md  
• Infer theme from puzzle description.  
• Define a theme object (colors, style, mood).  
• Propose a visualization metaphor (grid, nodes, tracks, particles, etc.).  
• Explain how theme + metaphor guide rendering.

emission_rules.md  
• Define when conceptual steps should be emitted.  
• Describe what changes merit a frame.  
• Define sampling strategy to keep animation < 5 minutes.  
• Show how progression toward the result should appear.

(Do not include any TypeScript or JSON here.)

────────────────
STEP 2 — VISUALIZER APP (code output + one prose file)
────────────────

Use the markdown files from Step 1 as **authoritative design guidance**.

Produce:

A) The **full visualizer application** (TypeScript + minimal HTML/CSS).  
   • Load JSON log.  
   • Sample frames to meet max duration.  
   • Render frames on a canvas using your visualization metaphor.  
   • Apply theme.  
   • Choose the lowest adequate resolution: 480p, 720p, or 1080p (justify in comments).  
   • Use requestAnimationFrame or timers for playback.  
   • Use canvas.captureStream + MediaRecorder for WebM output. Detect supported mime types with MediaRecorder.isTypeSupported (try vp9 → vp8 → generic WebM), and fall back gracefully (warn/alert) instead of hardcoding an unsupported codec.  
   • Highlight or show the result meaningfully.
   • Display the puzzle name and day number prominently in the visualization UI so viewers know which puzzle solution they are watching.
   • Include a selector to adjust playback speed by 0.5 to 5 times normal.
   • The name of the file containing the typescript code should be `dayNN-visualizer.ts`, where NN is the two-digit day of the puzzle.

B) visualizer_annotation.md  
   • Document architecture, how Step-1 docs guided your design, resolution choice, rendering logic, and recording workflow in markdown format.

────────────────
STEP 3 — JSON SCHEMA (markdown)
────────────────

Produce json_log_spec.md describing the exact JSON contract the solver must emit.

Requirements:  
• Schema must match exactly what your visualizer consumes.  
• Include only fields the visualizer actually uses.  
• Define all object types: top-level log, frames, entities/cells/nodes/tracks, annotations, theme/config blocks if used.  
• For each field: name, type, required/optional, and its meaning in the visualization.

This schema is the contract the Rust solver must follow.
