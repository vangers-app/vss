import { useState } from "preact/hooks";
import inventoryBgUrl from "../assets/inventory-bg.jpg";
import { inventoryItems, type InventoryItem } from "./items";

export function InventoryFrame(props: { closeActiveUi: () => void }) {
    const [items, setItems] = useState<InventoryItem[]>(inventoryItems);
    const [activeId, setActiveId] = useState<string>(inventoryItems[0]?.id ?? "");
    const active = items.find((item) => item.id === activeId) ?? null;

    function toggleActive() {
        if (active === null) {
            return;
        }
        setItems(items.map((item) => item.id === active.id ? {
            ...item,
            enabled: !item.enabled,
        } : item));
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
                </>}
        </section>
    </div>;
}
