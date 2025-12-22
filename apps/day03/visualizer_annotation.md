# Visualizer Annotation — Day 03: Lobby Battery Banks

## Architecture
- TypeScript app (`day03-visualizer.ts`) renders to a 1280×720 canvas. Playback is frame-driven: frames from the JSON log are advanced at `BASE_FRAME_DURATION / speed`, interpolating cursor/window motion for smooth movement while keeping runtime low.
- Rendering layers: background + escalator spine → power rail (12 slots) → battery bank row with window/cursor/locked cells → transient pick animation → footer text. Layout is recalculated per frame to fit long banks.
- Frame throttling: `downsampleFrames` keeps logs under 6000 frames by thinning only `skip` frames while preserving all picks and finales.
- Interactivity: file loader, speed control (0.5×–5×), play/restart, stop, and WebM recording. Recording triggers playback if idle and downloads the video when finished.

## Theme mapping
- Lobby vibe: dark teal base with brass highlights and jade circuitry cues. Rounded “battery” capsules line the floor; a translucent jade band marks the lookahead window; a coral probe shows the cursor.
- Picks rise as coral sparks into a glassy power rail; locked cells glow amber. Each completed bank sends a pulse up a vertical escalator spine on the right; the spine fills as banks complete.
- Text uses a clean geometric feel (Trebuchet/Futura family) and keeps brass for totals, jade for interactable cues, coral for pivotal selections.

## Resolution choice
- 720p chosen to balance clarity with performance: enough horizontal room to display long battery rows and a 12-slot rail without crowding, while keeping recording sizes moderate. Higher resolutions add file size without improving readability; 480p would compress digits and rail labels too tightly.

## Recording workflow
- Uses `canvas.captureStream(60)` feeding `MediaRecorder`. MIME selection probes `vp9 → vp8 → webm` to match browser support.
- Recording buffers chunks, stops automatically when playback ends, and downloads `day03-lobby.webm`. Playback auto-starts when recording if idle.
