import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { BridgeContext } from "../bridge";
import { UIType } from "../api";
import { CalendarButton, InappOpen, Lang, MobileButton, QuestionButton, SizeToggle, Telegram, TextInput } from "./keys";
import { bindMouseControl } from "./mouse";

const showDebugButton = false;

export function DefaultControls(props: {
    setUiType: (uiType: UIType) => void,
    showLang: boolean,
    showSizeToggle: boolean,
    showSocial: boolean,
    showTextInput: boolean,
    showControlsSelector: boolean,
    showNetworkCalendar: boolean,
}) {
    const bridge = useContext(BridgeContext);
    const rootRef = useRef<HTMLDivElement>(null);

    const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
    const [networkGamesCount, setNetworkGamesCount] = useState<number>(0);

    useEffect(() => {
        if (rootRef === null || rootRef.current === null) {
            return;
        }

        return bindMouseControl(rootRef.current, bridge);
    }, [bridge, rootRef]);

    useEffect(() => {
        if (props.showNetworkCalendar) {
            getNetworkGamesCount()
                .then(setNetworkGamesCount)
                .catch(console.error);
        }
    }, [props.showNetworkCalendar]);

    const debugText = showDebugInfo ?
        JSON.stringify(bridge, null, 2) : null;

    return <div ref={rootRef} class="w-full h-full">
        <InappOpen class="absolute cl-0 ct-0"
            onButtonUp={() => props.setUiType("inapp")} />
        {props.showSizeToggle && <SizeToggle class="absolute cl-0 ct-2" />}
        {props.showTextInput && <TextInput class="absolute cl-2 ct-0" position={bridge.rendererHeight - 100} />}
        {props.showLang && <Lang class="absolute cr-0 ct-2" />}
        {props.showSocial && <Telegram class="absolute cr-0 t-0" />}
        {props.showControlsSelector && <MobileButton class="absolute cr-0 cb-0" onButtonUp={() => {
            props.setUiType("controls-select");
        }} />}
        {props.showNetworkCalendar && <div class="absolute cl-0 cb-0">
            <CalendarButton onButtonUp={() => {
                props.setUiType("calendar");
            }} />
            {networkGamesCount > 0 &&
                <div class="bg-red-500 rounded-full flex items-center justify-center
                    absolute right-0 top-0 cw-0.5 ch-0.5 text-white
                    font-bold">
                    {networkGamesCount}
                </div>
            }
        </div>}
        {debugText && <textarea readOnly={true}
            class="absolute left-0 top-0 bottom-0 right-0 debug-text" value={debugText} />}
        {showDebugButton && <QuestionButton class="absolute cr-0 cb-0" onButtonUp={() => {
            setShowDebugInfo(!showDebugInfo);
        }} />}
    </div>;
}

async function getNetworkGamesCount(): Promise<number> {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    const response = await fetch("https://d5doclq1iiav7jvf299a.apigw.yandexcloud.net/get?start=" + start.getTime());
    const json = await response.json();
    if (json.success === false) {
        return 0;
    }

    return json.documents.length;
}
