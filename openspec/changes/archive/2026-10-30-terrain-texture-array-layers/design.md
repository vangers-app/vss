# Design

## Context

See proposal.md — Why. State before the change (`vange-rs`):

- `render/terrain/mod.rs:755` — `Terrain data`: `D2`, `Rgba8Uint`, `width/2 × height`, `depth_or_array_layers: 1` (two level texels packed into one rgba: `x = height[2i]`, `y = meta[2i]`, `z = height[2i+1]`, `w = meta[2i+1]`).
- Group 1 layout, `binding 2` (`mod.rs:855-859`): `view_dimension: D2`, `sample_type: Uint`; bind group `mod.rs:940` — default view.
- The only read — `res/shader/surface.inc.wgsl:50`: `textureLoad(t_Terrain, vec2<i32>(tci.x/2, tci.y), 0)`; the include is shared by all modes. `tci.y` is already wrapped into `[0, height)` by `get_map_coordinates`.
- `SurfaceConstants` (`surface.inc.wgsl:3`, `mod.rs` `update_dirty`): `texture_scale: vec4` (w unused; the "number of layers" comment was a placeholder), `terrain_bits`, `delta_mode`, `pad0`, `pad1`.
- `update_dirty` (`mod.rs:1615-1660`): a staging buffer of whole rows `[rect.y, rect.y+h)`, one `copy_buffer_to_texture` with `origin.y = rect.y`, `bytes_per_row = width*2`.
- Limits: `settings.rs:203` for `RayTraced`/`Sliced`/`Painted` requests the adapter `max_texture_dimension_2d` on top of `downlevel_webgl2_defaults()` (where `max_texture_array_layers = 256`). The effective limit is available through `device.limits()`.
- wasm: `emscripten/` (CMake, Emscripten toolchain, MinSizeRel) → `ninja vangers` → `app/src/vangers.{mjs,wasm}` (`src/CMakeLists.txt:176`).

## Goals / Non-Goals

**Goals:**
- Load maps of any height when the 2D texture limit is smaller than the level height.
- The same texture layout and fetch on every device: always a 2D array with at least two layers.
- One source of truth for "rows per layer" — passed from Rust to the shader.

**Non-Goals:**
- Changing the data packing format (`Rgba8Uint`, 2 texels per rgba).
- Supporting devices where `ceil(height / limit)` exceeds `max_texture_array_layers` (in practice 2 layers against 256+).
- Changing `get_device_limits` and limit requests.
- A 3D texture: the limit of 16383 on the target device is smaller than 16384.

## Decisions

**D1. Always a 2D array with at least 2 layers; layer count from `device.limits().max_texture_dimension_2d`.**
`layers = max(2, ceil(height / limit))`, `rows_per_layer = ceil(height / layers)`. A `D2` texture with `depth_or_array_layers = layers`, a `D2Array` view, layout `view_dimension: D2Array`. At least two layers because `wgpu-hal` GLES creates a single-layer D2 texture as `GL_TEXTURE_2D` (`gles/mod.rs`, `get_info_from_desc`: `(false, 1) => TEXTURE_2D`), and a `usampler2DArray` reads zeros from it: on desktop (WebKitGTK, limit 16384) the map rendered flat, on the phone (2 layers) correctly. Two layers of 8192 take the same memory as the previous 1024×16384, so the decision has no cost; the alternative — two shader variants (`texture_2d` for one layer through `substitutions`) — is an extra path for the same result. The texture is bound by two layouts: the terrain group 1 (`terrain/mod.rs`) and `Object surface` (`object.rs`, the view is created in `render/mod.rs`) — both move to `D2Array`, otherwise `create_bind_group` fails with "expects dimension = D2" (caught on the device).

**D2. `rows_per_layer` in `SurfaceConstants`.**
Use `pad0: u32` as `rows_per_layer` (rename the field). In the shader: `textureLoad(t_Terrain, vec2<i32>(tci.x/2, tci.y % rows), tci.y / rows, 0)`. Leave `texture_scale.w` alone (f32, stale comment). The alternative — a constant substitution into the shader at build time — the `substitutions` mechanism exists, but the value depends on the device and is known only after the device is created; a uniform is simpler.

**D3. Per-layer upload through `offset` in the staging buffer.**
The staging buffer is built as before (whole rows `[y, y+h)`); then for each layer `l` in `[y / rows, (y+h-1) / rows]`: rows `[max(y, l*rows), min(y+h, (l+1)*rows))`, `copy_buffer_to_texture` with `offset = (start - y) * row_stride`, `origin = {x: 0, y: start - l*rows, z: l}`, `height = end - start`. `row_stride = width*2` is a multiple of 4 (the `Rgba8Uint` texel size) and of 256 for `width ≥ 128`, so the wgpu requirements for `offset`/`bytes_per_row` hold. The alternative — a separate staging buffer per piece — extra allocations.

**D4. Layer limit check — an explicit panic with a clear message.**
If `layers > device.limits().max_texture_array_layers`, `assert!` with the level size and the limits in the text. This situation is impossible on known devices; silent truncation would produce a corrupted map.

**D5. Where to compute `rows_per_layer`.**
In `Terrain::new` (next to the texture creation), stored as a field of `Terrain`, used in `update_dirty` and when filling `SurfaceConstants`. `RayVoxel` reads the same texture through the shared include — no separate branch is needed.

## Risks / Trade-offs

- [Extra `%`/`/` per fetch in the ray shader] → integer operations on a uniform constant, no branching. If a noticeable slowdown appears — substitute `rows_per_layer` as a constant (out of scope).
- [Other textures with the level height] → per `mod.rs` only `Terrain data` has `height = extent.height`; `Terrain flood` is `flood_section_count × 1`, the tables are small. Check `grep "extent.height"` during implementation (lines 682/698 are scatter buffer sizes, not textures).
- [The wasm rebuild changes binaries in `app/src`] → check on desktop (`yarn tauri dev` on 1425) and on the device that there are no 2D/3D regressions.
- [No render tests] → `cargo test --test shaders` (naga parses `surface.inc.wgsl` through all terrain shaders), a manual visual check of the layer boundary (the seam at Fostral row 8192 must be invisible).
