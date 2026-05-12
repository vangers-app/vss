import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { Bridge, BridgeContext } from "../bridge";
import {
    Digg, Escape, Fire, Fly, Invetory, Jump, Menu,
    Open, Reverse, RollLeft, RollRight, Text,
} from "../controls/keys";
import { bindMouseControl } from "../controls/mouse";
import { UIType } from "../native-bridge";
import { createNippleHandler, createMovingHandler, distanceScale, tracctionScale, Position } from "../nipple/nipple";
import { MenuActivate, MenuDown, MenuUp } from "../controls/keys";
import { DynamicRing, ringSlots } from "../nipple/ring";
import { ScanCode } from "../controls/sdl-scancodes";
import { bindKeyboardControl } from "../controls/keyboard";

const slotAngle = ringSlots.angle;

export function Road(props: {
    uiType: UIType,
    mirrored: boolean,
}) {
    const bridge = useContext(BridgeContext);
    const mirrored = props.mirrored;
    const [menu, setMenu] = useState<boolean>(false);
    const [ringControls, setRingControls] = useState<boolean>(false);
    const [ringActiveIndex, setRingActiveIndex] = useState<number>(-1);
    const size = bridge.cellSizeInPx * 2;
    const rootRef = useRef<HTMLDivElement>(null);

    const leftSensor = useRef<HTMLDivElement>(null);
    const leftNipple = useRef<HTMLDivElement>(null);
    let leftInitialPosition = {
        x: size * (1.75 + 0.5 * distanceScale),
        y: innerHeight - size * (1 + 0.5 * distanceScale),
    };

    const rightSensor = useRef<HTMLDivElement>(null);
    const rightNipple = useRef<HTMLDivElement>(null);

    let rightInitialPosition = {
        x: innerWidth - size * (2 + 0.5 * distanceScale),
        y: innerHeight - size * (1 + 0.5 * distanceScale),
    };


    if (mirrored) {
        const temp = leftInitialPosition;
        leftInitialPosition = rightInitialPosition;
        rightInitialPosition = temp;
    }

    useEffect(() => {
        if (rootRef === null || rootRef.current === null) {
            return;
        }

        const root = rootRef.current;

        const leftHandler = createNippleHandler(
            leftNipple, leftSensor,
            leftInitialPosition, size, (pos: Position) => {
                setRingControls(true);
                setRingActiveIndex(-1);
                setMenu(false);
                return leftInitialPosition;
            }, (angle, distance) => {
                if (distance < size / 2) {
                    setRingActiveIndex(-1);
                } else {
                    setRingActiveIndex(Math.round(angle * 180 / Math.PI / slotAngle));
                }
            }, () => {
                setRingControls(false);
            });

        const rightHandler = createMovingHandler(
            bridge, rightNipple, rightSensor,
            rightInitialPosition, size,
            () => {
                setMenu(false);
            }, () => {
            });


        const pressedPointers: { [id: number]: boolean } = {};
        const usedPointers: { [id: number]: boolean } = {};
        let leftPointerId: number | null = null;
        let rightPointerId: number | null = null;

        function onPoinerDown(e: PointerEvent) {
            pressedPointers[e.pointerId] = true;
            if (e.target !== root) {
                return;
            }
            if (e.clientY < innerHeight / 2) {
                if (e.clientX > innerWidth / 2) {
                    setMenu(true);
                }
                return;
            }
            usedPointers[e.pointerId] = true;
            e.stopImmediatePropagation();

            let leftSideTouch =
                e.clientX < innerWidth / 2;

            if (mirrored) {
                leftSideTouch = !leftSideTouch;
            }

            if (leftSideTouch) {
                if (leftPointerId !== null) {
                    return;
                }
                leftPointerId = e.pointerId;
            } else {
                if (rightPointerId !== null) {
                    return;
                }
                rightPointerId = e.pointerId;
            }

            if (e.pointerId === leftPointerId) {
                leftHandler.nippleStart({ x: e.clientX, y: e.clientY });
            } else if (e.pointerId === rightPointerId) {
                rightHandler.nippleStart({ x: e.clientX, y: e.clientY });
            }
        };

        function onPoinerMove(e: PointerEvent) {
            if (e.pointerId === leftPointerId) {
                leftHandler.nippleUpdate({ x: e.clientX, y: e.clientY });
                e.stopImmediatePropagation();
            } else if (e.pointerId === rightPointerId) {
                rightHandler.nippleUpdate({ x: e.clientX, y: e.clientY }, size * tracctionScale);
                e.stopImmediatePropagation();
            }
        };

        function onPoinerUp(e: PointerEvent) {
            delete pressedPointers[e.pointerId];
            delete usedPointers[e.pointerId];

            if (e.pointerId === leftPointerId) {
                leftHandler.nippleEnd();
                leftPointerId = null;
                e.stopImmediatePropagation();
            } else if (e.pointerId === rightPointerId) {
                rightHandler.nippleEnd();
                rightPointerId = null;
                e.stopImmediatePropagation();
            }
        };

        root.addEventListener("pointerdown", onPoinerDown);
        root.addEventListener("pointermove", onPoinerMove);
        root.addEventListener("pointerup", onPoinerUp);
        root.addEventListener("pointercancel", onPoinerUp);

        const defaultUnbind = bindMouseControl(root, bridge);
        const keyboardUnbind = bindKeyboardControl(root, bridge);


        return () => {
            defaultUnbind();
            keyboardUnbind();
            leftHandler.nippleEnd();
            rightHandler.nippleEnd();
            root.removeEventListener("pointerdown", onPoinerDown);
            root.removeEventListener("pointermove", onPoinerMove);
            root.removeEventListener("pointerup", onPoinerUp);
            root.removeEventListener("pointercancel", onPoinerUp);
        };
    }, [rootRef, rootRef.current, menu, mirrored]);

    const xClass = props.mirrored ? "cr-0" : "cl-0";

    let keys;
    switch (props.uiType) {
        case "way83-text": {
            keys = <>
                <Reverse class={"absolute cb-6 " + xClass} />
                <Text class={"absolute cb-4 " + xClass} />
                <Jump class={"absolute cb-2 " + xClass} />
                <Open class={"absolute cb-0 " + xClass} />
            </>;
        } break;
        default:
            if (menu) {
                keys = <>
                    <MenuActivate class="absolute cl-0 cb-4" />
                    <MenuUp class="absolute cl-0 cb-2" />
                    <MenuDown class="absolute cl-0 cb-0" />
                </>;
            } else {
                keys = <>
                    <Reverse class={"absolute cb-6 " + xClass} />
                    <Fire class={"absolute cb-4 " + xClass} />
                    <Jump class={"absolute cb-2 " + xClass} />
                    <Open class={"absolute cb-0 " + xClass} />
                </>;
            }
    }

    return <div ref={rootRef} class="w-full h-full">
        <Escape class="absolute cl-0 ct-0" />
        {keys}
        <Invetory class="absolute cr-0 ct-0" />
        <Menu class="absolute cr-2 ct-0" />

        <div ref={leftSensor}
            class="absolute pointer-events-none rounded-full bg-slate-200 opacity-20 cw-2 ch-2" />
        <div ref={leftNipple}
            class="absolute hidden bg-slate-400 opacity-80 cw-1 ch-1 rounded-full pointer-events-none" />
        <div ref={rightSensor}
            class="absolute pointer-events-none rounded-full bg-slate-200 opacity-20 cw-2 ch-2" />
        <div ref={rightNipple}
            class="absolute hidden bg-slate-400 opacity-80 cw-1 ch-1 rounded-full pointer-events-none" />

        {ringControls && <RingControls {...props} bridge={bridge} center={leftInitialPosition} size={size}
            activeIndex={ringActiveIndex} />}
    </div>;
}


