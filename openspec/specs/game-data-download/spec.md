# game-data-download Specification

## Purpose

Lets the app obtain the original game data over the network when no local installation is found: needed for iOS, where the data cannot be placed manually, and for desktop without a Steam/GOG copy.

## Requirements

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

### Requirement: Download with progress and cancel
The download SHALL show progress (loaded / total, when the size is known) and the phase ("Downloading", "Extracting"). The user SHALL be able to cancel the download at any moment; after cancelling, temporary files MUST be removed and the screen returns to the "Game data not found" state.

#### Scenario: Progress
- **WHEN** the user pressed "Download game data" and the server sends `Content-Length`
- **THEN** the percentage and the loaded volume are visible, after the download — the extraction phase

#### Scenario: Cancel
- **WHEN** the user presses Cancel during the download or extraction
- **THEN** the download stops, the temporary archive and temporary folder are removed, the "Game data not found" screen is shown again

### Requirement: Atomic data installation
The data SHALL become visible to the app only as a whole: extraction goes into a temporary folder that is renamed into the final one after successful completion. On a network or extraction error a message with Retry and Close buttons SHALL be shown, and the final folder MUST NOT be left partially filled.

#### Scenario: Network drop
- **WHEN** the connection drops in the middle of the download
- **THEN** an error message with Retry is shown; the data folder is not created

#### Scenario: Success
- **WHEN** the download and extraction have finished
- **THEN** a success message with a Restart button is shown; after the restart the app finds the data and starts the game without downloading again

### Requirement: Repeated launches
After a successful installation the app SHALL use the downloaded data on every following launch without accessing the network.

#### Scenario: Second launch
- **WHEN** the app launches after a successful data installation
- **THEN** the game starts immediately, the "Game data not found" screen is not shown

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
