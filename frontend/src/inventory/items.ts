export type InventoryItem = {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    group?: "file-mod";
};

export const inventoryItems: InventoryItem[] = [
    {
        id: "vfv",
        name: "Voxels in Vangers",
        description: "Replaces game models with voxel-styled versions.",
        enabled: false,
        group: "file-mod",
    },
    {
        id: "vnm",
        name: "New Models",
        description: "Replaces game models with more detailed recreated versions.",
        enabled: false,
        group: "file-mod",
    },
    {
        id: "tankers",
        name: "Tankers",
        description: "Replaces mechos models with tanks.",
        enabled: false,
        group: "file-mod",
    },
    {
        id: "vss-music",
        name: "Music addon",
        description: "Additional soundtrack and audio behavior.",
        enabled: false,
    },
    {
        id: "vss-fullscreen-game",
        name: "Fullscreen game",
        description: "Road fullscreen UI behavior.",
        enabled: true,
    },
];
