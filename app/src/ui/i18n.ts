import { useContext } from "preact/hooks";
import { BridgeContext } from "./bridge";

const tData: { [lang: string]: { [key: string]: string } } = {
    en: {
        yes: "Yes",
        no: "No",
        processing: "Processing...",
        header: "Android version",
        next: "Next",
        dev: "Developer: Guryanov Alexander (@caiiiycuk)",
        telegram: "VAndroid Telegram",
        github: "Source code (github)",
        gp: "Vangers in Google Play",
        select_controls_type: "Select controls type",
        controls_options: "Common Options",
        mirrored_controls: "Mirrored controls",
        enable: "Enable",
        disable: "Disable",
        follow_camera: "Bind joystick to mechos",
        follow_camera_desc: "* if enabled, then joystick movements will take into account the direction of the mechos",
        road_zoom: "Camera zoom out",
    },
    ru: {
        yes: "Да",
        no: "Нет",
        processing: "Открытие транзакции...",
        header: "Android версия",
        next: "Далее",
        dev: "Разработчик: Гурьянов Александр (@caiiiycuk)",
        telegram: "VAndroid Телеграм",
        github: "Исходный код (github)",
        gp: "Вангеры в Google Play",
        select_controls_type: "Выберите вариант управления",
        controls_options: "Общие настройки",
        mirrored_controls: "Отразить управление",
        enable: "Включить",
        disable: "Выключить",
        follow_camera: "Привязка джойстика к мехосу",
        follow_camera_desc: "* если включено, то движения джойстика будут учитывать направление движения мехоса",
        road_zoom: "Отдаление камеры",
    },
};

export function t(key: string): string {
    const bridge = useContext(BridgeContext);
    return tData[bridge.native.language()][key] ?? tData["en"][key];
}
