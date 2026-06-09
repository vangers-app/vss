import ui from "./ui";
import { state } from "./state";
import vss, { VssCheckXYQuant, VssRedrawQuant } from "./vss";

const global = globalThis as typeof globalThis & {
    __VSS_MOBILE__?: boolean;
};

const hiddenUiObjects = new Set([
    // Native networking is replaced by the mobile calendar/login flow.
    "Main Screen:Multiplayer Option",
    "Multiplayer screen:Join Option",
    "Multiplayer screen:Create Option",
    "Multiplayer screen:Port Option",
    "Server screen:LAN Option",
    "Server screen:Inet Option",
    "Create server screen:TitleStr",
    "Create server screen:Back Option",
    "Search server screen:TitleStr",
    "Search server screen:Back Option",
    "Search server screen:List00",
    "Search server screen:List01",
    "Search server screen:List02",
    "Search server screen:List03",
    "Search server screen:List04",
    "Search server screen:Up Option",
    "Search server screen:Down Option",
    "Search server screen:Update Option",
    "Searching screen:SearchStr",
    "Searching screen:WaitStr",

    // Mobile controls replace the native keyboard controls menu.
    "Options screen II:Controls Option",
    "Controls screen 4:KeyName20",
    "Controls screen 4:KeyName20_1",

    // Resolution and fullscreen are managed by the outer UI.
    "Graphics screen:ResStr",
    "Graphics screen:ResTrig",
    "Graphics screen:FullScreenObj",
    "Graphics screen:FullScreenTrig",
]);

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
    const objectKey = `${payload.screenId ?? ""}:${payload.objectId ?? ""}`;

    if (hiddenUiObjects.has(objectKey)) {
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
