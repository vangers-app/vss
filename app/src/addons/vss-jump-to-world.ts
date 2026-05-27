import ui from "./ui";
import vss, { actEventCodes, FileOpenFlags, RoadRuntimeObjId } from "./vss";

export function init() {
    return;
    const assets = vss.getScriptsFolder() + "/assets/";
    vss.addQuantListener("runtime_object", (payload) => {
        if (payload.runtimeObjectId === RoadRuntimeObjId.RTO_GAME_QUANT_ID) {
            ui.log("send teleport 8");
            vss.sendEvent(actEventCodes.EV_TELEPORT, 8);
        }
    });

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
}
