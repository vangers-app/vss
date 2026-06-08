import { list_mods, type AddonMeta, type LocalFile } from "./compat";
import { reconcileMods } from "./inventory/storage";

let addons: AddonMeta[] = [];
let folders: Record<string, LocalFile[]> = {};
let present = false;

// Scans the unpack folder (via Rust `list_mods`), reconciles statuses with
// localStorage (new/disappeared mods become disabled), and caches the result for
// the runtime (vss-browser) and the inventory UI.
export async function loadMods(): Promise<AddonMeta[]> {
    const manifest = await list_mods();
    present = manifest.addons.length > 0 || Object.keys(manifest.folders).length > 0;
    addons = manifest.addons;
    folders = manifest.folders;
    reconcileMods(addons);
    return addons;
}

export function getModAddons(): AddonMeta[] {
    return addons;
}

export function getModFolders(): Record<string, LocalFile[]> {
    return folders;
}

export function modsPresent(): boolean {
    return present;
}
