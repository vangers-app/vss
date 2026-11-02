# render-settings Specification

## Purpose

User settings of the project: enabling the 3D renderer and its quality, the mobile controls options, their persistence between launches, the settings screen in the mods menu and on the first mobile launch, and the application of the chosen values at game start.

## Requirements

### Requirement: Settings screen in the mods menu
The mods menu SHALL contain a pinned first item "Settings", selected as soon as the menu opens; when it is selected the details panel SHALL show a "3D" toggle (on / off) and a "3D quality" toggle (high / normal / low). The quality toggle SHALL be visible but inactive while 3D is off. In the mobile interface the panel SHALL additionally show a "Controls" section with the mobile controls settings; on desktop the "Controls" section SHALL NOT be shown. The mods menu SHALL open from the main menu even when no mods are downloaded.

#### Scenario: Opening the settings without downloaded mods
- **WHEN** no mods are downloaded and the player presses the mods menu button in the main menu
- **THEN** the mods menu opens with the "Settings" item first in the list and already selected, and mods download is available inside the menu

#### Scenario: Quality unavailable while 3D is off
- **WHEN** 3D is off in the settings
- **THEN** the quality toggle is shown with its current value but does not react to clicks

#### Scenario: Settings on mobile
- **WHEN** the player opens the mods menu in the mobile interface
- **THEN** the "Settings" item and both render toggles are available the same way as on desktop, and the "Controls" section is shown below them

#### Scenario: Controls section absent on desktop
- **WHEN** the player opens the "Settings" panel on desktop
- **THEN** only the render toggles are shown, there is no "Controls" section

### Requirement: Storing and applying the settings
The chosen values SHALL be saved on the device immediately on change and SHALL survive a restart. The settings SHALL be applied at the next game start; closing the mods menu SHALL restart the game the same way as after changing mods. Without saved values 3D SHALL be off and quality SHALL be "normal".

#### Scenario: First launch
- **WHEN** the game starts without saved settings
- **THEN** the map is drawn by the classic 2D renderer, and the settings show "3D: off", "Quality: normal"

#### Scenario: Enabling 3D
- **WHEN** the player enables 3D, closes the mods menu and drives onto the map
- **THEN** the map is drawn by the 3D renderer with the quality from the settings, and after the next game launch the choice is preserved

### Requirement: 2D mode while 3D is off
While 3D is off the game SHALL draw the map with the classic CPU 2D renderer: terrain, objects and camera work as in the original game, the 3D context SHALL NOT be created and SHALL NOT occupy GPU memory.

#### Scenario: Map in 2D
- **WHEN** 3D is off and the player is on the map
- **THEN** terrain and mechos are visible in 2D, there are no render errors, the 3D context is not initialised

### Requirement: 3D quality presets
While 3D is on, the quality SHALL set the render parameters: high — shadow map 1024 and 128 ray-march steps; normal — shadow map 512 and 64 steps; low — no shadows and 64 steps. The remaining render parameters SHALL match the current configuration.

#### Scenario: High quality
- **WHEN** high quality is selected and 3D is on
- **THEN** the map is drawn with shadows from a 1024 shadow map and 128 ray-march steps (the picture matches the current one)

#### Scenario: Low quality
- **WHEN** low quality is selected and 3D is on
- **THEN** the map is drawn without shadows, with 64 ray-march steps, and the frame is noticeably cheaper than normal

### Requirement: Settings panel on the first launch
If no controls kind is saved yet in the mobile interface, the game SHALL show the settings panel as a separate full-screen frame without the mods list before the main menu. Closing the frame SHALL save the controls kind (Way83+ unless the player chose another) and show the main menu. If the render settings then differ from the ones the game was started with, the game SHALL restart with the new settings; otherwise the game SHALL continue without a restart. After the first close the frame SHALL NOT be shown on the following launches.

#### Scenario: First launch without render changes
- **WHEN** the game is launched on mobile for the first time, the player picks GamePix+ and closes the frame
- **THEN** the main menu is shown without a game restart, GamePix+ controls are used on the map, and the frame is not shown on the next launch

#### Scenario: First launch with 3D enabled
- **WHEN** the game is launched on mobile for the first time, the player enables 3D and closes the frame
- **THEN** the game restarts, the map is drawn by the 3D renderer, and the frame is not shown on the next launch

#### Scenario: Closing without a choice
- **WHEN** the player closes the first-launch frame without changing anything
- **THEN** the Way83+ controls kind is saved and the main menu is shown

### Requirement: Mobile controls settings
The "Controls" section SHALL contain a "Mirrored controls" toggle (on / off), a "Bind joystick to mechos" toggle (on / off) with an explanation, a "Camera zoom out" value (from 1.0 to 1.9 in steps of 0.1, cycling) and a choice of the Way83+ or GamePix+ controls kind with a hint image in the interface language. Every value SHALL be saved on the device immediately on change. The selected controls kind SHALL be shown with an expanded image, the others reduced; tapping a kind SHALL select it without a separate confirmation. A changed controls kind and mirroring SHALL apply to the map the next time the map is shown after the panel is closed (after the restart on closing the mods menu, or right after closing the first-launch frame).

#### Scenario: Picking the controls kind in the mods menu
- **WHEN** the player opens "Settings" in the mods menu, taps GamePix+ and closes the menu
- **THEN** the game restarts, GamePix+ controls are used on the map, and the GamePix+ image is expanded in the settings

#### Scenario: Camera zoom out
- **WHEN** the player taps the "Camera zoom out" value at 1.9
- **THEN** the value becomes 1.0 and is saved

#### Scenario: Image in the interface language
- **WHEN** the interface language is Russian
- **THEN** the Way83+ image is shown in its Russian variant

### Requirement: Single entry into the settings after the first launch
After the first launch the main menu SHALL NOT contain a separate controls selection button; the controls settings SHALL be reachable only through the "Settings" item of the mods menu.

#### Scenario: Main menu without the controls button
- **WHEN** the player is in the main menu on mobile after the first launch
- **THEN** there is no controls selection button in the bottom-right corner, and "Settings" open through the mods menu
