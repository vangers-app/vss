# Design

## Context

Motivation — see proposal.md, "Why". The current state that matters for the approach:

- The manifests already allow 2.12: `app/src-tauri/Cargo.toml` → `tauri = { version = "2", features = ["devtools"] }`, `tauri-build = "2"`, `tauri-plugin-fs = "2"`, `tauri-plugin-opener = "2"`; `app/package.json` → `@tauri-apps/cli ^2`, `@tauri-apps/api ^2`, `@tauri-apps/plugin-fs ^2.5.1`, `@tauri-apps/plugin-opener ^2`. The versions are pinned only in the lock files.
- The Android project `app/src-tauri/gen/android` is committed and hand-edited: `MainActivity.kt` (edge-to-edge, immersive mode), `buildSrc/.../BuildTask.kt`, `RustPlugin.kt`. Gradle wrapper 8.14.3, `kotlin-gradle-plugin` 1.9.25, `kotlinOptions { jvmTarget = "1.8" }`, `compileSdk = targetSdk = 36`.
- CI (`.github/workflows/tauri-release.yml`): `dtolnay/rust-toolchain@stable`, Java 17, `platforms;android-36 build-tools;36.0.0 ndk;27.2.12479018`, `yarn tauri android build --aab --apk --target aarch64 --ci`, `Swatinem/rust-cache@v2`.
- The Rust code uses from Tauri: `tauri::ipc::Channel`, `register_uri_scheme_protocol("vfile", …)` with `200/400/403/404` responses and no `Range`, `AppHandle::exit`, `get_webview_window("main")` + devtools, `tauri::ipc::Response`. The frontend: `invoke`, `Channel` from `@tauri-apps/api/core`, `plugin-fs`, `plugin-opener`.
- Verification per `AGENTS.md`: only the emscripten build through Tauri — desktop (`yarn tauri dev`, WebKitGTK) and Android (`yarn tauri android dev --host 127.0.0.1`).

## Goals / Non-Goals

**Goals:**

- Move both lock-file chains (Cargo and yarn) to the latest Tauri 2.x in one coordinated step: the Rust crate `tauri` and the JS `@tauri-apps/api` must be on the same minor (2.12), otherwise the frontend may call commands the backend does not have.
- Keep the committed `gen/android` unchanged.
- Confirm on a device the two behaviours that changed: closing through `exit_app` and installing an APK over the running app.

**Non-Goals:**

- Regenerating the Android/iOS templates (`tauri android init`, `tauri ios init`).
- Updating non-Tauri dependencies (`reqwest`, `zip`, `serde`, Vite etc.) — a separate change if needed.
- Moving to `tauri 3.0.0-alpha`.
- Changing `tauri.conf.json`, capabilities, `lib.rs`.

## Decisions

**1. Targeted `cargo update -p …` instead of a full `cargo update`.**
A full `cargo update` would also update `reqwest`, `zip`, `tokio` and more → the lock-file diff becomes unreadable and any regression is indistinguishable from a Tauri regression. A targeted update of `tauri tauri-build tauri-plugin-fs tauri-plugin-opener` pulls only their transitive dependencies (`wry`, `tao`, `tauri-utils`, `tauri-runtime*`, the `webkit2gtk` crates if needed). The alternative — editing `Cargo.lock` by hand — was rejected as fragile.

