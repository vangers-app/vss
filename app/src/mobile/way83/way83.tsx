// inspired by same named artifact Way 83+, with it you can move to any word
// Way83 is a super control that contains everything you need under single finger

import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { Bridge, BridgeContext } from "../bridge";
import { bindKeyboardControl } from "../controls/keyboard";
import {
    Open, RollLeft, RollRight,
    Fly, Digg, UseVector, Handbrake, Fire,
    FireV, FireT, NextSwitch, Fire1,
    Fire2, Fire3, Escape, Invetory, ZoomIn,
    ZoomOut, Jump, Menu, Reverse, Text, ChatKey, Leaderboard, TextInput, UseGluk,
} from "../controls/keys";
import { bindMouseControl } from "../controls/mouse";
import { ScanCode } from "../controls/sdl-scancodes";
import { createNippleHandler, createMovingHandler, tracctionScale, distanceScale, Position } from "../nipple/nipple";
import { ringSlots, DynamicRing, StaticRing } from "../nipple/ring";

const slotAngle = ringSlots.angle;

interface Way83Props {
    textMode: boolean,
    moving: boolean,
    setMoving: (moving: boolean) => void,
    mirrored: boolean,
    setMirrored: (mirrored: boolean) => void,
    portrait: boolean,
    spinClass: string,
    bridge: Bridge,
    size: number,
    setRing2Controls: (visibile: boolean) => void,
}

