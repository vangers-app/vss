import { invoke, Channel } from '@tauri-apps/api/core';

export const TAURI_BUILD = '__TAURI_INTERNALS__' in window;

export type LocalFile = {
    rel: string;
    abs: string;
};

export type Localized = string | { en?: string; ru?: string };

export type ModBehavior = { type: string;[k: string]: unknown };

export type AddonMeta = {
    id: string;
    name: Localized;
    description?: Localized;
    // Absolute disk path to a preview image (resolved by the Rust host).
    image?: string;
    // Absolute disk path to a README (resolved by the Rust host).
    readme?: string;
    // Absolute disk path to a background image (resolved by the Rust host).
    background?: string;
    defaultEnabled: boolean;
    group?: string;
    folders: string[];
    behavior?: ModBehavior;
};

export function pickLocale(text: Localized | undefined, lang: "en" | "ru"): string {
    if (text === undefined) {
        return "";
    }
    if (typeof text === "string") {
        return text;
    }
    return text[lang] ?? text.en ?? text.ru ?? "";
}

export function vfileUrl(abs: string): string {
    return "vfile://localhost/" + encodeURIComponent(abs);
}

export type ModsManifest = {
    addons: AddonMeta[];
    folders: Record<string, LocalFile[]>;
};

export type DownloadProgress = {
    phase: "downloading" | "extracting" | "done";
    label: string;
    loaded: number;
    total: number | null;
};

export async function find_steam_install() {
    if (!TAURI_BUILD) {
        return null;
    }

    return invoke<LocalFile[] | null>('find_steam_install');
}

export async function list_mods(): Promise<ModsManifest> {
    if (!TAURI_BUILD) {
        return { addons: [], folders: {} };
    }

    return invoke<ModsManifest>('list_mods');
}

export async function download_mods(onProgress: (progress: DownloadProgress) => void) {
    if (!TAURI_BUILD) {
        throw new Error("mods download is only available in the desktop build");
    }

    const channel = new Channel<DownloadProgress>();
    channel.onmessage = onProgress;
    return invoke<void>('download_mods', { onProgress: channel });
}

export async function cancel_download() {
    if (!TAURI_BUILD) {
        return;
    }

    return invoke<void>('cancel_download');
}

export async function delete_mods() {
    if (!TAURI_BUILD) {
        return;
    }

    return invoke<void>('delete_mods');
}

export async function read_file(path: string) {
    const url = "vfile://localhost/" + encodeURIComponent(path);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("vfile fetch failed: " + response.status);
    }
    return response.arrayBuffer();
}
