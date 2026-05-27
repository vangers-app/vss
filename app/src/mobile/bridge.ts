import { createContext } from "preact";
import { Event, Api, UIType } from "./api";
import { init as initOptions } from "./controls/options";
import { fromHex } from "../encoder";
import { installCellStyle, renderCellStyle } from "../ui/cell-style";

const textDecoder = new TextDecoder();
export const BridgeContext = createContext<Bridge>(null as any);

export class Bridge {
    public native: Api;

    private readyFn?: (bridge: Bridge) => void;
    public rendererWidth = 0;
    public rendererHeight = 0;
    public windowWidth = 0;
    public windowHeight = 0;
    public windowOffsetX = 0;
    public pageWidth = 0;
    public pageHeight = 0;
    public pageScaleX = 1;
    public pageScaleY = 1;
    public rendererScaleX = 1;
    public rendererScaleY = 1;
    public scaledRenderer = true;
    public scaledRendererOffsetX = 0;
    public scaledRendererScale = 1;
    public useRendererScale = true;

    public cellCount = 10;
    public cellSizeInPx = 0;

    public cutout = "";

    public onUiTypeChanged = (uiType: UIType) => { };
    public onNetworkState = (network: boolean) => { };
    public onOrientationChanged = (orientation: "portrait" | "landscape") => { };
    private onInappResult = () => { };

    private tokenPromise: Promise<string> | null = null;
    private tokenResolve: (token: string) => void = () => { };
    private tokenReject: (reason?: any) => void = () => { };
    private uiStyleSheet: HTMLStyleElement | null = null;

    constructor(native: Api, readFn: (bridge: Bridge) => void) {
        this.native = native;
        this.readyFn = readFn;

        (window as any).onNativeEvent = (base64json: string) => {
            const entry = textDecoder.decode(fromHex(base64json));
            const json = entry[0] === "{" ?
                entry :
                "{" + entry.substring(0, entry.length - 1) + "}";
            const event = JSON.parse(json) as Event;

            this.onEvent(event);
        };

        this.useRendererScale = this.native.haveRendererScale();
        this.native.ready();
    }

    onEvent(event: Event) {
        switch (event.type) {
            case "ready": {
                initOptions(this);
                this.rendererWidth = this.native.rendererWidth();
                this.rendererHeight = this.native.rendererHeight();
                this.windowWidth = this.native.windowWidth();
                this.windowHeight = this.native.windowHeight();
                this.pageWidth = window.innerWidth;
                this.pageHeight = window.innerHeight;
                this.pageScaleX = this.windowWidth / this.pageWidth;
                this.pageScaleY = this.windowHeight / this.pageHeight;
                this.rendererScaleX = this.windowWidth / this.rendererWidth;
                this.rendererScaleY = this.windowHeight / this.rendererHeight;
                this.windowOffsetX = (this.windowWidth -
                    this.windowHeight * (this.rendererWidth / this.rendererHeight)) / 2;
                this.scaledRendererScale = this.rendererHeight / 600.0;
                this.scaledRendererOffsetX =
                    (800 * this.scaledRendererScale - this.rendererWidth) / 2 * this.rendererScaleX;
                this.cutout = this.native.cutout();
                this.log("ready",
                    "renderer", this.rendererWidth + "x" + this.rendererHeight,
                    "window", this.windowWidth + "x" + this.windowHeight,
                    "viewport", this.pageWidth + "x" + this.pageHeight);
                this.renderUiStyleSheet(this.renderSize());
                this.readyFn?.(this);
                delete this.readyFn;
            } break;
            case "scaled_renderer_changed": {
                this.scaledRenderer = event.enabled;
                this.log("scaledRendererChanged", this.scaledRenderer);
            } break;
            case "ui_type_changed": {
                this.log("ui_type_changed", event.uiType);
                this.onUiTypeChanged(event.uiType);
            } break;
            case "network_state": {
                this.log("network_state", event.network);
                this.onNetworkState(event.network);
            } break;
            case "log": {
                this.log("vandroid:", event.message);
            } break;
            case "orientation_changed": {
                this.onOrientationChanged(event.orientation);
            } break;
            case "inapp-result": {
                this.onInappResult();
            } break;
            default: {
                this.warn("Unknown event type", event.type);
            } break;
        }
    }

    rendererToPage(rendererX: number, rendererY: number) {
        const windowX = (rendererX * this.rendererScaleX -
            this.windowOffsetX / this.rendererScaleX);
        const windowY = rendererY * this.rendererScaleY;

        return {
            x: windowX / this.pageScaleX,
            y: windowY / this.pageScaleY,
        };
    }

    map2Window(pageX: number, pageY: number, useScaledOffset?: boolean) {
        let windowX = pageX * this.pageScaleX;
        let windowY = pageY * this.pageScaleY;
        let scaledRendererOffsetX = this.scaledRendererOffsetX;

        if (!this.useRendererScale) {
            windowX /= this.rendererScaleX;
            windowY /= this.rendererScaleY;
            scaledRendererOffsetX /= this.rendererScaleX;
        }

        if (this.scaledRenderer) {
            let scaledX = windowX;

            if (this.useRendererScale) {
                // not supported by 3d render, so ignore
                scaledX += this.windowOffsetX / this.scaledRendererScale;
            }

            if (useScaledOffset !== false) {
                scaledX += scaledRendererOffsetX;
            }

            scaledX = scaledX / this.scaledRendererScale;
            const scaledY = windowY / this.scaledRendererScale;

            if (scaledX < 0) {
                scaledX = 0;
            }

            return {
                x: scaledX,
                y: scaledY,
            };
        }

        return {
            x: windowX,
            y: windowY,
        };
    }

    log(...args: any[]) {
        if (this.native.debug() === true) {
            console.log(...args);
        }
    }

    warn(...args: any[]) {
        console.warn(...args);
    }

    renderUiStyleSheet(scale: number) {
        const cellStyle = renderCellStyle(this.pageWidth, this.pageHeight, this.cellCount, scale);
        this.cellSizeInPx = cellStyle.cellSizeInPx;
        this.uiStyleSheet = installCellStyle(this.uiStyleSheet, cellStyle.css);
    }

    proceedInapp(onInappResult: () => void) {
        this.onInappResult = () => {
            this.onInappResult = () => { };
            onInappResult();
        };
        this.native.proceedInapp();
    }

    getToken(showUiIfNeeded: boolean) {
        if (this.tokenPromise !== null) {
            return this.tokenPromise;
        }

        this.tokenPromise = new Promise<string>((resolve, reject) => {
            this.tokenResolve = (token: string) => {
                this.tokenPromise = null;
                resolve(token);
            };

            this.tokenReject = (reason?: any) => {
                this.tokenPromise = null;
                reject(reason);
            };

            (window as any).onTokenResolve = this.tokenResolve;
            (window as any).onTokenReject = this.tokenReject;
            this.native.requestToken(showUiIfNeeded);
        });

        return this.tokenPromise;
    }

    toggleSize() {
        const size = this.renderSize();
        const newSize = this.nextSize(size);
        this.setRenderSize(newSize);
        this.renderUiStyleSheet(newSize);
    }

    nextSize(size: number): number {
        const sizes = [1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7];
        let index = 0;
        while (index < sizes.length && size <= sizes[index]) {
            index++;
        }
        return sizes[index % sizes.length];
    }

    renderSize() {
        const size = localStorage.getItem("renderSize");
        if (size === null) {
            return 1.0;
        }

        return Number.parseFloat(size);
    }

    setRenderSize(size: number) {
        localStorage.setItem("renderSize", size + "");
    }
}
