import { useContext, useEffect, useRef } from "preact/hooks";
import { BridgeContext } from "../bridge";
import { bindKeyboardControl } from "../controls/keyboard";
import { Text } from "../controls/keys";
import { bindMouseControl } from "../controls/mouse";

export function Way83Text(props: {
    class?: string,
}) {
    const bridge = useContext(BridgeContext);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (rootRef === null || rootRef.current === null) {
            return;
        }

        const root = rootRef.current;
        const mouseUnbind = bindMouseControl(rootRef.current, bridge);
        const keyboardUnbind = bindKeyboardControl(root, bridge);

        return () => {
            mouseUnbind();
            keyboardUnbind();
        };
    }, [bridge, rootRef]);

    return <div ref={rootRef} class={"w-full h-full " + props.class}>
        <Text class="absolute cl-0 cb-0" />
    </div>;
}
