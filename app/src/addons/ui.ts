export interface UI {
    joyActive(): boolean;
    joyAngle(): number;
    joyDistance(): number;
    joyReverse(): boolean;
    portraitMode(): boolean;
    sendMessage(payload: string): void;
    localStorageUpdates(): string[];
    registerFramesData(menuFrame: Uint8Array, pauseFrame: Uint8Array,
        mapFrame: Uint8Array, shopFrame: Uint8Array): void;
    lockFrames(): void;
    unlockFrames(): void;
    filterEvent(code: number): boolean;
    tick(): void;
    enabled(id: string): boolean;

    // implemented here
    sendObject(object: any): void;
    log(message: string): void;
}

const global = new Function("return this;")();
const fallback: UI = {
    joyActive: () => false,
    joyAngle: () => 0,
    joyDistance: () => 0,
    joyReverse: () => false,
    portraitMode: () => false,
    sendMessage: () => {
    },
    sendObject: () => {
    },
    log: () => {
    },
    localStorageUpdates: () => [],
    registerFramesData: () => {
    },
    lockFrames: () => {
    },
    unlockFrames: () => {
    },
    filterEvent: () => false,
    tick: () => {
    },
    enabled: () => false,
};

const ui: UI = {
    joyActive: () => (global.ui ?? fallback).joyActive(),
    joyAngle: () => (global.ui ?? fallback).joyAngle(),
    joyDistance: () => (global.ui ?? fallback).joyDistance(),
    joyReverse: () => (global.ui ?? fallback).joyReverse(),
    portraitMode: () => (global.ui ?? fallback).portraitMode(),
    sendMessage: (payload) => (global.ui ?? fallback).sendMessage(payload),
    sendObject: (object) => (global.ui ?? fallback).sendObject(object),
    log: (message) => (global.ui ?? fallback).log(message),
    localStorageUpdates: () => (global.ui ?? fallback).localStorageUpdates(),
    registerFramesData: (...frames) => (global.ui ?? fallback).registerFramesData(...frames),
    lockFrames: () => (global.ui ?? fallback).lockFrames(),
    unlockFrames: () => (global.ui ?? fallback).unlockFrames(),
    filterEvent: (code) => (global.ui ?? fallback).filterEvent(code),
    tick: () => (global.ui ?? fallback).tick(),
    enabled: (id) => (global.ui ?? fallback).enabled(id),
};

ui.sendObject = (object: { type: string }) => {
    ui.sendMessage(JSON.stringify(object));
};

ui.log = (message: string) => {
    ui.sendObject({
        type: "log",
        message,
    });
};

export default ui;
