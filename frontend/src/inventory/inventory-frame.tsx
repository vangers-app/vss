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
        <button class="inventory-close" onClick={props.closeActiveUi} aria-label="Close inventory">x</button>
        <aside class="inventory-list">
            {items.map((item) =>
                <button
                    class={"inventory-item" + (item.id === activeId ? " active" : "")}
                    onClick={() => setActiveId(item.id)}>
                    <span class={"inventory-dot" + (item.enabled ? " enabled" : "")}></span>
                    <span>{item.name}</span>
                </button>)}
        </aside>
        <section class="inventory-details">
            {active !== null &&
                <>
                    <h2>{active.name}</h2>
                    <p>{active.description}</p>
                    <button class="inventory-toggle" onClick={toggleActive}>
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
