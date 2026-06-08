import { read_file } from "./compat";

type EmscriptenFS = {
    mkdirTree(path: string): void;
    writeFile(path: string, data: Uint8Array): void;
};

let fs: EmscriptenFS | null = null;
let cache = new Map<string, Promise<{ file: string }>>();

export function setFs(next: EmscriptenFS) {
    fs = next;
    cache = new Map();
}

export function resetDiskCache() {
    cache = new Map();
}

// Loads a real on-disk file (via the `vfile://` scheme) into the emscripten FS at
// `fsPath`, caching by `fsPath`, and returns the FS path to hand back to the engine.
// Used both by the lazy file_open loader and by mods that pick files at runtime.
export function loadDiskFile(fsPath: string, abs: string): Promise<{ file: string }> {
    const cached = cache.get(fsPath);
    if (cached !== undefined) {
        return cached;
    }
    const promise = read_file(abs).then((bytes) => {
        const dir = fsPath.substring(0, fsPath.lastIndexOf("/"));
        if (dir.length > 0) {
            fs!.mkdirTree(dir);
        }
        fs!.writeFile(fsPath, new Uint8Array(bytes));
        return { file: fsPath };
    }).catch((err) => {
        cache.delete(fsPath);
        console.error("== loadDiskFile failed:", abs, err);
        return { file: "" };
    });
    cache.set(fsPath, promise);
    return promise;
}
