
import { useEffect, useState } from "preact/hooks";
import { Bridge, BridgeContext } from "./bridge";
import { DefaultControls } from "./controls/default-controls";
import { UIType } from "./native-bridge";
import { NoopNativeBrige } from "./noop-native";
import { PauseFrame } from "./way83/pause-frame";
import {
    isMirroredEnabled, setMirrored as setMirroredEnabled,
    isCameraFollowEnabled, setCameraFollow as setCameraFollowEnabled,
    getControlsKind, setControlsKind as setControlsKindValue,
    getRoadZoom, setRoadZoom as setRoadZoomValue,
} from "./controls/options";
import { Credits } from "./credits";
import { ShopFrame } from "./way83/shop-frame";
import { InappFrame } from "./inapp-frame";
import { ScanCode } from "./controls/sdl-scancodes";
import { EscaveControls } from "./controls/escave-controls";
import { ControlSelector } from "./controls/control-selector";
import { MapControlsKind, renderMapFrame } from "./map-frame";
import { CalendarFrame } from "./calendar-frame";

const isNative = typeof (window as any).bridge === "object";

export function Frame() {
    const [bridge, setBridge] = useState<Bridge | null>(null);

    useEffect(() => {
        if (bridge === null) {
            const nativeBridge = (window as any).bridge;
            new Bridge(
                nativeBridge ?? new NoopNativeBrige(),
                setBridge,
            );
            return;
        }
    }, [bridge]);

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
    const [cameraFollow, _setCameraFollow] = useState<boolean>(isCameraFollowEnabled());
    const [roadZoom, _setRoadZoom] = useState<number>(getRoadZoom());
    const [uiType, _setUiType] = useState<UIType>(isNative ? "main-menu" : "way83+");
    const [network, setNetwork] = useState<boolean>(false);
    const [controlsKind, _setControlsKind] =
        useState<MapControlsKind | null>(getControlsKind());

    function setControlsKind(kind: MapControlsKind) {
        setControlsKindValue(kind);
        _setControlsKind(kind);
    }

    async function setUiType(newUiType: UIType) {
        if (newUiType === "inapp") {
            let token: string | null = null;
            try {
                token = await bridge.getToken(true);
            } catch (e) {
                console.error("can't get token", e);
            }

            if (token === null) {
                return;
            }
        }
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

    function setRoadZoom(value: number) {
        setRoadZoomValue(value);
        _setRoadZoom(value);
    }

    function setMirrored(enabled: boolean) {
        setMirroredEnabled(enabled);
        _setMirrored(enabled);
    }

    function setCameraFollow(enabled: boolean) {
        setCameraFollowEnabled(enabled);
        _setCameraFollow(enabled);
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
                <ControlSelector
                    mirrored={mirrored}
                    setMirrored={setMirrored}
                    cameraFollow={cameraFollow}
                    setCameraFollow={setCameraFollow}
                    roadZoom={roadZoom}
                    setRoadZoom={setRoadZoom}
                    selected="way83+"
                    onChange={setControlsKind} />
            </BridgeContext.Provider>
        </div>;
    }

    switch (uiType) {
        case "controls-select":
            return <div class="frame">
                <BridgeContext.Provider value={bridge}>
                    <ControlSelector
                        mirrored={mirrored}
                        setMirrored={setMirrored}
                        cameraFollow={cameraFollow}
                        setCameraFollow={setCameraFollow}
                        roadZoom={roadZoom}
                        setRoadZoom={setRoadZoom}
                        selected={controlsKind}
                        onChange={(selected) => {
                            setControlsKind(selected);
                            setUiType(prevUiType);
                        }} />
                </BridgeContext.Provider>
            </div>;

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
                        showControlsSelector={true}
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
