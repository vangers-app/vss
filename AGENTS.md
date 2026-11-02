# vss

## Build targets

- The only supported build of the game and of the `vange-rs` submodule in this
  project is `wasm32-unknown-emscripten`: `emcmake cmake` in `emscripten/`, then
  `ninja vangers` (it runs `cargo build -p rusty-vangers --target
  wasm32-unknown-emscripten` itself and links `app/src/vangers.wasm`).
- Native builds of the game (`cargo build` without a target, native CMake) are
  not supported. Do not use them to verify a change.
- Verification of a change is the emscripten build run through the Tauri app:
  desktop (`cd app && yarn tauri dev`, WebKitGTK) and Android (`yarn tauri
  android dev --host 127.0.0.1`).
- Host-side `cargo test` in `vange-rs` (for example `--test shaders`) is fine
  as a quick check, but it is not a build of the game.
