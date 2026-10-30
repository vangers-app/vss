export type Size = { width: number, height: number };

// SAFETY: the engine letterboxes its logical surface into the SDL window with a
// uniform scale (lib/xgraph/xgraph.cpp, XGR_Screen::flip and the SDL_MOUSEMOTION
// handler). Both functions must stay the exact inverse of that transform.
export function rendererToWindow(x: number, y: number, renderer: Size, window: Size) {
    const scale = Math.min(window.width / renderer.width, window.height / renderer.height);
    return {
        x: (window.width - renderer.width * scale) / 2 + x * scale,
        y: (window.height - renderer.height * scale) / 2 + y * scale,
    };
}

export function windowToRenderer(x: number, y: number, renderer: Size, window: Size) {
    const scale = Math.min(window.width / renderer.width, window.height / renderer.height);
    return {
        x: (x - (window.width - renderer.width * scale) / 2) / scale,
        y: (y - (window.height - renderer.height * scale) / 2) / scale,
    };
}
