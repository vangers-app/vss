# Design

## Context

See proposal.md — Why. Facts the approach relies on (verified in the code and by measurement on a TECNO AD10 on 2026-11-02):

- Sound goes through clunk (`lib/xsound/xsound.cpp:340`, `context.init(maxHZ, 2, 512)`), SDL_mixer is commented out. clunk passes the third argument as `SDL_AudioSpec.samples` to `SDL_OpenAudioDevice` (clunk `context.cpp:242`) and mixes in the SDL callback: decoding of the ogg music (`lib/xsound/ogg_stream.cpp`) and up to 16 effects on the 2D path (position is zero, HRTF is not used).
- The emscripten SDL2 port 2.32.10 (emsdk 5.0.2) creates a `ScriptProcessorNode(samples)` on the main thread (`SDL_emscriptenaudio.c:344`), sets `spec.freq = audioContext.sampleRate` (48000 on Android) and resamples 44100→48000 through `SDL_AudioStream`. The handler checks that the `outputBuffer` length equals `samples`. The build has no pthreads and uses `-sASYNCIFY=1`; no AudioWorklet is used.
- Measurement in game on the map, 20 s: rAF frames p50 10.8 ms, p95 23 ms, max 36 ms. `onaudioprocess` calls later than 1.5 periods: 512 → 421, 1024 → 83, 2048 → 7 (no crackle by ear). `latencyHint: 'playback'` does not help: Chrome pulls chunks in bursts, 314 late calls and an `outputLatency` of 320 ms.
- Probe and swap without a rebuild: `/tmp/audio-probe.mjs` and `/tmp/audio-bigbuf.mjs` through CDP (`adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>`, `window.__vssBrowser.Module.SDL2`). Described in the agent memory `android-audio-crackle`.

## Goals / Non-Goals

**Goals:**

- Remove the regular crackle in the web build with a minimal change: a 2048-frame chunk under `EMSCRIPTEN`.
- Keep the effect latency within playable bounds (≤200 ms).
- Leave the native value of 512 untouched.

**Non-Goals:**

- Moving the mixing off the main thread (AudioWorklet, pthreads, `PROXY_TO_PTHREAD`).
- Adaptive buffer sizing from measured dropouts.
- Different sizes for the mobile and desktop web builds.
- Eliminating the rare frames longer than 64 ms (their source is not investigated).
- Dropping the 44100→48000 resampling (`EFFECT_KHZ`): it only adds CPU and does not affect the dropouts.

## Decisions

### 2048 frames, not 1024 or 4096

1024 (21 ms) leaves 83 late calls in 20 s (4/s) — audible. 4096 (85 ms) gives ~200 ms of total latency and is not needed with a max frame of 36 ms. 2048 (43 ms) covers the p95 frame almost twice over; the user does not hear the 7 remaining late calls in 20 s. The size is a power of two in the 256–16384 range, as `createScriptProcessor` requires.

### Unconditional under `EMSCRIPTEN`, no mobile/desktop split

The only place is `SoundInit` in C++; the size is known before the game starts. A split would require passing the value from `main.tsx` as a command-line argument based on `__VSS_MOBILE__`. The desktop WebKitGTK build gets +65 ms of latency; for this game (20 FPS logic, 50 ms frame) that is below the threshold of perception. If the latency gets in the way on desktop — add an `-audio-buffer N` argument in a separate change. This is an assumption; the user preferred to start with the simple option.

### The change goes into `xsound.cpp`, not into clunk or SDL

clunk is an external dependency pinned to a SHA (`stalkerg/clunk`), SDL2 is a prebuilt emscripten port. `SoundInit` already owns the number 512 and the single `context.init` call; an `#ifdef EMSCRIPTEN` right there is the minimal diff.

### Rejected: `latencyHint` and the `baseLatency`/`outputLatency` fields

These fields describe the "audio thread → hardware" path (5 ms / 32 ms on the device), not the main thread being blocked by a game frame; the chunk size cannot be derived from them. `latencyHint: 'playback'` makes things worse (see Context).

### Rejected for now: a lookahead queue through an AudioWorklet

The main loop mixes ~150 ms ahead and sends PCM to a JS worklet through `postMessage`; needs no SharedArrayBuffer or COOP/COEP, works in WKWebView. Robust against any stall shorter than the lookahead, but requires an own backend instead of `SDL_OpenAudioDevice` in clunk (`Context::process` is public), a pump in `normal_loop` and a worklet file. Deferred until there is a device where 2048 is not enough. The emscripten `-sAUDIO_WORKLET` option is rejected more firmly: pthreads + COOP/COEP on the custom Tauri scheme (Android and iOS) while `add-ios-build` is in progress.

## Risks / Trade-offs

- [Frames longer than 64 ms remain audible as rare single clicks] → accepted; on complaints measure with the probe and consider 4096 or the lookahead queue.
- [Effect latency ~120 ms on Android, ~110 ms on desktop] → check shots/engine by ear at acceptance; the 200 ms threshold is in the spec.
- [Other devices with a heavier frame] → the probe `/tmp/audio-probe.mjs` gives the number of late calls in 20 s; the criterion from the spec is ≤10.
- [Native build] → the value 512 stays under `#else`; native builds are not supported and not verified.

## Migration Plan

Rebuild with `ninja vangers` in `emscripten/`, run Tauri desktop and Android. Rollback — restore 512.
