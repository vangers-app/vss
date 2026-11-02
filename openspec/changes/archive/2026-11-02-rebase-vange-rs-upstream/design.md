# Design

## Context

See proposal.md — Why. Facts the approach depends on (verified in `vange-rs/` with `git fetch`, `git merge --no-commit` followed by `--abort`, `patch --dry-run`):

- Only one commit is unique locally, `ffd7de6`; `6f05bf6` is identical to upstream `d5b81d4`, `git rebase` drops it by itself.
- Four files conflict. In `object.wgsl` upstream added `@interpolate(flat)` to `color_id`. In `shadow.rs` our diff is only rustfmt line wrapping, upstream moved the logic into `shadow_view()`. In `surface.inc.wgsl` we added `rows_per_layer`, upstream added `void_zero` and `_pad`. In `terrain/mod.rs` upstream rewrote the upload: `queue.write_texture` of the window `(x0..x1, y0..y1)` from `texture_upload_window`, the `upload_scratch` buffer, `tracks.patch_row`; it also added a second bind group layout entry for `t_Terrain` (visibility without VERTEX).
- `src/render/object.rs` and `src/render/mod.rs` merge automatically, but upstream creates the view in `render/mod.rs` (~line 672) with `TextureViewDescriptor::default()`, which has to be switched to `D2Array` by hand.
- The only place reading `t_Terrain` in the shaders is still `get_surface_impl` in `surface.inc.wgsl`; the mesh/TIN shaders read through it.
- The Emscripten target is `target_arch = "wasm32"`, so the upstream branches under that cfg (embedded shaders, `rect_reaches_drawn`, `build_pending`) compile for us too. The embedded shaders were already there at the merge-base; the rest only works for `Kind::Mesh`, and the ffi uses `RayTraced`.
- The build runs only from `emscripten/` (`ninja vangers` → `cargo build -p rusty-vangers --target wasm32-unknown-emscripten --release` with the Cargo.lock patch through `cmake/ApplyGitPatch.cmake`, then linking into `app/src/vangers.wasm`). The desktop check is tauri desktop (WebKitGTK), Android is tauri android dev on a TECNO AD10.

## Goals / Non-Goals

**Goals:**

- `vange-rs` on `origin/master` + one commit of ours, without a merge commit.
- The `terrain-data-texture` requirements hold on the new code: the map loads on Mali with a limit of 8192, the seam at the layer boundary is invisible, dirty rectangles reach the right layer.
- The old SHA `ffd7de6` stays reachable in `caiiiycuk/vange-rs`.
- The "emscripten only" rule is written down in the project's `AGENTS.md`.

**Non-Goals:**

- Fixing the submodule URL in `.gitmodules` (it currently points at `kvark/vange-rs`, which does not have our commit; a fresh clone needs the `caiiiycuk` remote added). This is the existing situation, the change does not alter it.
- Moving the ffi to the TIN/mesh mode, tuning the new upstream lighting or shadows. Their result is accepted as is, as long as the picture is not broken.
- Updating the `wgpu/` fork: version 29.0.1 matches.
- A native build of the game and its verification.

## Decisions

### Rebase, not merge

Cherry-picking one commit onto `origin/master` gives the history "upstream + 1"; the submodule pin stays an honest fork without a merge bubble. The amount of conflict resolution is the same either way. The price of the rebase is a force-push to `caiiiycuk/master`; it is covered by a tag on the old SHA (below). Merge was rejected: dragging a merge commit and a second parent along for the sake of one commit is pointless.

### A tag on the old SHA before the force-push

The current vss HEAD pins `ffd7de6`. After the force-push of `caiiiycuk/master` that SHA is no longer reachable from any branch and may be garbage-collected → old vss commits could not `submodule update`. Before the push a tag like `vss-pin-2026-11-02` is put on `ffd7de6` and pushed to `caiiiycuk`. The branch is pushed with `--force-with-lease`.

### Conflict resolution

- `object.wgsl`, `shadow.rs` → the upstream version as a whole. Our contribution to both files is either already in upstream or purely cosmetic.
- `surface.inc.wgsl` and the Rust `SurfaceConstants` → `rows_per_layer` takes the place of `_pad`/`pad1`: `texture_scale` (16) + `terrain_bits`, `delta_mode`, `void_zero`, `rows_per_layer` (4×4) = 32 bytes, the uniform alignment does not change, no extra padding is needed. `t_Terrain` stays `texture_2d_array<u32>`, the fetch is `textureLoad(t_Terrain, vec2(tci.x/2, tci.y % rows), tci.y / rows, 0)`.
- `terrain/mod.rs` → take upstream as the base and re-apply our commit: `layer_count`/`rows_per_layer` computed from `device.limits()` with an `assert!` on `max_texture_array_layers`, the texture with `height = rows_per_layer, depth_or_array_layers = layer_count`, the `rows_per_layer` field in `Context` and in the uniform, both layout entries for `t_Terrain` → `D2Array`, both `create_view` calls (`terrain/mod.rs`, `render/mod.rs`) → `D2Array`.

### Splitting the upload by layer on top of `write_texture`

Upstream already computes the window `(x0, x1, y0, y1)` and fills `upload_scratch` with rows of `row_bytes`. On top of that: a loop over the layers `y0 / rows_per_layer ..= (y1 - 1) / rows_per_layer`; for each layer `start = max(y0, layer_start)`, `end = min(y1, layer_start + rows_per_layer)`, a `queue.write_texture` call with `origin = (x0/2, start - layer_start, layer)`, the data `&upload_scratch[(start - y0) * row_bytes ..]`, `bytes_per_row = row_bytes`, height `end - start`. The alternative, bringing back `copy_buffer_to_texture` from our commit, was rejected: it loses the upstream sub-rectangle optimisation the upload was rewritten for. The `tracks.patch_row` and `rect_reaches_drawn` logic is left alone; they work in level coordinates, not texture coordinates.

### Verification under emscripten only

There is one product build: `cd emscripten && ninja vangers`. The shader test `cargo test -p vangers --test shaders` (naga parsing) stays as a cheap host-side syntax check of `surface.inc.wgsl`; it is not a build of the game and does not contradict the "emscripten only" rule. `AGENTS.md` states the rule as: the supported `vange-rs` target in vss is `wasm32-unknown-emscripten`; verification is tauri desktop and Android; native builds of the game (`cargo build` without a target, native CMake) are not supported and are not accepted as proof that something works.

## Risks / Trade-offs

- [The new upstream dependencies do not build under emscripten] → the first `ninja vangers` shows it; `libm` and `lib/vot` have no platform code, `glam scalar-math` is the regular path for wasm. If something does not build, fix it in our commit on top, not in the upstream history.
- [The picture changes because of the upstream sRGB lighting] → the ffi already provides `Rgba8UnormSrgb`, the palette is picked to match the target format (`Palette::format_for_target`), we expect the same picture; checked by eye on desktop. If it is noticeably darker/lighter, that is a separate change; here we only record it.
- [`void_zero`, clipping at the edge, the new shadow centring] → look at the map edge and the shadows on desktop; we accept the upstream behaviour.
- [The Cargo.lock patch stops applying] → the dry run passed with offsets; `ApplyGitPatch.cmake` does `git checkout -f Cargo.lock` before each apply, so the build reports a failure itself.
- [The force-push breaks old vss pins] → the tag on `ffd7de6`, `--force-with-lease`.
- [An offset mistake in the per-layer split] → the `terrain-data-texture` scenarios "Dirty rectangle across the layer boundary" and "Full initial upload": on Android check the 8191/8192 seam on Fostral and the terrain update after shots/craters.