**2. `yarn upgrade` by package names, not `yarn upgrade` as a whole.**
Same logic for JS: only `@tauri-apps/cli`, `@tauri-apps/api`, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-opener` are updated. The CLI and the `tauri` crate do not have to match patch for patch (CLI 2.12.4 against crate 2.12.5 is fine: they are different packages with independent numbering within one release).

**3. `gen/android` is not regenerated.**
The new 2.12 template (Gradle 9.6.1, AGP 9.3.1, Kotlin 2.2, `compilerOptions`, targetSdk 37, Material3 theme, `consumer-rules.pro`) is applied only through `tauri android init`. Our Gradle 8.14.3 ≥ the new minimum 8.13; Kotlin 1.9.25 accepts `kotlinOptions` (only Kotlin 2.3+ errors on it); Java 17 is compatible with Gradle 8.14. Regeneration risks overwriting `MainActivity.kt` and `buildSrc` and gives nothing for the task at hand. The `tauri-android` library (with `TauriActivity` / `WryActivity`) is not committed: `gen/android/.gitignore` excludes `/.tauri` and `/tauri.settings.gradle`, `tauri-build` generates them from the `tauri` crate on every build. Therefore the JNI lifecycle hook renames of tao 0.36 (`create` → `onFirstActivityCreate` etc.) are handled inside Tauri itself: `MainActivity` overrides only `onCreate` and `onWindowFocusChanged`, which were not renamed.

**4. The `exit_app` code stays, the behaviour is verified.**
In 2.12 `AppHandle::exit` on Android finishes the Activity (`finish()`) instead of the process. For our scenario (the exit button in the UI, `app/src/addons/app-exit.ts`) this is the desired behaviour: the system transition instead of a black screen. If the device shows that the Activity stays in recents with a frozen WebView, that is a reason for a separate change, not for a fix here.

**5. Verification order: desktop first, then Android, then CI.**
Desktop (`yarn tauri dev`) catches compile errors and `vfile`/`Channel` incompatibilities within minutes. The Android check is more expensive (build + device), so it comes after a green desktop. The CI run on the branch is last; it covers `tauri android build --aab --apk`, the iOS IPA and the Linux/Windows/macOS bundles that are not built locally.

## Risks / Trade-offs

- [The transitive `webkit2gtk-rs` update requires a newer system `libwebkit2gtk-4.1`] → `tauri` 2.10 already removed the upper version bound (#14873); if the desktop `cargo build` does not link, revert the lock files (`git checkout app/src-tauri/Cargo.lock app/yarn.lock`) and record the system library version in this document as an open question.
- [`cargo update -p` pulls crates with `edition = "2024"` (wry 0.57)] → MSRV 1.85; locally 1.95, CI stable → not blocking. If a contributor has an old toolchain, the error is explicit (`feature edition2024 is required`).
- [Frontend 2.12.4 and backend 2.12.5 expect new internal commands from each other] → both are updated in one commit; a mixed state (only yarn.lock or only Cargo.lock updated) is not allowed.
- [`tauri android dev` in 2.12 handles `adb reverse` differently (#16105): it removes "stale" forwards on other connected devices] → keep a single device connected during verification.
- [The `exit_app` behaviour changed without our code] → an explicit device check; the criterion is that the app closes with the transition and a relaunch from the launcher starts it fresh instead of showing a frozen WebView.
- [The install-over check: fix #15949 closes the crash exactly at `adb install -r` over the running app] → this scenario is exercised on purpose: start the game, install the new APK without closing it, confirm there is no `IllegalStateException` in `logcat`.
- [The `tauri-utils` 2.10.2 CI cache fix (#16199) changes the permission file paths in `OUT_DIR`] → the first CI run after the update may build the app crate from scratch; expected and one-off.

## Migration Plan

1. On the branch: `cd app && yarn upgrade @tauri-apps/cli @tauri-apps/api @tauri-apps/plugin-fs @tauri-apps/plugin-opener`.
2. `cd app/src-tauri && cargo update -p tauri -p tauri-build -p tauri-plugin-fs -p tauri-plugin-opener`.
3. Desktop → Android (device) → push the branch and a green `Tauri Release`.
4. One commit with both lock files.

Rollback: `git revert` of that commit. The lock files are the only thing that changes; no state on the device or in CI migrates.

## Verification Notes

- The desktop check passed with the system `libwebkit2gtk-4.1` = 2.52.6 (`pkg-config --modversion`, 2026-11-06): the `tauri` 2.12.5 / `wry` 0.57.1 build links without changes; the download through `Channel`, cancel, atomic installation, `vfile` (200 / 403) and `exit_app` (exit code 0) work.
- In two of five desktop runs under `tauri dev` the app exited on its own with code 0 without any interaction (about 1 s after start and after 319 s, both before the checks began). Not reproduced in three later runs totalling >15 minutes (the binary run directly and under the CLI with `strace`): no coredump, panic or signal in the logs. The cause was not established; it did not affect the acceptance criteria.
- Android (TECNO AD10, Android 15, 2026-11-06): CI APK 1128 (`tauri` 2.12.5) installed with `adb install -r` over the running 1126 (`tauri` 2.11.2) — no `IllegalStateException`/`FATAL EXCEPTION` in logcat, the game starts straight away after launch (data preserved). `exit_app` → the Activity finished, focus returned to the previous app, the process exited on its own (`ApplicationExitInfo reason=EXIT_SELF status=0`), a relaunch displayed `MainActivity` in 164 ms. Immersive: `statusBars`/`navigationBars visible=false`, a swipe from the top edge shows the bar, hidden again after 5 s. `tauri android dev --host 127.0.0.1` (CLI 2.12.4) sets up exactly one `adb reverse tcp:1420 tcp:1420` itself, the page comes from Vite (`/@vite/client`, `/src/main.tsx`).
- CI run 42202344476: `linux-x86_64`, `windows-x86_64`, `android-aarch64`, `ios-aarch64` — success; `macos-aarch64` — cancelled without a runner, as in the runs before the change.