export function Way83(props: {
    textMode: boolean,
    portrait: boolean,
    mirrored: boolean,
    setMirrored: (mirrored: boolean) => void,
    class?: string,
    network: boolean,
}) {
    const bridge = useContext(BridgeContext);
    const size = bridge.cellSizeInPx * 2;
    const { mirrored, portrait, class: aClass } = props;

    const rootRef = useRef<HTMLDivElement>(null);
    const [moving, setMoving] = useState<boolean>(false);
    const [ring2Controls, setRing2Controls] = useState<boolean>(false);
    const [ring3Controls, setRing3Controls] = useState<boolean>(false);

    const [chat, setChat] = useState<boolean>(false);

    const leftSensor = useRef<HTMLDivElement>(null);
    const leftNipple = useRef<HTMLDivElement>(null);
    let leftInitialPosition = {
        x: portrait ? innerWidth - size * (1 + 0.5 * distanceScale) : size * (1.3 + 0.5 * distanceScale),
        y: innerHeight - size * ((portrait ? 1 : 1.3) + 0.5 * distanceScale),
    };

    const [ring3ActiveIndex, setRing3ActiveIndex] = useState<number>(-1);


    const rightSensor = useRef<HTMLDivElement>(null);
    const rightNipple = useRef<HTMLDivElement>(null);
    let rightInitialPosition = {
        x: innerWidth - size * ((portrait ? 1 : 1.3) + 0.5 * distanceScale),
        y: portrait ? size * (1 + 0.5 * distanceScale) : innerHeight - size * (1.3 + 0.5 * distanceScale),
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
                setRing3Controls(true);
                setRing3ActiveIndex(-1);
                return leftInitialPosition;
            }, (angle, distance) => {
                if (distance < size / 2) {
                    setRing3ActiveIndex(-1);
                } else {
                    setRing3ActiveIndex(Math.round((angle * 180 / Math.PI +
                        (portrait ? -Math.PI / 2 : 0)) / slotAngle));
                }
            }, () => {
                setRing3Controls(false);
            });

        const rightHandler = createMovingHandler(
            bridge, rightNipple, rightSensor,
            rightInitialPosition, size,
            () => {
                setMoving(true);
            }, () => {
                setMoving(false);
                setRing2Controls(false);
            });

        const pressedPointers: { [id: number]: boolean } = {};
        const usedPointers: { [id: number]: boolean } = {};
        let leftPointerId: number | null = null;
        let rightPointerId: number | null = null;
        function onPoinerDown(e: PointerEvent, skipTargetCheck = false) {
            pressedPointers[e.pointerId] = true;
            if (!skipTargetCheck && e.target !== root) {
                return;
            }
            usedPointers[e.pointerId] = true;

            let leftSideTouch =
                portrait ?
                    e.clientY > innerHeight / 2 :
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
            if (!usedPointers[e.pointerId] &&
                pressedPointers[e.pointerId] === true &&
                e.target !== root) {
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                if (e.clientX < rect.left || e.clientX > (rect.left + rect.width) ||
                    e.clientY < rect.top || e.clientY > (rect.top + rect.height)) {
                    onPoinerDown(e, true);
                    return;
                }
            }

            if (e.pointerId === leftPointerId) {
                leftHandler.nippleUpdate({ x: e.clientX, y: e.clientY });
            } else if (e.pointerId === rightPointerId) {
                rightHandler.nippleUpdate({ x: e.clientX, y: e.clientY }, size * tracctionScale);
            }
        };

        function onPoinerUp(e: PointerEvent) {
            delete pressedPointers[e.pointerId];
            delete usedPointers[e.pointerId];

            if (e.pointerId === leftPointerId) {
                leftHandler.nippleEnd();
                leftPointerId = null;
            } else if (e.pointerId === rightPointerId) {
                rightHandler.nippleEnd();
                rightPointerId = null;
            }
        };

        root.addEventListener("pointerdown", onPoinerDown);
        root.addEventListener("pointermove", onPoinerMove);
        root.addEventListener("pointerup", onPoinerUp);
        root.addEventListener("pointercancel", onPoinerUp);

        const keyboardUnbind = bindKeyboardControl(root, bridge);

        return () => {
            keyboardUnbind();
            rightHandler.nippleEnd();
            root.removeEventListener("pointerdown", onPoinerDown);
            root.removeEventListener("pointermove", onPoinerMove);
            root.removeEventListener("pointerup", onPoinerUp);
            root.removeEventListener("pointercancel", onPoinerUp);
        };
    }, [portrait, mirrored]);

    useEffect(() => {
        if (chat && !props.network) {
            setChat(false);
        }
    }, [chat, props.network]);

    useEffect(() => {
        if (rootRef === null || rootRef.current === null) {
            return;
        }

        return bindMouseControl(rootRef.current, bridge);
    }, [chat, rootRef]);

    const spinClass = portrait ? "-rotate-90" : "";
    const way83Props: Way83Props = {
        textMode: props.textMode,
        moving,
        setMoving,
        mirrored: props.mirrored,
        setMirrored: props.setMirrored,
        spinClass,
        portrait,
        bridge,
        size,
        setRing2Controls,
    };

    const vClass = mirrored ? "ct" : "cb";
    const hClass = mirrored ? "cr" : "cl";

    const chatKey = <ChatKey
        class={"absolute cl-0 ct-0 " + spinClass}
        open={chat}
        onPress={() => {
            setChat(!chat);
            if (chat) {
                bridge.native.onKeyDown(ScanCode.SDL_SCANCODE_F1, false);
                setTimeout(() => bridge.native.onKeyUp(ScanCode.SDL_SCANCODE_F1), 300);
            }
        }} />;

    if (chat) {
        return <div ref={rootRef} class={aClass}>
            {chatKey}
            <TextInput class={"absolute cl-2 ct-0 " + spinClass} position={bridge.rendererHeight - 100} />
        </div>;
    }

    return <div ref={rootRef} class={aClass}>
        {!moving && !ring2Controls && <Ring1Controls {...way83Props} center={rightInitialPosition} />}
        {!moving && ring2Controls && <Ring2Controls {...way83Props} center={rightInitialPosition} />}
        {ring3Controls && <Ring3Controls {...way83Props} center={leftInitialPosition}
            activeIndex={ring3ActiveIndex} />}

        <div ref={leftSensor}
            class="absolute pointer-events-none rounded-full bg-slate-200 opacity-20 cw-2 ch-2" />
        <div ref={leftNipple}
            class="absolute hidden bg-slate-400 opacity-80 cw-1 ch-1 rounded-full pointer-events-none" />
        <div ref={rightSensor}
            class="absolute pointer-events-none rounded-full bg-slate-200 opacity-20 cw-2 ch-2" />
        <div ref={rightNipple}
            class="absolute hidden bg-slate-400 opacity-80 cw-1 ch-1 rounded-full pointer-events-none" />

        <Reverse
            class={"absolute " + spinClass + (portrait ? ` cr-4 ${vClass}-0` : ` cb-4 ${hClass}-0`)}
        />
        <Handbrake
            class={"absolute " + spinClass + (portrait ? ` cr-0 ${vClass}-0` : ` cb-0 ${hClass}-0`)}
        />
        <Jump
            class={"absolute " + spinClass + (portrait ? ` cr-2 ${vClass}-0` : ` cb-2 ${hClass}-0`)}
        />

        {props.network && chatKey}
        {props.network && <Leaderboard class={"absolute cl-2 ct-0 " + spinClass} />}
    </div>;
}

