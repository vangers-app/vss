# android-build Specification

## Purpose

Building the Android app in GitHub Actions: a signed AAB for publishing to Google Play and an APK for manual installation, without game data inside and with a monotonically growing version code.

## Requirements

### Requirement: CI builds signed Android AAB and APK
The release workflow SHALL build the app for `aarch64-linux-android` on a Linux runner and publish the artifacts `Vangers-<ref>-android-aarch64.aab` and `Vangers-<ref>-android-aarch64.apk`, where `<ref>` is the branch or tag name with `/` replaced by `-`. Both files MUST be signed with the key from the repository secrets whose certificate matches the upload key of the app `com.caiiiycuk.github.vangers.gp` in Google Play Console (keystore `vandroid`). The build MUST NOT require `resources/game-data.zip`.

#### Scenario: Workflow run on a branch
- **WHEN** the workflow is started by a push to a tracked branch or manually and the keystore secrets are set
- **THEN** the run artifacts include an `.aab` and an `.apk` whose signature is verified by `apksigner verify --print-certs` and gives the certificate SHA-256 `3A:57:B5:12:…:28:54` (the fingerprint of the `vandroid` keystore)

#### Scenario: Run on a tag
- **WHEN** the workflow is started by a `v*` tag
- **THEN** the AAB and APK are attached to the GitHub Release next to the AppImage, exe, dmg and IPA

#### Scenario: The APK installs over the previous build
- **WHEN** the device has the APK from the previous run installed and the user installs the APK from a new run
- **THEN** the installation proceeds as an update, the app data (including the downloaded game data) is preserved

### Requirement: The version code grows monotonically and is above the published one
Every workflow run SHALL assign the Android build a `versionCode` strictly greater than that of any previous run and greater than the last one uploaded to Google Play (1027). The value SHALL be computed as `1100 + <workflow run number>`.

#### Scenario: Upload to Play Console
- **WHEN** the AAB from a run is uploaded to Google Play Console after the AAB from any earlier run
- **THEN** Play accepts it as a new version without reporting a version code already in use

#### Scenario: First run
- **WHEN** the workflow runs for the first time after the rollout
- **THEN** the `versionCode` in the AAB is greater than 1027

### Requirement: A build without signing secrets does not fail
If the keystore secrets are not set (for example a pull request from a fork), the Android job SHALL build unsigned AAB and APK and finish successfully; the artifacts are published but are not usable for Play or for installation on a device.

#### Scenario: Pull request from a fork
- **WHEN** the workflow runs for a pull request that has no access to the repository secrets
- **THEN** the Android job is green, the log states explicitly that the build is unsigned

### Requirement: Android instructions in README
README SHALL describe where to get the AAB and APK from Actions, that the AAB is meant for Google Play and the APK for manual installation, and that the game data is downloaded by the app on first launch.

#### Scenario: Reader of the Android section
- **WHEN** the user reads the Android section in README
- **THEN** they find no instructions to copy `game-data.zip` into `resources/` and know where to download the run artifacts
