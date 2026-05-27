import vss, {
    actEventCodes,
    iScreenOptionId, SDLScanCode, VssCameraQuant, VssCameraQuantResult,
    VssMechosTractionQuant, VssMechosTractionQuantResult, VssOptionQuant, VssOptionQuantResult, VssSendEventQuant,
} from "./vss";

import ui from "./ui";
import { getCameraFollow } from "./ui-options";

export function init() {
    vss.addQuantResultListener("option", optionQuant);
    vss.addQuantResultListener("send_event", optionEventQuant);
    vss.addQuantListener("camera", cameraQuant);
    vss.addQuantListener("mechos_traction", joystickQuant);
}

export interface TractionTurnConfig {
    interion: number;
    turnAngle: number;
}

const tractionTurnConfig = {
    "portrait": {
        interion: 4,
        turnAngle: -vss.math.PI,
    },
    "landscape": {
        interion: 4,
        turnAngle: -vss.math.PI_2,
    },
};

let orientation: "portrait" | "landscape" = "landscape";
let cameraTurnMode = false;
let targetTurnAngle = 0;
let appliedTurnAngle = 0;
let turnConfig = tractionTurnConfig["portrait"];

function joystickQuant(payload: VssMechosTractionQuant): void | VssMechosTractionQuantResult {
    const newOrientation = ui.portraitMode() ? "portrait" : "landscape";

    if (newOrientation !== orientation) {
        orientation = newOrientation;
        ui.sendObject({
            type: "orientation_changed",
            orientation,
        });
    }

    targetTurnAngle = payload.unitAngle;
    turnConfig = tractionTurnConfig[orientation];

    const joyActive = ui.joyActive();
    const joyReverse = ui.joyReverse();

    if (!joyActive && joyReverse) {
        return {
            traction: -payload.tractionMax * 0.5,
        };
    }

    if (!joyActive) {
        return;
    }

    const cameraFollow = getCameraFollow();
    const joyAngle = ui.joyAngle();
    const joyDistance = ui.joyDistance();

    const dTurnAngle = targetTurnAngle - appliedTurnAngle;
    const angle =
        cameraTurnMode ?
            vss.math.angleToRadians(dTurnAngle + turnConfig.turnAngle) :
            vss.math.angleToRadians(cameraFollow ? payload.unitAngle : turnConfig.turnAngle);
    const tmax = payload.tractionMax;
    const rmax = payload.rudderMax;

    if (Math.abs(joyDistance) < 0.1) {
        return {
            traction: 0,
            rudder: 0,
            helicopterStrife: (vss.isKeyPressed(SDLScanCode.SDL_SCANCODE_A) ||
                vss.isKeyPressed(SDLScanCode.SDL_SCANCODE_D)) ? 1 : 0,
        };
    }

    // joyAngle (current joy stick angle), angle (current mechos angle):
    //        270
    //  180 ----x----> 0
    //         90
    let dAngle = Math.atan2(Math.sin(joyAngle - angle), Math.cos(joyAngle - angle)) * 180 / Math.PI;

    let traction;
    let rudder;
    let sensivity;
    let scale;

    let forward = !joyReverse;

    if (!cameraFollow) {
        if (orientation === "landscape") {
            forward = !(joyAngle > 0 && joyAngle < Math.PI);
        } else {
            forward = !((joyAngle > 0 && joyAngle < Math.PI / 2) ||
                (joyAngle > Math.PI * 3 / 2 && joyAngle < Math.PI * 2));
        }
    }

    if (forward) {
        traction = tmax * Math.abs(joyDistance);
        sensivity = 15;
        scale = 90;
    } else {
        traction = -tmax * Math.abs(joyDistance);
        dAngle = -(dAngle > 0 ? dAngle - 180 : dAngle + 180);
        sensivity = 5;
        scale = 45;
    }

    if (dAngle < -sensivity) {
        rudder = -Math.max(dAngle, -scale) * rmax / scale;
    } else if (dAngle > sensivity) {
        rudder = -Math.min(dAngle, scale) * rmax / scale;
    } else {
        rudder = 0;
    }

    return {
        traction,
        rudder,
    };
}

function optionQuant(payload: VssOptionQuant, result: VssOptionQuantResult) {
    if (payload.id === iScreenOptionId.iCAMERA_TURN) {
        cameraTurnMode = (result.value ?? payload.value) === 1;
    }
}

function optionEventQuant(payload: VssSendEventQuant, result: { handled: boolean, preventDefault: boolean }) {
    if (payload.code === actEventCodes.EV_VSS_CAMERA_ROT_EVENT) {
        if (result.preventDefault) {
            return;
        }

        cameraTurnMode = payload.data === 1;
    }
}

function cameraQuant(payload: VssCameraQuant): void | VssCameraQuantResult {
    if (cameraTurnMode) {
        const intertion = turnConfig.interion;
        if (targetTurnAngle < vss.math.PI_2 && appliedTurnAngle > vss.math.PI_2 * 2) {
            const pi2Distance = Math.round(vss.math.PIx2 - appliedTurnAngle);
            const step = Math.round((targetTurnAngle + pi2Distance) / intertion);
            if (step <= pi2Distance) {
                appliedTurnAngle = appliedTurnAngle + step;
            } else {
                appliedTurnAngle = step - pi2Distance;
            }
        } else if (targetTurnAngle > vss.math.PI_2 * 2 && appliedTurnAngle < vss.math.PI_2) {
            const pi2Distance = Math.round(vss.math.PIx2 - targetTurnAngle);
            const step = Math.round((appliedTurnAngle + pi2Distance) / intertion);
            if (step <= appliedTurnAngle) {
                appliedTurnAngle = appliedTurnAngle - step;
            } else {
                appliedTurnAngle = vss.math.PIx2 - (step - appliedTurnAngle);
            }
        } else {
            const updateAngle = Math.round((targetTurnAngle - appliedTurnAngle) / intertion);
            appliedTurnAngle = appliedTurnAngle + updateAngle;
        }

        return {
            turnAngle: -appliedTurnAngle + turnConfig.turnAngle,
        };
    }
}
