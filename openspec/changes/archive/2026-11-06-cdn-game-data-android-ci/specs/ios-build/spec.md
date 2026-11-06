# Spec Delta

## MODIFIED Requirements

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
