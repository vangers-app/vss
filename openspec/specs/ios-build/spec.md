# ios-build Specification

## Purpose

Building the app for iPhone in GitHub Actions without a Mac on the developer's side and without a paid Apple Developer account: the result is an unsigned IPA that the user signs and installs on the device themselves.

## Requirements

### Requirement: CI builds an unsigned iOS IPA
The release workflow SHALL build the app for `aarch64-apple-ios` on a macOS runner and publish the artifact `Vangers-<ref>-ios-aarch64.ipa`, where `<ref>` is the branch or tag name with `/` replaced by `-`. The build MUST pass without Apple certificates, provisioning profiles and App Store Connect keys.

#### Scenario: Workflow run on a branch
- **WHEN** the workflow is started by a push to a tracked branch or manually
- **THEN** the run artifacts include `Vangers-<ref>-ios-aarch64.ipa` containing `Payload/*.app`

#### Scenario: Run on a tag
- **WHEN** the workflow is started by a `v*` tag
- **THEN** the IPA is attached to the GitHub Release next to the AppImage, exe and dmg

#### Scenario: No secrets
- **WHEN** the repository has no Apple-related secret at all
- **THEN** the iOS job finishes successfully

### Requirement: The build does not require game data
No build of the app (desktop, Android, iOS) MUST require `resources/game-data.zip` on the build machine, and none MUST include the game data in the bundle. On every platform the data SHALL be delivered by downloading on first launch (spec `game-data-download`).

#### Scenario: Desktop build without the archive
- **WHEN** `tauri build` is run for Linux, Windows or macOS without the file `app/src-tauri/resources/game-data.zip`
- **THEN** the build finishes successfully

#### Scenario: Android build without the archive
- **WHEN** `tauri android build` is run without the file `app/src-tauri/resources/game-data.zip`
- **THEN** the build finishes successfully, the APK and AAB contain no `game-data.zip` resource

#### Scenario: The archive is present locally
- **WHEN** the developer has `game-data.zip` in `app/src-tauri/resources/`
- **THEN** it is ignored: it does not get into the bundle of any platform

### Requirement: The iOS app launches in the game orientation
The iOS build SHALL allow only landscape orientations, hide the system status bar and require fullscreen. The minimum iOS version SHALL be 15.2 or higher (WebGL2 and OPFS sync access handle in WKWebView).

#### Scenario: Launch on an iPhone 8 with iOS 16
- **WHEN** the signed IPA is installed and launched on an iPhone 8 (iOS 16.x)
- **THEN** the app opens in landscape without a status bar and shows the mobile interface (as on Android)

#### Scenario: Rotating the device to portrait
- **WHEN** the user rotates the phone to portrait orientation
- **THEN** the interface stays in landscape

### Requirement: iPhone installation instructions
README SHALL describe where to get the IPA from Actions and how to install it on an iPhone with a free Apple ID (Sideloadly/AltStore), including the 7-day signature limit.

#### Scenario: A user without Mac development
- **WHEN** the user reads the iOS section in README
- **THEN** they can download the run artifact and repeat the installation without additional sources
