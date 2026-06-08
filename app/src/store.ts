import { create } from "zustand";

export type DownloadPhase = "idle" | "downloading" | "extracting" | "done" | "error";

export interface DownloadState {
    active: boolean;
    phase: DownloadPhase;
    label: string;
    loaded: number;
    total: number | null;
    error?: string;
}

const idleDownload: DownloadState = {
    active: false,
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
