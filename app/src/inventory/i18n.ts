import { useContext } from "preact/hooks";
import { currentLanguage } from "../language";
import { BridgeContext } from "../mobile/bridge";

const tData: { [lang: string]: { [key: string]: string } } = {
    en: {
        refresh: "Refresh",
        tap_item: "Tap on artifact to see details",
        owned: "You have this item",
        enable: "Enable",
        disable: "Disable",
        fullscreen_lock: "Lock camera to road fullscreen mode",
        settings: "Settings",
        render_3d: "3D",
        render_quality: "3D quality",
        quality_high: "High",
        quality_normal: "Normal",
        quality_low: "Low",
        on: "On",
        off: "Off",
        select_controls_type: "Select controls type",
        controls_options: "Controls",
        mirrored_controls: "Mirrored controls",
        follow_camera: "Bind joystick to mechos",
        follow_camera_desc: "* if enabled, then joystick movements will take into account the direction of the mechos",
        road_zoom: "Camera zoom out",
    },
    ru: {
        refresh: "Обновить",
        tap_item: "Нажмите на артефакт что бы увидеть подробности",
        owned: "Принадлежит Вам",
        enable: "Включить",
        disable: "Выключить",
        fullscreen_lock: "Зафиксировать камеру в режиме дороги на весь экран",
        settings: "Настройки",
        render_3d: "3D",
        render_quality: "Качество 3D",
        quality_high: "Высокое",
        quality_normal: "Нормальное",
        quality_low: "Низкое",
        on: "Включено",
        off: "Выключено",
        select_controls_type: "Выберите вариант управления",
        controls_options: "Управление",
        mirrored_controls: "Отразить управление",
        follow_camera: "Привязка джойстика к мехосу",
        follow_camera_desc: "* если включено, то движения джойстика будут учитывать направление движения мехоса",
        road_zoom: "Отдаление камеры",
    },
};

// Current UI language outside of the render tree (no hook). Used to resolve
// localized mod metadata in reconcileMods.
export function currentLang(): "en" | "ru" {
    return currentLanguage();
}

export function t(key: string): string {
    const bridge = useContext(BridgeContext);
    const nativeLang = bridge?.native.language();
    const lang: "en" | "ru" = nativeLang === "en" || nativeLang === "ru" ? nativeLang : currentLang();
    return tData[lang][key] ?? tData.en[key] ?? key;
}
