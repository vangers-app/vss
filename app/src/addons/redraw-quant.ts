import ui from "./ui";
import { state } from "./state";
import vss, { VssCheckXYQuant, VssRedrawQuant } from "./vss";

const global = globalThis as typeof globalThis & {
    __VSS_MOBILE__?: boolean;
};

export function init() {
    vss.addQuantListener("redraw", handleUiVisibility);
    vss.addQuantListener("check_xy", handleUiVisibility);
}

export function initCredits() {
    vss.addQuantListener("redraw", handleCredits);
    vss.addQuantListener("check_xy", handleCredits);
}

let creditsScreenActive = false;
let creditsOverlayDismissed = false;

export function dismissCreditsOverlay() {
    creditsOverlayDismissed = true;
}

function handleUiVisibility(payload: VssRedrawQuant & { quant: "redraw" } |
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

    if (global.__VSS_MOBILE__ === true && payload.quant === "check_xy" && id === 29) {
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

function handleCredits(payload: VssRedrawQuant & { quant: "redraw" } |
    VssCheckXYQuant & { quant: "check_xy" }): void {
    if (payload.quant === "check_xy") {
        if (payload.objectId === "Credits Option") {
            creditsScreenActive = false;
            creditsOverlayDismissed = false;
        }
        return;
    }

    if (payload.screenId === undefined) {
        return;
    }

    const isNativeCreditsScreen = payload.screenId.startsWith("Credits");
    if (isNativeCreditsScreen) {
        if (!creditsScreenActive && !creditsOverlayDismissed) {
            state().uiType = "credits";
            ui.sendObject({
                type: "ui_type_changed",
                uiType: "credits",
            });
        }
        creditsScreenActive = true;
        return;
    }
    creditsScreenActive = false;
}
