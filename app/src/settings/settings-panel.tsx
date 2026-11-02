import { useContext, useState } from "preact/hooks";
import { t } from "../inventory/i18n";
import { currentLanguage } from "../language";
import { BridgeContext } from "../mobile/bridge";
import type { MapControlsKind } from "../mobile/map-frame";
import {
    getControlsKind, setControlsKind,
    getRoadZoom, setRoadZoom,
    isCameraFollowEnabled, setCameraFollow,
    isMirroredEnabled, setMirrored,
} from "../mobile/controls/options";
import {
    type RenderQuality,
    type RenderSettings,
    readRenderSettings,
    writeRenderSettings,
} from "../render-presets";
import way83Url from "../assets/controls/way83+.jpeg";
import way83RuUrl from "../assets/controls/way83+ru.jpeg";
import gamepixUrl from "../assets/controls/gamepix+.jpg";

const controlsKinds: { id: MapControlsKind, label: string, enImage: string, ruImage: string }[] = [{
    id: "way83+",
    label: "Way 83+",
    enImage: way83Url,
    ruImage: way83RuUrl,
}, {
    id: "gamepix+",
    label: "GamePix+",
    enImage: gamepixUrl,
    ruImage: gamepixUrl,
}];

export function SettingsPanel() {
    return <div class="flex flex-col">
        <p class="text-2xl font-bold">{t("settings")}</p>
        <RenderSection />
        {(window as any).__VSS_MOBILE__ === true && <ControlsSection />}
    </div>;
}

function RenderSection() {
    const [renderSettings, setRenderSettings] = useState<RenderSettings>(readRenderSettings());

    function updateRenderSettings(next: RenderSettings) {
        writeRenderSettings(next);
        setRenderSettings(next);
    }

    return <>
        <p class="mt-4 ml-4 text-lg text-shadow-sm">{t("render_3d")}</p>
        <div class="flex flex-row ml-4 mt-1">
            {([["1", true], ["0", false]] as const).map(([key, use3d]) =>
                <SettingOption key={key}
                    label={t(use3d ? "on" : "off")}
                    selected={renderSettings.use3d === use3d}
                    onSelect={() => updateRenderSettings({ ...renderSettings, use3d })} />)}
        </div>
        <p class="mt-4 ml-4 text-lg text-shadow-sm">{t("render_quality")}</p>
        <div class={"flex flex-row ml-4 mt-1" + (renderSettings.use3d ? "" : " opacity-40")}>
            {(["high", "normal", "low"] as RenderQuality[]).map((quality) =>
                <SettingOption key={quality}
                    label={t("quality_" + quality)}
                    selected={renderSettings.quality === quality}
                    onSelect={renderSettings.use3d ?
                        () => updateRenderSettings({ ...renderSettings, quality }) :
                        undefined} />)}
        </div>
    </>;
}

function ControlsSection() {
    const bridge = useContext(BridgeContext);
    const [mirrored, setMirroredState] = useState<boolean>(isMirroredEnabled());
    const [cameraFollow, setCameraFollowState] = useState<boolean>(isCameraFollowEnabled());
    const [roadZoom, setRoadZoomState] = useState<number>(getRoadZoom());
    const [controlsKind, setControlsKindState] = useState<MapControlsKind>(getControlsKind() ?? "way83+");
    const nativeLanguage = bridge?.native.language();
    const language = nativeLanguage === "en" || nativeLanguage === "ru" ? nativeLanguage : currentLanguage();

    function nextZoom() {
        const next = roadZoom + 0.1 > 1.9 ? 1.0 : Math.round((roadZoom + 0.1) * 10) / 10;
        setRoadZoom(next);
        setRoadZoomState(next);
    }

    function selectControlsKind(kind: MapControlsKind) {
        setControlsKind(kind);
        setControlsKindState(kind);
    }

    const orderedKinds = [
        ...controlsKinds.filter((kind) => kind.id === controlsKind),
        ...controlsKinds.filter((kind) => kind.id !== controlsKind),
    ];
    return <>
        <p class="mt-8 text-2xl font-bold">{t("controls_options")}</p>
        <p class="mt-4 ml-4 text-lg text-shadow-sm">{t("mirrored_controls")}</p>
        <div class="flex flex-row ml-4 mt-1">
            {[true, false].map((enabled) =>
                <SettingOption key={String(enabled)}
                    label={t(enabled ? "on" : "off")}
                    selected={mirrored === enabled}
                    onSelect={() => {
                        setMirrored(enabled);
                        setMirroredState(enabled);
                    }} />)}
        </div>
        <p class="mt-4 ml-4 text-lg text-shadow-sm">{t("follow_camera")}</p>
        <div class="flex flex-row ml-4 mt-1">
            {[true, false].map((enabled) =>
                <SettingOption key={String(enabled)}
                    label={t(enabled ? "on" : "off")}
                    selected={cameraFollow === enabled}
                    onSelect={() => {
                        setCameraFollow(enabled);
                        setCameraFollowState(enabled);
                    }} />)}
        </div>
        <p class="ml-4 mt-1 text-sm text-shadow-sm">{t("follow_camera_desc")}</p>
        <p class="mt-4 ml-4 text-lg text-shadow-sm">{t("road_zoom")}</p>
        <div class="flex flex-row ml-4 mt-1">
            <SettingOption label={String(Math.round(roadZoom * 10) / 10)} selected={true} onSelect={nextZoom} />
        </div>
        <p class="mt-4 ml-4 text-lg text-shadow-sm">{t("select_controls_type")}</p>
        <div class="flex flex-col ml-4 mt-1 mb-4">
            {orderedKinds.map((kind) =>
                <div key={kind.id} class="flex flex-col my-2 cursor-pointer items-start"
                    onClick={() => selectControlsKind(kind.id)}>
                    <SettingOption label={kind.label} selected={kind.id === controlsKind} />
                    <img src={language === "ru" ? kind.ruImage : kind.enImage}
                        class={(kind.id === controlsKind ?
                            "w-full max-w-3xl border-green-500 border-4 " :
                            "w-96 h-48 object-cover object-top ") +
                            "mt-2 rounded-xl pointer-events-none"} />
                </div>)}
        </div>
    </>;
}

function SettingOption(props: { label: string, selected: boolean, onSelect?: () => void }) {
    return <div onClick={props.onSelect}
        class={(props.onSelect !== undefined ? "cursor-pointer " : "") +
            (props.selected ? "bg-green-500 text-slate-50 " : "bg-black/60 text-slate-300 ") +
            "mr-2 px-4 py-1 text-xl font-bold rounded"}>
        {props.label}
    </div>;
}
