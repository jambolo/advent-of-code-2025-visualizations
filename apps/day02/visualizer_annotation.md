## Architecture
- Canvas-driven renderer with a fixed 1280x720 surface; DOM provides file load, speed, play, record, and stop controls.
- JSON log is parsed into strongly typed `Frame` objects; the visualizer samples frames to stay under a 3-minute playback budget and always preserves `invalid_hit` and boundary frames.
- Playback loop runs at 60fps with a delta-time accumulator so speed changes and recording share the same timing; MediaRecorder captures `canvas.captureStream(60)` to WebM.
- Rendering pipeline per frame: paint gradient backdrop + ambient stripes → range info panel → register total → receipt strip with scanner beam → range progress bar → footer message.

## Design guidance linkage
- `input_summary.md` informed the states surfaced: range context, current ID digits, candidate repeat metadata, invalid hits, and running sum.
- `visual_theme.md` dictated the palette (paper, mint beam, candy red/gold) and metaphor (receipt on a conveyor under a scanner).
- `emission_rules.md` mapped directly to frame types rendered: `range_start`, `scan_tick`, `pattern_check`, `invalid_hit`, `range_end`, `final_summary`; the ribbon label and chunk highlighting respond to these types.

## Resolution choice
- 720p (1280x720) chosen to keep boxed digits crisp and chunk bands legible while keeping recordings smaller; 480p made the alternating chunk fills muddy, and 1080p would add size without revealing more structure on a single strip.

## Rendering logic
- Receipt strip centers on canvas; digits are monospaced boxes. Repeat chunks are shown as alternating red/mint bands; failing candidates tint charcoal; confirmed invalids glow gold.
- Scanner beam is a horizontal mint-to-red gradient slice through the strip. A footer ribbon states the current action derived from the frame type.
- Left panel shows the active range and numeric bounds; bottom bar shows `range_progress` (interpolated between frames). Right panel is a register display that pulses gold when `global_sum` changes.

## Recording workflow
- "Record WebM" resets playback to frame 0, starts `MediaRecorder` with VP9, and runs the same animation loop; on stop, chunks are assembled and auto-downloaded as `day02-visualization.webm`.
- "Stop" halts playback and finalizes recording; "Play" resumes from the current frame without restarting. Frame sampling keeps the timeline bounded before recording begins.
