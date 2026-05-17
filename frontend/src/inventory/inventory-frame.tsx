import { useState } from "preact/hooks";
import inventoryBgUrl from "../assets/inventory-bg.jpg";
import type { InventoryItem } from "./items";
import {
    readCustomProp,
    readInventoryItems,
    writeCustomProp,
    writeInventoryItems,
} from "./storage";

export function InventoryFrame(props: { closeActiveUi: () => void }) {
    const [items, setItems] = useState<InventoryItem[]>(readInventoryItems());
    const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");
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

    return <div class="inventory-frame" style={{ backgroundImage: `url(${inventoryBgUrl})` }}>
        <button class="inventory-close" onClick={props.closeActiveUi} aria-label="Close inventory">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
        <aside class="inventory-list">
            {items.map((item) =>
                <button
                    class={"inventory-card" + (item.id === activeId ? " active" : "")}
                    onClick={() => setActiveId(item.id)}>
                    <span class="inventory-preview" style={{ backgroundImage: `url(${item.imageUrl})` }}>
                        <span class={"inventory-badge" + (item.enabled ? " enabled" : "")}>
                            <span class="inventory-dot"></span>
                            <span>{item.name}</span>
                        </span>
                    </span>
                </button>)}
        </aside>
        <section class="inventory-details">
            {active !== null &&
                <>
                    <h2>
                        <span class={"inventory-dot" + (active.enabled ? " enabled" : "")}></span>
                        <span>{active.name}</span>
                    </h2>
                    <p>{active.description}</p>
                    <button class={"inventory-toggle" + (active.enabled ? " enabled" : "")} onClick={toggleActive}>
                        {active.enabled ? "Disable" : "Enable"}
                    </button>
                    {active.id === "vss-fullscreen-game" &&
                        <label class="inventory-setting">
                            <input
                                type="checkbox"
                                checked={fullscreenLock}
                                onChange={toggleFullscreenLock} />
                            <span>Lock camera to road fullscreen mode</span>
                        </label>}
                </>}
        </section>
    </div>;
}
