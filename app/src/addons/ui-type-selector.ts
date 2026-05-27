import { state, UIType } from "./state";
import ui from "./ui";
import vss, { actEventCodes, actintItemEvents, ASFlag, ASMode, RoadRuntimeObjId } from "./vss";


let runtimeObjectId = RoadRuntimeObjId.RTO_MAIN_MENU_ID;
let roadFullscreen = false;
let inventory = false;
let paused = false;
let shop = false;
let text = false;
let network = false;

export function init() {
    vss.addQuantListener("runtime_object", (payload) => {
        if (payload.runtimeObjectId === RoadRuntimeObjId.RTO_PALETTE_TRANSFORM_ID ||
            runtimeObjectId === payload.runtimeObjectId) {
            return;
        }

        runtimeObjectId = payload.runtimeObjectId;
        updateUiType();
    });

    vss.addQuantResultListener("set_road_fullscreen", (payload, result) => {
        const newFullscreen = result.enabled ?? payload.enabled;
        if (newFullscreen === roadFullscreen) {
            return;
        }
        roadFullscreen = newFullscreen;
        updateUiType();
    });

    vss.addQuantListener("network_state", (payload) => {
        if (payload.on !== network) {
            network = payload.on;
            ui.sendObject({
                type: "network_state",
                network,
            });
        }
    });

    vss.addQuantResultListener("send_event", (payload, result) => {
        if (result.preventDefault) {
            return;
        }

        if (payload.code === actEventCodes.EV_ENTER_TEXT_MODE ||
            payload.code === actintItemEvents.ACI_SHOW_TEXT) {
            text = true;
            updateUiType();
            return;
        }

        if (payload.code === actEventCodes.EV_LEAVE_TEXT_MODE ||
            payload.code === actintItemEvents.ACI_HIDE_TEXT) {
            text = false;
            updateUiType();
            return;
        }

        if (payload.code === actEventCodes.EV_ACTIVATE_IINV) {
            shop = true;
            updateUiType();
            return;
        }

        if (payload.code === actEventCodes.EV_DEACTIVATE_IINV) {
            shop = false;
            updateUiType();
            return;
        }

        if ((payload.asFlags & ASFlag.AS_INV_MOVE_ITEM) > 0) {
            return;
        }

        let newInventory = inventory;
        if (payload.code === actEventCodes.EV_CHANGE_MODE) {
            newInventory = payload.data !== ASMode.AS_INV_MODE;
        }

        if (payload.code === actEventCodes.EV_SET_MODE) {
            newInventory = payload.data === ASMode.AS_INV_MODE;
        }

        if (newInventory === inventory) {
            return;
        }

        inventory = newInventory;
        updateUiType();
    });

    vss.addQuantListener("pause", (payload) => {
        if (paused === payload.paused) {
            return;
        }

        paused = payload.paused;
        updateUiType();
    });

    updateUiType();
};

function updateUiType() {
    const newUiType = calculateUiType();
    if (newUiType === state().uiType) {
        return;
    }
    ui.log("uiType changed to " + newUiType + "; rtoId " + runtimeObjectId + " roadFullScreen " + roadFullscreen +
        " paused " + paused + " inventory " + inventory + " shop " + shop + " text " + text);
    state().uiType = newUiType;
    ui.sendObject({
        type: "ui_type_changed",
        uiType: newUiType,
    });
}

function calculateUiType(): UIType {
    if (inventory) {
        text = false;
    }

    if (paused) {
        return "pause";
    }

    if (runtimeObjectId === RoadRuntimeObjId.RTO_GAME_QUANT_ID && text) {
        return "way83-text";
    }

    if (runtimeObjectId === RoadRuntimeObjId.RTO_GAME_QUANT_ID && inventory) {
        return "way83-inventory";
    }

    if (runtimeObjectId === RoadRuntimeObjId.RTO_GAME_QUANT_ID &&
        roadFullscreen === true) {
        return "way83+";
    }

    if (runtimeObjectId === RoadRuntimeObjId.RTO_GAME_QUANT_ID &&
        roadFullscreen === false) {
        return "menu";
    }

    if (runtimeObjectId !== RoadRuntimeObjId.RTO_GAME_QUANT_ID && shop) {
        return "shop";
    }

    if (runtimeObjectId === RoadRuntimeObjId.RTO_MAIN_MENU_ID) {
        return "main-menu";
    }

    return "default";
};
