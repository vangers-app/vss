import { pickLocale, type AddonMeta } from "../compat";
import { currentLang } from "./i18n";

export type InventoryItem = {
    id: string;
    name: string;
    description?: string;
    // Absolute disk path to a preview image (served via vfile://).
    image?: string;
    // Absolute disk path to a README (loaded via vfile:// and shown read-only).
    readme?: string;
    // Absolute disk path to a background image (served via vfile://).
    background?: string;
    enabled: boolean;
    group?: string;
};

// Only the toggle state is persisted; display fields (name/description/image) come
// from the live manifest and depend on the current locale.
type AddonEntry = {
    id: string;
    enabled: boolean;
};

type InventoryStorage = {
    version: string;
    addons: AddonEntry[];
    customProps?: Record<string, string>;
};

const storageKey = "vss:addons";

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

// Reconciles the discovered mods (from the unpack folder scan) with the persisted
// statuses: known mods keep their saved status, new mods start disabled, and
// disappeared mods are dropped. The cleaned list is written back to storage.
export function reconcileMods(discovered: AddonMeta[]): InventoryItem[] {
    const storage = readStorage();
    const lang = currentLang();
    const enabledById = new Map(storage.addons.map((addon) => [addon.id, addon.enabled]));
    const items: InventoryItem[] = discovered.map((mod) => ({
        id: mod.id,
        name: pickLocale(mod.name, lang),
        description: pickLocale(mod.description, lang) || undefined,
        image: mod.image,
        readme: mod.readme,
        background: mod.background,
        enabled: enabledById.get(mod.id) ?? false,
        group: mod.group,
    }));
    storage.addons = items.map((item) => ({ id: item.id, enabled: item.enabled }));
    writeStorage(storage);
    return items;
}

export function readInventoryItems(): InventoryItem[] {
    return readStorage().addons.map((addon) => ({
        id: addon.id,
        name: addon.id,
        enabled: addon.enabled,
    }));
}

export function writeInventoryItems(items: InventoryItem[]) {
    const storage = readStorage();
    storage.addons = items.map((item) => ({ id: item.id, enabled: item.enabled }));
    writeStorage(storage);
}

export function isAddonEnabled(id: string, defaultEnabled = false) {
    return readStorage().addons.find((addon) => addon.id === id)?.enabled ?? defaultEnabled;
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
