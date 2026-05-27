import { invoke } from '@tauri-apps/api/core';

const TAURI_BUILD = '__TAURI_INTERNALS__' in window;

export async function find_steam_install() {
    if (!TAURI_BUILD) {
        return null;
    }

    return invoke<string[] | null>('find_steam_install');
}
