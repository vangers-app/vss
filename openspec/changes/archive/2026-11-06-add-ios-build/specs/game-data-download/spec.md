# Spec Delta

## Purpose

Lets the app obtain the original game data over the network when no local installation is found: needed for iOS, where the data cannot be placed manually, and for desktop without a Steam/GOG copy.

## ADDED Requirements

### Requirement: Offer to download the data
If a Tauri build (desktop or iOS) finds no game data at launch, the "Game data not found" screen SHALL offer a data download button next to the Steam and GOG links. The source URL is built into the app; the user does not enter it. On mobile platforms the Exit button MUST NOT be shown.

#### Scenario: First launch on iOS
- **WHEN** the app is launched on iOS and the app storage has no data folder
- **THEN** the "Game data not found" screen is shown with a "Download game data" button and without an Exit button

#### Scenario: Desktop without a Steam copy
- **WHEN** the app is launched on Linux/Windows/macOS and neither the Steam path nor the app storage contains data
- **THEN** the same screen is shown with a "Download game data" button and an Exit button

#### Scenario: Android
- **WHEN** the app is launched on Android
- **THEN** the data is extracted from the bundle as before; the download screen is not shown

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
