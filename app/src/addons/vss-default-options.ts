import vss, { iScreenOptionId } from "./vss";

// These options are backed by localStorage instead of options.dat: the value
// in localStorage is authoritative and is fed to the game on every read, so a
// value coming from options.dat never overrides it. Each ships enabled (1) on
// first run.
const STORAGE_KEYS: Partial<Record<iScreenOptionId, string>> = {
    [iScreenOptionId.iFPS_60]: "option.fps60",
    [iScreenOptionId.iAUTO_ACCELERATION]: "option.autoAcceleration",
    [iScreenOptionId.iCAMERA_SLOPE]: "option.cameraSlope",
    [iScreenOptionId.iCAMERA_TURN]: "option.cameraTurn",
};

export function init() {
    // Last C++ state seen per option. The first value observed after (re)init
    // is the options.dat-loaded one, which we must NOT treat as a user choice;
    // only a later change of the C++ state means the user toggled the option.
    const lastState: Partial<Record<iScreenOptionId, number>> = {};

    vss.addQuantListener("option", (payload) => {
        const key = STORAGE_KEYS[payload.id];
        if (key === undefined) {
            return;
        }

        let stored = localStorage.getItem(key);
        if (stored === null) {
            stored = "1";
            localStorage.setItem(key, stored);
        }

        const seen = lastState[payload.id];
        if (seen !== undefined && payload.value !== seen) {
            // C++ state changed since the last read => the user toggled the
            // option in-game, persist the new value to localStorage.
            stored = payload.value ? "1" : "0";
            localStorage.setItem(key, stored);
        }
        lastState[payload.id] = payload.value;

        return { value: stored === "1" ? 1 : 0 };
    });
};
