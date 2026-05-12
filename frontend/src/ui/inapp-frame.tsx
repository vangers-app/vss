import { useEffect, useRef, useState } from "preact/hooks";

export function InappFrame(props: { closeActiveUi: () => void }) {
    const nativeBridge = (window as any).bridge;
    const artifactoryUrl = nativeBridge ? nativeBridge.artifactoryUrl() : 
        "https://vangers.dos.zone/inventory/index.html";
    const ref = useRef<HTMLIFrameElement>(null);
    const [live, setLive] = useState<boolean | null>(null);

    useEffect(() => {
        if (ref === null) {
            return;
        }

        const listener = (e: any) => {
            if (e.data.action === "close") {
                props.closeActiveUi();
            }
        };
        window.addEventListener("message", listener);

        return () => {
            window.removeEventListener("message", listener);
        };
    }, [ref, ref.current, props.closeActiveUi]);

    useEffect(() => {
        if (live === null) {
            fetch(artifactoryUrl, {
                cache: "no-cache",
            })
                .then(() => setLive(true))
                .catch(() => setLive(false));
        }
    }, [live]);

    const closeEl =
        <div class="absolute right-16 top-16 bg-white rounded-full p-4 opacity-80 cursor-pointer"
            onClick={() => props.closeActiveUi()}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </div>;


    if (live === null) {
        return <div class="w-full h-full flex flex-row items-center justify-center bg-beeb">
            <div class="text-6xl animate-pulse">...</div>
            {closeEl}
        </div>;
    }

    if (!live) {
        return <div class="w-full h-full flex flex-col items-center justify-center bg-beeb">
            <div class="text-6xl text-red-800 uppercase">Not connected</div>
            <div class="text-6xl text-blue-800 uppercase underline cursor-pointer mt-8"
                onClick={() => setLive(null)}>Retry</div>
            {closeEl}
        </div>;
    }

    return <div class="w-full h-full" style={{ background: "#b7c48f" }}>
        <iframe class="w-full h-full" src={artifactoryUrl}></iframe>
    </div>;
}
