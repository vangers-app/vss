import { useContext, useEffect, useState } from "preact/hooks";
import { BridgeContext } from "./bridge";

const multikUrl = "https://vangers.dos.zone/multik/";

export function CalendarFrame(props: { closeActiveUi: () => void }) {
    const bridge = useContext(BridgeContext);
    const [live, setLive] = useState<boolean | null>(null);

    useEffect(() => {
        if (live === null) {
            fetch(multikUrl, {
                cache: "no-cache",
            })
                .then((r) => setLive(true))
                .catch(() => setLive(false));
        }
    }, [live]);

    const closeEl =
        <div class="absolute right-16 top-8 bg-slate-200 rounded-full p-4 opacity-80 cursor-pointer"
            onClick={() => props.closeActiveUi()}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </div>;


    if (live === null) {
        return <div class="w-full h-full flex flex-row items-center justify-center bg-white">
            <div class="text-6xl animate-pulse">...</div>
            {closeEl}
        </div>;
    }

    if (!live) {
        return <div class="w-full h-full flex flex-col items-center justify-center bg-white">
            <div class="text-6xl text-red-800 uppercase">Not connected</div>
            <div class="text-6xl text-blue-800 uppercase underline cursor-pointer mt-8"
                onClick={() => setLive(null)}>Retry</div>
            {closeEl}
        </div>;
    }

    const login = bridge.native.login();
    return <div class="w-full h-full bg-white">
        <iframe class="w-full h-full" src={multikUrl + (login.length > 0 ? "?login=" + login : "")}></iframe>
        {closeEl}
    </div>;
}
