# Tasks

## 1. Shared settings panel

- [x] 1.1 Move the `select_controls_type`, `controls_options`, `mirrored_controls`, `follow_camera`, `follow_camera_desc`, `road_zoom` strings (en/ru) from `app/src/mobile/i18n.ts` to `app/src/inventory/i18n.ts`; verify `cd app && yarn tsc --noEmit`
- [x] 1.2 Create `app/src/settings/settings-panel.tsx`: `SettingsPanel` with the "Render" section (markup and `SettingOption` moved from `inventory-frame.tsx`, values through `render-presets.ts`) and the "Controls" section (toggles and the list of kinds from `control-selector.tsx`, local state from `options.tsx`, written right on tap, the selected kind first and expanded, image language through `BridgeContext` with a fallback to `currentLanguage()`), the "Controls" section only under `__VSS_MOBILE__`; in `inventory-frame.tsx` render `<SettingsPanel />` when `activeId === "settings"` and remove the moved code; verify `yarn tsc --noEmit` and on desktop (tauri): the "Settings" panel looks as before, no "Controls" section
- [x] 1.3 Create `app/src/settings/settings-frame.tsx`: `SettingsFrame` with the `inventory-bg.jpg` background, the `.inventory-close` cross and `<SettingsPanel />`; remember `readRenderSettings()` on mount, on close — `location.reload()` if the values changed, otherwise `props.onClose()`; verify `yarn tsc --noEmit`

## 2. Mobile: first launch and removal of the old screen

- [x] 2.1 In `app/src/mobile/frame.tsx` render `SettingsFrame` inside `BridgeContext.Provider` when `controlsKind === null`; in `onClose` call `setControlsKind(getControlsKind() ?? "way83+")` and re-read `isMirroredEnabled()`; remove the `mirrored`/`cameraFollow`/`roadZoom` state and setters, keeping `mirrored` as the value for `renderMapFrame`; delete the `case "controls-select"` branch; verify `yarn tsc --noEmit`
- [x] 2.2 Remove `"controls-select"` from `UIType` in `app/src/mobile/api.ts`, the `showControlsSelector` prop and the `MobileButton` from `default-controls.tsx` and `frame.tsx`, `MobileButton` and the `mobile.png` import from `keys.tsx`, the file `app/src/assets/mobile.png`, the file `app/src/mobile/controls/control-selector.tsx`, the `.inventory-setting` rule from `app/src/index.css`; verify `yarn tsc --noEmit` and that `grep -rn "controls-select\|ControlSelector\|MobileButton\|inventory-setting" app/src` is empty

## 3. Device verification

- [x] 3.1 Android (TECNO AD10, `yarn tauri android dev --host 127.0.0.1`), `localStorage` without `ui.controls.kind`: the full-screen settings frame without the mods list is shown at start; picking GamePix+ and closing → main menu without a restart, GamePix+ controls on the map; app restart → the frame is not shown, no bottom-right button in the main menu
- [x] 3.2 Android, again without `ui.controls.kind`: enable 3D in the first-launch frame and close → the game restarts (a second `Runtime initialized` and `.render_config=` in `adb logcat -s Tauri/Console`), the map is in 3D, the frame is not shown again
- [x] 3.3 Android: open the mods menu → the "Settings" card is active, the "Controls" section is below the render one; tap "Camera zoom out" at 1.9 → 1.0; pick Way83+ and close the menu → Way83+ on the map after the reload; the images fit the details panel in landscape without horizontal scrolling
- [x] 3.4 Desktop (tauri): mods menu → "Settings" without the "Controls" section, the render toggles work as before
- [x] 3.5 Commit the changes in one commit (English message); `git status` clean, `vange-rs` untouched
