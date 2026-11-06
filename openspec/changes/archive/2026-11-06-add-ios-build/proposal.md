# Proposal

## Why

The app is built for Linux/Windows/macOS in GitHub Actions and for Android locally, but there is no iPhone build and it cannot be made locally: there is no Mac with Xcode. An iOS build is needed right in Actions, with a result that can be downloaded and installed on an iPhone 8 with a free Apple ID via Sideloadly/AltStore. Along the way: desktop CI has been broken since commit `76c20fb` — `bundle.resources` requires `resources/game-data.zip`, which is absent on the runner (verified in the log of run 40895085436: `resource path 'resources/game-data.zip' doesn't exist`).

## What Changes

- New job `ios` in `.github/workflows/tauri-release.yml`: build on `macos-15-intel` for `aarch64-apple-ios`, unsigned IPA via `tauri ios build --no-sign`, artifact `Vangers-<ref>-ios-aarch64.ipa`, attached to the GitHub Release on a tag together with the others.
- The Xcode project (`gen/apple`) is generated in CI by `tauri ios init --ci` and is not committed.
- iOS configuration of the app: iOS icons, minimum iOS version, `Info.ios.plist` (landscape only, hidden status bar, fullscreen).
- `bundle.resources` with `resources/game-data.zip` moves to `tauri.android.conf.json` → desktop and iOS builds stop requiring the archive at build time; Android keeps bundling the data as before.
- In-app game data download: new Rust command `download_game_data` with the URL hardcoded in the source (a constant next to `MODS_URL`), based on the existing `download_mods` mechanism (streaming with progress, extraction into a temporary folder, atomic rename into `app_data/data`).
- The `DataNotFound` screen gets a "Download game data" button with progress/error/cancel; after success the app restarts and finds the data through the existing `find_install`. The Exit button is hidden on mobile (iOS does not let an app close itself).
- README: iOS section — how to get the IPA from Actions and install it via Sideloadly.

## Capabilities

### New Capabilities
- `ios-build`: building an unsigned iOS IPA in CI without Apple secrets and without game data; platform conditions for bundling the data (Android only).
- `game-data-download`: downloading and installing the game data from inside the app when no local installation is found.

### Modified Capabilities
<!-- The project has no existing specs (`openspec list --specs` is empty). -->

## Impact

- `.github/workflows/tauri-release.yml` — new job `ios`.
- `app/src-tauri/tauri.conf.json`, new `tauri.android.conf.json`, new `Info.ios.plist`, `icons/ios/*`.
- `app/src-tauri/src/lib.rs` — generalisation of `download_and_extract`, command `download_game_data`.
- `app/src/compat.ts`, `app/src/ui/data-not-found.tsx`, `app/src/ui/download-mods.tsx`, `app/src/main.tsx` — download UI.
- `README.md` — iOS instructions.
- No new dependencies: `reqwest`, `zip`, `@tauri-apps/cli@2.11.2` (in the lockfile, contains `--no-sign`) are already present.
- Side effect: the red desktop CI gets fixed.
