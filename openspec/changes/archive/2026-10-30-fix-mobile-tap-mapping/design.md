# Design

## Context

See proposal.md — Why. Engine geometry (verified against `lib/xgraph/xgraph.cpp`, numbers from logcat on a TECNO AD10):

```
viewport / SDL window (RealX x RealY)        360x850 portrait, 850x360 landscape
  |  letterbox: scale = min(RealX/hdW, RealY/hdH), surface centred
  v
hd logical surface (hdW x hdH)               1280 x round(1280/aspect); screen aspect
  |                                          at init, clamped to [4/3, 1280/600]
  |  the "frame" quant delivers this hd frame (xgrScreenSizeX x xgrScreenSizeY)
  |  mouse: SDL_MOUSEMOTION -> hd via the inverse letterbox (xgraph.cpp:2454-2456)
  v
2D UI 800x600 (iScreen), stretched into hd with screen_scale = hdH/600 in scaled renderer mode
```

- Frames (`app/src/addons/frame.ts`) are cut from the hd frame: menu at `(width - 200, 60)`, pause centred, shop at `(90, 160)`. So the frame origin and the engine mouse coordinates share one space (hd).
- `BrowserMobileApi.dispatchMouse` gives SDL `clientX/Y` relative to `canvas.getBoundingClientRect()`; SDL converts them to canvas pixels (`RealX x RealY`), the engine to hd.
- The old `Bridge` modelled the letterbox and the scaled renderer itself, but in page pixels and with different signs; `rendererWidth()` returned `canvas.width` (the window) while the frames expected hd.
- `#canvas` is CSS 100% x 100%; SDL keeps `canvas.width/height` equal to the CSS size (log: `renderer 360x850 viewport 360x850`).
- The hd height depends on the screen orientation at init (portrait → 960, landscape → 600), so it cannot be hardcoded.

## Goals / Non-Goals

**Goals:**
- One coordinate space at the UI → game boundary: the hd surface.
- One place with the letterbox math, mirroring the engine in both directions.
- The hd size comes from the engine instead of being computed in the UI.
- Remove the "scaled renderer" model from `Bridge` and `Api`.

**Non-Goals:**
- Changing the engine (`lib/xgraph`) or the `frame` quant.
- Letterboxing the game canvas through CSS.
- Changing `renderUiStyleSheet`/`cell-style`.
- Automated tests for `app/` (no test runner).

## Decisions

**D1. The `Api.onMouse*` boundary takes hd coordinates; `dispatchMouse` maps hd → window → clientX.**
`rendererToWindow` (`app/src/mobile/letterbox.ts`) repeats the engine's `flip()`/`SDL_MOUSEMOTION` formula. The alternative — handing SDL window pixels and computing the letterbox in every caller — duplicates the formula.

**D1a. `dispatchMouse` sends a `mousemove` to the same point before `mousedown`/`mouseup`.**
The engine takes the press position from the last `SDL_MOUSEMOTION` (`xgraph.cpp:2489`, `XGR_MousePress(..., PosX, PosY)`), and SDL does not update the position on `mousedown`. Without this, a tap without finger movement presses at the old cursor position — the source of "it never hits". The alternative — using `button.x/y` in the engine handler — is a `lib/xgraph` change, out of scope.

**D2. Frames compute hd coordinates directly.**
`bindFrameMouseControl(canvas, bridge, frameStart, frame)`: `start + (client - rect) * frame / rect` per axis. `frameStart` is a function because `bridge.rendererWidth` may not be known yet when the frame mounts (the size arrives with the first frame).

**D3. `map2Window` = window → hd via `windowToRenderer`, using `window.innerWidth/innerHeight` at call time.**
Relies on the invariant "the canvas fills the viewport and SDL keeps its pixel size equal to the CSS size" (recorded in a comment). The alternative — asking for `canvas.width` through `Api` — adds a method for the same number.

