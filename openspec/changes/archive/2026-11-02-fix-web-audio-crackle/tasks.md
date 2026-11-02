# Tasks

## 1. Audio chunk size in the web build

- [x] 1.1 In `lib/xsound/xsound.cpp` `SoundInit`: call `context.init` with a 2048 period under `#ifdef EMSCRIPTEN` and 512 in `#else`; add a short comment with the `// PERF:` prefix saying that the `ScriptProcessorNode` lives on the main thread and the chunk has to cover a game frame; verify `git diff lib/xsound/xsound.cpp` — only these lines
- [x] 1.2 Rebuild: `cd emscripten && ninja vangers`; verify that `app/src/vangers.wasm` and `vangers.mjs` were updated (mtime)

## 2. Verification on Android

- [x] 2.1 `adb reverse tcp:1420 tcp:1420; adb reverse tcp:1421 tcp:1421`, `yarn tauri android dev --host 127.0.0.1` on the TECNO AD10; after launch `adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>` and `node /tmp/cdp.mjs "window.__vssBrowser.Module.SDL2.audio.scriptProcessorNode.bufferSize"` → 2048
- [x] 2.2 Drive to the map with music and effects, run `node /tmp/audio-probe.mjs 20000`: `audio.late15x` ≤ 10 in 20 s (scenario "Playing on a phone with frames up to 40 ms"); the user confirms there is no crackle by ear
- [x] 2.3 Fire and start the engine: the sound starts without noticeable delay (scenario "A shot is heard without noticeable delay", 200 ms threshold by ear)

## 3. Verification on desktop

- [x] 3.1 `cd app && yarn tauri dev` (WebKitGTK): the menu music and the effects on the map play without crackle, the shot/engine delay does not get in the way; the console has no SDL/clunk errors about opening the audio device

## 4. Record it

- [x] 4.1 Commit `xsound.cpp` with an English message; `git status` is clean (wasm/mjs are not tracked)
