import { toHex } from "./encoder";
import { isAddonEnabled, readCustomProp, writeCustomProp } from "./inventory/storage";
import type { NativeBridge } from "./ui/native-bridge";

type UiAddonBridge = {
    joyActive(): boolean;
    joyAngle(): number;
    joyDistance(): number;
    joyReverse(): boolean;
    portraitMode(): boolean;
    sendMessage(payload: string): void;
    sendObject(payload: Record<string, unknown>): void;
    log(message: string): void;
    localStorageUpdates(): string[];
    registerFramesData(...frames: Uint8Array[]): void;
    lockFrames(): void;
    unlockFrames(): void;
    filterEvent(code: number): boolean;
    tick(): void;
    enabled(id: string): boolean;
};

const encoder = new TextEncoder();
const scanCodeToKeyboardEvent: Record<number, { code: string; key: string }> = {
    4: { code: "KeyA", key: "a" },
    5: { code: "KeyB", key: "b" },
    6: { code: "KeyC", key: "c" },
    7: { code: "KeyD", key: "d" },
    8: { code: "KeyE", key: "e" },
    9: { code: "KeyF", key: "f" },
    20: { code: "KeyQ", key: "q" },
    21: { code: "KeyR", key: "r" },
    22: { code: "KeyS", key: "s" },
    25: { code: "KeyV", key: "v" },
    26: { code: "KeyW", key: "w" },
    30: { code: "Digit1", key: "1" },
    31: { code: "Digit2", key: "2" },
    32: { code: "Digit3", key: "3" },
    33: { code: "Digit4", key: "4" },
    34: { code: "Digit5", key: "5" },
    40: { code: "Enter", key: "Enter" },
    41: { code: "Escape", key: "Escape" },
    43: { code: "Tab", key: "Tab" },
    44: { code: "Space", key: " " },
    58: { code: "F1", key: "F1" },
    60: { code: "F3", key: "F3" },
    79: { code: "ArrowRight", key: "ArrowRight" },
    80: { code: "ArrowLeft", key: "ArrowLeft" },
    81: { code: "ArrowDown", key: "ArrowDown" },
    82: { code: "ArrowUp", key: "ArrowUp" },
};

class BrowserMobileBridge implements NativeBridge {
    private joyIsActive = false;
    private joyCurrentAngle = 0;
    private joyCurrentDistance = 0;
    private joyIsReverse = false;
    private storageUpdates: string[] = [];
    private frames: Uint8Array[] = [];

    readonly ui: UiAddonBridge = {
        joyActive: () => this.joyIsActive,
        joyAngle: () => this.joyCurrentAngle,
        joyDistance: () => this.joyCurrentDistance,
        joyReverse: () => this.joyIsReverse,
        portraitMode: () => window.innerHeight > window.innerWidth,
        sendMessage: (payload) => this.emitAddonMessage(payload),
        sendObject: (payload) => this.emitAddonMessage(JSON.stringify(payload)),
        log: (message) => this.emitAddonMessage(JSON.stringify({ type: "log", message })),
        localStorageUpdates: () => {
            const updates = this.storageUpdates;
            this.storageUpdates = [];
            return updates;
        },
        registerFramesData: (...frames) => {
            this.frames = frames;
        },
        lockFrames: () => {
        },
        unlockFrames: () => {
        },
        filterEvent: () => false,
        tick: () => {
        },
        enabled: (id) => isAddonEnabled(id),
    };

    ready(): void {
    }

    debug(): boolean {
        return true;
    }

    artifactoryUrl(): string {
        return "";
    }

    setStorageItem(key: string, value: string): void {
        window.localStorage.setItem(key, value);
        this.storageUpdates.push(key, value);
    }

    getCustomProp(name: string): string {
        return readCustomProp(name);
    }

    setCustomProp(name: string, value: string): void {
        writeCustomProp(name, value);
    }

    rendererWidth(): number {
        return this.canvas()?.width ?? 800;
    }

    rendererHeight(): number {
        return this.canvas()?.height ?? 600;
    }

    windowWidth(): number {
        return window.innerWidth;
    }

    windowHeight(): number {
        return window.innerHeight;
    }

    onMouseDown(button: 1 | 2, x: number, y: number): void {
        this.dispatchMouse("mousedown", button, x, y);
    }

