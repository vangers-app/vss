# Design

## Context

Motivation — in proposal.md (Why). What matters for the approach (verified against the code):

- The game is WebAssembly (emscripten, `-sASYNCIFY=1`, no pthreads/SharedArrayBuffer), 3D through wgpu-hal GLES → WebGL2 (`src/CMakeLists.txt:150-151`), data in OPFS via `createSyncAccessHandle` in a worker. For iOS only the Rust Tauri shell is compiled; the wasm is the same as for desktop/Android.
- CI already uses the `macos-14` runner, emsdk, CMake 4, Rust toolchain; those steps are reused.
- The mobile UI (`app/src/mobile/*`) is enabled by `pointer: coarse`/UA — it works on iPhone without changes.
- `lib.rs` already contains `cfg(any(android, ios))` for imports and an empty Steam path list; bundle extraction is `cfg(android)` only.
- `download_mods` (`lib.rs:416-522`) is a ready pattern: streaming into cache, `Channel<DownloadProgress>`, `CANCEL_DOWNLOAD`, extraction into tmp, `rename`.
- `@tauri-apps/cli` 2.11.2 is in `yarn.lock`; the `tauri ios build --no-sign` flag appeared in 2.11.0 (PR tauri-apps/tauri#15061) and puts the IPA at `gen/apple/build/arm64/<productName>.ipa`.
- Tauri merges `tauri.<platform>.conf.json` over `tauri.conf.json` (tauri-utils `config/parse.rs`) and picks up `Info.ios.plist` next to the config (tauri-utils `config.rs`, `IosConfig`).
- The custom scheme `vfile://localhost/...` in `compat.ts` is the form for macOS/iOS/Linux; iOS matches desktop.

## Goals / Non-Goals

**Goals:**
- One job in the existing workflow, no secrets, an artifact in the same naming format.
- Minimum new code: reuse `download_and_extract` and the progress modal.
- Desktop CI green again.

**Non-Goals:**
- Signing in CI, TestFlight, App Store — separate work once a paid account exists.
- Android CI and changing how data is delivered on Android.
- Optimising wasm memory/performance for iPhone 8 — checked by the first launch, fixes by result.
- Localisation of the `DataNotFound` screen (English only for now).

## Decisions

### D1. `gen/apple` is generated in CI, not committed
`yarn tauri ios init --ci` in the job before the build. There is no Mac for local regeneration → a committed project would drift from the config (Tauri complains about a stale `gen/apple` when `identifier` changes). Everything that needs configuring in the Xcode project is expressed through `tauri.conf.json` (`bundle.iOS.*`) and `Info.ios.plist`. Alternative — committing `gen/apple` after the first run (downloaded as an artifact) — kept as a fallback if init in CI needs manual edits.

### D2. Unsigned IPA via `tauri ios build --no-sign`
Instead of a manual `xcodebuild archive` + packaging `Payload/` — the CLI flag does the same (archive without codesign, extracts the `.app`, writes the IPA). Fewer scripts in the workflow, a stable artifact path: `app/src-tauri/gen/apple/build/arm64/*.ipa`. `--ci` disables interactivity. Fallback in case of problems — `xcodebuild` with `CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO` (described in tauri-apps/tauri#14940).

### D3. Separate job `ios` on an Intel runner, not a matrix entry
Runner — `macos-15-intel`: when checked (run 40903884033, three reruns) GitHub never allocated a macOS arm64 runner ("The job was not acquired by Runner of type hosted"); the existing `macos-aarch64` job failed too. Xcode on Intel builds the arm64 iOS app just the same (verified: run 40912033657, 28 min, Mach-O arm64 in the IPA). The build steps differ (`ios init`, `ios build` instead of `tauri build --target`), the artifact is collected from a different path. The preparation steps (checkout, emsdk, cmake, rust, node, wasm build, `yarn install`) are duplicated; this is a deliberate price for the readability of the matrix job. The `release` job adds `needs: [build, ios]`; `download-artifact` with `merge-multiple` picks up the IPA without changes.

### D4. Android resources — in `tauri.android.conf.json`
`bundle.resources: ["resources/game-data.zip"]` moves from `tauri.conf.json` into `app/src-tauri/tauri.android.conf.json`. For Linux/Windows/macOS/iOS `resources` becomes empty → `tauri-build` does not look for the file. The Rust extraction code stays under `cfg(target_os = "android")` unchanged.

### D5. iOS configuration
- `tauri.conf.json` → `bundle.iOS.minimumSystemVersion: "15.2"` (OPFS sync access handle in WKWebView since 15.2; WebGL2 since 15.0). iPhone 8 on iOS 16.x passes.
- `app/src-tauri/Info.ios.plist`: `UISupportedInterfaceOrientations` = landscape left/right, `UIStatusBarHidden = true`, `UIViewControllerBasedStatusBarAppearance = false`, `UIRequiresFullScreen = true`.
- Icons: `yarn tauri icon app-icon.png` generates `icons/ios/*` (and overwrites the rest from the same source); only `icons/ios` is committed. Without them xcodebuild fails on the missing AppIcon.

### D6. Data download — generalise `download_and_extract`
One function `download_and_extract(url, zip_path, tmp_dir, final_dir, locate_root)`:
- `download_mods`: `locate_root` looks for the folder with `mods.json` (as now), `final_dir = app_data/mods`, nested `scripts/`.
- `download_game_data`: archive root = data root (that is how `scripts/pack-game-data.sh` packs it), `final_dir = app_data/data`, tmp = `app_data/data-tmp`, archive in `cache/game-data-download.zip`.
Shared: `CANCEL_DOWNLOAD`, progress through `Channel<DownloadProgress>`, cleanup on error/cancel. `GAME_DATA_URL` — a constant next to `MODS_URL`; the user fills in the value (decision: the link is hardcoded, not entered in the UI). `find_install` → `get_local_data_path` already returns `app_data/data` if the folder exists — no changes needed.

Alternative (a URL input field in the UI) was rejected by the user.

### D7. UI: reuse the `DownloadMods` modal
`DownloadMods` currently hardcodes the "mods" texts. The component is parametrised by the download kind (`"mods" | "game-data"`) via `download.kind` in the store; `startModsDownload` gets a twin `startGameDataDownload`, both call one start function with the needed command and label. `DataNotFound` gets a "Download game data" button (only under `TAURI_BUILD`, which is the only case the screen is shown anyway) and renders the modal when `download.active`. On the `done` phase — `location.reload()`, after which `App` calls `find_install` again. The Exit button is hidden when `__VSS_MOBILE__ === true`.

### D8. Network layer on iOS
`reqwest` with `rustls-tls` uses raw sockets, not `NSURLSession` → App Transport Security does not apply, an `http://` URL (for example a LAN server for testing) should work. If it turns out otherwise — add `NSAppTransportSecurity`/`NSAllowsArbitraryLoads` to `Info.ios.plist`.

## Risks / Trade-offs

- [`tauri ios init --ci` requires a development team] → set `APPLE_DEVELOPMENT_TEAM` with a dummy value in the job env; by community reports that is enough for init.
- [`-sINITIAL_MEMORY=512MB` + growth on an iPhone 8 with 2 GB RAM, WKWebView kills the process] → check with the first launch; on a crash lower the initial memory for the wasm build (separate change, out of scope).
- [Audio in WKWebView requires a user gesture] → the mobile UI already starts with a tap; if there is no sound — check `AudioContext.resume` in the mobile frame.
- [7-day signature of a free Apple ID] → documented in README; reinstalling with the same bundle id keeps the app container (OPFS with data) — check on the device.
- [The IPA is small, but the first data download is hundreds of MB over the phone network] → progress and cancel are mandatory (spec `game-data-download`).
- [Duplicated preparation steps between `build` and `ios`] → accepted for simplicity; with a third mobile job extract into a composite action.

## Migration Plan

1. Merge the change: desktop CI turns green already at the `tauri.android.conf.json` step.
2. First run of the iOS job — check `ios init --ci` and `--no-sign` on the runner; on failure — the fallbacks from D1/D2.
3. Put in the real `GAME_DATA_URL`, check the download on desktop (Linux without the Steam path), then on an iPhone via Sideloadly.
Rollback: delete the `ios` job from the workflow; the remaining edits are safe for desktop/Android.

## Open Questions

- ~~The real value of `GAME_DATA_URL`~~ — set 2026-10-30: `https://cdn.dos.zone/kdlab/vangers/1011/vangers.zip` (300 MB, `data` contents at the root, no encryption); the full download → extraction → Restart cycle verified on desktop with this URL.
