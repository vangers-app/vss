import ui from "./ui";
import vss, { VssCheckXYQuant, VssRedrawQuant } from "./vss";

export function init() {
    vss.addQuantListener("redraw", hideControls);
    vss.addQuantListener("check_xy", hideControls);
}

let showCredits = false;

function hideControls(payload: VssRedrawQuant & { quant: "redraw" } |
    VssCheckXYQuant & { quant: "check_xy" }): void | "preventDefault" {
    const id = payload.id;
    const hide =
        id == 52 || id == 53 || // fullscreen
        id == 121 || id == 122 || id == 124 || id == 120 || id == 125 || // networking
        id == 38 || // controls
        id == 46 || id == 47; // resolution

    if (hide) {
        return "preventDefault";
    }

    if (payload.quant === "redraw" && id === 1103 && showCredits) {
        ui.sendObject({
            type: "ui_type_changed",
            uiType: "credits",
        });
        showCredits = false;
    }

    if (payload.quant === "check_xy" && id === 32) {
        showCredits = true;
    }

    if (payload.quant === "check_xy" && id === 29) {
        if (ui.enabled("goolden_beeb")) {
            return;
        }

        ui.sendObject({
            type: "ui_type_changed",
            uiType: "inapp",
        });
        return "preventDefault";
    }
}
