import { JSX } from "preact";
import { useEffect } from "preact/hooks";
import { Bridge } from "../bridge";
import { ScanCode } from "../controls/sdl-scancodes";
import { Position, distanceScale } from "./nipple";

function initStaticSlots(slotCount: number) {
    const slots: Position[] = [];
    const angle = 360 / slotCount;
    for (let i = 0; i < slotCount; ++i) {
        slots.push({
            x: Math.cos(i * angle / 180 * Math.PI),
            y: Math.sin(i * angle / 180 * Math.PI),
        });
    }
    return slots;
}

const slotCount = 8;

export const ringSlots = {
    count: slotCount,
    angle: 360 / slotCount,
    slots: initStaticSlots(slotCount),
};

export function getLeft(props: { size: number, center: Position }, slot: number, scale = 1) {
    const distance = props.size * distanceScale * scale;
    return (props.center.x + ringSlots.slots[slot].x * distance - props.size / 2) + "px";
}

export function getTop(props: { size: number, center: Position }, slot: number, scale = 1) {
    const distance = props.size * distanceScale * scale;
    return (props.center.y + ringSlots.slots[slot].y * distance - props.size / 2) + "px";
}

export function StaticRing(props: {
    portrait: boolean,
    size: number,
    center: Position,
    ringElements: (((left: string, top: string) => JSX.Element) |
        undefined | null)[],
}) {
    const spin = props.portrait ? 6 : 0;

    function position(index: number) {
        return (index + spin) % slotCount;
    }

    function scale(index: number) {
        if (index === 1 || index === 3 || index === 5 || index === 7) {
            return 1.3;
        }
        return 1;
    }

    return <>
        {props.ringElements.map((element, index) => {
            return element === null || element === undefined ?
                null :
                element(getLeft(props, position(index), scale(index)),
                    getTop(props, position(index), scale(index)));
        })}
    </>;
}

export function DynamicRing(props: {
    bridge: Bridge,
    portrait: boolean,
    mirrored: boolean,
    activeIndex: number,

    size: number,
    center: Position,

    // @caiiiycuk: this is dirty hack to avoid even more
    // dirty way to update react state from outside
    ringElements: ({
        key: ScanCode,
        jsx: (left: string, top: string, aClass: string) => JSX.Element
    } | undefined | null)[],
}) {
    const portrait = props.portrait;
    const mirrored = props.mirrored;
    const spin = mirrored ?
        (portrait ? -2 : -4) :
        (portrait ? 6 : 0);
    const bridge = props.bridge;
    const ringElements = props.ringElements;

    function position(pos: number) {
        if (mirrored) {
            return (slotCount - pos - spin) % slotCount;
        }

        return (pos + spin) % slotCount;
    }


    let activeIndex = 8 - props.activeIndex;
    activeIndex = activeIndex === 8 ? 0 : activeIndex;
    if (mirrored) {
        activeIndex = 8 - activeIndex - spin;
        if (activeIndex > 7) {
            activeIndex = activeIndex - 8;
        }
    } else if (portrait) {
        activeIndex -= spin;
        if (activeIndex < 0) {
            activeIndex = 8 + activeIndex;
        }
    }

    function animate(slot: number) {
        if (slot === activeIndex) {
            return "animate-spin";
        }
        return "";
    }

    useEffect(() => {
        const element = ringElements[activeIndex];
        if (element === null || element === undefined) {
            return;
        }

        const keyCode = element.key;
        if (keyCode === ScanCode.SDL_SCANCODE_UNKNOWN) {
            return;
        }

        bridge.native.onKeyDown(keyCode, false);
        return () => {
            bridge.native.onKeyUp(keyCode);
        };
    }, [activeIndex]);

    return <>
        {ringElements.map((element, index) => {
            return element === null || element === undefined ?
                null :
                element.jsx(getLeft(props, position(index)),
                    getTop(props, position(index)),
                    animate(index));
        })}
    </>;
}
