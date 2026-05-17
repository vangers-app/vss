import { useState } from "preact/hooks";
import inventoryBgUrl from "../assets/inventory-bg.jpg";
import type { InventoryItem } from "./items";
import { t } from "./i18n";
import {
    readCustomProp,
    readInventoryItems,
    writeCustomProp,
    writeInventoryItems,
} from "./storage";

export function InventoryFrame(props: { closeActiveUi: () => void }) {
    const [items, setItems] = useState<InventoryItem[]>(readInventoryItems());
    const [activeId, setActiveId] = useState<string>("");
    const [fullscreenLock, setFullscreenLock] =
        useState<boolean>(readCustomProp("vss-fullscreen-game.locked") !== "false");
    const active = items.find((item) => item.id === activeId) ?? null;

    function toggleActive() {
        if (active === null) {
            return;
        }
        const nextItems = items.map((item) => item.id === active.id ? {
            ...item,
            enabled: !item.enabled,
        } : active.group !== undefined && item.group === active.group ? {
            ...item,
            enabled: false,
        } : item);
        writeInventoryItems(nextItems);
        setItems(nextItems);
    }

    function toggleFullscreenLock() {
        const nextValue = !fullscreenLock;
        writeCustomProp("vss-fullscreen-game.locked", nextValue ? "true" : "false");
        setFullscreenLock(nextValue);
    }

    return <div class="inventory-frame h-full flex flex-row" style={{ backgroundImage: `url(${inventoryBgUrl})` }}>
        <button class="inventory-close absolute right-8 top-4 cursor-pointer"
            onClick={props.closeActiveUi} aria-label="Close inventory">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
        <aside class="inventory-list flex flex-col flex-shrink-0 overflow-auto smooth">
            {items.map((item) =>
                <button
                    class={"inventory-card cursor-pointer w-52 my-4 mx-8 overflow-hidden relative border " +
                        "border-slate-800 flex-shrink-0 rounded" +
                        (item.id === activeId ? " outline-double outline-green-400" : "")}
                    onClick={() => setActiveId(item.id)}>
                    <span class="relative block w-full h-32 bg-no-repeat bg-center bg-cover bg-slate-800"
                        style={{ backgroundImage: `url(${item.imageUrl})` }}>
                        <span class={(item.enabled ? "bg-green-200 " : "bg-red-200 ") +
                            "absolute opacity-90 flex flex-row mt-4 px-4 pt-1 text-lg font-bold items-center rounded-r-sm"}>
                            <span class={(item.enabled ? "bg-green-500 " : "bg-red-500 ") +
                                "rounded-full w-2 h-2 mr-2 mb-1"}></span>
                            <span class="overflow-ellipsis whitespace-nowrap">{t(item.nameKey)}</span>
                        </span>
                    </span>
                </button>)}
        </aside>
        <section class="inventory-details flex flex-col flex-grow ml-4 mr-8 overflow-auto">
            <div class="self-end flex flex-row my-4 mr-16">
                <div class="cursor-pointer underline text-yellow-800 text-shadow-sm" onClick={() => location.reload()}>
                    {t("refresh")}
                </div>
            </div>
            {active === null &&
                <div class="flex flex-col">
                    <p class="text-2xl">{t("tap_item")}</p>
                </div>}
            {active !== null &&
                <>
                    <div class="flex flex-row items-center">
                        <p class={(active.enabled ? "bg-green-500 " : "bg-red-500 ") +
                            "rounded-full w-2 h-2 mr-2 mb-1"}></p>
                        <p class="text-2xl font-bold">{t(active.nameKey)}</p>
                    </div>
                    {active.enabled !== true &&
                        <div onClick={toggleActive}
                            class="cursor-pointer mt-2 ml-4 text-5xl text-green-800 underline text-shadow">
                            {t("enable")}
                        </div>}
                    {active.enabled === true &&
                        <div onClick={toggleActive}
                            class="cursor-pointer mt-2 ml-4 text-5xl text-red-800 underline text-shadow">
                            {t("disable")}
                        </div>}
                    <p class="mt-4">{t(active.descriptionKey)}</p>
                    <p class="font-bold text-lg text-shadow-sm text-yellow-800">{t("owned")}</p>
                    {active.id === "vss-fullscreen-game" &&
                        <label class="inventory-setting ml-4 text-2xl mt-4 flex flex-row text-shadow-sm text-white cursor-pointer">
                            <input
                                type="checkbox"
                                checked={fullscreenLock}
                                onChange={toggleFullscreenLock} />
                            <span>{t("fullscreen_lock")}</span>
                        </label>}
                </>}
        </section>
    </div>;
}
