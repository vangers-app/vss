# Tasks

## 1. Keep the old point and rebase the submodule

- [x] 1.1 In `vange-rs/`: `git fetch origin caiiiycuk`, put the tag `vss-pin-2026-11-02` on `ffd7de6` and push it to `caiiiycuk`; verify `git ls-remote --tags caiiiycuk | grep vss-pin-2026-11-02`
- [x] 1.2 In `vange-rs/`: `git rebase origin/master`; confirm that `6f05bf6` is dropped as already applied and the only stop is at `ffd7de6` with conflicts in `res/shader/surface.inc.wgsl`, `src/render/shadow.rs`, `src/render/terrain/mod.rs` (`git status`); fact: `object.wgsl` does not conflict, only the dropped `6f05bf6` touched it
- [x] 1.3 Resolve `object.wgsl` and `shadow.rs` with the upstream version (`git checkout --theirs` in rebase terms = upstream, re-check the content by eye: `@interpolate(flat)` is in place, `shadow_view()` is used); verify `git diff origin/master -- res/shader/object.wgsl src/render/shadow.rs` is empty
- [x] 1.4 Resolve `surface.inc.wgsl`: keep `texture_2d_array<u32>`, the per-layer fetch and the `rows_per_layer` field instead of `_pad` after `void_zero`; verify the struct contains `texture_scale, terrain_bits, delta_mode, void_zero, rows_per_layer` and nothing else

## 2. Carry the array layers over to the new upstream terrain code

- [x] 2.1 In `src/render/terrain/mod.rs` resolve the conflict with upstream as the base: `rows_per_layer` instead of `pad1` in `SurfaceConstants` (initialisation and filling in `update_dirty`), `layer_count`/`rows_per_layer` computed from `device.limits()` with an `assert!` on `max_texture_array_layers`, the `Terrain data` texture with `height = rows_per_layer, depth_or_array_layers = layer_count`, the `rows_per_layer` field in `Context`; verify `git diff origin/master -- src/render/terrain/mod.rs` contains only these hunks plus 2.2–2.3
- [x] 2.2 Switch the bind group layout entry for `t_Terrain` in `terrain/mod.rs` and the `create_view` there, as well as the `create_view` in `src/render/mod.rs`, to `TextureViewDimension::D2Array`; verify `grep -n "D2Array" src/render/terrain/mod.rs src/render/mod.rs src/render/object.rs` shows 2 layouts + 2 views (object.rs merged automatically; fact: `terrain/mod.rs` has only one layout entry for `t_Terrain`, binding 5 is the table map)
- [x] 2.3 In `update_dirty`, on top of the upstream `queue.write_texture`, add a loop over the layers of the window `(y0, y1)`: `origin = (x0/2, start - layer_start, layer)`, data `&self.upload_scratch[(start - y0) * row_bytes ..]`, height `end - start`; verify `cargo test -p vangers --test shaders` passes (parsing of all terrain shaders) and `git rebase --continue` finishes the rebase with one commit on top of `85dd159` (`git log --oneline origin/master..HEAD` = 1 line)

## 3. Build under emscripten and check on desktop

- [x] 3.1 `cd emscripten && ninja vangers`: the Cargo.lock patch applies, `cargo build --target wasm32-unknown-emscripten` builds the new upstream dependencies, `app/src/vangers.wasm` and `vangers.mjs` are updated (mtime); on build errors the fix goes into our top commit of the submodule
- [x] 3.2 Tauri desktop (`cd app && yarn tauri dev`): drive out of the escave onto Fostral, the WebKitGTK console has no `Validation Error`/panic; brightness and shadows do not differ noticeably from the previous build, the map edge (wrap) has no artifacts
- [x] 3.3 On desktop check the terrain update: shots/craters and moving land appear on the map without delays or offsets (the per-layer sub-rectangle upload works)

## 4. Check on Android

- [x] 4.1 `adb reverse tcp:1420 tcp:1420; adb reverse tcp:1421 tcp:1421`, `yarn tauri android dev --host 127.0.0.1` on a TECNO AD10; `adb logcat -s Tauri/Console` has no `Validation Error`/`Aborted` when entering Fostral, the map is rendered
- [x] 4.2 Drive to the layer boundary (rows 8191/8192 on Fostral) and make a crater next to it: no seam, the crater is visible and not offset (scenario "Dirty rectangle across the layer boundary")

## 5. Record it in vss

- [x] 5.1 Push `vange-rs` `master` to `caiiiycuk` with `--force-with-lease`; verify `git ls-remote caiiiycuk master` = the new SHA and the tag from 1.1 is in place
- [x] 5.2 Create `AGENTS.md` in the vss root: the only supported `vange-rs` target is `wasm32-unknown-emscripten` through `emscripten/` + the tauri app; verification is tauri desktop and Android; native builds of the game are not supported and are not accepted as verification; verify the file reads (`cat AGENTS.md`) and does not contradict `README.html5.md`
- [x] 5.3 Commit the new submodule pin and `AGENTS.md` in vss as one commit (English message); verify `git submodule status` shows the new SHA without `+`, `git status` is clean
