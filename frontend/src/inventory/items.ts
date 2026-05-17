import fullscreenUrl from "../assets/inventory/fullscreen.jpg";
import musicUrl from "../assets/inventory/music.jpg";
import tankersUrl from "../assets/inventory/tankers.jpg";
import vfvUrl from "../assets/inventory/vfv.jpg";
import vnmUrl from "../assets/inventory/vnm.jpg";

export type InventoryItem = {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    enabled: boolean;
    group?: "file-mod";
};

export const inventoryItems: InventoryItem[] = [
    {
        id: "vfv",
        name: "Voxels in Vangers",
        description: "Replaces game models with voxel-styled versions.",
        imageUrl: vfvUrl,
        enabled: false,
        group: "file-mod",
    },
    {
        id: "vnm",
        name: "New Models",
        description: "Replaces game models with more detailed recreated versions.",
        imageUrl: vnmUrl,
        enabled: false,
        group: "file-mod",
    },
    {
        id: "tankers",
        name: "Tankers",
        description: "Replaces mechos models with tanks.",
        imageUrl: tankersUrl,
        enabled: false,
        group: "file-mod",
    },
    {
        id: "vss-music",
        name: "Music addon",
        description: "Additional soundtrack and audio behavior.",
        imageUrl: musicUrl,
        enabled: false,
    },
    {
        id: "vss-fullscreen-game",
        name: "Fullscreen game",
        description: "Road fullscreen UI behavior.",
        imageUrl: fullscreenUrl,
        enabled: true,
    },
];
