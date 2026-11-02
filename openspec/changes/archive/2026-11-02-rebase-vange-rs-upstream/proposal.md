# Proposal

## Why

The `vange-rs` submodule in vss fell 237 commits behind `origin/master` (kvark/vange-rs): the merge-base `7660f39` dates from 2026-05-16 while upstream is at `85dd159` from 2026-10-27. The longer we wait, the more expensive it gets to carry over our only real commit `ffd7de6` (terrain data texture as array layers, see the archive `2026-10-30-terrain-texture-array-layers`), because upstream has already rewritten exactly the code we touched (the dirty-rectangle upload in `src/render/terrain/mod.rs`). Our second commit `6f05bf6` (Fix 3D wheel palette) exists byte-for-byte in upstream as `d5b81d4`.

At the same time we write down a rule that so far lived only in people's heads: vss builds `vange-rs` only for `wasm32-unknown-emscripten`; native builds of the game are neither supported nor verified.

## What Changes

- The `vange-rs` submodule is rebased onto `origin/master` (`85dd159`): the history becomes "upstream + one commit `Terrain: split level rows across texture array layers`". Commit `6f05bf6` is dropped as already applied.
- The array-layers commit is rewritten on top of the new upstream upload code (`queue.write_texture` of a sub-rectangle through `texture_upload_window` instead of `copy_buffer_to_texture` of whole rows); in the `SurfaceConstants` uniform the `_pad` field is taken by `rows_per_layer` next to the new upstream field `void_zero`.
- The submodule pin in vss moves to the new SHA; the old `ffd7de6` is kept as a tag in `caiiiycuk/vange-rs` so that old vss commits stay reproducible.
- An `AGENTS.md` is created in the vss root with the rule: the only supported build target of `vange-rs` in this project is `wasm32-unknown-emscripten` (through `emscripten/` + the tauri app for desktop WebKitGTK and Android WebView); native builds of the game are not supported and are not used for verification.
- Upstream also brings renderer changes we did not pick: lighting in linear space with an sRGB palette, `void_zero` (height 0 stays solid for world maps), clipping of uploads at the map edge, a new shadow map centring. They are checked visually but not written up as separate requirements.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The change sets `skip_specs: true`: this is a dependency update plus project documentation. The requirements of the existing `terrain-data-texture` spec (the map loads with a limit of 8192, the fetch is transparent to layers, uploads respect layers) do not change and serve as the acceptance criteria for carrying the commit over.

## Impact

- `vange-rs` (submodule): the history of branch `master` is rewritten; conflicts in `res/shader/object.wgsl`, `res/shader/surface.inc.wgsl`, `src/render/shadow.rs`, `src/render/terrain/mod.rs`. The array-layers code moves into `src/render/terrain/mod.rs` (texture creation, two bind group layouts, view, upload) and `src/render/mod.rs` (view).
- Verified before the work started: the `lib/ffi` ABI used by `lib/renderer/.../RustVisualBackend.cpp` did not change; wgpu/naga stayed at `29.0.1`, the `wgpu/` fork needs no rebase; `patches/vange-rs-local-wgpu-lock.patch` applies to the upstream `Cargo.lock` (dry run); upstream did not touch `res/ffi/*.ron`, the new `settings::Render` fields have `serde(default)`; the ffi still uses `terrain: RayTraced`, so the upstream TIN/mesh branches and their `cfg(target_arch = "wasm32")` are inactive for us data-wise.
- vss: the submodule pin, the new `AGENTS.md`. The binary artifacts `app/src/vangers.wasm` and `vangers.mjs` are not tracked by git and are rebuilt locally.
- The new upstream dependencies (`libm`, `lib/vot`, `glam` with `scalar-math`) have to build under emscripten; this is checked by the build, not guaranteed statically.