    onMouseMove(x: number, y: number): void {
        this.dispatchMouse("mousemove", 0, x, y);
    }

    onMouseUp(button: 1 | 2, x: number, y: number): void {
        this.dispatchMouse("mouseup", button, x, y);
    }

    onKeyDown(keyCode: number, repeat: boolean): void {
        this.dispatchKey("keydown", keyCode, repeat);
    }

    onKeyUp(keyCode: number): void {
        this.dispatchKey("keyup", keyCode, false);
    }

    onJoystickUpdate(active: boolean, distance: number, angle: number): void {
        this.joyIsActive = active;
        this.joyCurrentDistance = distance;
        this.joyCurrentAngle = angle;
    }

    onJoystickReverseUpdate(reverse: boolean): void {
        this.joyIsReverse = reverse;
    }

    getMenuFrame(): string {
        return this.getFrame(0);
    }

    getPauseFrame(): string {
        return this.getFrame(1);
    }

    getMapFrame(): string {
        return this.getFrame(2);
    }

    getShopFrame(): string {
        return this.getFrame(3);
    }

    proceedInapp(): void {
        this.emitAddonMessage(JSON.stringify({ type: "inapp-result" }));
    }

    language(): "en" | "ru" {
        return window.localStorage.getItem("mobile.language") === "en" ? "en" : "ru";
    }

    setLanguage(lang: "en" | "ru"): void {
        window.localStorage.setItem("mobile.language", lang);
    }

    toggleShopAvi(): void {
        const browser = (window as typeof window & {
            __vssBrowser?: { toggleShopAvi(): void };
        }).__vssBrowser;
        browser?.toggleShopAvi();
    }

    requestToken(): void {
        window.dispatchEvent(new CustomEvent("mobile-token-unavailable"));
    }

    haveRendererScale(): boolean {
        return true;
    }

    menuUp(): void {
        this.tapKey(82);
    }

    menuDown(): void {
        this.tapKey(81);
    }

    menuActivate(): void {
        this.tapKey(40);
    }

    setInputPosition(): void {
    }

    showInput(): void {
    }

    openUrl(url: string): void {
        window.open(url, "_blank", "noopener,noreferrer");
    }

    cutout(): string {
        return "";
    }

    login(): string {
        return "";
    }

    private canvas() {
        return document.getElementById("canvas") as HTMLCanvasElement | null;
    }

    private emitAddonMessage(payload: string) {
        const onNativeEvent = (window as typeof window & {
            onNativeEvent?: (hexJson: string) => void;
        }).onNativeEvent;
        if (onNativeEvent !== undefined) {
            onNativeEvent(toHex(encoder.encode(payload)));
        }
    }

    private dispatchMouse(type: "mousedown" | "mousemove" | "mouseup", button: number, x: number, y: number) {
        const canvas = this.canvas();
        if (canvas !== null) {
            const bounds = canvas.getBoundingClientRect();
            const clientX = bounds.left + x / this.rendererWidth() * bounds.width;
            const clientY = bounds.top + y / this.rendererHeight() * bounds.height;
            canvas.dispatchEvent(new MouseEvent(type, {
                bubbles: true,
                button: button > 0 ? button - 1 : 0,
                buttons: type === "mouseup" ? 0 : button,
                clientX,
                clientY,
            }));
        }
    }

    private dispatchKey(type: "keydown" | "keyup", scanCode: number, repeat: boolean) {
        const key = scanCodeToKeyboardEvent[scanCode];
        if (key !== undefined) {
            window.dispatchEvent(new KeyboardEvent(type, {
                bubbles: true,
                code: key.code,
                key: key.key,
                repeat,
            }));
        }
    }

    private tapKey(scanCode: number) {
        this.dispatchKey("keydown", scanCode, false);
        window.setTimeout(() => this.dispatchKey("keyup", scanCode, false), 0);
    }

    private getFrame(index: number) {
        const frame = this.frames[index];
        return frame === undefined ? "" : toHex(frame);
    }
}

const global = window as typeof window & {
    bridge?: NativeBridge;
    ui?: UiAddonBridge;
};

export const mobileBrowser = new BrowserMobileBridge();

global.bridge = mobileBrowser;
global.ui = mobileBrowser.ui;
