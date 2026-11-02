# terrain-data-texture Specification

## Purpose

Defines how the level surface data (height and meta of every point) is placed in a GPU texture so that the map loads on devices with any 2D texture size limit, including mobile GPUs with a limit of 8192.

## Requirements

### Requirement: The map loads when the texture limit is smaller than the level height
The system SHALL create the surface data texture so that no dimension exceeds the device 2D texture limit: level rows SHALL be distributed over the layers of a 2D array texture, where the layer count equals `max(2, ceil(level height / limit))` and the layer height equals `ceil(level height / layer count)`. There SHALL be at least two layers on every device so that the texture is always a real 2D array for the GL backend. Map loading SHALL NOT fail with a validation error because of the level height as long as the layer count does not exceed the device layer limit.

#### Scenario: Fostral on a GPU with a limit of 8192
- **WHEN** the 2048×16384 level loads on a device with a 2D texture limit of 8192 and a layer limit ≥ 2
- **THEN** the surface data texture is created as 1024×8192 with 2 layers, the map is displayed, there is no panic and no `abort`

#### Scenario: Desktop with a limit of 16384 and above
- **WHEN** the same level loads on a device with a 2D texture limit ≥ 16384
- **THEN** the texture is created as 1024×8192 with 2 layers (the same memory as the previous 1024×16384), the picture is identical to the previous one

### Requirement: Surface fetch is transparent to layers
Reading the surface data in shaders SHALL return, for any level coordinate `(x, y)`, the same height and meta values as before the split into layers: the layer is selected as `y / layer height`, the row within the layer as `y % layer height`. All terrain modes (ray, slice, paint, scatter, voxel) SHALL use the same fetch.

#### Scenario: Point on the layer boundary
- **WHEN** the layer height is 8192 and the shader requests rows 8191 and 8192
- **THEN** row 8191 comes from layer 0 (row 8191), row 8192 from layer 1 (row 0), and the values match the level data

#### Scenario: Shaders of all modes compile
- **WHEN** the shaders are parsed with naga (`tests/shaders.rs`)
- **THEN** all terrain shaders parse without errors

### Requirement: Updates of changed regions respect layers
When uploading a changed range of level rows, the system SHALL copy each row into the layer and position where the fetch reads it; a range crossing a layer boundary SHALL be split into per-layer pieces.

#### Scenario: Dirty rectangle across the layer boundary
- **WHEN** rows 8100..8300 change with a layer height of 8192
- **THEN** rows 8100..8191 are written into layer 0 starting at row 8100, rows 8192..8299 into layer 1 starting at row 0, after which the fetch returns the updated values

#### Scenario: Full initial upload
- **WHEN** the map has just been created and the whole level is marked for upload
- **THEN** all layers are filled and the fetch of any row returns the level data
