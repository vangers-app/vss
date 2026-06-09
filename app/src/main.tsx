import { render } from 'preact'
import { openUrl } from "@tauri-apps/plugin-opener";
import type { ComponentType } from "preact";
import Vangers from "./vangers.mjs";
import { useEffect, useRef, useState } from 'preact/hooks';
import { installVssBrowser, localInstall } from "./vss-browser";
import { InventoryFrame } from "./inventory/inventory-frame";
import { installCellStyle, renderCellStyle } from "./ui/cell-style";
import { DownloadModsButton, InventoryOpenButton, LanguageButton, Telegram } from "./mobile/controls/keys";
import { Credits } from "./mobile/credits";
import type { Api, Event, UIType } from "./mobile/api";
import { find_steam_install, TAURI_BUILD } from "./compat";
import { loadMods, modsPresent } from "./mods";
import { useUiStore } from "./store";
import { DataNotFound } from "./ui/data-not-found";
import { DownloadMods, startModsDownload } from "./ui/download-mods";
import { state as addonState } from "./addons/state";
import { dismissCreditsOverlay } from "./addons/redraw-quant";
import "./index.css";

function isMobile(): boolean {
    if (typeof window === "undefined") {
        return false;
    }
    if (window.matchMedia?.("(pointer: coarse)").matches) {
        return true;
    }
    return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function App() {
    const [ready, setReady] = useState(false);
    const dataNotFound = useUiStore((state) => state.dataNotFound);
    const downloadActive = useUiStore((state) => state.download.active);
    useEffect(() => {
        (async () => {
            (window as any).__VSS_MOBILE__ = isMobile();
            const files = await find_steam_install();
            if (files !== null) {
                for (const { rel, abs } of files) {
                    localInstall.set(rel, abs);
                }
            } else if (TAURI_BUILD) {
                useUiStore.getState().setDataNotFound(true);
                return;
            }
            await loadMods();
            useUiStore.getState().setModsPresent(modsPresent());
            setReady(true);
        })();
    }, []);

    if (dataNotFound) {
        return <DataNotFound />;
    }

    if (!ready) {
        return null;
    }

    return <>
        <Game />
        {downloadActive && <DownloadMods />}
    </>;
}

function Game() {
    const canvas = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (canvas.current) {
            const Module: any = {
                canvas: canvas.current,
                onRuntimeInitialized: () => {
                    console.log("Runtime initialized");
                    installVssBrowser(Module);
                    const args = ["-vss", "/app-addons"];
                    if (window.localStorage.getItem("mobile.language") === "ru") {
                        args.push("-russian");
                    }
                    Module.callMain(args);
                }
            };
            let shopRightClickActive = false;
            let shopRightClickHandledAt = 0;
            const hasShopItem = () =>
                (window as any).__VSS_MOBILE__ !== true &&
                typeof Module._vss_bridge_hasShopItem === "function" &&
                Module._vss_bridge_hasShopItem() !== 0;
            const toggleShopAvi = (event: MouseEvent) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                shopRightClickHandledAt = Date.now();
                Module._vss_bridge_toggleShopAvi();
            };
            const onMouseDown = (event: MouseEvent) => {
                if (event.button === 2 && hasShopItem()) {
                    shopRightClickActive = true;
                    toggleShopAvi(event);
                }
            };
            const onMouseUp = (event: MouseEvent) => {
                if (event.button === 2 && shopRightClickActive) {
                    shopRightClickActive = false;
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }
            };
            const onContextMenu = (event: MouseEvent) => {
                event.preventDefault();
                if (hasShopItem() && Date.now() - shopRightClickHandledAt > 500) {
                    toggleShopAvi(event);
                }
            };
            canvas.current.addEventListener("mousedown", onMouseDown, true);
            canvas.current.addEventListener("mouseup", onMouseUp, true);
            canvas.current.addEventListener("contextmenu", onContextMenu, true);
            Vangers(Module);
            return () => {
                canvas.current?.removeEventListener("mousedown", onMouseDown, true);
                canvas.current?.removeEventListener("mouseup", onMouseUp, true);
                canvas.current?.removeEventListener("contextmenu", onContextMenu, true);
            };
        }
    }, [canvas]);

    return <div class="game-root">
        <canvas id="canvas" ref={canvas} width={800} height={600}></canvas>
        {(window as any).__VSS_MOBILE__ !== true && <DesktopFrame />}
        {(window as any).__VSS_MOBILE__ === true && <MobileFrame />}
    </div>
}

function DesktopFrame() {
    const [open, setOpen] = useState(false);
    const [uiType, setUiType] = useState<UIType>(() => addonState().uiType);
    const modsPresentState = useUiStore((state) => state.modsPresent);
    const style = useRef<HTMLStyleElement | null>(null);
    useEffect(() => {
        function renderStyle() {
            style.current = installCellStyle(style.current,
                renderCellStyle(window.innerWidth, window.innerHeight, 10, 1).css);
        }
        renderStyle();
        window.addEventListener("resize", renderStyle);
        return () => {
            window.removeEventListener("resize", renderStyle);
            if (style.current !== null) {
                document.head.removeChild(style.current);
                style.current = null;
            }
        };
    }, []);
    useEffect(() => {
        function onUiEvent(event: CustomEvent<Event>) {
            if (event.detail.type === "ui_type_changed") {
                setUiType(event.detail.uiType);
            }
        }
        window.addEventListener("vss-ui-event", onUiEvent as EventListener);
        setUiType(addonState().uiType);
        return () => window.removeEventListener("vss-ui-event", onUiEvent as EventListener);
    }, []);
    useEffect(() => {
        if (uiType !== "main-menu") {
            setOpen(false);
        }
    }, [uiType]);
    function closeDesktopCredits() {
        dismissCreditsOverlay();
        addonState().uiType = "main-menu";
        setUiType("main-menu");
    }
    if (open) {
        return <div class="frame">
            <InventoryFrame closeActiveUi={() => setOpen(false)} />
        </div>;
    }
    if (uiType === "credits") {
        return <div class="frame">
            <Credits closeActiveUi={closeDesktopCredits} />
        </div>;
    }
    if (uiType !== "main-menu") {
        return null;
    }
    if (!modsPresentState && TAURI_BUILD) {
        return <>
            <DownloadModsButton class="absolute cl-0 ct-0" onButtonUp={() => startModsDownload()} />
            <DesktopLanguageButton />
            <Telegram class="absolute cr-0 ct-2" openUrl={openUrl} />
        </>;
    }
    return <>
        <InventoryOpenButton class="absolute cl-0 ct-0" onButtonUp={() => setOpen(true)} />
        <DesktopLanguageButton />
        <Telegram class="absolute cr-0 ct-2" openUrl={openUrl} />
    </>;
}

function DesktopLanguageButton() {
    return <LanguageButton
        class="absolute cr-0 ct-0"
        language={() => window.localStorage.getItem("mobile.language") === "en" ? "en" : "ru"}
        setLanguage={(language) => window.localStorage.setItem("mobile.language", language)}
    />;
}

function MobileFrame() {
    const [Frame, setFrame] = useState<ComponentType<{ mobileApi: Api }> | null>(null);
    const [mobileApi, setMobileApi] = useState<Api | null>(null);
    useEffect(() => {
        import("./mobile/mobile-api").then((module) => setMobileApi(module.installMobileBrowser()));
        import("./mobile/frame").then((module) => setFrame(() => module.Frame));
    }, []);
    return Frame === null || mobileApi === null ? null : <Frame mobileApi={mobileApi} />;
}

render(<App />, document.getElementById('app')!)
