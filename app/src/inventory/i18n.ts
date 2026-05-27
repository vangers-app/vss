import { useContext } from "preact/hooks";
import { BridgeContext } from "../mobile/bridge";

const tData: { [lang: string]: { [key: string]: string } } = {
    en: {
        refresh: "Refresh",
        tap_item: "Tap on artifact to see details",
        owned: "You have this item",
        enable: "Enable",
        disable: "Disable",
        fullscreen_lock: "Lock camera to road fullscreen mode",
        vfv_name: "Voxels in Vangers",
        vfv_description: "Replaces game models with voxel-styled versions.",
        vnm_name: "New Models",
        vnm_description: "Replaces game models with more detailed recreated versions.",
        tankers_name: "Tankers",
        tankers_description: "Replaces mechos models with tanks.",
        "vss-music_name": "Music addon",
        "vss-music_description": "Additional soundtrack and audio behavior.",
        "vss-fullscreen-game_name": "Fullscreen game",
        "vss-fullscreen-game_description": "Road fullscreen UI behavior.",
    },
    ru: {
        refresh: "Обновить",
        tap_item: "Нажмите на артефакт что бы увидеть подробности",
        owned: "Принадлежит Вам",
        enable: "Включить",
        disable: "Выключить",
        fullscreen_lock: "Зафиксировать камеру в режиме дороги на весь экран",
        vfv_name: "Воксели в Вангерах",
        vfv_description: "Заменяет модели игры версиями в воксельном стиле.",
        vnm_name: "Новые модели",
        vnm_description: "Заменяет модели игры более детализированными воссозданными версиями.",
        tankers_name: "Танкисты",
        tankers_description: "Заменяет модели мехосов танками.",
        "vss-music_name": "Музыкальное дополнение",
        "vss-music_description": "Дополнительный саундтрек и поведение аудио.",
        "vss-fullscreen-game_name": "Игра на весь экран",
        "vss-fullscreen-game_description": "Поведение интерфейса дороги на весь экран.",
    },
};

function detectLang(): "en" | "ru" {
    const stored = window.localStorage.getItem("mobile.language");
    if (stored === "en" || stored === "ru") {
        return stored;
    }
    const navLang = (navigator.language || "").toLowerCase();
    return navLang.startsWith("ru") ? "ru" : "en";
}

export function t(key: string): string {
    const bridge = useContext(BridgeContext);
    const nativeLang = bridge?.native.language();
    const lang: "en" | "ru" = nativeLang === "en" || nativeLang === "ru" ? nativeLang : detectLang();
    return tData[lang][key] ?? tData.en[key] ?? key;
}
