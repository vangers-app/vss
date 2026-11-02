# Proposal

## Why

On Android (TECNO AD10, Mali‑G710, WebGL 2.0) the game crashes when entering the map: `vange-rs` creates the `Terrain data` texture at `width/2 × height` of the level (Fostral: 1024×16384), while the 2D texture limit of this GPU is 8192. wgpu reports `Validation Error … Dimension Y value 16384 exceeds the limit of 8192`, Rust panics, wasm calls `abort()` → a black screen with no way to continue. Desktop GPUs have a limit ≥ 16384, so the problem does not show there. Verified with logcat and the device GL limits (`MAX_TEXTURE_SIZE 8192`, `MAX_3D_TEXTURE_SIZE 16383`, `MAX_ARRAY_TEXTURE_LAYERS 4096`).

## What Changes

- The `Terrain data` texture (`vange-rs/src/render/terrain/mod.rs`) becomes a 2D array: layer count = `max(2, ceil(height / device max_texture_dimension_2d))`, layer height = `ceil(height / layer count)`. At least two layers on every device (the wgpu GLES backend turns a single-layer texture into a plain `GL_TEXTURE_2D`); on desktop this is 2×8192 with the same memory footprint.
- The shader fetch (`res/shader/surface.inc.wgsl`, the only place reading `t_Terrain`) moves to `texture_2d_array<u32>`: row `y` → layer `y / rows_per_layer`, row within the layer `y % rows_per_layer`; `rows_per_layer` is passed in `SurfaceConstants`.
- Dirty rectangle uploads (`update_dirty`) split the row range at layer boundaries and copy each piece into its layer.
- Bind group layouts binding the texture (terrain group 1 `binding 2` and `Object surface`) use `TextureViewDimension::D2Array`.
- `app/src/vangers.wasm`/`vangers.mjs` are rebuilt from `emscripten/` (`ninja vangers`).

## Capabilities

### New Capabilities
- `terrain-data-texture`: placement of the level surface data (height/meta) in a GPU texture within the device limits.

### Modified Capabilities
<!-- The project has no main specs for this area yet. -->

## Impact

- `vange-rs/src/render/terrain/mod.rs` — texture creation, layout, `SurfaceConstants`, `update_dirty`.
- `vange-rs/src/render/object.rs`, `vange-rs/src/render/mod.rs` — `Object surface` layout and view as `D2Array`.
- `vange-rs/res/shader/surface.inc.wgsl` — fetch from the layer array (included by all terrain shaders: ray, slice, paint, scatter, voxel).
- `vange-rs/tests/shaders.rs` — naga shader parsing covers the syntax of the changed include.
- `app/src/vangers.wasm`, `app/src/vangers.mjs` — rebuilt binary artifacts.
- Desktop: two layers of 8192 with the same memory as before; the picture does not change; one extra integer division/modulo per fetch.
- There are no render tests; verification is `cargo test --test shaders`, a native build, and running the map on the device and on desktop.
