type VssModule = {
    FS: {
        readdir(path: string): string[];
        readFile(path: string, options?: { encoding?: "utf8" }): string | Uint8Array;
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
};

type CommonJsModule = {
    exports: Record<string, unknown>;
};

type Quant = {
    name: string;
    payload: Record<string, unknown>;
};

type QuantResult = Record<string, unknown>;

const global = globalThis as typeof globalThis & {
    bridge?: Record<string, unknown>;
    config?: unknown;
    ls?: unknown;
    onVssQuant?: (name: string, payload: Record<string, unknown>) => QuantResult | undefined;
    vss?: unknown;
    __vssBrowser?: VssBrowser;
};

class VssBrowser {
    private folder = "";
    private Module: VssModule;
    private nextQuantId = 1;
    private nextResultId = 1;
    private modules: Record<string, CommonJsModule> = {};
    private quants: Record<number, Quant> = {};
    private results: Record<number, QuantResult> = {};

    constructor(Module: VssModule) {
        this.Module = Module;
    }

    initScripts(folder: string) {
        this.folder = folder;
        this.modules = {};
        this.quants = {};
        this.results = {};
        delete global.config;
        delete global.ls;
        delete global.onVssQuant;
        delete global.vss;
        global.bridge = this.createBridge();
        this.require("main");
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

    private require = (id: string) => {
        const fileName = this.resolve(id);
        const cached = this.modules[fileName];
        if (cached !== undefined) {
            return cached.exports;
        }
        const module = { exports: {} };
        this.modules[fileName] = module;
        new Function(
            "require",
            "exports",
            "module",
            `${this.readText(fileName)}\n//# sourceURL=${this.folder}/${fileName}`,
        )(this.require, module.exports, module);
        return module.exports;
    };

    private resolve(id: string) {
        const fileName = id.startsWith("./") ? id.substring(2) : id;
        return fileName.endsWith(".js") ? fileName : `${fileName}.js`;
    }

    private readText(fileName: string) {
        return this.Module.FS.readFile(`${this.folder}/${fileName}`, { encoding: "utf8" }) as string;
    }

    private createBridge() {
        return {
            fatal: (msg: string) => {
                throw new Error(msg);
            },
            scripts: () => this.Module.FS.readdir(this.folder).filter((value) => value.endsWith(".js")),
            initScripts: (folder: string) => this.initScripts(folder),
            getScriptsFolder: () => this.folder,
            sendEvent: (code: number, data?: number) => {
                this.Module._vss_bridge_sendEvent(code, data ?? 0);
            },
            isKeyPressed: () => false,
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
            readLocalStorage: () => {
                const key = this.localStorageKey();
                let value = window.localStorage.getItem(key);
                if (value === null) {
                    value = this.readText("ls.json");
                    window.localStorage.setItem(key, value);
                }
                return value;
            },
            writeLocalStorage: (value: string) => {
                window.localStorage.setItem(this.localStorageKey(), value);
            },
        };
    }

    private localStorageKey() {
        return `vss:${this.folder}:ls`;
    }
}

export function installVssBrowser(Module: VssModule) {
    global.__vssBrowser = new VssBrowser(Module);
}
