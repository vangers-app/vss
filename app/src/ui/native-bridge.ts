/* eslint-disable no-unused-vars */
export type UIType = "default" | "main-menu" |
    "way83+" | "way83-inventory" | "way83-text" |
    "menu" | "pause" |
    "inapp" | "credits" | "shop" |
    "controls-select" |
    "calendar";

export interface Event {
    type: "ready" | "scaled_renderer_changed" | "ui_type_changed" | "log" | "orientation_changed" | "inapp-result" |
        "network_state";
    orientation: "portrait" | "landscape";
    enabled: boolean;
    id: RuntimeObjectId;
    message: string;
    uiType: UIType;
    network: boolean;
}

export enum RuntimeObjectId {
    RTO_GAME_QUANT_ID = 1, // 1
    RTO_LOADING1_ID, // 2
    RTO_LOADING2_ID, // 3
    RTO_LOADING3_ID, // 4
    RTO_MAIN_MENU_ID, // 5
    RTO_FIRST_ESCAVE_ID, // 6
    RTO_FIRST_ESCAVE_OUT_ID, // 7
    RTO_ESCAVE_ID, // 8
    RTO_ESCAVE_OUT_ID, // 9
    RTO_PALETTE_TRANSFORM_ID, // 10
    RTO_SHOW_IMAGE_ID, // 11
    RTO_SHOW_AVI_ID, // 12
}

export interface NativeBridge {
    ready(): void;
    debug(): boolean;
    artifactoryUrl(): string;

    setStorageItem(key: string, value: string): void;
    getCustomProp(name: string): string;
    setCustomProp(name: string, value: string): void;

    rendererWidth(): number;
    rendererHeight(): number;
    windowWidth(): number;
    windowHeight(): number;

    onMouseDown(button: 1 | 2, x: number, y: number): void;
    onMouseMove(x: number, y: number): void;
    onMouseUp(button: 1 | 2, x: number, y: number): void;

    onKeyDown(keyCode: number, repeat: boolean): void;
    onKeyUp(keyCode: number): void;

    onJoystickUpdate(active: boolean, distance: number, angle: number): void;
    onJoystickReverseUpdate(reverse: boolean): void;

    getMenuFrame(): string;
    getPauseFrame(): string;
    getMapFrame(): string;
    getShopFrame(): string;

    proceedInapp(): void;

    language(): "en" | "ru";
    setLanguage(lang: "en" | "ru"): void;

    toggleShopAvi(): void;

    requestToken(showUiIfNeeded: boolean): void;

    haveRendererScale(): boolean;

    menuUp(): void;
    menuDown(): void;
    menuActivate(): void;
    setInputPosition(position: number): void;
    showInput(): void;

    openUrl(url: string): void;
    cutout(): string;
    login(): string;
};
