# Design

## Context

See proposal.md — Why. What exists today (from the code):

- `mobile/frame.tsx:FrameWithBridge` holds the `mirrored`, `cameraFollow`, `roadZoom`, `controlsKind` state (from `controls/options.tsx`, `ui.*` keys in `localStorage`; `setCameraFollow`/`setRoadZoom` mirror the value into `bridge.native.setStorageItem`). With `controlsKind === null` it renders the full-screen `ControlSelector` with `selected="way83+"`; confirming (check mark) calls `setControlsKind` and shows `main-menu`. The same `ControlSelector` opens on `uiType "controls-select"` from `MobileButton` in `default-controls.tsx`.
- `ControlSelector` (`controls/control-selector.tsx`): `CommonProps` (three toggles), the list of kinds with images (`assets/controls/way83+.jpeg`, `way83+ru.jpeg`, `gamepix+.jpg`), distinguishes `opened` (expanded image) and `selected` (confirmed). The image language comes from `bridge.native.language()`.
- `inventory/inventory-frame.tsx`: the `settings` card is active on open, a panel with two rows of `SettingOption`, values through `render-presets.ts`; closing is `location.reload()`. On mobile the frame lives inside `BridgeContext` (`InappFrame`), on desktop without a bridge. `inventory/i18n.t()` works without a bridge.
- `mirrored` from the `FrameWithBridge` state is passed to `renderMapFrame`; `cameraFollow`/`roadZoom` are read by the native side through storage; `controlsKind` selects `Road`/`Way83` in `map-frame.tsx`.

## Goals / Non-Goals

**Goals:**

- One settings panel component with two mount points: the `InventoryFrame` details panel and the first-launch full-screen frame.
- The controls section is mobile only; the desktop panel does not change visually.
- Removal of `ControlSelector`, `controls-select`, `MobileButton`.

**Non-Goals:**

- Moving the `ui.*` keys into `vss:addons`.customProps — storage does not change.
- Applying the controls kind "live" while the mods menu is open (the reload on close stays).
- Changing the set or semantics of the controls toggles themselves.

## Decisions

### Structure: `app/src/settings/settings-panel.tsx` and `settings-frame.tsx`

`SettingsPanel` — the "Render" section (moves from `inventory-frame.tsx` together with `SettingOption`) and the "Controls" section (moves from `control-selector.tsx`: toggles, list of kinds, images). The "Controls" section renders when `(window as any).__VSS_MOBILE__ === true`, as `main.tsx` already does to choose `DesktopFrame`/`MobileFrame`. `InventoryFrame` renders `<SettingsPanel />` when `activeId === "settings"`.

`SettingsFrame` — the full-screen frame for the first launch: `inventory-bg.jpg` background, a close button like `.inventory-close`, `SettingsPanel` inside. Prop `onClose`.

Alternative — `InventoryFrame` with a `settingsOnly` prop (hide the list and "Refresh") — rejected: `InventoryFrame` calls `reconcileMods(getModAddons())` on mount and writes storage, which is needless work and needless coupling on the first mobile launch.

### Controls section state — inside the panel, no state in `FrameWithBridge`

`SettingsPanel` reads the initial values from `options.tsx` (`isMirroredEnabled` etc.) into local `useState` and writes through the same setters right on tap. `FrameWithBridge` stops holding `mirrored`/`cameraFollow`/`roadZoom` as editable state: after `SettingsFrame` closes it re-reads `getControlsKind()` and `isMirroredEnabled()` from storage (the only values it needs for `renderMapFrame`). On the mods menu path no re-read is needed — `location.reload()`.

Alternative — passing setters from `FrameWithBridge` into the panel through props, as `ControlSelector` does today — rejected: the panel must also work inside `InventoryFrame`, where `FrameWithBridge` cannot reach it.

### Controls kind selection — one state instead of `opened`/`selected`

Tapping a kind calls `setControlsKind` right away and expands the image; the confirm check mark is removed. The `controls.sort(...)` by `opened` from `ControlSelector` (module mutation on every render) is not carried over: the selected kind is simply rendered first via `[selected, ...rest]`.

### Closing the first-launch frame: reload only when `render.*` changed

`SettingsFrame` remembers `readRenderSettings()` on mount; on close it first calls `props.onClose`, then, if the current `readRenderSettings()` differ from the remembered ones, `location.reload()`. `FrameWithBridge` in `onClose` writes `setControlsKind(getControlsKind() ?? "way83+")` (so that the frame does not show up again — including after the reload) and moves the `controlsKind` state away from `null`.

Alternative — always reload — rejected: an extra game restart for every new player for the sake of a rare case.

### Image language — as in `inventory/i18n.t()`

`useContext(BridgeContext)?.native.language()` with a fallback to `currentLanguage()`; the same order as in `t()`. The panel does not crash without a bridge (desktop), even though the section is not rendered there.

### Strings — in `inventory/i18n.ts`

The six strings of the controls section (`select_controls_type`, `controls_options`, `mirrored_controls`, `follow_camera`, `follow_camera_desc`, `road_zoom`) are used only by `control-selector.tsx`; they move into `inventory/i18n.ts` (which already has `enable`/`disable`) and are removed from `mobile/i18n.ts`. The panel imports one `t`.

### Removals

`controls/control-selector.tsx`; the `controls-select` branch and `"controls-select"` in `api.ts:UIType`; `MobileButton` in `keys.tsx` with the `assets/mobile.png` import (the file itself is deleted, no other uses); the `showControlsSelector` prop in `DefaultControls`; `.inventory-setting` in `index.css`.

## Risks / Trade-offs

- [`setCameraFollow`/`setRoadZoom` from `options.tsx` call `bridge.native.setStorageItem` through a module variable `bridge` initialised in `Bridge`] → on desktop the section does not render and the setters are not called; on mobile `Bridge` exists before any frame. No risk, but the dependency is implicit — the section being under `__VSS_MOBILE__` is enough, no `// SAFETY` comment needed.
- [Controls kind images (`w-96`, the expanded one `w-full`) inside the `InventoryFrame` details panel] → the panel is `overflow-auto`; on a phone in landscape the details width is ~600+ CSS px. Verified on the device in the tasks; if cramped — cap the expanded image with `max-w-xl`.
- [A player used to the bottom-right button] → deliberate decision (proposal, BREAKING); the "Settings" card is active when the mods menu opens, one tap away.
- [`prevUiType` in `frame.tsx` after the `controls-select` branch is removed] → the `setUiType`/`closeActiveUi` logic does not depend on that branch, stays as is.
