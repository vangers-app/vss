# Tasks

## 1. hd size and letterbox at the UI → game boundary

- [x] 1.1 Add `app/src/mobile/letterbox.ts` with `rendererToWindow`/`windowToRenderer` (D1/D3, mirror of `xgraph.cpp`); add `setRendererSize` to `UI` (`app/src/addons/ui.ts`) and call it from the `frame` quant in `app/src/addons/frame.ts`; in `BrowserMobileApi` store the size, expose it through `rendererWidth/Height()`, send `renderer_size_changed` on change, in `dispatchMouse` map coordinates → window through `rendererToWindow` without scaled renderer handling (D5) and send `mousemove` before `mousedown`/`mouseup` (D1a); handle `renderer_size_changed` in `Bridge`; verify `yarn build`, the `renderer_size_changed 1280x960` logcat line after start, and on the device: a single tap without finger movement on a main menu item activates it

## 2. Frames: direct tap mapping into hd coordinates

- [x] 2.1 Add `bindFrameMouseControl(canvas, bridge, frameStart, frame)` to `app/src/mobile/controls/mouse.ts` (D2) and move `app/src/mobile/way83/menu-frame.tsx` to it; verify on the device: a tap on the left edge of the menu frame gives `x ≈ rendererWidth - 200`, on the right edge `x ≈ rendererWidth`, the cursor is at the tap point, the menu item is selected where tapped
- [x] 2.2 Move `app/src/mobile/way83/pause-frame.tsx` to `bindFrameMouseControl`, remove `windowOffsetX / pageScaleX`; verify on the device that pause items are selected where tapped
- [x] 2.3 Move `app/src/mobile/way83/shop-frame.tsx` to `bindFrameMouseControl` (`frameStart = (shopFrame.left, shopFrame.top)`), remove the `scaledRendererScale` factors and the `false` argument; verify on the device item selection in the shop and that a root tap on the shop background does not break selection

## 3. Bridge and Api without the "scaled renderer" model

- [x] 3.1 In `app/src/mobile/bridge.ts` rewrite `map2Window` through `windowToRenderer` on `window.innerWidth/innerHeight` with the 2D 800x600 transform while `scaledRenderer` is set (flag from the `scaled_renderer_changed` event, D5); remove `rendererToPage`, the fields `windowWidth`, `windowHeight`, `windowOffsetX`, `pageScaleX/Y`, `rendererScaleX/Y`, `scaledRendererOffsetX`, `scaledRendererScale`, `useRendererScale` and their initialisation in `ready`; verify `yarn build` and on the device: a tap on the screen centre outside the frames gives the hd surface centre, after rotating the device coordinates follow the new window
- [x] 3.2 In `app/src/mobile/api.ts` remove `haveRendererScale`, `windowWidth`, `windowHeight` from `Api`; in `app/src/mobile/mobile-api.ts` remove their implementations; the `scaled_renderer_changed` event and its forwarding in `app/src/addons/sys.ts` stay (needed by `map2Window`, D5); verify `yarn build` without errors and that `grep -rn "haveRendererScale\|windowOffsetX\|rendererToPage" app/src` is empty

## 4. Integration check

- [x] 4.1 Build with `yarn tauri android dev --host 127.0.0.1` and `adb reverse tcp:1420/1421` on a TECNO AD10 and walk through: main menu (menu-frame), in-game pause (pause-frame), shop (shop-frame), taps on the game screen outside the frames, screen rotation; in logcat (`Tauri/Console`, `onMouseDown`) the coordinates match the expected values from the spec scenarios
