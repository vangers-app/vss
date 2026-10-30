# Spec Delta

## Purpose

Defines how mobile UI touches (menu, pause and shop frames, and direct taps on the game canvas) are translated into the coordinates of the game renderer's logical surface so that the game cursor lands exactly at the touch point.

## ADDED Requirements

### Requirement: Mobile UI knows the renderer logical surface size
The system SHALL report the width and height of the renderer's logical surface (the surface in which the engine draws the frame and interprets mouse coordinates) to the mobile UI and update them when they change. Coordinates passed to the game from the mobile UI SHALL be expressed in pixels of that surface.

#### Scenario: Size becomes known after the first frame
- **WHEN** the engine has rendered the first frame
- **THEN** the mobile UI receives the logical surface size (for example 1280x960) and uses it for all subsequent touch transforms

### Requirement: A frame tap lands at the same point of the frame
The system SHALL translate a touch on a mobile frame (menu, pause, shop) into logical surface coordinates so that the coordinate inside the frame is computed independently per axis from the touch position relative to the drawn frame and the frame size in surface pixels, and the frame origin comes from the same rules by which the frame is cut from the rendered frame. The result SHALL NOT depend on the viewport aspect ratio.

#### Scenario: Tap on the top-left corner of the menu frame
- **WHEN** the user touches the top-left corner of the drawn menu frame
- **THEN** the game receives the coordinates `(rendererWidth - menuFrame.width, menuFrame.top)` within 1 surface pixel

#### Scenario: Tap on the centre of the menu frame on a non-4:3 screen
- **WHEN** the viewport aspect ratio differs from the logical surface aspect ratio and the user touches the centre of the menu frame
- **THEN** the game receives the coordinates of the centre of the frame area in the surface, with no offset from the touch point on either axis

#### Scenario: Tap on the pause and shop frames
- **WHEN** the user touches a point inside the pause frame or the shop frame
- **THEN** the game receives the coordinates of the same point in the surface, computed by the same rule as for the menu

### Requirement: UI transforms mirror the engine letterbox
The engine fits the logical surface into the window with a single scale on both axes and centres it. The system SHALL use the same transform in both directions: when passing surface coordinates to the game (surface → window) and when translating a direct viewport touch into surface coordinates (window → surface), using the window size current at the moment of the touch.

#### Scenario: Direct tap on the screen centre
- **WHEN** the user touches the centre of the viewport outside the frames
- **THEN** the game receives the coordinates of the centre of the logical surface within 1 surface pixel

#### Scenario: Direct tap into the letterbox band
- **WHEN** the user touches a viewport area outside the fitted surface
- **THEN** the passed coordinates lie outside the surface range on the corresponding axis (negative or larger than the size), without clamping on the UI side

#### Scenario: Orientation change
- **WHEN** the viewport size has changed after start (device rotation)
- **THEN** subsequent touches are translated with the new window size while the surface size stays the same

### Requirement: A press without movement fires at the touch point
The system SHALL guarantee that the press and release passed to the game happen at the coordinates of the touch itself, even if no move events preceded it: the engine cursor position SHALL be updated to the touch point before the press or release is passed.

#### Scenario: Single tap without finger movement
- **WHEN** the user touches a menu item and releases the finger without moving it
- **THEN** the game registers the press and release at the touch point, and the menu item is activated

### Requirement: Direct touches in scaled renderer mode are translated to 2D screen coordinates
When the engine reports that scaled renderer mode is on (the 800x600 2D screen is drawn upscaled and centred in the logical surface, and the engine treats the frame for the frames and the mouse positions in 800x600 coordinates), the system SHALL translate a direct viewport touch from surface coordinates into 2D screen coordinates by the same rule by which the engine places the 2D screen in the surface. Coordinates computed from a frame SHALL be passed without this transform: the frame is cut from the rendered frame in the same space in which the engine reads the mouse. When the mode is off, direct touches SHALL be passed in surface coordinates. The mode flag SHALL come from the engine, not be computed in the UI.

#### Scenario: Direct tap on a main menu item
- **WHEN** scaled renderer mode is on, the surface is 1280x960, and the user touches the viewport point corresponding to surface point `(878, 533)`
- **THEN** the game receives the 2D screen coordinates `(549, 333)`, and the game cursor appears at the touch point

#### Scenario: Tap on the shop frame in scaled mode
- **WHEN** scaled renderer mode is on and the user touches the shop frame point corresponding to `(185, 305)` in frame space
- **THEN** the game receives the coordinates `(185, 305)` without additional scaling, and the game cursor in the frame image appears at the touch point

#### Scenario: Switching between the 2D menu and the 3D road
- **WHEN** the engine turns scaled renderer off when driving out onto the road
- **THEN** subsequent direct touches are passed in surface coordinates without the 2D screen transform
