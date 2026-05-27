import { Bridge } from "../bridge";

export const distanceScale = 1.1;
export const tracctionScale = 1.5;

type DivRef = {
    current: HTMLDivElement | null;
};

export interface NippleHandler {
    nippleStart: (pos: Position) => void,
    nippleUpdate: (pos: Position, maxDistance?: number) => void,
    nippleEnd: () => void,
}

export interface Position {
    x: number;
    y: number;
}

export function createNippleHandler(
    nippleRef: DivRef,
    sensorRef: DivRef,
    initialPosition: Position,
    size: number,
    onStart: (pos: Position) => Position | undefined,
    onUpdate: (angle: number, distance: number) => void,
    onEnd: () => void,
): NippleHandler {
    function updateSensor(pos: Position) {
        const el = sensorRef.current;
        if (el !== null) {
            el.style.left = (pos.x - size / 2) + "px";
            el.style.top = (pos.y - size / 2) + "px";
        }
    }

    let center = initialPosition;
    updateSensor(center);

    function nippleEl() {
        return nippleRef.current;
    }

    function nippleStart(initalPos: Position) {
        const overridePos = onStart(initalPos);
        nippleEl()?.classList.remove("hidden");
        center = overridePos ?? initalPos;
        updateSensor(center);
        nippleUpdate(initalPos);
    }

    function nippleUpdate(pos: Position, maxDistance?: number) {
        const nippleAngle = angle(center, pos);
        const nippleDistance = Math.min(maxDistance ?? size, distance(center, pos));
        const normalizedAngle = nippleAngle < 0 ? -nippleAngle : Math.PI * 2 - nippleAngle;

        const el = nippleEl();
        if (el !== null) {
            el.style.left = (center.x + Math.cos(nippleAngle) * nippleDistance - size / 4) + "px";
            el.style.top = (center.y + Math.sin(nippleAngle) * nippleDistance - size / 4) + "px";
        }

        onUpdate(normalizedAngle, nippleDistance);
    }

    function nippleEnd() {
        nippleEl()?.classList.add("hidden");
        center = initialPosition;
        updateSensor(center);
        onEnd();
    }

    return {
        nippleStart,
        nippleUpdate,
        nippleEnd,
    };
}

export function createMovingHandler(
    bridge: Bridge,
    nippleRef: DivRef,
    sensorRef: DivRef,
    initialPosition: Position,
    size: number,
    onStart: () => void,
    onEnd: () => void,
) {
    return createNippleHandler(nippleRef, sensorRef,
        initialPosition, size,
        () => {
            onStart();
            return undefined;
        },
        (angle: number, distance: number) => {
            bridge.native.onJoystickUpdate(true, distance / size / tracctionScale,
                Math.PI * 2 - angle);
        },
        () => {
            bridge.native.onJoystickUpdate(false, 0, 0);
            onEnd();
        });
}


export function angle(p1: Position, p2: Position) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    return Math.atan2(dy, dx);
}

export function distance(p1: Position, p2: Position) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    return Math.sqrt((dx * dx) + (dy * dy));
}
