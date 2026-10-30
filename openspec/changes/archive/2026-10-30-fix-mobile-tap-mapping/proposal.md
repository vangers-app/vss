# Proposal

## Why

On Android (Tauri + WebView) the game cursor lands to the right of the tap on the mobile frames (menu, pause, shop) and drifts vertically as well. The engine (`lib/xgraph/xgraph.cpp`) draws an hd surface of 1280x960 (height depends on the screen), letterboxes it into the window with a uniform scale and centering, interprets the mouse in that same hd space and emits the `frame` quant from which the mobile frames are cut. `Bridge` in `app/src/mobile/bridge.ts` modelled this letterbox its own way — in page pixels, with different signs and with "scaled renderer" corrections — while `BrowserMobileApi.rendererWidth()` returned the window size (`canvas.width`) although the frames expected the hd surface size. `BrowserMobileApi` is the only `Api` implementation; the native Android client the model was written for no longer exists.

## What Changes

- The UI → game boundary (`Api.onMouseDown/Move/Up`) takes hd surface coordinates; `BrowserMobileApi.dispatchMouse` maps them to the window with the engine's letterbox formula (`app/src/mobile/letterbox.ts`).
- The hd size comes from the `frame` quant (`app/src/addons/frame.ts` → `ui.setRendererSize`) and reaches `Bridge` through the `renderer_size_changed` event; `Api.rendererWidth/Height()` return it.
- The `menu-frame`, `pause-frame` and `shop-frame` frames compute the tap's hd coordinates directly from their own `getBoundingClientRect()` and the frame size (`frame-info.ts`), per axis, without `rendererToPage`/`map2Window` (`bindFrameMouseControl` in `controls/mouse.ts`).
- `Bridge.map2Window` becomes the inverse letterbox: window (viewport) → hd on the current window size, followed by hd → 800x600 2D screen while the engine reports scaled renderer mode.
- `windowOffsetX`, `pageScaleX/Y`, `rendererScaleX/Y`, `scaledRendererOffsetX`, `scaledRendererScale`, `useRendererScale` and `rendererToPage` are removed from `Bridge`; the `scaled_renderer_changed` event stays as the source of the scaled renderer flag.
- `haveRendererScale`, `windowWidth` and `windowHeight` are removed from the `Api` interface (`app/src/mobile/api.ts`) and from `BrowserMobileApi`.
- **BREAKING** (internal contract): `Bridge` no longer exposes letterbox fields; `Api.rendererWidth/Height` mean the hd surface, not the window. There are no external consumers in the repository.

## Capabilities

### New Capabilities
- `mobile-tap-mapping`: mapping of mobile UI touches (frames and direct taps on the game canvas) to game renderer coordinates.

### Modified Capabilities
<!-- The project has no main specs yet. -->

## Impact

- `app/src/mobile/letterbox.ts` — new module with the forward and inverse letterbox transform.
- `app/src/mobile/bridge.ts` — simplified geometry, `renderer_size_changed` event.
- `app/src/mobile/api.ts`, `app/src/mobile/mobile-api.ts` — narrower `Api`, hd size, `dispatchMouse`.
- `app/src/addons/ui.ts`, `app/src/addons/frame.ts` — `setRendererSize` from the `frame` quant.
- `app/src/mobile/way83/menu-frame.tsx`, `pause-frame.tsx`, `shop-frame.tsx` — new tap mapping.
- `app/src/addons/sys.ts` — the `scaled_renderer` quant is still forwarded to the UI.
- Direct taps on the game canvas through `bindMouseControl(root, bridge)` (`way83.tsx`, `default-controls.tsx`, `escave-controls.tsx`, `shop-frame.tsx` root) get the fixed `map2Window`; behaviour there changes from "page px + offset" to correct renderer coordinates.
- `app/` has no automated tests (`package.json` has no `test`); verification is `yarn build` (tsc) and manual checks on the device.
