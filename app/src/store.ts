import { create } from "zustand";

export type DownloadPhase = "idle" | "downloading" | "extracting" | "done" | "error";

export type DownloadKind = "mods" | "game-data";

export interface DownloadState {
    active: boolean;
    kind: DownloadKind;
    phase: DownloadPhase;
    label: string;
    loaded: number;
    total: number | null;
    error?: string;
}

const idleDownload: DownloadState = {
    active: false,
    kind: "mods",
    phase: "idle",
    label: "",
    loaded: 0,
    total: null,
};

interface UiState {
    dataNotFound: boolean;
    setDataNotFound: (dataNotFound: boolean) => void;
    modsPresent: boolean;
    setModsPresent: (modsPresent: boolean) => void;
    download: DownloadState;
    setDownload: (patch: Partial<DownloadState>) => void;
}

export const useUiStore = create<UiState>((set) => ({
    dataNotFound: false,
    setDataNotFound: (dataNotFound) => set({ dataNotFound }),
    modsPresent: false,
    setModsPresent: (modsPresent) => set({ modsPresent }),
    download: idleDownload,
    setDownload: (patch) => set((state) => ({ download: { ...state.download, ...patch } })),
}));
