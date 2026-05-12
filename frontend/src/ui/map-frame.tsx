import { Bridge, BridgeContext } from "./bridge";
import { Road } from "./gamepix/road";
import { UIType } from "./native-bridge";
import { Way83 } from "./way83/way83";
import { Way83Inventory } from "./way83/way83-inventory";

import { MenuFrame } from "./way83/menu-frame";
import { MapFrame } from "./way83/map-frame";
import { Menu, MenuActivate, MenuDown, MenuUp } from "./controls/keys";
import { RoadInventory } from "./gamepix/road-inventory";

export type MapControlsKind = "way83+" | "gamepix+";

export interface MapControlsProps {
    bridge: Bridge,
    uiType: UIType,
    controlsKind: MapControlsKind,

    mirrored: boolean,
    setMirrored: (newMirrored: boolean) => void;

    portrait: boolean;
    network: boolean;
};

export function renderMapFrame(props: MapControlsProps) {
    switch (props.controlsKind) {
        case "gamepix+":
            return renderGamepix(props);
        default:
            return renderWay83Frame(props);
    }

    return <></>;
}

function renderWay83Frame(props: MapControlsProps) {
    const { bridge, uiType, mirrored, setMirrored, portrait, network } = props;
    switch (uiType) {
        case "menu":
            return <div class="frame">
                <BridgeContext.Provider value={bridge}>
                    <MenuFrame />
                    <MapFrame />
                    <MenuActivate class="absolute cb-6 cl-0" />
                    <MenuUp class="absolute cb-4 cl-0" />
                    <MenuDown class="absolute cb-2 cl-0" />
                    <Menu buggyIcon={true} class="absolute cb-0 cl-0" />
                </BridgeContext.Provider>
            </div>;

        case "way83-text":
        case "way83+":
            return <div class="frame">
                <BridgeContext.Provider value={bridge}>
                    <Way83
                        textMode={uiType === "way83-text"}
                        mirrored={mirrored}
                        setMirrored={setMirrored}
                        portrait={portrait}
                        network={network}
                        class="absolute left-0 top-0 bottom-0 right-0" />
                </BridgeContext.Provider>
            </div>;

        case "way83-inventory":
            return <div class="frame">
                <BridgeContext.Provider value={bridge}>
                    <Way83Inventory />
                </BridgeContext.Provider>
            </div>;
    }

    return <></>;
}

function renderGamepix(props: MapControlsProps) {
    const { bridge, uiType, mirrored } = props;
    switch (uiType) {
        case "way83-inventory": {
            return <div class="frame">
                <BridgeContext.Provider value={bridge}>
                    <RoadInventory />
                </BridgeContext.Provider>
            </div>;
        } break;
        default:
            return <div class="frame">
                <BridgeContext.Provider value={bridge}>
                    <Road uiType={uiType} mirrored={mirrored} />
                </BridgeContext.Provider>
            </div>;
    }
}