**D4. The hd size comes from the `frame` quant: `ui.setRendererSize(width, height)` → `BrowserMobileApi` stores it and sends `renderer_size_changed` to `Bridge` on change.**
The `frame` quant arrives on every `flip()` in all modes, so the size is known right after start. `Api.rendererWidth/Height()` return it (0 before the first frame). The alternative — a `_vss_bridge_*` export from C++ — requires an engine change.

**D5. The scaled renderer is handled only for direct taps, in `Bridge.map2Window`; frames and `dispatchMouse` ignore it.**
Empirically (CDP taps, screenshots and frame canvas dumps on a TECNO AD10): in scaled mode the engine cursor lands `screen_scale` (= `hdH/600`, 1.6 at 1280x960) times farther than the passed hd point, while a tap at `hd/1.6` lands exactly. Cause: the `SDL_MOUSEMOTION` handler in `xgraph.cpp` maps window → hd, but the cursor and the 2D screen hit test live in 800x600 in scaled mode (`flip()`: `src_rect {0,0,800,600}` → `dst_rect {(hdW - 800*sy)/2, 0, 800*sy, hdH}`). At the same time the `frame` quant (`blitRgba`) delivers the 2D buffer unscaled, so the frames (`frame.ts`) are cut in the same 800x600 coordinates in scaled mode and in hd outside it: frame space always matches the engine mouse space. Hence:
- `BrowserMobileApi.dispatchMouse` is a pure `rendererToWindow`: the number we pass comes back to the engine through its own inverse letterbox and is interpreted in the current mode.
- Frames pass frame coordinates as they are (`bindFrameMouseControl`).
- `Bridge.map2Window` for direct taps: window → hd (`windowToRenderer`), then with `scaledRenderer` → `x2d = (x - (hdW - 800*sy)/2)/sy`, `y2d = y/sy`. The flag arrives through the `scaled_renderer_changed` event from `sys.ts` (`scaled_renderer` quant: `set_is_scaled_renderer` → `sys_scaledRendererQuant`, default `false`, enabled by `MainMenuRTO`, `EscaveRTO`, `ShowImageRTO` etc., disabled by their `Finit`).
Check that the conversion belongs to direct taps and not to the whole flow: with the conversion in `dispatchMouse` a tap on the shop frame put the cursor (in the frame canvas dump) at `1/1.6` of the touch point; without it, at the touch point.
Removed from `Bridge`: `windowOffsetX`, `pageScale*`, `rendererScale*`, `scaledRendererOffsetX/Scale`, `useRendererScale`, `rendererToPage`; from `Api`: `haveRendererScale`, `windowWidth/Height`.
The alternative — fixing the mouse handler in the engine (`lib/xgraph/xgraph.cpp`, divide by `screen_scale_y` when `is_scaled_renderer`) — addresses the root cause but requires rebuilding `app/src/vangers.wasm` (emscripten + cargo wasm32) and is outside the mobile UI; left as a follow-up.

## Risks / Trade-offs

- [hd size unknown before the first frame] → `rendererWidth/Height = 0`, `map2Window` yields `NaN`/`Infinity` before the first frame. Touches before the first frame are meaningless; frames read the size lazily. If needed, ignore touches while the size is zero.
- [Invariant canvas == viewport] → if the canvas CSS changes (letterbox via styles, DPR scaling), `map2Window` diverges from the engine. Frames are unaffected (they do not use `map2Window`).
- [Desktop `UiAdapter` without `setRendererSize`] → the `frame` addon has `scope: "mobile"` and does not run on desktop; `tsc` passes.
- [No automated tests] → verification by `yarn build` and manually on the device. Expected numbers on a TECNO AD10, portrait, hd 1280x960, window 360x850: `scale = 0.28125`, the surface occupies `360x270` with a 290 px top offset; a tap on the left edge of the menu frame → `x = 1080`, on the right edge → `x = 1280`.
- [Unstable network to the dev server (VPN on the phone)] → `adb reverse tcp:1420/1421` + `--host 127.0.0.1`.