function Ring1Controls(props: Way83Props & { center: Position }) {
    const aClass = "absolute " + props.spinClass;
    return <StaticRing
        {...props}
        ringElements={
            [
                (left, top) => <RollRight class={aClass} style={{ left, top }} />,
                (left, top) => <UseGluk class={aClass} style={{ left, top }} />,
                (left, top) => <NextSwitch class={aClass} style={{ left, top }}
                    onButtonUp={() => props.setRing2Controls(true)}
                    active={false} />,
                (left, top) => <Open class={aClass} style={{ left, top }} />,
                (left, top) => <RollLeft class={aClass} style={{ left, top }} />,
                (left, top) => <Invetory class={aClass} style={{ left, top }} />,
                (left, top) => <FireV class={aClass} style={{ left, top }} />,
                (left, top) => <>
                    {!props.textMode && <Menu class={aClass} style={{ left, top }} />}
                    {props.textMode && <Text class={aClass + " animate-pulse"} style={{ left, top }} />}
                </>,
            ]
        }
    />;
}

function Ring2Controls(props: Way83Props & { center: Position }) {
    const aClass = "absolute " + props.spinClass;
    return <StaticRing
        {...props}
        ringElements={
            [
                (left, top) => <UseVector class={aClass} style={{ left, top }} />,
                (left, top) => <Digg class={aClass} style={{ left, top }} />,
                (left, top) => <NextSwitch class={aClass} style={{ left, top }}
                    onButtonUp={() => props.setRing2Controls(false)}
                    active={true} />,
                (left, top) => <Fly class={aClass} style={{ left, top }} />,
                (left, top) => <Text class={aClass} style={{ left, top }} />,
                (left, top) => <ZoomIn class={aClass} style={{ left, top }} />,
                (left, top) => <Escape class={aClass} style={{ left, top }} />,
                (left, top) => <ZoomOut class={aClass} style={{ left, top }} />,
            ]
        }
    />;
}

function Ring3Controls(props: Way83Props & { center: Position, activeIndex: number }) {
    const aClass = "absolute pointer-events-none " + props.spinClass;
    return <DynamicRing
        {...props}
        ringElements={
            [
                {
                    key: ScanCode.SDL_SCANCODE_2,
                    jsx(left, top, ringClass) {
                        return <Fire2 class={`${aClass} ${ringClass}`} style={{ left, top }} />;
                    },
                },
                {
                    key: ScanCode.SDL_SCANCODE_3,
                    jsx(left, top, ringClass) {
                        return <Fire3 class={`${aClass} ${ringClass}`} style={{ left, top }} />;
                    },
                },
                {
                    key: ScanCode.SDL_SCANCODE_4,
                    jsx(left, top, ringClass) {
                        return <FireT class={`${aClass} ${ringClass}`} style={{ left, top }} />;
                    },
                },
                null,
                null,
                null,
                {
                    key: ScanCode.SDL_SCANCODE_E,
                    jsx(left, top, ringClass) {
                        return <Fire class={`${aClass} ${ringClass}`} style={{ left, top }} />;
                    },
                },
                {
                    key: ScanCode.SDL_SCANCODE_1,
                    jsx(left, top, ringClass) {
                        return <Fire1 class={`${aClass} ${ringClass}`} style={{ left, top }} />;
                    },
                },
            ]
        }
    />;
}
