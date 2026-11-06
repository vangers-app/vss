# Spec Delta

## Purpose

Building the app for iPhone in GitHub Actions without a Mac on the developer's side and without a paid Apple Developer account: the result is an unsigned IPA that the user signs and installs on the device themselves.

## ADDED Requirements

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
Neither the desktop nor the iOS build MUST require `resources/game-data.zip` on the build machine. Bundling the data archive SHALL remain only in the Android build.

#### Scenario: Desktop build without the archive
- **WHEN** `tauri build` is run for Linux, Windows or macOS without the file `app/src-tauri/resources/game-data.zip`
- **THEN** the build finishes successfully

#### Scenario: Android build with the archive
- **WHEN** `tauri android build` is run with `app/src-tauri/resources/game-data.zip`
- **THEN** the archive gets into the APK as a resource and is extracted on the first launch, as before

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
