# Design

## Context

See proposal.md — Why. What already exists and what we build on (verified in code and in the running game):

- `InventoryFrame` (`app/src/inventory/inventory-frame.tsx`) — list of mod cards on the left, details panel on the right; on desktop it opens from `DesktopFrame` (`app/src/main.tsx:192`), on mobile through `mobile/inapp-frame.tsx` (`InappOpen` in `default-controls.tsx` is always shown). Closing calls `location.reload()`. `inventory/storage.ts` has `readCustomProp`/`writeCustomProp` (arbitrary strings in the same `localStorage` object as the mods list), `i18n.ts` has an en/ru dictionary.
- On desktop the frame open button (`InventoryOpenButton`) is shown only when `modsPresent`; otherwise `DownloadModsButton` is shown, which starts the download right away.
- `main.tsx` assembles `args` for `Module.callMain` (`-vss`, `-russian`, `-quickstart`); `lib/xtool/xtcore.cpp:main()` parses them. `Module.FS` is available in `onRuntimeInitialized` (used by `vss-browser.ts`), the `/res/ffi` preload is mounted by then.
- `RustVisualBackend` is created in `xtInitApplication` (`src/road.cpp:483-487`) after `XGR_Init`, the config path is hardcoded (`RustVisualBackend.cpp:38`, `res/ffi/render-compat.ron`). `rv_init` reads the ron through `ron::de::from_reader`; `shadow.size == 0` yields `Option<Shadow> = None` (`vange-rs/src/render/mod.rs:648`), `ray_steps` is a top-level field with `serde(default)`.
- `vMap->__use_external_renderer` (`src/terra/vmap.cpp:320`, `true` by default) switches between the Rust renderer and classic 2D: when `false` the software path in `vmap.cpp` runs, model sprites are enabled in `3d/optimize.cpp:228`, `renderer->render()` and `SyncExternalModels()` are skipped (`road.cpp:1995`). The `\` key toggles it at runtime; the 2D path on the map was verified visually on 2026-11-02.
- `DummyVisualBackend` (`lib/renderer/.../dummy/`) implements `AbstractVisualBackend` with empty methods.

## Goals / Non-Goals

**Goals:**

- Settings reachable from the mods menu on desktop and mobile, stored in `localStorage`, applied by a page reload.
- 3D off by default; in that mode the Rust context is not created.
- Three quality presets as vss data, without touching the submodule.

**Non-Goals:**

- Switching 3D or quality at runtime without a restart.
- Render resolution scale relative to the window (the main performance reserve on desktop; a separate change).
- Migrating existing users to 3D: without the key in `localStorage` everybody starts in 2D.
- Changing `vange-rs` and its `render-compat.ron`.

## Decisions

### Storage: `customProps` in the inventory storage, keys `render.3d` and `render.quality`

`readCustomProp`/`writeCustomProp` already serve the same `localStorage` object as the mods and are read before `callMain` in the same `main.tsx`. Values: `render.3d` ∈ {`"1"`, `"0"`}, empty = `"0"`; `render.quality` ∈ {`high`, `normal`, `low`}, empty = `normal`. The alternative — separate `localStorage` keys as in `mobile/controls/options.tsx` — was rejected: project settings belong next to the mods, which the same screen manages.

### Application: `callMain` arguments, preset written to MEMFS

`main.tsx` before `callMain`:

```
3d == "0":  args.push("-no3d")
3d == "1":  Module.FS.writeFile("/res/ffi/render-vss.ron", PRESETS[quality]);
            args.push("-render-config", "/res/ffi/render-vss.ron")
```

The presets are three ron strings in the new module `app/src/render-presets.ts`, copies of `render-compat.ron` with different `shadow.size`/`ray_steps`. Writing to MEMFS instead of files in `vange-rs/res/ffi`: the presets stay in vss, the submodule fork does not grow, and arbitrary values can be assembled later. Writing into `/res/ffi` next to the preload files is fine: it is MEMFS and the directory exists.

### C++: two globals from the arguments

`xtcore.cpp:main()` gets the branches `-no3d` → `Use3D = 0` and `-render-config <path>` → `RenderConfigPath`. The globals are declared in `src/road.cpp` next to `QuickStartGame` (`int Use3D = 1; const char* RenderConfigPath = "res/ffi/render-compat.ron";`).

- `xtInitApplication` (`road.cpp:487`): `Use3D ? RustVisualBackend : DummyVisualBackend`. Dummy is already included (`road.cpp:107`).
- `RustVisualBackend` constructor: `.render_config = RenderConfigPath` instead of the literal.
- `vrtMap::vrtMap`: `__use_external_renderer(Use3D)` instead of `true`. The `\` key stays a debug toggle; with `Use3D = 0` it enables the external renderer on the Dummy backend, i.e. an empty map — debug behaviour, not fixed.

The alternative — passing the settings through duktape addons and the `option` quant — was rejected: the decision is needed before `XGR_Init`, and the arguments already take that path.

### UI: pinned card in `InventoryFrame`

A card with id `settings` is added first in the list (not part of the mods `items` and never written by `writeInventoryItems`) and is selected when the frame opens (`activeId` starts as `settings`). When `activeId === "settings"` the details panel renders two rows of toggles (three/two buttons per row, the active one highlighted like an enabled mod) instead of the description and enable/disable buttons. Quality with `render.3d == "0"` is rendered with `opacity` and no handler. Strings `settings`, `render_3d`, `quality_high/normal/low`, `on`, `off` in `i18n.ts` (en/ru).

`DesktopFrame`: `InventoryOpenButton` is always shown; the `DownloadModsButton` branch is removed (download goes through "Refresh" inside the frame). Mobile is unchanged.

## Risks / Trade-offs

- [The 2D path has not been the primary one for a long time] → verified with the `\` key on the map on desktop; Android is verified in the tasks. If something is broken on mobile (for example the `hd` surface layers), it is fixed within this change because 2D becomes the default.
- [`Module.FS.writeFile` before `callMain` into the preload directory] → preload is mounted in `preRun`, `onRuntimeInitialized` comes later; `vss-browser.ts` already writes to MEMFS at that point. If the path is taken — error in the console and fallback to `render-compat.ron` (C++ default).
- [Presets duplicate `render-compat.ron`] → if the upstream settings format changes, `rv_init` panics on `unwrap` while parsing. Task 2.x pins this down: parsing of all three presets in the emscripten build is verified by launching each.
- [Switching the default to 2D surprises players who played in 3D] → deliberate decision (proposal, BREAKING); enabled with one toggle.
- [`DummyVisualBackend` returns zero handles, code may expect non-zero] → `optimize.cpp:228` treats 0 exactly that way; the other calls through `backend()` are safe (empty methods).
