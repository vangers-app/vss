import { useRef } from "preact/hooks";
import inventoryBgUrl from "../assets/inventory-bg.jpg";
import { readRenderSettings } from "../render-presets";
import { SettingsPanel } from "./settings-panel";

// Standalone settings screen shown on the first mobile launch, before the
// main menu. Render settings only take effect at engine start, so closing
// also reloads the page when they were changed. onClose runs first so that
// whatever it persists (the chosen controls kind) survives the reload.
export function SettingsFrame(props: { onClose: () => void }) {
    const initialRenderSettings = useRef(readRenderSettings());

    function close() {
        props.onClose();
        const current = readRenderSettings();
        if (current.use3d !== initialRenderSettings.current.use3d ||
            current.quality !== initialRenderSettings.current.quality) {
            location.reload();
        }
    }

    return <div class="inventory-frame h-full flex flex-col" style={{ backgroundImage: `url(${inventoryBgUrl})` }}>
        <button class="inventory-close absolute right-8 top-4 cursor-pointer"
            onClick={close} aria-label="Close settings">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
        <section class="inventory-details flex flex-col flex-grow mx-8 mt-4 overflow-auto">
            <SettingsPanel />
        </section>
    </div>;
}
