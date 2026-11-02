# Proposal

## Why

On mobile the settings are split across two screens: the controls toggles (mirrored controls, joystick binding, camera zoom, Way83+/GamePix+ controls kind) live in a separate full-screen `ControlSelector` shown on the first launch and opened by a button in the bottom-right corner of the main menu, while the render settings (3D, quality) live in the "Settings" card of the mods menu. Two entry points to settings on one screen and two different mechanics (confirm with a check mark versus write on tap) are confusing; one settings panel is easier to find and to maintain.

## What Changes

- The "Controls" section (mirrored controls, joystick binding to the mechos, camera zoom, controls kind with a preview image) is embedded into the "Settings" panel of the mods menu below the render section. The section is shown only in the mobile interface; on desktop the panel does not change.
- The controls kind is selected with a tap right away (like the other toggles of the panel), without a separate confirm button; the selected kind is shown with an expanded image.
- On the first mobile launch (no controls kind chosen yet) the same settings panel is shown as a separate full-screen frame without the mods list, the way `ControlSelector` is shown today. Closing the frame saves the choice (Way83+ by default) and leads to the main menu; if the player changed the render settings, the game restarts to apply them.
- **BREAKING (UI):** the controls selection button in the bottom-right corner of the main menu and the `controls-select` screen are removed. The only way into the settings after the first launch is the mods menu (top-left button), where the "Settings" card is already active when the menu opens.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `render-settings`: the "Settings screen in the mods menu" requirement grows a controls section on mobile; requirements about showing the settings panel on the first launch and about the mobile controls settings (values, persistence, application) are added. The capability stays "project settings" — no separate capability is introduced for four toggles.

## Impact

- `app/src/inventory/inventory-frame.tsx` — the settings panel is extracted into a separate component; `app/src/settings/` (new) — the shared panel and the first-launch full-screen frame.
- `app/src/mobile/controls/control-selector.tsx` is deleted, its logic and markup move into the shared panel; `app/src/mobile/frame.tsx` — the first-launch branch renders the new frame, the `controls-select` branch is removed; `app/src/mobile/api.ts` — the `controls-select` type is removed; `app/src/mobile/controls/default-controls.tsx` — the button and the `showControlsSelector` prop are removed; `app/src/mobile/controls/keys.tsx` — `MobileButton` and `assets/mobile.png` are no longer used.
- `app/src/inventory/i18n.ts` / `app/src/mobile/i18n.ts` — the controls section strings move into the settings dictionary.
- `app/src/index.css` — the dead `.inventory-setting` rule is removed.
- Storage does not change: controls stay in the `ui.*` `localStorage` keys (and `bridge.native.setStorageItem` for the native side), render settings in `vss:addons`.customProps. The engine (C++/Rust) is not touched.
- Verification: tauri desktop (panel without the controls section) and Android (first launch, panel in the mods menu).
