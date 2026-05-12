import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { BridgeContext } from "../bridge";
import { bindKeyboardControl } from "../controls/keyboard";
import { InventoryUse, Invetory } from "../controls/keys";
import { bindMouseControl, bindRightMouseControl } from "../controls/mouse";

export function Way83Inventory(props: {}) {
    const bridge = useContext(BridgeContext);
    const rootRef = useRef<HTMLDivElement>(null);
    const [useMode, setUseMode] = useState<boolean>(false);

    useEffect(() => {
        if (rootRef === null || rootRef.current === null) {
            return;
        }

        const root = rootRef.current;
        const keyboardUnbind = bindKeyboardControl(root, bridge);

        let mouseUnbind: () => void;
        if (useMode) {
            mouseUnbind = bindRightMouseControl(root, bridge);
        } else {
            mouseUnbind = bindMouseControl(root, bridge);
        }
        return () => {
            mouseUnbind();
            keyboardUnbind();
        };
    }, [bridge, rootRef, useMode]);

    return <div ref={rootRef} class="w-full h-full">
        <InventoryUse
            buggyIcon={true}
            class="absolute cb-2 cl-0"
            onButtonDown={() => setUseMode(true)}
            onButtonUp={() => setUseMode(false)}
        />
        <Invetory buggyIcon={true} class="absolute cb-0 cl-0" />
    </div>;
}
