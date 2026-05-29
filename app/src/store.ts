import { create } from "zustand";

interface UiState {
    dataNotFound: boolean;
    setDataNotFound: (dataNotFound: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
    dataNotFound: false,
    setDataNotFound: (dataNotFound) => set({ dataNotFound }),
}));
