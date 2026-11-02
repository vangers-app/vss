import { invoke } from "@tauri-apps/api/core";
import { TAURI_BUILD } from "../compat";
import vss from "./vss";

export function init() {
    vss.addQuantListener("screen_exit", (payload) => {
        if (payload.screenId !== "Main Screen") {
            return;
        }

        if (TAURI_BUILD) {
            invoke("exit_app").catch((err) => {
                console.error("Failed to exit application", err);
            });
            return;
        }

        window.close();
    });
}
