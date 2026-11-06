# Proposal

## Why

The Android build exists only locally and carries 163 MB of game data inside the APK, while the iOS build downloads the data from a URL hardcoded in `lib.rs` that currently answers 404. A single way of delivering the data is needed for every platform (download from a CDN on first launch, the URL set at the GitHub level, not in the code), plus an Android build in GitHub Actions as an AAB for Google Play signed with the existing upload key.

## What Changes

- `GAME_DATA_URL` stops being a constant in the code: it is taken at build time from an environment variable (`option_env!`) that the workflow gets from the GitHub Variable `GAME_DATA_URL`. Without the variable the build passes, but the download returns the error "GAME_DATA_URL is not set".
- **BREAKING** for the Android build: the game data is no longer bundled into the APK. `tauri.android.conf.json` (`bundle.resources`) is removed, the Android branch extracting from resources in `get_local_data_path` is removed; Android shows the same "Game data not found" screen with a "Download game data" button as desktop and iOS.
- New job `android` in `.github/workflows/tauri-release.yml`: Ubuntu runner, Android SDK/NDK, `aarch64-linux-android`, `tauri android build --aab --apk --target aarch64`. Artifacts `Vangers-<ref>-android-aarch64.aab` (for Google Play) and `.apk` (for sideloading); on a tag they go into the GitHub Release. `release` job → `needs: [build, ios, android]`.
- Android signing with the existing keystore `vandroid` (the upload key of the app `com.caiiiycuk.github.vangers.gp` in Play Console) from the secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`; `signingConfigs` driven by `key.properties` is added to `gen/android/app/build.gradle.kts`.
- `versionCode` for Android is set in CI as `1100 + github.run_number` via `--config` (the last one uploaded to Play is 1027; the automatic one from `version: 0.1.0` would be 1000 and rejected).
- README: the Android section is rewritten (CI artifacts, AAB/APK, the data is downloaded on first launch), a description of the `GAME_DATA_URL` variable for local builds is added.
- Outside the repository (done by the user): the GitHub Variable `GAME_DATA_URL` and the four keystore secrets.

## Capabilities

### New Capabilities
- `android-build`: building a signed Android AAB/APK in CI with a monotonic `versionCode`, publishing the artifacts and getting them into the Release.

### Modified Capabilities
- `game-data-download`: the source URL is set at build time from the environment instead of being hardcoded; Android downloads the data the same way as desktop and iOS (the "Android: extraction from the bundle" scenario is replaced); when the URL is missing from the build an error is shown.
- `ios-build`: the requirement "The build does not require game data" is extended to Android — bundling `resources/game-data.zip` is removed from every platform.

Both modified specs currently exist only as deltas of the unarchived change `add-ios-build` (they are not yet in `openspec/specs/`). This change MUST be archived after `add-ios-build`; at archive time the `### Requirement:` headers in the MODIFIED blocks are matched against the already-English main specs.

## Impact

- `.github/workflows/tauri-release.yml` — `env.GAME_DATA_URL` at the workflow level, new job `android`, `release.needs`.
- `app/src-tauri/src/lib.rs` — `GAME_DATA_URL` via `option_env!`, removal of the Android branch in `get_local_data_path` and of the now unused imports `tauri_plugin_fs::{FsExt, OpenOptions}` / `BaseDirectory`.
- `app/src-tauri/tauri.android.conf.json` — removed.
- `app/src-tauri/gen/android/app/build.gradle.kts` — `signingConfigs.release` from `key.properties`.
- `README.md` — Android section, description of `GAME_DATA_URL`.
- `.gitignore` — the line `app/src-tauri/resources/game-data.zip` becomes redundant (remove).
- No new dependencies: `@tauri-apps/cli@2.11.2` supports `--aab`, `--apk`, `--target`, `--config` and `bundle.android.versionCode` (verified against `config.schema.json`).
- Local development: `tauri dev`/`tauri build` without `GAME_DATA_URL` in the environment still build; the download button shows an error.
- Users of the old Android build: the data extracted from the APK into `app_data/data` stays and is used; no new download starts.
