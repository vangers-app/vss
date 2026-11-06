# Spec Delta

## MODIFIED Requirements

### Requirement: Offer to download the data
If a Tauri build (desktop, Android or iOS) finds no game data at launch, the "Game data not found" screen SHALL offer a data download button next to the Steam and GOG links. The source URL is set when the app is built (see the requirement "The source URL is set at build time"); the user does not enter it. On mobile platforms the Exit button MUST NOT be shown.

#### Scenario: First launch on iOS
- **WHEN** the app is launched on iOS and the app storage has no data folder
- **THEN** the "Game data not found" screen is shown with a "Download game data" button and without an Exit button

#### Scenario: First launch on Android
- **WHEN** the app is launched on Android and the app storage has no data folder
- **THEN** the "Game data not found" screen is shown with a "Download game data" button and without an Exit button; nothing is extracted from the app resources

#### Scenario: Desktop without a Steam copy
- **WHEN** the app is launched on Linux/Windows/macOS and neither the Steam path nor the app storage contains data
- **THEN** the same screen is shown with a "Download game data" button and an Exit button

#### Scenario: Android after updating from the old build
- **WHEN** the app is updated over a build that extracted the data from the APK into the app storage
- **THEN** the game starts with that data, the "Game data not found" screen is not shown

## ADDED Requirements

### Requirement: The source URL is set at build time
The URL of the data archive SHALL be passed into the build through the `GAME_DATA_URL` environment variable and fixed into the built app at build time. The release workflow SHALL take the value from the GitHub repository variable `GAME_DATA_URL` for every platform. A build without the variable MUST succeed.

#### Scenario: Build in CI
- **WHEN** the repository variable `GAME_DATA_URL` is set and the workflow builds any platform
- **THEN** pressing "Download game data" in that build downloads the archive from that URL

#### Scenario: Build without a URL
- **WHEN** the app is built without the `GAME_DATA_URL` variable (locally or in a pull request from a fork) and the user presses "Download game data"
- **THEN** an error message is shown that the data URL was not set at build time, with Retry and Close buttons; no network requests are made

#### Scenario: Changing the URL
- **WHEN** the value of the repository variable is changed
- **THEN** the next workflow run builds the app with the new URL without code changes
