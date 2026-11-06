# Design

## Context

Motivation — in proposal.md (Why). What shapes the approach (verified against the code and the environment):

- `download_game_data` in `app/src-tauri/src/lib.rs` is not limited to a platform; the "Download game data" button and the progress/error modal (`app/src/ui/download-mods.tsx`) are already shown on every platform, Exit is hidden under `__VSS_MOBILE__`. The only Android-specific part is the branch in `get_local_data_path` (`lib.rs:164-176`) extracting `resources/game-data.zip` from the bundle, and `tauri.android.conf.json` with `bundle.resources`.
- `extract_zip_file` is also used in `download_archive` (`lib.rs:384`) — it stays. The imports `tauri_plugin_fs::{FsExt, OpenOptions}` and `BaseDirectory` under `cfg(any(android, ios))` are needed only by the Android branch. The `tauri_plugin_fs::init()` registration stays: the frontend may use the plugin.
- Workflow `.github/workflows/tauri-release.yml`: jobs `build` (matrix), `ios`, `release`; the preparation steps (emsdk 5.0.2, CMake 4, Rust, Node 20, wasm build) are already duplicated between `build` and `ios`.
- `app/src-tauri/gen/android` is committed (40 files): `build.gradle.kts` without `signingConfigs`, `key.properties`/`keystore.properties` in `.gitignore`, Gradle 8.14.3, `compileSdk = 36`, `minSdk = 24`. `tauri android init` is not needed in CI.
- `@tauri-apps/cli` 2.11.2: `tauri android build` accepts `--aab`, `--apk`, `--target`, `--config`, `--ci`; `bundle.android.versionCode` exists in `config.schema.json`. Without it versionCode = `0*1000000 + 1*1000 + 0 = 1000` from `version: 0.1.0`.
- Google Play for `com.caiiiycuk.github.vangers.gp`: the last uploaded versionCode is 1027 (`vangers-android/app/build.gradle`), the upload key is `vangers-android/etc/vandroid.keystore` (JKS, alias `vandroid`, SHA-256 `3A:57:B5:12:…:28:54`). Play App Signing re-signs the AAB with its own key but checks the upload key certificate → a new key would not be accepted.
- CDN file: `https://cdn.dos.zone/kdlab/vss/v1/game-data-v1.zip`, HTTP 200, 171 049 448 bytes, etag = md5 of the local `etc/game-data-v1.zip`, the `data` folder contents at the root — the layout `download_game_data` expects.

## Goals / Non-Goals

**Goals:**
- One data delivery mechanism on every platform; the URL changes in GitHub without a commit.
- The Android job in the same workflow and with the same artifact naming conventions as `build` and `ios`.
- Reproducible signing with the upload key, so that APKs update over each other and the AAB is accepted by Play.

**Non-Goals:**
- Automatic upload of the AAB to Play Console (service account, `upload-google-play`) — a separate change.
- A RuStore build (the old project had a separate flavor).
- Building for `armv7`/`x86_64`: Play requires 64-bit, the target devices are arm64; 32-bit ones are not supported by the wasm with `INITIAL_MEMORY=512MB` memory-wise.
- Extracting the shared workflow steps into a composite action (a third mobile job is a reason, but not in this change).
- Changing `version` in `tauri.conf.json` (`versionName` stays `0.1.0`).

## Decisions

### D1. `GAME_DATA_URL` is fixed into the frontend bundle (Vite), not into Rust
`vite.config.ts` adds `GAME_DATA_URL` to `envPrefix` → `import.meta.env.GAME_DATA_URL` is substituted during `yarn build`; `compat.ts` passes it as the `url` argument to `download_game_data`, which returns `Err("GAME_DATA_URL is not set at build time")` for an empty string — the modal already shows the error text with Retry/Close. The first variant — `option_env!("GAME_DATA_URL")` in `lib.rs` — was rejected by the result of run 42176076849: on Linux and Android the URL got into the binary, but not into the IPA, because `tauri ios build` runs cargo from an Xcode script phase without the job environment. `yarn build` (`beforeBuildCommand`) is executed by the Tauri CLI itself in the job shell on every platform, so the Vite variable reaches everywhere; locally `GAME_DATA_URL=... yarn tauri dev` works (the Vite dev server inherits the environment too). `env!` was rejected: it would break local builds and pull requests from forks. A constant with a default was rejected: the URL must change without a commit.

### D2. A repository variable, not a secret, at the workflow level
`env: GAME_DATA_URL: ${{ vars.GAME_DATA_URL }}` at the root of the workflow → reaches `build`, `ios`, `android` without duplication. The URL is not secret (it is extractable from the binary), and a secret would mask it in the logs when debugging the download. A pull request from a fork does not get `vars` → a build without a URL, which D1 allows.

