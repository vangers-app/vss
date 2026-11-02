# Proposal

## Why

In the Android build the sound crackles about 20 times a second for the whole game. The cause was found and confirmed by measurement on a TECNO AD10 (Android 15, WebView 156, 2026-11-02): the emscripten SDL2 port outputs audio through a `ScriptProcessorNode` on the main thread with a 512-frame buffer (10.7 ms at 48 kHz), which clunk requests (`lib/xsound/xsound.cpp`, `context.init(44100, 2, 512)`). A game loop frame on the phone lasts p50 10.8 ms, p95 23 ms, max 36 ms → the audio callback runs late (421 of 1875 buffers in 20 s arrived later than 1.5 periods) → silence goes into the output buffer → a click. The cost of the mixing itself is irrelevant (0.3–2.3 ms per call).

Swapping the buffer for 2048 frames (42.7 ms) live through CDP, without a rebuild, removed the crackle by ear (7 late buffers in 20 s instead of 421); 1024 leaves 83 late buffers and is not enough.

## What Changes

- In the web build (`EMSCRIPTEN`) clunk opens the audio device with a 2048-frame period instead of 512. Native builds are untouched (they are not supported anyway, see `AGENTS.md`).
- The sound effect latency in the web build grows from about 55 ms to ~120 ms (the `ScriptProcessorNode` double buffer 2×43 ms + 32 ms output latency on Android). Accepted as the price of no crackle; it also applies to the desktop WebKitGTK build (one code path, no separate mobile size — an assumption, see design.md).
- Nothing changes in the data format, mixing, music or volume control.

## Capabilities

### New Capabilities

- `web-audio-output`: audio output in the browser build — requirements on the output buffer size and the allowed latency, so that a main-thread stall for the duration of a game frame does not cause audio dropouts.

### Modified Capabilities

None. The existing specs (`mobile-tap-mapping`, `render-settings`, `terrain-data-texture`) do not describe sound.

## Impact

- `lib/xsound/xsound.cpp`: `SoundInit` — the period size passed to `context.init` under `#ifdef EMSCRIPTEN`.
- Rebuild of `app/src/vangers.wasm` / `vangers.mjs` through `emscripten/` (`ninja vangers`); git does not track them.
- Verification: Android (TECNO AD10) by ear and with the probe `/tmp/audio-probe.mjs` through CDP (number of late `onaudioprocess` calls in 20 s of play), desktop WebKitGTK — sound plays, effect latency does not get in the way.
- clunk (external dependency `stalkerg/clunk`), the SDL2 port and the TypeScript part of the app do not change.
- Not solved by this change: frames longer than ~64 ms (7 cases in 20 s at 2048) and the fundamental dependency of audio on the main thread; if 2048 is not enough on other devices, the next step is a lookahead queue through an AudioWorklet (recorded in design.md as an alternative rejected for now).
