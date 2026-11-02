
import { useEffect, useState } from "preact/hooks";
import { Bridge, BridgeContext } from "./bridge";
import { DefaultControls } from "./controls/default-controls";
import { Api, UIType } from "./api";
import { PauseFrame } from "./way83/pause-frame";
import {
    isMirroredEnabled, setMirrored as setMirroredEnabled,
    getControlsKind, setControlsKind as setControlsKindValue,
} from "./controls/options";
import { Credits } from "./credits";
import { ShopFrame } from "./way83/shop-frame";
import { InappFrame } from "./inapp-frame";
import { ScanCode } from "./controls/sdl-scancodes";
import { EscaveControls } from "./controls/escave-controls";
import { MapControlsKind, renderMapFrame } from "./map-frame";
import { CalendarFrame } from "./calendar-frame";
import { SettingsFrame } from "../settings/settings-frame";

export function Frame(props: { mobileApi: Api }) {
    const [bridge, setBridge] = useState<Bridge | null>(null);

    useEffect(() => {
        if (bridge === null) {
            new Bridge(
                props.mobileApi,
                setBridge,
            );
            return;
        }
    }, [bridge, props.mobileApi]);

    if (bridge === null) {
        return;
    }

    return <FrameWithBridge bridge={bridge} />;
}

let prevUiType: UIType = "main-menu";

function FrameWithBridge(props: { bridge: Bridge }) {
    const bridge = props.bridge;
    const [portrait, setPortrait] = useState<boolean>(false);
    const [mirrored, _setMirrored] = useState<boolean>(isMirroredEnabled());
    const [uiType, _setUiType] =
        useState<UIType>("main-menu");
    const [network, setNetwork] = useState<boolean>(false);
    const [controlsKind, _setControlsKind] =
        useState<MapControlsKind | null>(getControlsKind());

    // First-launch settings closed: the panel wrote its values to storage,
    // pick them up and make sure a controls kind is saved so the screen does
    // not come back on the next launch.
    function closeFirstLaunchSettings() {
        const kind = getControlsKind() ?? "way83+";
        setControlsKindValue(kind);
        _setControlsKind(kind);
        _setMirrored(isMirroredEnabled());
    }

    async function setUiType(newUiType: UIType) {
        if (uiType !== "inapp" && uiType !== "credits" && uiType !== "calendar") {
            prevUiType = uiType;
        }

        if (prevUiType === "way83-text" && newUiType === "menu") {
            bridge.native.onKeyDown(ScanCode.SDL_SCANCODE_F1, false);
            setTimeout(() => {
                bridge.native.onKeyUp(ScanCode.SDL_SCANCODE_F1);
            }, 500);
            return;
        }
        _setUiType(newUiType);
    }

    function setMirrored(enabled: boolean) {
        setMirroredEnabled(enabled);
        _setMirrored(enabled);
    }

    function closeActiveUi() {
        _setUiType(prevUiType);
    }

    useEffect(() => {
        let uiChangeTimeout: number | null = null;
        let uiChangePending: UIType | null = null;
        bridge.onOrientationChanged = (orientation) => {
            setPortrait(orientation === "portrait");
        };
        bridge.onUiTypeChanged = (newUiType: UIType) => {
            if ((uiChangePending === null && uiType === newUiType) || newUiType === uiChangePending) {
                return;
            }

            if (uiChangeTimeout !== null) {
                bridge.log("uiType change cancelled", uiChangePending);
                clearTimeout(uiChangeTimeout);
                uiChangeTimeout = null;
                uiChangePending = null;
            }

            bridge.log("uiType scheduled to change to", newUiType);
            uiChangePending = newUiType;
            uiChangeTimeout = setTimeout(() => {
                bridge.log("uiType changed to", newUiType);
                if (uiChangePending !== newUiType) {
                    bridge.log("ERROR! newUiType != pendingType", newUiType, uiChangePending);
                }
                uiChangeTimeout = null;
                uiChangePending = null;
                setUiType(newUiType);
            }, 32);
        };
        bridge.onNetworkState = (network: boolean) => {
            setNetwork(network);
        };
    }, [bridge, setPortrait, setUiType]);

    if (controlsKind === null) {
        return <div class="frame">
            <BridgeContext.Provider value={bridge}>
                <SettingsFrame onClose={closeFirstLaunchSettings} />
            </BridgeContext.Provider>
        </div>;
    }

    switch (uiType) {
        case "menu":
        case "way83-text":
        case "way83+":
        case "way83-inventory":
            return renderMapFrame({
                bridge,
                uiType,
                controlsKind,

                mirrored,
                setMirrored,

                portrait,
                network,
            });

        case "shop":
            return <div class="frame">
                <BridgeContext.Provider value={bridge}>
                    <ShopFrame setUiType={setUiType} />
                </BridgeContext.Provider>
            </div>;

        case "pause":
            return <div class="frame">
                <BridgeContext.Provider value={bridge}>
                    <PauseFrame />
                </BridgeContext.Provider>
            </div>;

        case "inapp":
            return <div class="frame">
                <BridgeContext.Provider value={bridge}>
                    <InappFrame closeActiveUi={closeActiveUi} />
                </BridgeContext.Provider>
            </div>;

        case "calendar":
            return <div class="frame">
                <BridgeContext.Provider value={bridge}>
                    <CalendarFrame closeActiveUi={closeActiveUi} />
                </BridgeContext.Provider>
            </div>;

        case "credits":
            return <div class="frame">
                <BridgeContext.Provider value={bridge}>
                    <Credits closeActiveUi={closeActiveUi} />
                </BridgeContext.Provider>
            </div>;

        case "main-menu":
            return <div class="frame">
                <BridgeContext.Provider value={bridge}>
                    <DefaultControls
                        showTextInput={network}
                        showLang={!network}
                        showSizeToggle={!network}
                        setUiType={setUiType}
                        showSocial={true}
                        showNetworkCalendar={bridge.native.login().length > 0} />;
                </BridgeContext.Provider>
            </div>;

        default:
            return <div class="frame">
                <BridgeContext.Provider value={bridge}>
                    <EscaveControls setUiType={setUiType} />;
                </BridgeContext.Provider>
            </div>;
    }
}
