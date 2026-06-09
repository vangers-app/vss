import vss, {
    SDLScanCode,
    VssCameraQuant,
    VssCameraQuantResult,
    VssMechosTractionQuant,
} from "./vss";

(window as any).cameraSlopeAngle = -682;
(window as any).cameraZoom = 700;
(window as any).targetLookAhead = -100;
const turnInertia = 5;
const positionInertia = 4;

let enabled = false;
let bracketWasPressed = false;
let targetTurnAngle = 0;
let appliedTurnAngle = 0;
let hasUnitAngle = false;
let appliedViewX = 0;
let appliedViewY = 0;
let hasViewPosition = false;

export function init() {
    enabled = false;
    bracketWasPressed = false;
    targetTurnAngle = 0;
    appliedTurnAngle = 0;
    hasUnitAngle = false;
    appliedViewX = 0;
    appliedViewY = 0;
    hasViewPosition = false;

    vss.addQuantListener("tick", tickQuant);
    vss.addQuantListener("mechos_traction", mechosTractionQuant);
    vss.addQuantListener("camera", cameraQuant);
}

function tickQuant() {
    const bracketPressed = vss.isKeyPressed(SDLScanCode.SDL_SCANCODE_RIGHTBRACKET);
    if (bracketPressed && !bracketWasPressed) {
        enabled = !enabled;
        if (enabled) {
            appliedTurnAngle = targetCameraTurnAngle();
            hasViewPosition = false;
        }
    }
    bracketWasPressed = bracketPressed;
}

function mechosTractionQuant(payload: VssMechosTractionQuant) {
    targetTurnAngle = normalizeAngle(payload.unitAngle);
    if (!hasUnitAngle) {
        appliedTurnAngle = targetTurnAngle;
        hasUnitAngle = true;
    }
}

function cameraQuant(payload: VssCameraQuant): void | VssCameraQuantResult {
    if (!enabled) {
        return;
    }

    const targetView = targetViewPosition(payload);
    if (!hasUnitAngle) {
        appliedTurnAngle = normalizeAngle(payload.turnAngle);
    } else {
        const turnAngle = targetCameraTurnAngle();
        appliedTurnAngle = normalizeAngle(appliedTurnAngle + Math.round(angleDistance(turnAngle, appliedTurnAngle) / turnInertia));
    }

    if (!hasViewPosition) {
        appliedViewX = targetView.x;
        appliedViewY = targetView.y;
        hasViewPosition = true;
    } else {
        appliedViewX += Math.round((targetView.x - appliedViewX) / positionInertia);
        appliedViewY += Math.round((targetView.y - appliedViewY) / positionInertia);
    }

    return {
        turnAngle: appliedTurnAngle,
        slopeAngle: (window as any).cameraSlopeAngle,
        viewX: appliedViewX,
        viewY: appliedViewY,
        z: (window as any).cameraZoom,
    };
}

function targetCameraTurnAngle() {
    return normalizeAngle(-targetTurnAngle - vss.math.PI_2);
}

function targetViewPosition(payload: VssCameraQuant) {
    const unitX = payload.unitX ?? payload.viewX;
    const unitY = payload.unitY ?? payload.viewY;
    const angle = vss.math.angleToRadians(targetTurnAngle);

    return {
        x: Math.round(unitX - Math.cos(angle) * (window as any).targetLookAhead),
        y: Math.round(unitY - Math.sin(angle) * (window as any).targetLookAhead),
    };
}

function normalizeAngle(angle: number) {
    const period = vss.math.PIx2;
    return ((Math.round(angle) % period) + period) % period;
}

function angleDistance(target: number, current: number) {
    const halfPeriod = vss.math.PI;
    const period = vss.math.PIx2;
    return ((target - current + halfPeriod) % period + period) % period - halfPeriod;
}
