import { state } from "./state";
import ui from "./ui";
import vss from "./vss";


function storage(): {[key: string]: string} {
    return state().storage;
}

export function init() {
    vss.addQuantListener("tick", () => {
        const updates = ui.localStorageUpdates();
        const aStorage = storage();
        for (let i = 0; i < updates.length; i = i + 2) {
            const key = updates[i];
            const value = updates[i + 1];
            aStorage[key] = value;
        }
    });
};

export function getCameraFollow(): boolean {
    return storage()["ui.camera.follow"] !== "false";
};

export function getRoadZoom(): number {
    const zoom = storage()["ui.road.zoom"];
    if (zoom === null) {
        return 1;
    }
    try {
        return Number.parseFloat(zoom);
    } catch (e) {
        return 1;
    }
}
