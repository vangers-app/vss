import vss, { actEventCodes, RoadRuntimeObjId } from "./vss";
import * as randomFile from "./random-file";
import type { LocalFile, ModBehavior } from "../compat";

// Runtime behaviors for downloadable mods. The declarative `behavior` object from
// mods.json (`{ type, ...params }`) is dispatched here by `type` — the app owns the
// real game-changing logic, the archive only selects and parameterizes it.
type BehaviorFactory = (behavior: ModBehavior, folders: Record<string, LocalFile[]>) => void;

const behaviors: Record<string, BehaviorFactory> = {
    // Teleport to an escave on every game quant. params: { escaveId }.
    "jump": (behavior) => {
        vss.addQuantListener("runtime_object", (payload) => {
            if (payload.runtimeObjectId === RoadRuntimeObjId.RTO_GAME_QUANT_ID) {
                vss.sendEvent(actEventCodes.EV_TELEPORT, Number(behavior.escaveId));
            }
        });
    },
    // Substitute a requested file with a random one from a pool of variants.
    // params: { folder, pattern, keepOriginalChance }.
    "random-file": (behavior, folders) => {
        randomFile.init(
            String(behavior.folder),
            folders[String(behavior.folder)] ?? [],
            String(behavior.pattern),
            Number(behavior.keepOriginalChance ?? 0),
        );
    },
};

export function runModBehavior(behavior: ModBehavior | undefined, folders: Record<string, LocalFile[]>) {
    if (behavior === undefined) {
        return;
    }
    const factory = behaviors[behavior.type];
    if (factory === undefined) {
        console.warn("== mod: unknown behavior", behavior.type);
        return;
    }
    factory(behavior, folders);
}
