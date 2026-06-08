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
    },
    ru: {
        refresh: "Обновить",
        tap_item: "Нажмите на артефакт что бы увидеть подробности",
        owned: "Принадлежит Вам",
        enable: "Включить",
        disable: "Выключить",
        fullscreen_lock: "Зафиксировать камеру в режиме дороги на весь экран",
    },
};

// Current UI language outside of the render tree (no hook). Used to resolve
// localized mod metadata in reconcileMods.
export function currentLang(): "en" | "ru" {
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
    const lang: "en" | "ru" = nativeLang === "en" || nativeLang === "ru" ? nativeLang : currentLang();
    return tData[lang][key] ?? tData.en[key] ?? key;
}
