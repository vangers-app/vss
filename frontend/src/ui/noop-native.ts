import { toHex } from "../encoder";
import { NativeBridge } from "./native-bridge";

const encoder = new TextEncoder();

export class NoopNativeBrige implements NativeBridge {
    ready(): void {
        setTimeout(() => {
            (window as any).onNativeEvent(toHex(encoder.encode("\"type\":\"ready\",")));
        }, 1000);
    }

    debug(): boolean {
        return true;
    }

    artifactoryUrl(): string {
        return "";
    }

    setStorageItem(key: string, value: string): void {
        // ignore
    }

    rendererWidth(): number {
        return window.innerWidth;
    }

    rendererHeight(): number {
        return window.innerHeight;
    }

    windowWidth(): number {
        return window.innerWidth;
    }

    windowHeight(): number {
        return window.innerHeight;
    }

    onMouseDown(button: 1 | 2, x: number, y: number): void {
        // ignore
    }

    onMouseMove(x: number, y: number): void {
        // ignore
    }

    onMouseUp(button: 1 | 2, x: number, y: number): void {
        // ignore
    }

    onKeyDown(keyCode: number): void {
        // ignore
    }

    onKeyUp(keyCode: number): void {
        // ignore
    }

    onJoystickUpdate(active: boolean, distance: number, angle: number) {
        // ignore
    }

    onJoystickReverseUpdate(reverse: boolean): void {
        // ignore
    }

    getMapFrame(): string {
        return "";
    }

    getMenuFrame(): string {
        return "";
    }

    getPauseFrame(): string {
        return "";
    }

    getShopFrame(): string {
        return "";
    }

    proceedInapp(): void {
    }

    language(): "en" | "ru" {
        return "ru";
    }

    setLanguage(lang: "en" | "ru"): void {
    }

    toggleShopAvi(): void {
    }

    requestToken(showUiIfNeeded: boolean): void {
    }

    haveRendererScale(): boolean {
        return true;
    }

    menuUp(): void {
    }

    menuDown(): void {
    }

    menuActivate(): void {
    }

    setInputPosition(position: number): void {
    }

    showInput(): void {
    }

    openUrl(url: string): void {
    }

    cutout(): string {
        return "";
    }

    login(): string {
        return "";
    }

}
