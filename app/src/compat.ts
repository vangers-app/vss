import { invoke } from '@tauri-apps/api/core';

const TAURI_BUILD = '__TAURI_INTERNALS__' in window;

export type LocalFile = {
    rel: string;
    abs: string;
};

export async function find_steam_install() {
    if (!TAURI_BUILD) {
        return null;
    }

    return invoke<LocalFile[] | null>('find_steam_install');
}

export async function read_file(path: string) {
    const url = "vfile://localhost/" + encodeURIComponent(path);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("vfile fetch failed: " + response.status);
    }
    return response.arrayBuffer();
}
