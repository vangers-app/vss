import appIconUrl from "../assets/app-icon.png";
import bgUrl from "../assets/vss-bg.jpg";
import { useUiStore } from "../store";
import { cancel_download, download_mods } from "../compat";

// Starts the mods download flow and drives the progress modal via the store.
export async function startModsDownload() {
    const setDownload = useUiStore.getState().setDownload;
    setDownload({
        active: true,
        phase: "downloading",
        label: "Downloading mods",
        loaded: 0,
        total: null,
        error: undefined,
    });
    try {
        await download_mods((progress) => {
            setDownload({
                phase: progress.phase,
                label: progress.label,
                loaded: progress.loaded,
                total: progress.total,
            });
        });
        setDownload({ phase: "done", label: "Done" });
    } catch (error) {
        const message = String(error);
        if (message.includes("cancelled")) {
            setDownload({ active: false, phase: "idle" });
        } else {
            setDownload({ phase: "error", error: message });
        }
    }
}

async function onCancel() {
    await cancel_download();
    useUiStore.getState().setDownload({ active: false, phase: "idle" });
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return bytes + " B";
    }
    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(0) + " KB";
    }
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function DownloadMods() {
    const download = useUiStore((state) => state.download);
    const percent = download.total !== null && download.total > 0
        ? Math.min(100, Math.round((download.loaded / download.total) * 100))
        : null;

    return <div class="absolute inset-0 z-50 flex items-center justify-center bg-cover bg-center text-white"
        style={{ backgroundImage: `url(${bgUrl})` }}>
        <div class="absolute inset-0 bg-black/70"></div>
        <div class="relative flex flex-col items-center max-w-lg w-full mx-8 mt-16 p-8 pt-20 rounded-lg border border-yellow-700 bg-zinc-900/80 text-center">
            <img src={appIconUrl} alt="Vangers" width={128} height={128}
                class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-2xl border border-yellow-700 shadow-lg" />

            {download.phase === "error" &&
                <>
                    <h1 class="text-3xl font-bold mb-4 text-red-400">Download failed</h1>
                    <p class="mb-6 text-lg leading-relaxed break-words">{download.error}</p>
                    <div class="flex flex-row gap-4">
                        <button class="cursor-pointer px-6 py-3 rounded border border-yellow-700 bg-yellow-900/40 hover:bg-yellow-800/60 text-xl"
                            onClick={() => startModsDownload()}>Retry</button>
                        <button class="cursor-pointer px-6 py-3 rounded border border-zinc-600 bg-zinc-800/60 hover:bg-zinc-700/60 text-xl"
                            onClick={() => useUiStore.getState().setDownload({ active: false, phase: "idle" })}>Close</button>
                    </div>
                </>}

            {download.phase === "done" &&
                <>
                    <h1 class="text-3xl font-bold mb-4">Mods installed</h1>
                    <p class="mb-6 text-lg leading-relaxed">The game needs to restart to apply the mods.</p>
                    <button class="cursor-pointer px-6 py-3 rounded border border-yellow-700 bg-yellow-900/40 hover:bg-yellow-800/60 text-xl"
                        onClick={() => location.reload()}>Restart</button>
                </>}

            {(download.phase === "downloading" || download.phase === "extracting") &&
                <>
                    <h1 class="text-3xl font-bold mb-4">
                        {download.phase === "extracting" ? "Extracting mods…" : "Downloading mods…"}
                    </h1>
                    <div class="w-full h-4 mb-3 rounded bg-zinc-800 overflow-hidden border border-yellow-900">
                        <div class={"h-full bg-yellow-600 " + (percent === null ? "animate-pulse w-full" : "")}
                            style={percent === null ? {} : { width: percent + "%" }}></div>
                    </div>
                    <p class="mb-6 text-lg">
                        {download.phase === "extracting"
                            ? "Unpacking…"
                            : percent !== null
                                ? percent + "% (" + formatBytes(download.loaded) + ")"
                                : formatBytes(download.loaded)}
                    </p>
                    <button class="cursor-pointer underline text-yellow-400 hover:text-yellow-200 text-lg"
                        onClick={onCancel}>Cancel</button>
                </>}
        </div>
    </div>;
}
