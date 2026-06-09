import ui from "./ui";
import vss, { RoadRuntimeObjId } from "./vss";

const global = globalThis as typeof globalThis & {
    __VSS_MOBILE__?: boolean;
};

let shownOnce = false;

export function init() {
    if (global.__VSS_MOBILE__ === true) {
        return false;
    }

    vss.addQuantListener("screen_exit", (payload) => {
        if (shownOnce || payload.value !== 1 || !payload.screenId?.match(/^LocScreen\d+$/)) {
            return;
        }

        shownOnce = true;
        ui.sendObject({
            type: "desktop_controls_overlay",
            visible: true,
        });
    });

    vss.addQuantListener("runtime_object", (payload) => {
        if (payload.runtimeObjectId !== RoadRuntimeObjId.RTO_GAME_QUANT_ID) {
            return;
        }

        ui.sendObject({
            type: "desktop_controls_overlay",
            visible: false,
        });
    });
}
