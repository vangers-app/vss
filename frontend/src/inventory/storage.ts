import { inventoryItems, type InventoryItem } from "./items";

type AddonEntry = {
    id: string;
    name: string;
    enabled: boolean;
};

type InventoryStorage = {
    version: string;
    addons: AddonEntry[];
    customProps?: Record<string, string>;
};

const storageKey = "vss:/addon:ls";

function readStorage(): InventoryStorage {
    const raw = window.localStorage.getItem(storageKey);
    if (raw !== null) {
        try {
            return JSON.parse(raw) as InventoryStorage;
        } catch {
        }
    }
    return {
        version: "1.0",
        addons: [],
        customProps: {},
    };
}

function writeStorage(storage: InventoryStorage) {
    window.localStorage.setItem(storageKey, JSON.stringify(storage, null, 2));
}

export function readInventoryItems() {
    const storage = readStorage();
    const enabledById = new Map(storage.addons.map((addon) => [addon.id, addon.enabled]));
    return inventoryItems.map((item) => ({
        ...item,
        enabled: enabledById.get(item.id) ?? item.enabled,
    }));
}

export function writeInventoryItems(items: InventoryItem[]) {
    const storage = readStorage();
    const inventoryIds = new Set(inventoryItems.map((item) => item.id));
    storage.addons = storage.addons.filter((addon) => !inventoryIds.has(addon.id)).concat(items.map((item) => ({
        id: item.id,
        name: item.name,
        enabled: item.enabled,
    })));
    writeStorage(storage);
}

export function isAddonEnabled(id: string) {
    return readInventoryItems().some((item) => item.id === id && item.enabled);
}

export function readCustomProp(name: string) {
    return readStorage().customProps?.[name] ?? "";
}

export function writeCustomProp(name: string, value: string) {
    const storage = readStorage();
    storage.customProps = storage.customProps ?? {};
    storage.customProps[name] = value;
    writeStorage(storage);
}
