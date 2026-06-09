import { getCurrentWindow } from "@tauri-apps/api/window";
import { TAURI_BUILD } from "../compat";
import vss from "./vss";

export function init() {
    vss.addQuantListener("screen_exit", (payload) => {
        if (payload.screenId !== "Main Screen") {
            return;
        }

        if (TAURI_BUILD) {
            getCurrentWindow().close().catch((err) => {
                console.error("Failed to close application window", err);
            });
            return;
        }

        window.close();
    });
}
