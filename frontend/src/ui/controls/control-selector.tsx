import { t } from "../i18n";

import { useContext, useRef, useState } from "preact/hooks";
import { BridgeContext } from "../bridge";

import way83Url from "../../assets/controls/way83+.jpeg";
import way83RuUrl from "../../assets/controls/way83+ru.jpeg";
import gamepixUrl from "../../assets/controls/gamepix+.jpg";
import { MapControlsKind } from "../map-frame";

interface ControlsProps {
    mirrored: boolean;
    setMirrored: (mirrored: boolean) => void;

    cameraFollow: boolean;
    setCameraFollow: (follow: boolean) => void;

    roadZoom: number;
    setRoadZoom: (roadZoom: number) => void;

    selected: MapControlsKind,
    onChange: (selected: MapControlsKind) => void,
};

const controls: {
    label: string,
    id: MapControlsKind,
    enImage: string,
    ruImage: string,
}[] = [{
    label: "Way 83+",
    id: "way83+",
    enImage: way83Url,
    ruImage: way83RuUrl,
}, {
    label: "GamePix+",
    id: "gamepix+",
    enImage: gamepixUrl,
    ruImage: gamepixUrl,
}];

export function ControlSelector(props: ControlsProps) {
    const bridge = useContext(BridgeContext);
    const selected = props.selected;
    const [opened, setOpened] = useState<MapControlsKind>(selected);
    const scrollDiv = useRef<HTMLDivElement>(null);

    controls.sort((a, b) => {
        return a.id === opened ? -1 :
            (b.id === opened ? 1 : 0);
    });

    function changeOpened(id: MapControlsKind) {
        scrollDiv.current?.scrollTo({
            left: 0,
            top: 0,
            behavior: "smooth",
        });
        setOpened(id);
    }

    return <div ref={scrollDiv} class="w-full h-full overflow-scroll touch">
        <div class="absolute z-50 right-8 top-8 text-green-900 animate-pulse"
            onClick={(e) => props.onChange(opened)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                stroke-width="1.5" stroke="currentColor" class="w-16 h-16">
                <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <div class="w-full bg-beeb flex flex-col
            items-center justify-center overflow-auto">
            <div class="hidden text-4xl my-4 text-shadow text-white">{t("controls_options")}</div>
            <div class="w-full">
                <CommonProps {...props} />
            </div>
            <div class="text-4xl mt-0 mb-4 text-shadow text-white">{t("select_controls_type")}</div>
            {controls.map((v) => {
                return <ControlType
                    key={v.id}
                    label={v.label}
                    selected={selected === v.id}
                    opened={opened === v.id}
                    imageUrl={bridge.native.language() === "en" ? v.enImage : v.ruImage}
                    onClick={() => changeOpened(v.id)} />;
            })}
        </div>
    </div>;
}

function ControlType(props: {
    label: string,
    imageUrl: string,
    selected: boolean,
    opened: boolean,
    onClick: () => void,
}) {
    if (props.opened) {
        return <div class="flex flex-col px-8 my-4 w-full items-center cursor-pointer">
            <div class="text-white text-2xl text-shadow">{props.label}</div>
            <img src={props.imageUrl}
                class="w-full rounded-xl pointer-events-none border-green-600 border-4"></img>
        </div>;
    }

    return <div class="flex flex-col px-8 my-4 items-center cursor-pointer" onClick={props.onClick}>
        <div class="text-white text-2xl text-shadow">{props.label}</div>
        <div style={{ backgroundImage: "url(" + props.imageUrl + ")" }}
            class={"w-96 h-48 bg-cover bg-top rounded-xl " +
                (props.selected ? "border-green-600 border-4" : "")}></div>
    </div>;
}

function CommonProps(props: ControlsProps) {
    function nextZoom() {
        let newValue = props.roadZoom + 0.1;
        if (newValue > 1.9) {
            newValue = 1.0;
        }
        props.setRoadZoom(newValue);
    }

    return <div class="flex flex-col text-white text-4xl text-shadow w-full
        px-10 my-8">
        <div class="flex flex-row items-center">
            <div class={props.mirrored ? "text-green-300" : "text-gray-300"}>{t("mirrored_controls")}</div>
            <Switch enabled={props.mirrored} onChange={props.setMirrored} />
        </div>
        <div class="flex flex-row mt-4 items-center">
            <div class={props.cameraFollow ? "text-green-300" : "text-gray-300"}>{t("follow_camera")}</div>
            <Switch enabled={props.cameraFollow} onChange={props.setCameraFollow} />
        </div>
        <div class="text-lg ml-8">
            {t("follow_camera_desc")}
        </div>
        <div class="flex flex-row mt-4 items-center">
            <div class="text-green-300">{t("road_zoom")}</div>
            <div onClick={nextZoom} class="ml-10 underline">{Math.round(props.roadZoom * 10) / 10}</div>
        </div>
    </div>;
}

function Switch(props: {
    enabled: boolean,
    onChange: (enabled: boolean) => void,
}) {
    return <div
        onClick={() => props.onChange(!props.enabled)}
        class="ml-10 underline">
        {t(props.enabled ? "disable" : "enable")}
    </div>;
}
