import fullscreenUrl from "../assets/inventory/fullscreen.jpg";
import musicUrl from "../assets/inventory/music.jpg";
import tankersUrl from "../assets/inventory/tankers.jpg";
import vfvUrl from "../assets/inventory/vfv.jpg";
import vnmUrl from "../assets/inventory/vnm.jpg";

export type InventoryItem = {
    id: string;
    nameKey: string;
    descriptionKey: string;
    imageUrl: string;
    enabled: boolean;
    group?: "file-mod";
};

export const inventoryItems: InventoryItem[] = [
    {
        id: "vfv",
        nameKey: "vfv_name",
        descriptionKey: "vfv_description",
        imageUrl: vfvUrl,
        enabled: false,
        group: "file-mod",
    },
    {
        id: "vnm",
        nameKey: "vnm_name",
        descriptionKey: "vnm_description",
        imageUrl: vnmUrl,
        enabled: false,
        group: "file-mod",
    },
    {
        id: "tankers",
        nameKey: "tankers_name",
        descriptionKey: "tankers_description",
        imageUrl: tankersUrl,
        enabled: false,
        group: "file-mod",
    },
    {
        id: "vss-music",
        nameKey: "vss-music_name",
        descriptionKey: "vss-music_description",
        imageUrl: musicUrl,
        enabled: false,
    },
    {
        id: "vss-fullscreen-game",
        nameKey: "vss-fullscreen-game_name",
        descriptionKey: "vss-fullscreen-game_description",
        imageUrl: fullscreenUrl,
        enabled: true,
    },
];
