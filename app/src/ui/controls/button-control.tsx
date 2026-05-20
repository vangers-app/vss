import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { usePropsRef } from "../refs";
import { BridgeContext } from "../bridge";
import backgroundUrl from "../../assets/button-back.png";

export function Button(props: {
    class?: string,
    style?: string | JSX.CSSProperties,
    image?: string,
    onButtonDown?: () => void,
    onButtonUp?: () => void,
    noBackground?: boolean,
}) {
    const [rotate] = useState<number>(Math.random() * 360);
    const bridge = useContext(BridgeContext);
    const aClass = props.class;

    const zoneRef = useRef<HTMLDivElement>(null);
    const onButtonDownRef = usePropsRef<(() => void) | undefined>(props.onButtonDown);
    const onButtonUpRef = usePropsRef<(() => void) | undefined>(props.onButtonUp);

    useEffect(() => {
        if (zoneRef === null || zoneRef.current === null) {
            return;
        }
        const target = zoneRef.current;

        let pressed = false;
        const keyDown = () => {
            if (pressed) {
                return;
            }

            if (onButtonDownRef.current !== undefined) {
                onButtonDownRef.current();
            }

            pressed = true;
            target.classList.add("animate-spin");
        };

        const keyUp = () => {
            if (!pressed) {
                return;
            }

            if (onButtonUpRef.current !== undefined) {
                onButtonUpRef.current();
            }

            pressed = false;
            target.classList.remove("animate-spin");
        };


        const onPointerDown = (e: PointerEvent) => {
            if (e.target !== target) {
                return;
            }

            keyDown();
        };

        const onPointerUp = (e: PointerEvent) => {
            if (!pressed) {
                return;
            }
            keyUp();
        };

        const onPointerMove = (e: PointerEvent) => {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > (rect.left + rect.width) ||
                    e.clientY < rect.top || e.clientY > (rect.top + rect.height)) {
                if (!pressed) {
                    pressed = false;
                    target.classList.remove("animate-spin");
                    return;
                }
                keyUp();
            }
        };

        target.addEventListener("pointerdown", onPointerDown);
        target.addEventListener("pointerup", onPointerUp);
        target.addEventListener("pointercancel", onPointerUp);
        target.addEventListener("pointermove", onPointerMove);
        target.addEventListener("pointerleave", onPointerUp);

        return () => {
            if (pressed) {
                keyUp();
            }
            target.removeEventListener("pointerdown", onPointerDown);
            target.removeEventListener("pointerup", onPointerUp);
            target.removeEventListener("pointercancel", onPointerUp);
            target.removeEventListener("pointermove", onPointerMove);
            target.addEventListener("pointerleave", onPointerUp);
        };
    }, [zoneRef, bridge]);

    return <div ref={zoneRef}
        class={(aClass || "") +
            " cw-2 ch-2 flex justify-center items-center rounded-full"}
        style={props.style}
    >
        { props.noBackground !== true && <div class="absolute cw-1.5 ch-1.5 pointer-events-none opacity-50"
            style={{
                backgroundImage: `url(${backgroundUrl})`,
                backgroundSize: "cover",
                transform: `rotate(${rotate}deg)`,
            }} /> }

        { props.image && <div class="absolute cw-0.8 ch-0.8 pointer-events-none opacity-65"
            style={{
                backgroundImage: `url(${props.image})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
            }} />
        }
    </div>;
}
