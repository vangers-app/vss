import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { BridgeContext } from "../bridge";
import { Escape, InventoryUse, Invetory } from "../controls/keys";
import { bindMouseControl, bindRightMouseControl } from "../controls/mouse";

export function RoadInventory(props: {}) {
    const bridge = useContext(BridgeContext);
    const rootRef = useRef<HTMLDivElement>(null);
    const [useMode, setUseMode] = useState<boolean>(false);

    useEffect(() => {
        if (rootRef === null || rootRef.current === null) {
            return;
        }
        if (useMode) {
            return bindRightMouseControl(rootRef.current, bridge);
        }

        return bindMouseControl(rootRef.current, bridge);
    }, [rootRef, rootRef.current]);


    return <div ref={rootRef} class="w-full h-full">
        <Escape class="absolute cl-0 ct-0" />
        <InventoryUse
            buggyIcon={true}
            class="absolute cb-0 cl-0"
            onButtonDown={() => setUseMode(true)}
            onButtonUp={() => setUseMode(false)}
        />
        <Invetory buggyIcon={true} class="absolute ct-0 cr-0" />
    </div>;
}
