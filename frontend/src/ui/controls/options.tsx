import { Bridge } from "../bridge";
import { MapControlsKind } from "../map-frame";

let bridge: Bridge;
const defaultZoom = 1.0;

export function init(aBridge: Bridge) {
    bridge = aBridge;
    bridge.native.setStorageItem("ui.camera.follow", isCameraFollowEnabled() + "");
    bridge.native.setStorageItem("ui.road.zoom", getRoadZoom() + "");
}

export function isMirroredEnabled() {
    return localStorage.getItem("ui.mirrored") !== "false";
}

export function setMirrored(enabled: boolean) {
    localStorage.setItem("ui.mirrored", enabled ? "true" : "false");
}

export function isCameraFollowEnabled() {
    return localStorage.getItem("ui.camera.follow") !== "false";
}

export function setCameraFollow(enabled: boolean) {
    localStorage.setItem("ui.camera.follow", enabled ? "true" : "false");
    bridge.native.setStorageItem("ui.camera.follow", enabled ? "true" : "false");
}

export function getControlsKind(): MapControlsKind | null {
    return localStorage.getItem("ui.controls.kind") as MapControlsKind | null;
}

export function setControlsKind(kind: MapControlsKind) {
    localStorage.setItem("ui.controls.kind", kind);
}

export function getRoadZoom(): number {
    const zoomString = localStorage.getItem("ui.road.zoom");
    if (zoomString === null) {
        return defaultZoom;
    }

    try {
        return Number.parseFloat(zoomString);
    } catch (e) {
        return defaultZoom;
    }
}

export function setRoadZoom(zoom: number) {
    localStorage.setItem("ui.road.zoom", zoom + "");
    bridge.native.setStorageItem("ui.road.zoom", zoom + "");
}
