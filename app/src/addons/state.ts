export type UIType = "default" | "main-menu" |
    "way83+" | "way83-inventory" | "way83-text" |
    "menu" | "pause" | "shop";

const global = new Function("return this;")();

interface GlobalState {
    storage: { [key: string]: string },
    uiType: UIType,
};

export function state(): GlobalState {
    if (global.globalState === undefined) {
        const globalState: GlobalState = {
            storage: {},
            uiType: "default",
        };
        global.globalState = globalState;
    }

    return global.globalState;
}
