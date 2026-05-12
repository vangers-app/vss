export type InventoryItem = {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    enabled: boolean;
};

export const inventoryItems: InventoryItem[] = [
    {
        id: "vss-files-mod",
        name: "Files mod",
        description: "Local file-based addon workflow.",
        imageUrl: "",
        enabled: true,
    },
    {
        id: "vss-music",
        name: "Music addon",
        description: "Additional soundtrack and audio behavior.",
        imageUrl: "",
        enabled: false,
    },
    {
        id: "vss-fullscreen-game",
        name: "Fullscreen game",
        description: "Road fullscreen UI behavior.",
        imageUrl: "",
        enabled: true,
    },
];