### D3. Structure of job `android`
`ubuntu-22.04`, modelled on `ios`:
1. checkout with submodules, `actions/setup-java@v4` (temurin 17 — Gradle 8.14 and AGP require JDK 17+), `android-actions/setup-android@v3` with `packages: "platforms;android-36 build-tools;36.0.0 ndk;27.2.12479018 platform-tools"`, `NDK_HOME=$ANDROID_HOME/ndk/27.2.12479018` in the job env (Tauri/cargo-mobile2 looks for `NDK_HOME`).
2. Ninja, emsdk 5.0.2, CMake 4, Rust with `aarch64-linux-android,wasm32-unknown-emscripten`, `rust-cache` with key `android-aarch64`, Node 20, wasm build (copy of the step from `ios`), `yarn install --frozen-lockfile`.
3. Signing (D4), then `yarn tauri android build --aab --apk --target aarch64 --ci --config '{"bundle":{"android":{"versionCode":<N>}}}'` (D5).
4. Collection: `gen/android/app/build/outputs/bundle/universalRelease/*.aab` and `.../apk/universal/release/*.apk` → `dist-artifacts/Vangers-<ref>-android-aarch64.{aab,apk}`; `upload-artifact` named `Vangers-android-aarch64`; `release.needs: [build, ios, android]`.
Linux system deps for WebKitGTK are not needed: `tauri android build` does not build the desktop binary. The alternative — a row in the `build` matrix — was rejected for the same reason as for iOS (different build commands and artifact paths).

### D4. Signing through `key.properties`, conditional
`build.gradle.kts` gets the block standard for Tauri: it reads `rootProject.file("key.properties")`; if the file exists — `signingConfigs.create("release")` with `storeFile`, `storePassword`, `keyAlias`, `keyPassword` and `buildTypes.release.signingConfig`; if there is no file — release stays unsigned (the build passes, spec "A build without signing secrets does not fail"). The workflow step with `if: secrets.ANDROID_KEYSTORE_BASE64 != ''` (via `env` + a bash check, since `secrets` are not available in `if` directly) decodes the keystore into `$RUNNER_TEMP/vandroid.keystore` and writes `gen/android/key.properties` with an absolute path; otherwise it prints a warning. `key.properties` is already in `.gitignore`, the keystore is outside the repository tree. Separate `storePassword`/`keyPassword` instead of the single `password` from the Tauri docs — for the `vandroid` keystore they may differ. The alternative — `apksigner` over an unsigned APK — does not cover the AAB (needs `jarsigner`) and duplicates the logic; rejected.

### D5. `versionCode = 1100 + github.run_number`
Above 1027 with a margin, monotonic within the workflow file, without manual bumps. Substituted via `--config` in CI; local builds get the automatic 1000 — for a device that does not matter (an APK from CI over a local one requires a reinstall, accepted). The `run_number` counter is bound to the path `tauri-release.yml`: renaming the file resets it, but the 1100 offset is still above the last Play code; if by then Play has codes > 1100, raise the offset. The alternative — bumping `version` before every upload — was rejected as manual and conflicting with the desktop version.

### D6. Android moves to the shared download path
Removed: `tauri.android.conf.json` entirely (it contains only `bundle.resources`), the Android branch in `get_local_data_path`, the unneeded cfg imports, the line `app/src-tauri/resources/game-data.zip` in `.gitignore`. The Rust and TS download code does not change. Data already extracted by the old build lies in `app_data/data` → `get_local_data_path` finds it without changes (scenario "after updating from the old build"). The `INTERNET` permission is already in the manifest.

### D7. One run — both AAB and APK
`--aab --apk` in one command: one Rust/Gradle build, two outputs. The APK is needed for installation on a device without Play (testing, sideload), the AAB — for the console. Both are signed with the same upload key, so an APK from CI updates over an APK from CI.

## Risks / Trade-offs

- [The NDK/SDK version in `setup-android` is incompatible with cargo-mobile2 or the AGP from `gen/android`] → first run; on failure take the NDK the user's local environment installs (`sdkmanager --list_installed`) and pin it in the workflow.
- [The Gradle output file names differ from `app-universal-release.*`] → the collection step uses a glob over the `outputs/bundle/**/*.aab` and `outputs/apk/**/*.apk` directories and fails with `::error` if empty; refine after the first run.
- [`option_env!` and `rust-cache`: an old URL value from the cache] → check on the first run after changing the variable (`strings` on the `.so` in the APK); on a problem add `GAME_DATA_URL` to the rust-cache `key`.
- [The keystore passwords are lost] → without them signing is impossible; check `keytool -list -storepass` locally before creating the secrets.
- [Play rejects the first AAB: `targetSdk`/policies, missing 64-bit for other ABIs] → `targetSdk = 36`, arm64 is present; the console shows the concrete reason, the fix is separate.
- [A user of the old Android build without data (never launched it)] → sees the download screen like a new user; acceptable.
- [Duplicated preparation steps in a third job] → accepted; a composite action is out of scope.

## Migration Plan

1. The user: `gh variable set GAME_DATA_URL -R vangers-app/vss --body "<url>"`, the four keystore secrets from `vangers-android/etc/vandroid.keystore`.
2. Merge the change; first `workflow_dispatch` run: check the signature (`apksigner verify --print-certs`), the versionCode (`aapt dump badging` or `bundletool dump manifest`), the URL in the binary.
3. Upload the AAB to the internal track of Play Console manually; install the APK on a device, go through the data download.
Rollback: restore `tauri.android.conf.json` and the Android branch in `lib.rs`, delete the job — desktop/iOS are not affected; the variable and secrets are harmless.

## Open Questions

- The exact paths of the `.aab`/`.apk` in `gen/android/app/build/outputs/` for `--target aarch64` (universal or per-ABI) — refined by the first run, they do not affect the specs and tasks (glob).
