# Proposal

## Why

Profiling the desktop build (WebKitGTK, AMD Raphael iGPU) showed the game is GPU-bound in map mode: the vange-rs ray-marched terrain runs twice per frame (a 1024² shadow pass and the main pass at full canvas size) with `ray_steps = 128`, and a frame takes ~100 ms (10 FPS). Measurements: shadow 512 + `ray_steps` 64 → ~49 ms; no shadows is cheaper still. On a weak GPU and on mobile the only way to play is the classic CPU 2D renderer, which the engine still has (`vMap->__use_external_renderer`, toggled with the `\` key, verified on the map) but which is not reachable by the player. The project needs a settings screen where the player chooses: 3D on/off and 3D quality.

## What Changes

- The mods menu (`InventoryFrame`, opened from the button in the top-left corner of the main menu on desktop and mobile) gets a pinned first card "Settings". Selecting it shows two toggles in the right panel: **3D** (on / off) and **3D quality** (high / normal / low). Values are written to `localStorage` immediately; they take effect when the frame closes, which already does `location.reload()`.
- The `InventoryFrame` open button on desktop is always shown (today, without downloaded mods, a download button takes its place and the frame is unreachable). Mods download stays inside the frame ("Refresh").
- **BREAKING (default behaviour):** 3D is off by default. Without a saved setting the game starts in classic 2D: `RustVisualBackend` is not created, `DummyVisualBackend` is used instead, `vMap->__use_external_renderer = false`. This applies to Android and to players who already played in 3D.
- Default quality is normal. Presets: high — shadow 1024 / `ray_steps` 128 (the current `render-compat.ron`), normal — 512 / 64, low — no shadows (`shadow.size = 0`) / 64. The quality toggle is visible but inactive while 3D is off.
- Delivery to the engine: `main.tsx` reads the settings before `callMain` and adds the arguments `-no3d` or `-render-config <path>`; the presets are ron strings in TS written into MEMFS (`Module.FS.writeFile`) as `/res/ffi/render-vss.ron`. `lib/xtool/xtcore.cpp:main()` parses the arguments into globals; `RustVisualBackend` takes the path from the global with a fallback to `res/ffi/render-compat.ron`; `vrtMap` takes `__use_external_renderer` from the global.

## Capabilities

### New Capabilities

- `render-settings`: user render settings of the project (3D on/off, 3D quality), their storage, the screen in the mods menu and their application at game start.

### Modified Capabilities

None.

## Impact

- `app/src/inventory/inventory-frame.tsx`, `storage.ts` (`readCustomProp`/`writeCustomProp` already exist), `i18n.ts` — settings card and panel, en/ru strings.
- `app/src/main.tsx` — frame open button always visible; `args` assembly and preset write to MEMFS before `callMain`. Mobile gets the screen through `mobile/inapp-frame.tsx` unchanged.
- `lib/xtool/xtcore.cpp` — `-no3d`, `-render-config` arguments; `src/road.cpp` — choice of `DummyVisualBackend`/`RustVisualBackend` at `XGR_Init`; `src/terra/vmap.cpp` — initial `__use_external_renderer`; `lib/renderer/.../RustVisualBackend.cpp` — config path.
- `vange-rs` is not changed: `render-compat.ron` stays, presets live in vss.
- Default behaviour changes for all users (2D instead of 3D); with 3D off no GPU memory is spent on the terrain texture and passes.
- Verification is emscripten only: tauri desktop and Android.
