import { Bridge } from "../bridge";

export function bindMouseControl(
    target: HTMLElement,
    bridge: Bridge,
    optionalMap2Window?: (x: number, y: number) => { x: number, y: number}) {
    return bindMouseControlImpl(target, bridge, 1, optionalMap2Window);
}

export function bindRightMouseControl(
    target: HTMLElement,
    bridge: Bridge,
    optionalMap2Window?: (x: number, y: number) => { x: number, y: number}) {
    return bindMouseControlImpl(target, bridge, 2, optionalMap2Window);
}

function bindMouseControlImpl(
    target: HTMLElement,
    bridge: Bridge,
    button: 1 | 2,
    optionalMap2Window?: (x: number, y: number) => { x: number, y: number}) {
    const map2Window = optionalMap2Window ?? bridge.map2Window.bind(bridge);

    let pressed = false;
    const onPointerDown = (e: PointerEvent) => {
        if (e.target !== target || pressed) {
            return;
        }
        pressed = true;
        const { x, y } = map2Window(e.clientX, e.clientY);
        bridge.native.onMouseDown(button, x, y);
        bridge.log("onMouseDown", "button", button, "x", x, "y", y);
    };

    const onPointerUp = (e: PointerEvent) => {
        if (e.target !== target || !pressed) {
            return;
        }
        pressed = false;
        const { x, y } = map2Window(e.clientX, e.clientY);
        bridge.native.onMouseUp(button, x, y);
        bridge.log("onMouseUp", "button", button, "x", x, "y", y);
    };

    const onPointerMove = (e: PointerEvent) => {
        if (e.target !== target || !pressed) {
            return;
        }
        const { x, y } = map2Window(e.clientX, e.clientY);
        bridge.native.onMouseMove(x, y);
        bridge.log("onMouseMove", "x", x, "y", y);
    };

    target.addEventListener("pointerdown", onPointerDown);
    target.addEventListener("pointerup", onPointerUp);
    target.addEventListener("pointermove", onPointerMove);
    target.addEventListener("pointercancel", onPointerUp);

    return () => {
        target.removeEventListener("pointerdown", onPointerDown);
        target.removeEventListener("pointerup", onPointerUp);
        target.removeEventListener("pointermove", onPointerMove);
        target.removeEventListener("pointercancel", onPointerUp);
    };
};
