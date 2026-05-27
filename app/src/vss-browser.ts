import * as frame from "./addons/frame";
import * as redrawQuant from "./addons/redraw-quant";
import * as sys from "./addons/sys";
import * as traction from "./addons/traction";
import * as uiOptions from "./addons/ui-options";
import * as uiTypeSelector from "./addons/ui-type-selector";
import * as vssFilesMod from "./addons/vss-files-mod";
import * as vssFullscreenGame from "./addons/vss-fullscreen-game";
import * as vssMusic from "./addons/vss-music";
import { isAddonEnabled } from "./inventory/storage";
import vss from "./addons/vss";
import { find_steam_install } from "./compat";


type VssModule = {
    FS: {
        stat(path: string): unknown;
    };
    HEAPU8: Uint8Array;
    UTF8ToString(ptr: number): string;
    _vss_bridge_getLineT(line: number): number;
    _vss_bridge_getLineTSize(): number;
    _vss_bridge_getShopItemInternalId(): number;
    _vss_bridge_getShopItemMechosName(): number;
    _vss_bridge_getShopItemType(): number;
    _vss_bridge_hasShopItem(): number;
    _vss_bridge_renderLine(line: number): void;
    _vss_bridge_sendEvent(code: number, data: number): void;
    _vss_bridge_toggleShopAvi(): void;
};

type Quant = {
    name: string;
    payload: Record<string, unknown>;
};

type QuantResult = Record<string, unknown>;

const keyCodeToScanCode: Record<string, number> = {
    Digit1: 30,
    Digit2: 31,
    Digit3: 32,
    Digit4: 33,
    Digit5: 34,
    Digit6: 35,
    Digit7: 36,
    Digit8: 37,
    Digit9: 38,
    Digit0: 39,
    Enter: 40,
    Escape: 41,
    Backspace: 42,
    Tab: 43,
    Space: 44,
    Minus: 45,
    Equal: 46,
    BracketLeft: 47,
    BracketRight: 48,
    Backslash: 49,
    Semicolon: 51,
    Quote: 52,
    Backquote: 53,
    Comma: 54,
    Period: 55,
    Slash: 56,
    CapsLock: 57,
    F1: 58,
    F2: 59,
    F3: 60,
    F4: 61,
    F5: 62,
    F6: 63,
    F7: 64,
    F8: 65,
    F9: 66,
    F10: 67,
    F11: 68,
    F12: 69,
    Insert: 73,
    Home: 74,
    PageUp: 75,
    Delete: 76,
    End: 77,
    PageDown: 78,
    ArrowRight: 79,
    ArrowLeft: 80,
    ArrowDown: 81,
    ArrowUp: 82,
    NumpadDivide: 84,
    NumpadMultiply: 85,
    NumpadSubtract: 86,
    NumpadAdd: 87,
    NumpadEnter: 88,
    Numpad1: 89,
    Numpad2: 90,
    Numpad3: 91,
    Numpad4: 92,
    Numpad5: 93,
    Numpad6: 94,
    Numpad7: 95,
    Numpad8: 96,
    Numpad9: 97,
    Numpad0: 98,
    NumpadDecimal: 99,
    ControlLeft: 224,
    ShiftLeft: 225,
    AltLeft: 226,
    MetaLeft: 227,
    ControlRight: 228,
    ShiftRight: 229,
    AltRight: 230,
    MetaRight: 231,
};

for (let i = 0; i < 26; i++) {
    keyCodeToScanCode[`Key${String.fromCharCode(65 + i)}`] = 4 + i;
}

const global = globalThis as typeof globalThis & {
    bridge?: Record<string, unknown>;
    config?: unknown;
    onVssQuant?: (name: string, payload: Record<string, unknown>) => QuantResult | undefined;
    ui?: UiAdapter;
    vss?: unknown;
    __vssBrowser?: VssBrowser;
    __VSS_MOBILE__?: boolean;
};

type AddonManifest = {
    id: string;
    scope: "global" | "mobile";
    defaultEnabled: boolean;
    loader: () => boolean | void;
};

