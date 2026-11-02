# Tasks

## 1. Texture and fetch

- [x] 1.1 In `vange-rs/src/render/terrain/mod.rs` (`Terrain::new`) compute `layers = max(2, ceil(height / device.limits().max_texture_dimension_2d))` and `rows_per_layer = ceil(height / layers)`, create `Terrain data` with `depth_or_array_layers = layers`, store `rows_per_layer` in `Terrain`, add an `assert!` on `max_texture_array_layers` (D1, D4, D5); verify `cargo build -p vangers` without errors
- [x] 1.2 Move the group 1 `binding 2` layout (`terrain/mod.rs`) and `Object surface` (`object.rs`) to `TextureViewDimension::D2Array`, both views (`terrain/mod.rs`, `render/mod.rs`) to `D2Array`; rename `pad0` to `rows_per_layer` in `SurfaceConstants` (Rust and `surface.inc.wgsl`) and fill it in `update_dirty` (D2); verify `cargo build -p vangers`
- [x] 1.3 In `res/shader/surface.inc.wgsl` declare `t_Terrain: texture_2d_array<u32>` and read `textureLoad(t_Terrain, vec2<i32>(tci.x/2, tci.y % rows), tci.y / rows, 0)`; verify `cargo test -p vangers --test shaders` — all terrain shaders parse

## 2. Per-layer data upload

- [x] 2.1 In `update_dirty` split the dirty rectangle row range by layers and copy each piece through `copy_buffer_to_texture` with `offset`, `origin.y` within the layer and `origin.z = layer` (D3); verify `cargo build -p vangers` and running Fostral on desktop (2 layers of 8192 — the picture is unchanged)

## 3. wasm build and device checks

- [x] 3.1 Rebuild wasm: `cd emscripten && ninja vangers` (the Emscripten toolchain is already configured) and confirm that `app/src/vangers.wasm` and `app/src/vangers.mjs` are updated
- [x] 3.2 On a TECNO AD10 (`yarn tauri android dev --host 127.0.0.1` + `adb reverse tcp:1420/1421`) drive out of the escave onto the Fostral map; logcat (`Tauri/Console`) has no `Validation Error`/`Aborted`, the map renders, the seam between rows 8191/8192 is invisible
- [x] 3.3 On desktop (`yarn tauri dev` on port 1425) drive onto the map: rendering and performance without visible changes (2 layers of 8192)
