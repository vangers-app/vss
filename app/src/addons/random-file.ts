import vss, { FileOpenFlags } from "./vss";
import { loadDiskFile } from "../fs-loader";
import type { LocalFile } from "../compat";

// Random file substitution. For each requested file matching `pattern`, picks a
// random variant from a pool of mod files (or keeps the original with probability
// `keepOriginalChance`) and loads the chosen file into the FS on demand. The pool is
// grouped by the first two chars of each file's relative path, so the `pattern`
// capture group selects the matching variant set (e.g. `track(.*)\.ogg`).
export function init(folder: string, files: LocalFile[], pattern: string, keepOriginalChance: number) {
    const re = new RegExp(pattern);
    const pool: Record<string, LocalFile[]> = {};
    for (const next of files) {
        (pool[next.rel.substring(0, 2)] ??= []).push(next);
    }

    vss.addQuantListener("file_open", (payload) => {
        const { file, flags } = payload;
        if ((flags & FileOpenFlags.XS_IN) === 0) {
            return;
        }

        const match = re.exec(file);
        if (match === null) {
            return;
        }
        const list = pool[match[1]];
        if (list === undefined || list.length === 0) {
            return;
        }

        if (Math.random() < keepOriginalChance) {
            return;
        }
        const chosen = list[Math.floor(Math.random() * list.length)];
        return loadDiskFile("/__mods/" + folder + "/" + chosen.rel, chosen.abs);
    });
}