function RingControls(props: {
    bridge: Bridge,
    center: Position,
    activeIndex: number,
    mirrored: boolean,
    size: number,
}) {
    const aClass = "absolute pointer-events-none";
    const rollLeft =
    {
        key: ScanCode.SDL_SCANCODE_A,
        jsx(left: string, top: string, ringClass: string) {
            return <RollLeft class={`${aClass} ${ringClass}`} style={{ left, top }} />;
        },
    };
    const rollRight =
    {
        key: ScanCode.SDL_SCANCODE_D,
        jsx(left: string, top: string, ringClass: string) {
            return <RollRight class={`${aClass} ${ringClass}`} style={{ left, top }} />;
        },
    };
    return <DynamicRing
        {...props}
        portrait={false}
        ringElements={
            [
                props.mirrored ? rollLeft : rollRight,
                null,
                {
                    key: ScanCode.SDL_SCANCODE_F,
                    jsx(left, top, ringClass) {
                        return <Digg class={`${aClass} ${ringClass}`} style={{ left, top }} />;
                    },
                },
                null,
                props.mirrored ? rollRight : rollLeft,
                null,
                {
                    key: ScanCode.SDL_SCANCODE_R,
                    jsx(left, top, ringClass) {
                        return <Fly class={`${aClass} ${ringClass}`} style={{ left, top }} />;
                    },
                },
            ]
        }
    />;
}