type UiAdapter = {
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

const addonManifest: AddonManifest[] = [
    { id: "frame", scope: "mobile", defaultEnabled: true, loader: () => frame.init() },
    { id: "redraw-quant", scope: "mobile", defaultEnabled: true, loader: () => redrawQuant.init() },
    { id: "sys", scope: "mobile", defaultEnabled: true, loader: () => sys.init() },
    { id: "traction", scope: "mobile", defaultEnabled: true, loader: () => traction.init() },
    { id: "ui-options", scope: "mobile", defaultEnabled: true, loader: () => uiOptions.init() },
    { id: "ui-type-selector", scope: "global", defaultEnabled: true, loader: () => uiTypeSelector.init() },
    { id: "vss-files-mod", scope: "global", defaultEnabled: true, loader: () => vssFilesMod.init() },
    { id: "vss-music", scope: "global", defaultEnabled: false, loader: () => vssMusic.init() },
    { id: "vss-fullscreen-game", scope: "global", defaultEnabled: true, loader: () => vssFullscreenGame.init() },
];

class VssBrowser {
    private folder = "";
    private Module: VssModule;
    private nextQuantId = 1;
    private nextResultId = 1;
    private quants: Record<number, Quant> = {};
    private results: Record<number, QuantResult> = {};
    private pressedScanCodes = new Set<number>();

    constructor(Module: VssModule) {
        this.Module = Module;
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
        window.addEventListener("blur", this.onBlur);
    }

    initScripts(folder: string) {
        this.folder = folder;
        this.quants = {};
        this.results = {};
        delete global.config;
        global.bridge = this.createBridge();
        global.ui = global.ui ?? createDesktopUiAdapter();

        const localInstall = new Map<string, string>();
        find_steam_install().then((files) => {
            if (files !== null) {
                for (const file of files) {
                    console.log("== local install:", file);
                    localInstall.set(file, file);
                }
            }
        });

        vss.addQuantListener("file_open", (payload) => {
            const { file, flags } = payload;
            console.log("== file_open:", file, flags);
        });

        for (const next of addonManifest) {
            if (this.isAddonActive(next)) {
                const started = next.loader();
                console.log("== vss:", next.id, started === false ? "failed" : "started");
            } else {
                console.log("== vss:", next.id, "disabled");
            }
        }

        return true;
    }

    beginQuant(name: string) {
        const id = this.nextQuantId++;
        this.quants[id] = { name, payload: {} };
        return id;
    }

    setProp(id: number, name: string, value: unknown) {
        const quant = this.quants[id];
        if (quant !== undefined) {
            quant.payload[name] = value;
        }
    }

    sendQuant(id: number) {
        const quant = this.quants[id];
        delete this.quants[id];
        if (quant === undefined || global.onVssQuant === undefined) {
            return 0;
        }
        const result = global.onVssQuant(quant.name, quant.payload);
        if (result === undefined) {
            return 0;
        }
        const resultId = this.nextResultId++;
        this.results[resultId] = result;
        return resultId;
    }

    isResultHandled(id: number) {
        return this.results[id]?.handled === true;
    }

    isPreventDefault(id: number) {
        return this.results[id]?.preventDefault === true;
    }

    getInt(id: number, name: string, defaultValue: number) {
        const value = this.results[id]?.[name];
        return typeof value === "number" ? value : defaultValue;
    }

    getBool(id: number, name: string, defaultValue: boolean) {
        const value = this.results[id]?.[name];
        return typeof value === "boolean" ? value : defaultValue;
    }

    getString(id: number, name: string, defaultValue: string) {
        const value = this.results[id]?.[name];
        return typeof value === "string" ? value : defaultValue;
    }

    releaseResult(id: number) {
        delete this.results[id];
    }

    toggleShopAvi() {
        this.Module._vss_bridge_toggleShopAvi();
    }

    private createBridge() {
        return {
            fatal: (msg: string) => {
                throw new Error(msg);
            },
            initScripts: (folder: string) => this.initScripts(folder),
            getScriptsFolder: () => this.folder,
            sendEvent: (code: number, data?: number) => {
                this.Module._vss_bridge_sendEvent(code, data ?? 0);
            },
            isKeyPressed: (scanCode: number) => this.pressedScanCodes.has(scanCode),
            isFileExists: (file: string) => {
                try {
                    this.Module.FS.stat(file);
                    return true;
                } catch {
                    return false;
                }
            },
            getLineT: (line: number) => {
                const ptr = this.Module._vss_bridge_getLineT(line);
                return this.Module.HEAPU8.subarray(ptr, ptr + this.Module._vss_bridge_getLineTSize());
            },
            renderLine: (line: number) => {
                this.Module._vss_bridge_renderLine(line);
            },
            getRgbaData: (
                frame: Uint8Array,
                frameWidth: number,
                startX: number,
                startY: number,
                width: number,
                height: number,
                rgbaData: Uint8Array,
            ) => {
                for (let y = 0; y < height; y++) {
                    const offset = ((y + startY) * frameWidth + startX) * 4;
                    rgbaData.set(
                        frame.subarray(offset, offset + width * 4),
                        y * width * 4,
                    );
                }
            },
            toBase64: (data: Uint8Array) => {
                let binary = "";
                for (let i = 0; i < data.length; i += 0x8000) {
                    binary += String.fromCharCode(...data.subarray(i, i + 0x8000));
                }
                return btoa(binary);
            },
            getShopItem: () => {
                if (this.Module._vss_bridge_hasShopItem() === 0) {
                    return {};
                }
                return {
                    internalId: this.Module._vss_bridge_getShopItemInternalId(),
                    mechosName: this.Module.UTF8ToString(this.Module._vss_bridge_getShopItemMechosName()),
                    type: this.Module._vss_bridge_getShopItemType(),
                };
            },
        };
    }

    private isAddonActive(addon: AddonManifest) {
        if (addon.scope === "mobile") {
            return global.__VSS_MOBILE__ === true && addon.defaultEnabled;
        }
        if (addon.id === "vss-fullscreen-game" && global.__VSS_MOBILE__ === true) {
            return true;
        }
        return isAddonEnabled(addon.id, addon.defaultEnabled);
    }

    private onKeyDown = (event: KeyboardEvent) => {
        const scanCode = keyCodeToScanCode[event.code];
        if (scanCode !== undefined) {
            this.pressedScanCodes.add(scanCode);
        }
    };

    private onKeyUp = (event: KeyboardEvent) => {
        const scanCode = keyCodeToScanCode[event.code];
        if (scanCode !== undefined) {
            this.pressedScanCodes.delete(scanCode);
        }
    };

    private onBlur = () => {
        this.pressedScanCodes.clear();
    };
}

export function installVssBrowser(Module: VssModule) {
    global.__vssBrowser = new VssBrowser(Module);
}

function createDesktopUiAdapter(): UiAdapter {
    return {
        joyActive: () => false,
        joyAngle: () => 0,
        joyDistance: () => 0,
        joyReverse: () => false,
        portraitMode: () => false,
        sendMessage: () => {
        },
        sendObject: (payload) => {
            window.dispatchEvent(new CustomEvent("vss-ui-event", { detail: payload }));
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
        enabled: (id: string) => isAddonEnabled(id),
    };
}
