import ui from "./ui";
import vss, { FileOpenFlags } from "./vss";

export function init() {
    const mods = ["vfv", "vnm", "tankers"];

    for (const next of mods) {
        if (ui.enabled(next)) {
            const assets = vss.getScriptsFolder() + "/../mods/" + next + "/";

            vss.addQuantListener("file_open", (payload) => {
                const { file, flags } = payload;
                if ((flags & FileOpenFlags.XS_IN) === 0) {
                    return;
                }

                if (vss.isFileExists(assets + file)) {
                    return {
                        file: assets + file,
                    };
                }
            });

            return;
        }
    }
}
