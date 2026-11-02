# Tasks

## 1. Engine: `-no3d` and `-render-config` arguments

- [x] 1.1 In `src/road.cpp` next to `QuickStartGame` declare `int Use3D = 1;` and `const char* RenderConfigPath = "res/ffi/render-compat.ron";`; in `lib/xtool/xtcore.cpp:main()` add the branches `-no3d` → `Use3D = 0` and `-render-config <path>` → `RenderConfigPath` (with an error message when the value is missing, like `-vss`); verify `cd emscripten && ninja vangers` builds
- [x] 1.2 In `xtInitApplication` (`src/road.cpp:487`) create `DummyVisualBackend` when `Use3D == 0`, otherwise `RustVisualBackend`; in `vrtMap::vrtMap` initialise `__use_external_renderer(Use3D)`; in `RustVisualBackend.cpp` put `RenderConfigPath` into `.render_config`; verify: desktop run with `?quickstart` and `-no3d` added to `args` by hand shows the map in 2D and the console has no `rv_init`; without the argument — 3D as before

## 2. Presets and launch from `main.tsx`

- [x] 2.1 Create `app/src/render-presets.ts`: type `RenderQuality = "high" | "normal" | "low"`, functions `readRenderSettings()`/`writeRenderSettings()` over `readCustomProp`/`writeCustomProp` (`render.3d`, `render.quality`, defaults `"0"` and `normal`) and three ron strings (copy of `render-compat.ron` with `shadow.size` 1024/512/0 and `ray_steps` 128/64/64); verify `cd app && yarn tsc --noEmit` has no errors
- [x] 2.2 In `main.tsx` before `callMain`: with 3D off — `args.push("-no3d")`; with 3D on — `Module.FS.writeFile("/res/ffi/render-vss.ron", preset)` and `args.push("-render-config", "/res/ffi/render-vss.ron")`; verify on desktop: with `render.3d = "1"` and each of the three `render.quality` values in `localStorage` the game reaches the map, the console has `Using render: /res/ffi/render-vss.ron` and no panic; with `low` there are no shadows on the map

## 3. Settings screen in `InventoryFrame`

- [x] 3.1 In `app/src/inventory/i18n.ts` add en/ru strings: `settings`, `render_3d`, `render_quality`, `quality_high`, `quality_normal`, `quality_low`, `on`, `off`; verify `yarn tsc --noEmit`
- [x] 3.2 In `inventory-frame.tsx` add a pinned first card "Settings" (id `settings`, icon `app-icon.png`, not part of the mods `items`) and a panel with two rows of toggles when `activeId === "settings"`; values are read/written through `render-presets.ts` immediately on click; the quality row with 3D off is shown dimmed and without a handler; verify on desktop: the choice survives `reload`, the card does not reach `writeInventoryItems` (the mods list in `localStorage` has no `settings`)
- [x] 3.3 In `main.tsx` `DesktopFrame` always show `InventoryOpenButton`, remove the `DownloadModsButton` branch (and the import if no longer used); verify: without downloaded mods the button opens the frame, "Refresh" inside starts the download

## 4. Verification on desktop and Android

- [x] 4.1 Desktop (tauri, `yarn tauri dev`): clean `localStorage` → drive onto the map in 2D (terrain, mechos, sprite shadows), no `rv_init` in the console; enable 3D in the settings, close the frame → after reload the map is in 3D with normal quality; switch to low → no shadows; to high → as in the previous build
- [x] 4.2 Android (TECNO AD10, `yarn tauri android dev --host 127.0.0.1`): clean app data → map in 2D without artefacts and with working controls; enable 3D through the mods menu (`InappOpen`) → map in 3D; `adb logcat -s Tauri/Console` has no `Validation Error`/`Aborted`
- [x] 4.3 Commit the vss changes in one commit (English message); `git status` clean, the `vange-rs` submodule untouched
