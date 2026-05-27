import vss, { iScreenOptionId, VssOptionQuant, VssOptionQuantResult } from "./vss";
import ui from "./ui";
import { getRoadZoom } from "./ui-options";


export function init() {
    ui.log("addon is started");

    vss.addQuantListener("ready", () => ui.sendObject({ type: "ready" }));
    vss.addQuantListener("scaled_renderer",
        (payload) => {
            ui.sendObject({
                type: "scaled_renderer_changed",
                enabled: payload.enabled,
            });
        });
    vss.addQuantListener("option", optionQuant);
    vss.addQuantListener("send_event", (payload) => {
        if (ui.filterEvent(payload.code)) {
            return "preventDefault";
        }
    });
    vss.addQuantListener("tick", ui.tick);

    vss.addQuantListener("camera_zoom", (quant) => {
        ui.log("in " + quant.z + " zoom " + getRoadZoom() + " out " + quant.z * getRoadZoom());
        return {
            z: quant.z * getRoadZoom(),
        };
    });
}

function optionQuant(payload: VssOptionQuant): void | VssOptionQuantResult {
    switch (payload.id) {
        case iScreenOptionId.iSCREEN_RESOLUTION:
            return {
                value: 1,
            };
        case iScreenOptionId.iAUTO_ACCELERATION:
            return {
                value: 1,
            };
        default:
    }
}
