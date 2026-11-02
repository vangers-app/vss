# render-settings Specification

## Purpose

User render settings of the project: enabling the 3D renderer and its quality, their persistence between launches, the settings screen in the mods menu and the application of the chosen mode at game start.

## Requirements

### Requirement: Settings screen in the mods menu
The mods menu SHALL contain a pinned first item "Settings", selected as soon as the menu opens; when it is selected the details panel SHALL show a "3D" toggle (on / off) and a "3D quality" toggle (high / normal / low). The quality toggle SHALL be visible but inactive while 3D is off. The mods menu SHALL open from the main menu even when no mods are downloaded.

#### Scenario: Opening the settings without downloaded mods
- **WHEN** no mods are downloaded and the player presses the mods menu button in the main menu
- **THEN** the mods menu opens with the "Settings" item first in the list and already selected, and mods download is available inside the menu

#### Scenario: Quality unavailable while 3D is off
- **WHEN** 3D is off in the settings
- **THEN** the quality toggle is shown with its current value but does not react to clicks

#### Scenario: Settings on mobile
- **WHEN** the player opens the mods menu in the mobile interface
- **THEN** the "Settings" item and both toggles are available the same way as on desktop

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
