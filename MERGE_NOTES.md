# Merge notes: source/master -> wip-js-runtime-alpha-fixes

> **Это справочный документ к первой попытке мержа.** Сам мерж будет переделан
> поэтапно, см. `MERGE_PLAN_STAGED.md`. Состав ручных разрешений ниже не должен
> измениться — он понадобится как чек-лист при поэтапном сливе.
> Текущее состояние ветки: `STATUS.md`.

Merge commit: `41318e0b`. Parents: `22a66cdb` (ours) and `8713913f` (upstream `source/master`).

Upstream moved the project to SDL3 and deleted the emscripten/JS runtime, `vange-rs`
and `lib/renderer`. This branch is the opposite direction, so every file below was
resolved by hand or deliberately kept. Check them when the JS runtime misbehaves.

## 1. Files resolved by hand (content conflicts)

These took the upstream version as a base and our feature was ported back on top.

| File | What our side contributes |
|---|---|
| `CMakeLists.txt` | SDL3 + `SDL3_net` + `toml11`, emscripten retargeted to `-sUSE_SDL=3` / `-sUSE_SDL_NET=3`, `CLUNKAPI=`, C++20 for the renderer, `ENABLE_ASAN`, `tests` |
| `src/CMakeLists.txt` | `renderer` / `glad` link, MSVC Rust-std libs, whole emscripten block (OPFS, `EXPORT_ES6`, preload of `vange-rs/res`) |
| `lib/xtool/xtcore.cpp` | `normal_loop` + `em_normal_loop` with `emscripten_set_main_loop`, `sys_initScripts/-readyQuant/tickQuant/runtimeObjectQuant`, `-vss`, `SDL_EVENT_WINDOW_RESIZED` |
| `lib/xgraph/xgraph.cpp` | GLES3 context + `SDL_GL_GetProcAddress`, `compositor`, `sys_scaledRendererQuant` / `sys_frameQuant`, `get_palette_cache` |
| `lib/xgraph/xgraph.h` | `openGlContext`, `get_palette_cache()` |
| `lib/xtool/xglobal.h` | `__WORDSIZE` fix (no spaces around `=`) |
| `lib/xtool/CMakeLists.txt` | `lib/renderer/src` on the include path |
| `src/3d/3dobject.h` | renderer handle fields, `SyncExternalModel`, `ExternalModelVisible`, `ModelHandle` aliases |
| `src/3d/3dobject.cpp` | `external_body_color_id`, instance create/destroy, `SyncExternalModel` (frames, wheels, slots), `lay_to_slot` cleanup |
| `src/3d/optimize.cpp` | `draw_image_visible` set before the shadow, gates in `shadow_line` / `image_line` / `transparency_line`, `set_body_color` rebuild |
| `src/3d/3d_math.h` / `.cpp` | `Quaternion::multiply` |
| `src/terra/vmap.h` | `__use_external_renderer`, `request_region_update` |
| `src/terra/vmap.cpp` | `map_create`/`map_destroy`, `request_region_update`, early-outs in `scaling`/`turning`/`scaling_3D` |
| `src/terra/perpslop.cpp`, `slopskip.cpp` | `__use_external_renderer` early-out |
| `src/road.cpp` | renderer init, the whole GPU draw block in `iGameMap::draw`, camera zoom / `PAUSE_QUANT`, F8 + `\` keys, screen clear |
| `src/iscreen/iextern.cpp` | `OPTION_QUANT` override, `set_screen_resolution`, `iOptionsDataLoading` |
| `src/units/mechos.h` / `.cpp` | `ModelHandles` / `WheelModelHandles` / `FrameModelHandles`, `BindExternalModel`, `ExternalModelVisible`, `passage_out_ticks`, visibility push, weapon instances, `CAMERA_QUANT` |
| `src/units/items.h` / `.cpp` | `StuffObject::Free`, visibility push, model binding |
| `src/units/hobj.h` / `.cpp` | `BaseObject::SyncExternalModel`, `BaseObject::ExternalModelVisible`, `GameObjectDispatcher::SyncExternalModels` |
| `src/actint/actint.h` | `EV_VSS_CAMERA_ROT_EVENT`, `EV_VSS_CAMERA_ZOOM_EVENT`, `EV_VSS_CAMERA_PERSP_EVENT` |
| `src/actint/ascr_fnc.cpp` | camera events forwarded through `SEND_EVENT_QUANT` |
| `lib/renderer/.../AbstractVisualBackend.h`, `rust/RustVisualBackend.*`, `dummy/DummyVisualBackend.*` | `map_update_palette` takes a const palette; `SDL_ConvertSurface` / `SDL_DestroySurface`; `rv_gl_functor` cast |
| `lib/renderer/.../sdl_ext/SDL_extensions.cpp` / `.h` | SDL3 include + API names |
| `src/vss/sys-bridge.cpp` | SDL3 include |
| `vcpkg.json` | `builtin-baseline` (upstream manifest has none, vcpkg refuses to resolve ports) |

## 2. Conflicts resolved by keeping the deletion

Deleted on this branch on purpose (`9ee22ac1`, `f2efe952`); upstream still has them.

- `surmap/` (26 files) - the surmap editor, not used by the game or the JS build
- `lib/utils/` (6 files) - `xzip` is superseded by `lib/xtool/xzip.h` +
  `zip_resource.cpp`
- `.github/workflows/oss_linux_build.yml`, `oss_macos_build.yml`,
  `oss_windows_64_build.yml` - replaced by the Tauri release workflow

`tests/` from upstream was kept and enabled; it does not depend on either.

## 3. Known gaps

### 3.1 The compositor was deleted upstream and never restored - THIS IS THE MAIN BUG

Upstream removed the compositor completely: `source/master` has no `compositor`
member in `XGR_Screen` and never instantiates `renderer::compositor::gles3::GLES3Compositor`.
This branch relied on it for three separate things:

1. **Presenting the 3D frame.** `vange-rs` renders into the GL *default framebuffer*
   (`hal::api::Gles as hal::Api>::Texture::default_framebuffer`, `lib/ffi/src/lib.rs`
   `crate_main_views`). Nothing swaps it. Upstream's `XGR_Screen::flip()` then does an
   opaque `SDL_RenderTexture(sdlRenderer, sdlTexture, NULL, NULL)` over the whole window,
   so the cleared software buffer (UI only) paints over the 3D. That is the black screen.
   The old compositor drew the software layer with alpha blending on top of the GL result.
2. **Letterboxing / scaling of the 2D layer.** `XGR_Screen::flip()` sets
   `SDL_SetRenderLogicalPresentation(..., xgrScreenSizeX, xgrScreenSizeY, STRETCH)`, but
   the window is now created with `SDL_WINDOW_OPENGL` plus a separate
   `SDL_CreateRenderer`. In SDL3 that combination needs
   `SDL_SetRenderTarget(sdlRenderer, nullptr)` before the GL renderer draws, otherwise the
   GL work never reaches the back buffer. That is the unscaled 2D.
3. **`compositor->get_offset()`** was what `src/road.cpp` used to build the GPU
   `view_rect`. That call was replaced by hand-rolled scaling, which is only correct if
   the window aspect matches `hdWidth/hdHeight`.

### 3.2 Lost fixes

`src/units/items.cpp` lost the frame-rate compensation that this branch had:

```cpp
// now
if (BulletMode & BULLET_CONTROL_MODE::SPEED) Speed += p->RealSpeed;
// was
if (BulletMode & BULLET_CONTROL_MODE::SPEED) Speed += (int)round(p->RealSpeed / GAME_TIME_COEFF);
Speed = (int)round(in.get_int() / GAME_TIME_COEFF);      // fps fix
Precision = (int)round(in.get_int() / GAME_TIME_COEFF);  // fps fix
```

Also `extern int frame; // kdsplus.cpp` from `items.cpp`.

### 3.3 Other

- **wasm build is unverified.** No emsdk and no rust wasm target were available, so
  the `-sUSE_SDL=3` retarget has never been compiled.
- **`html5.cpp` still uses `#include <SDL.h>`** but is not in any build target.
- **`thechain/fostral/output.vmt` is gitignored** and absent from both trees.
- `bugs.md`: the MLVOT `regSet` crash is still unfixed.

## 4. How to verify nothing else was lost

For each hand-resolved file, diff the feature delta against the pre-merge base and
confirm every added line is still present:

```
git diff -w b503141b 22a66cdb -- <file>   # what this branch added
```

then look for each of those lines in the current tree. Note that exact-text matching
gives false positives: the hand-ported hunks were reformatted to the upstream
clang-format style, so match on tokens rather than whole lines.