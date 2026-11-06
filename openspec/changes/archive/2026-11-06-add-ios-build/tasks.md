# Tasks

## 1. Build configuration: resources and iOS

- [x] 1.1 Move `bundle.resources` from `app/src-tauri/tauri.conf.json` into a new `app/src-tauri/tauri.android.conf.json`; verify: `cd app && yarn install --frozen-lockfile && cargo build --manifest-path src-tauri/Cargo.toml` on Linux without `resources/game-data.zip` passes (it used to fail with `resource path ... doesn't exist`).
- [x] 1.2 Add `bundle.iOS.minimumSystemVersion: "15.2"` to `tauri.conf.json`; verify: `yarn tauri build --help` does not complain about the config, `cargo build` from 1.1 passes.
- [x] 1.3 Create `app/src-tauri/Info.ios.plist` (landscape left/right, `UIStatusBarHidden`, `UIViewControllerBasedStatusBarAppearance=false`, `UIRequiresFullScreen`); verify: `plutil -lint` on a macOS runner or `python3 -I -c "import plistlib,sys; plistlib.load(open(sys.argv[1],'rb'))" app/src-tauri/Info.ios.plist` locally.
- [x] 1.4 (the `icons/ios/*` icons were already committed, generation was not needed) Generate iOS icons `cd app && yarn tauri icon src-tauri/app-icon.png`, commit only `src-tauri/icons/ios/`, revert the other generated files with `git checkout`; verify: `git status` shows only `icons/ios/*`, the folder contains `AppIcon-512@2x.png`.

## 2. Rust: game data download

- [x] 2.1 Generalise `download_and_extract` in `app/src-tauri/src/lib.rs` to `(url, zip_path, tmp_dir, final_dir, locate_root)` and switch `download_mods` to it without behaviour changes; verify: `cargo build` passes, `download_mods` on desktop installs mods into `app_data/mods/scripts` as before.
- [x] 2.2 Add the `GAME_DATA_URL` constant next to `MODS_URL` (the value is a placeholder, filled in by the user) and the command `download_game_data(app, on_progress)`: archive in `cache/game-data-download.zip`, extraction into `app_data/data-tmp`, `rename` into `app_data/data`, cleanup on error/cancel; register in `generate_handler!`; verify: `cargo build`, on Linux with the Steam path renamed the download creates `app_data/data`, after which `find_install` returns files.
- [x] 2.3 Verify cancel and error: call `cancel_download` during the download → `data-tmp` and the zip are removed, `app_data/data` is not created; with an unreachable URL the command returns `Err` with the error text.

## 3. Frontend: download screen

- [x] 3.1 Add `download_game_data` to `app/src/compat.ts` modelled on `download_mods` and `kind: "mods" | "game-data"` to `DownloadState` (`app/src/store.ts`); verify: `cd app && yarn build` (tsc) passes.
- [x] 3.2 Parametrise `app/src/ui/download-mods.tsx` by `download.kind` (titles, labels, retry function) and add `startGameDataDownload`; on the `done` phase for `game-data` the Restart button does `location.reload()`; verify: `yarn build` passes, the mods modal looks and behaves as before.
- [x] 3.3 In `app/src/ui/data-not-found.tsx` add the "Download game data" button, render the modal when `download.active`, hide Exit when `window.__VSS_MOBILE__ === true`; verify: on Linux without the Steam path pressing the button shows progress, after Restart the game starts; with mobile emulation (`pointer: coarse` in devtools) there is no Exit button.
- [x] 3.4 Verify the repeated launch: after the data is installed, restarting the app starts the game immediately, without the "Game data not found" screen and without network requests to `GAME_DATA_URL`.

## 4. GitHub Actions: job `ios`

- [x] 4.1 Add job `ios` to `.github/workflows/tauri-release.yml` on `macos-15-intel` (the `macos-14` arm64 runners were not allocated three times, see design D3): checkout with submodules, Ninja, emsdk 5.0.2, CMake 4, Rust with `aarch64-apple-ios`, rust-cache (key `ios-aarch64`), Node 20, wasm build (copy of the step from `build`), `yarn install --frozen-lockfile`, `yarn tauri ios init --ci` (env `APPLE_DEVELOPMENT_TEAM` with a dummy value), `yarn tauri ios build --ci --no-sign`; verify: `actionlint` or review in GitHub without syntax errors.
- [x] 4.2 Artifact collection: find `app/src-tauri/gen/apple/build/arm64/*.ipa`, copy to `dist-artifacts/Vangers-<ref>-ios-aarch64.ipa`, `upload-artifact` named `Vangers-ios-aarch64`; `release` job — `needs: [build, ios]`; verify: a `workflow_dispatch` run on the branch is green, the artifact downloads, `unzip -l` shows `Payload/*.app/Info.plist`.
- [x] 4.3 Verify the `Info.plist` contents in the artifact: `UISupportedInterfaceOrientations` landscape only, `UIStatusBarHidden` true, `MinimumOSVersion` 15.2, the AppIcon icon is present (`unzip -l | grep AppIcon`).

## 5. Documentation and device check

- [x] 5.1 README: an "iOS" section under "Mobile APP" — where to get the IPA (run artifact / Release), installation via Sideloadly or AltStore with a free Apple ID, the 7-day limit, the first launch downloads the data; verify: the links in the section open.
- [ ] 5.2 Integration check on an iPhone 8: sign the IPA via Sideloadly, launch, download the data, reach the game screen; record in the PR comment the result on memory (the app is not killed by WKWebView) and sound; on failure — open separate issues without extending this change.
