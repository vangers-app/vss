import { openUrl } from "@tauri-apps/plugin-opener";
import { getCurrentWindow } from "@tauri-apps/api/window";
import appIconUrl from "../assets/app-icon.png";
import bgUrl from "../assets/vss-bg.jpg";

const STEAM_URL = "https://store.steampowered.com/app/264080/Vangers/";
const GOG_URL = "https://www.gog.com/game/vangers";
const HELP_URL = "https://t.me/vangers_mobile";

export function DataNotFound() {
    return <div class="absolute inset-0 flex items-center justify-center bg-cover bg-center text-white"
        style={{ backgroundImage: `url(${bgUrl})` }}>
        <div class="absolute inset-0 bg-black/70"></div>
        <div class="relative flex flex-col items-center max-w-lg mx-8 mt-16 p-8 pt-20 rounded-lg border border-red-700 bg-zinc-900/80 text-center">
            <img src={appIconUrl} alt="Vangers" width={128} height={128}
                class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-2xl border border-red-700 shadow-lg" />
            <h1 class="text-3xl font-bold mb-4">Game data not found</h1>
            <p class="mb-6 text-lg leading-relaxed">
                Vangers: Soup Supervisor could not locate an installed copy of the original
                game. Please install Vangers from Steam or GOG and launch this application again.
            </p>
            <div class="flex flex-row gap-4 mb-8">
                <button
                    class="cursor-pointer px-6 py-3 rounded border border-yellow-700 bg-yellow-900/40 hover:bg-yellow-800/60 text-xl"
                    onClick={() => openUrl(STEAM_URL)}>
                    Get on Steam
                </button>
                <button
                    class="cursor-pointer px-6 py-3 rounded border border-yellow-700 bg-yellow-900/40 hover:bg-yellow-800/60 text-xl"
                    onClick={() => openUrl(GOG_URL)}>
                    Get on GOG
                </button>
            </div>
            <div class="flex flex-row gap-6">
                <button
                    class="cursor-pointer underline text-yellow-400 hover:text-yellow-200 text-lg"
                    onClick={() => openUrl(HELP_URL)}>
                    Help
                </button>
                <button
                    class="cursor-pointer underline text-yellow-400 hover:text-yellow-200 text-lg"
                    onClick={() => getCurrentWindow().close()}>
                    Exit
                </button>
            </div>
        </div>
    </div>;
}
