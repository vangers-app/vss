import { useContext } from "preact/hooks";
import { currentLanguage } from "../language";
import { BridgeContext } from "./bridge";

const tData: { [lang: string]: { [key: string]: string } } = {
    en: {
        yes: "Yes",
        no: "No",
        processing: "Processing...",
        header: "Vangers: Soup Supervisor",
        next: "Next",
        dev: "Developer: Guryanov Alexander (@caiiiycuk)",
        telegram: "VAndroid Telegram",
        github: "Source code (github)",
        gp: "Vangers in Google Play",
        rustore: "Vangers in RuStore",
        enable: "Enable",
        disable: "Disable",
    },
    ru: {
        yes: "Да",
        no: "Нет",
        processing: "Открытие транзакции...",
        header: "Vangers: Soup Supervisor",
        next: "Далее",
        dev: "Разработчик: Гурьянов Александр (@caiiiycuk)",
        telegram: "VAndroid Телеграм",
        github: "Исходный код (github)",
        gp: "Вангеры в Google Play",
        rustore: "Вангеры в RuStore",
        enable: "Включить",
        disable: "Выключить",
    },
};

export function t(key: string): string {
    const bridge = useContext(BridgeContext);
    const nativeLang = bridge?.native.language();
    const lang = nativeLang === "en" || nativeLang === "ru"
        ? nativeLang
        : currentLanguage();
    return tData[lang][key] ?? tData["en"][key];
}
