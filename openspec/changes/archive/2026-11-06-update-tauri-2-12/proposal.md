# Proposal

## Why

The app is built on `tauri 2.11.2` / `@tauri-apps/cli 2.11.2` / `@tauri-apps/api 2.11.0` (from `app/src-tauri/Cargo.lock` and `app/yarn.lock`), while the latest stable release is `tauri 2.12.5` and `@tauri-apps/cli 2.12.4` from 2026-10-21. The fixes accumulated in between hit exactly our Android workflow: a crash when installing an APK over the running app (#15949), wrong port matching in `adb reverse` during `tauri android dev` (#16105), and the changed behaviour of `AppHandle::exit` on Android (#14767), which our `exit_app` command calls. The requirements in `Cargo.toml` and `package.json` are `"2"` / `^2` → the update needs no manifest changes and stays within the semantics of the current dependencies.

## What Changes

- `app/src-tauri/Cargo.lock`: `tauri` 2.11.2 → 2.12.5, `tauri-build` → 2.7.4, `tauri-plugin-fs` / `tauri-plugin-opener` → latest 2.x; transitively `wry` 0.55.1 → 0.57.1, `tao` 0.35.2 → 0.37.
- `app/yarn.lock`: `@tauri-apps/cli` → 2.12.4, `@tauri-apps/api` → 2.12.4, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-opener` → latest 2.x. The versions in `package.json` do not change (`^2`).
- The generated Android project `app/src-tauri/gen/android` is **not regenerated**: `tauri android init` is not run. The committed Gradle 8.14.3 / Kotlin 1.9.25 / `kotlinOptions` satisfy the new minimum (Gradle ≥ 8.13) and keep our edits in `MainActivity.kt` (edge-to-edge, immersive mode).
- The behaviour of `exit_app` on Android changes on the Tauri side: instead of `exit(0)` of the process the Activity is finished → the app closes with the system transition. Our code does not change, but this has to be verified on a device.
- No changes to the code in `app/src-tauri/src/lib.rs`, `app/src/**`, `tauri.conf.json`, capabilities: none of the APIs we use (`Channel`, `register_uri_scheme_protocol`, `AppHandle::exit`, `get_webview_window`, devtools) is broken in 2.12. The 2.12 breaking changes (`with_webview`, dropped Windows 7) do not affect the project.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The change sets `skip_specs: true`: this is a dependency update without requirement changes. The existing specs serve as acceptance criteria:

- `android-build` — CI builds signed AAB/APK, the APK installs over the previous build with the data preserved;
- `ios-build` — CI builds an unsigned IPA;
- `game-data-download` — download with progress through `Channel<DownloadProgress>` and atomic data installation.

## Impact

- `app/src-tauri/Cargo.lock`, `app/yarn.lock` — the only files that change.
- Rust toolchain: `wry` 0.57 raised the MSRV to 1.85 and moved to edition 2024. Locally `rustc 1.95.0`, in CI `dtolnay/rust-toolchain@stable` → the constraint is satisfied.
- CI `.github/workflows/tauri-release.yml`: Java 17, Gradle 8.14.3 from the wrapper, NDK 27.2 — all within the ranges 2.12 accepts. The `Swatinem/rust-cache@v2` cache gets the `tauri-utils` 2.10.2 fix (#16199) for a target dir restored at a different path.
- Side improvements that need no action on our side: `tauri-codegen` 2.7.4 pins the mtime of generated assets → the first `cargo build` without changes no longer recompiles the app crate (#16324); the `Channel` payload queue is bound to the webview and purged when it closes; on Android initialization scripts run once through `DOCUMENT_START_SCRIPT` (wry #1895); `Range` is no longer applied twice to `206` responses of custom protocols (wry #1865) — our `vfile` serves only `200`, so it is not directly affected.
- Out of scope: `tauri 3.0.0-alpha`, updating the Android template (Gradle 9.6 / AGP 9.3 / Kotlin 2.2 / targetSdk 37), updating `reqwest` / `zip` and other non-Tauri crates.
