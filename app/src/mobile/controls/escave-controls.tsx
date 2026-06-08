import { useContext, useEffect, useRef } from "preact/hooks";
import { BridgeContext } from "../bridge";
import { UIType } from "../api";
import { MenuDown, Escape, MenuUp } from "./keys";
import { bindMouseControl } from "./mouse";

export function EscaveControls(props: {
    setUiType: (uiType: UIType) => void,
}) {
    const bridge = useContext(BridgeContext);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (rootRef === null || rootRef.current === null) {
            return;
        }

        return bindMouseControl(rootRef.current, bridge);
    }, [bridge, rootRef]);

    return <div ref={rootRef} class="w-full h-full">
        <Escape class="absolute cl-0 ct-0" />
        <MenuUp class="absolute cl-0 cb-2" />
        <MenuDown class="absolute cl-0 cb-0" />
    </div>;
}
