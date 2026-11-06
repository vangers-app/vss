# Tasks

## 1. Updating the lock files

- [x] 1.1 In `app/` run `yarn upgrade @tauri-apps/cli @tauri-apps/api @tauri-apps/plugin-fs @tauri-apps/plugin-opener`; check that in `app/yarn.lock` `@tauri-apps/cli` and `@tauri-apps/api` became 2.12.x and that `app/package.json` did not change (`git diff --stat app/package.json` is empty)
- [x] 1.2 In `app/src-tauri/` run `cargo update -p tauri -p tauri-build -p tauri-plugin-fs -p tauri-plugin-opener`; check in `Cargo.lock` that `tauri` = 2.12.5, `tauri-build` = 2.7.4, `wry` = 0.57.x, `tao` = 0.37.x, and that `reqwest`, `zip`, `serde`, `tokio` stayed on their previous versions (`git diff app/src-tauri/Cargo.lock | grep '^-version'` does not contain them)
- [x] 1.3 Make sure `app/src-tauri/gen/android` and `gen/apple` did not change (`git status --porcelain app/src-tauri/gen` is empty) and `tauri android init` was not run

## 2. Desktop verification

- [x] 2.1 Build and run `cd app && yarn tauri dev` (WebKitGTK); check that compilation passed without `webkit2gtk` link errors, the game starts, the menu opens, devtools toggle through the `toggle_devtools` command
- [x] 2.2 Check the game data download on a clean profile (delete the data from the app data dir): progress through `Channel<DownloadProgress>` updates, cancel works, installation is atomic — criteria from `openspec/specs/game-data-download/spec.md`
- [x] 2.3 Check file loading through the `vfile` protocol (the game reads the data after installation) and exit through `exit_app` on desktop — the window closes, the process exits with code 0

## 3. Android verification

- [x] 3.1 With a single connected device run `cd app && yarn tauri android dev --host 127.0.0.1`; check that `adb reverse --list` contains exactly one forward to the dev server port and the game loads from it
- [x] 3.2 Without closing the running game, install the new APK over it (`adb install -r`); check in `adb logcat` that there is no `IllegalStateException: LifecycleOwner ... is attempting to register` and the app starts after the installation (scenario "The APK installs over the previous build" from `openspec/specs/android-build/spec.md`: the game data is preserved)
- [x] 3.3 Press exit in the game (`exit_app`); check that the app closes with the system transition without a black screen, no frozen WebView stays in recents, and a relaunch from the launcher starts the app fresh
- [x] 3.4 Check the immersive mode and edge-to-edge from `MainActivity.kt`: the system bars are hidden during play and appear on an edge swipe

## 4. CI and commit

- [x] 4.1 Commit `app/yarn.lock` and `app/src-tauri/Cargo.lock` in one commit (`Update Tauri to 2.12`), push the branch and wait for a green `Tauri Release`: AppImage/exe built, signed AAB and APK (`apksigner verify --print-certs` gives the `vandroid` fingerprint), unsigned IPA. The `macos-aarch64` job (dmg) in this and the previous runs is cancelled after 1 s without a `macos-14` runner being allocated — a CI condition that predates the change, not part of the criterion
- [x] 4.2 Record in `design.md` → "Open Questions" the actual `libwebkit2gtk-4.1` version the desktop check passed with, and remove the question
