import { useContext } from "preact/hooks";
import { Bridge, BridgeContext } from "../bridge";
import { Button } from "./button-control";

export function Key(props: {
    class?: string,
    style?: string | JSX.CSSProperties,
    image?: string,
    single?: boolean,
    keyCode: number | number[],
    repeat?: boolean,
    beforePress?: () => void,
    afterPress?: () => void,
}) {
    const bridge = useContext(BridgeContext);
    const sendKeyDown = keyDown(props.keyCode, bridge, props.repeat === true);
    const sendKeyUp = keyUp(props.keyCode, bridge);

    let pressedAt = 0;
    function onButtonDown() {
        if (props.single === true) {
            return;
        }

        if (props.beforePress !== undefined) {
            props.beforePress();
        }

        pressedAt = Date.now();
        sendKeyDown();
    }

    function onButtonUp() {
        if (props.single === true) {
            if (props.beforePress !== undefined) {
                props.beforePress();
            }

            pressedAt = Date.now();
            sendKeyDown();
        }

        setTimeout(() => {
            sendKeyUp();
            if (props.afterPress !== undefined) {
                props.afterPress();
            }
        }, Math.max(300 - (Date.now() - pressedAt), 0));
    }

    return <Button
        class={props.class}
        style={props.style}
        image={props.image}
        onButtonDown={onButtonDown}
        onButtonUp={onButtonUp}
    />;
}

export function keyDown(keyCode: number | number[], bridge: Bridge, repeat: boolean) {
    const keyCodes = typeof keyCode === "number" ? [keyCode] : keyCode;
    return () => {
        for (const next of keyCodes) {
            bridge.native.onKeyDown(next, repeat);
        }
        bridge.log("onKeyDown", keyCodes);
    };
}

export function keyUp(keyCode: number | number[], bridge: Bridge) {
    const keyCodes = typeof keyCode === "number" ? [keyCode] : keyCode;
    return () => {
        for (const next of keyCodes) {
            bridge.native.onKeyUp(next);
        }
        bridge.log("onKeyUp", keyCodes);
    };
}
