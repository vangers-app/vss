import { Bridge } from "../bridge";
import { ScanCode } from "./sdl-scancodes";

const keyMapping: { [key: string]: ScanCode } = {
    "w": ScanCode.SDL_SCANCODE_W,
    "s": ScanCode.SDL_SCANCODE_S,
    "d": ScanCode.SDL_SCANCODE_D,
    "a": ScanCode.SDL_SCANCODE_A,
    "q": ScanCode.SDL_SCANCODE_Q,
    "e": ScanCode.SDL_SCANCODE_E,
    "r": ScanCode.SDL_SCANCODE_R,
    "f": ScanCode.SDL_SCANCODE_F,
    "tab": ScanCode.SDL_SCANCODE_TAB,
    "1": ScanCode.SDL_SCANCODE_1,
    "2": ScanCode.SDL_SCANCODE_2,
    "3": ScanCode.SDL_SCANCODE_3,
    "4": ScanCode.SDL_SCANCODE_4,
    "5": ScanCode.SDL_SCANCODE_5,
    " ": ScanCode.SDL_SCANCODE_SPACE,
    "escape": ScanCode.SDL_SCANCODE_ESCAPE,
    "v": ScanCode.SDL_SCANCODE_V,
    "enter": ScanCode.SDL_SCANCODE_RETURN,
    "f1": ScanCode.SDL_SCANCODE_F1,
    "f3": ScanCode.SDL_SCANCODE_F3,
    "arrowleft": ScanCode.SDL_SCANCODE_LEFT,
    "arrowright": ScanCode.SDL_SCANCODE_RIGHT,
    "arrowup": ScanCode.SDL_SCANCODE_UP,
    "arrowdown": ScanCode.SDL_SCANCODE_DOWN,
};

const repeatKeys = new Map<ScanCode, boolean>([].map((v) => [v, true]));

export function bindKeyboardControl(
    target: HTMLElement,
    bridge: Bridge,
) {
    const pressed: {[code: string]: boolean} = {};

    function onKeyDown(e: KeyboardEvent) {
        const code = keyMapping[e.key.toLowerCase()];
        if (code) {
            if (pressed[code] === true) {
                return;
            }

            pressed[code] = true;
            bridge.native.onKeyDown(code, repeatKeys.get(code) === true);
        }
    }

    function onKeyUp(e: KeyboardEvent) {
        const code = keyMapping[e.key.toLowerCase()];
        if (code) {
            if (pressed[code] !== true) {
                return;
            }

            pressed[code] = false;
            bridge.native.onKeyUp(code);
        }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        Object.keys(pressed).forEach((code) => {
            bridge.native.onKeyUp(Number.parseInt(code));
        });
    };
}
