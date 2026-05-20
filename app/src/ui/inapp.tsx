import { useContext, useState } from "preact/hooks";
import { BridgeContext } from "./bridge";

import inappImageUrl from "../assets/inapp.jpg";
import { t } from "./i18n";


export function Inapp(props: {
    closeActiveUi: () => void,
}) {
    const bridge = useContext(BridgeContext);
    const [busy, setBusy] = useState<boolean>(false);

    function decline() {
        props.closeActiveUi();
    }

    function proceed() {
        setBusy(true);
        bridge.proceedInapp(() => {
            props.closeActiveUi();
        });
    }

    return <div class="w-full h-full bg-gray-800 opacity-90 flex flex-col">
        <div class="flex-grow flex flex-col p-8">
            <div class="flex-grow" style={{
                backgroundImage: "url(" + inappImageUrl + ")",
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }} />
        </div>
        <div class="flex flex-row justify-center items-center p-4 pb-12">
            {busy && <div class="text-white text-2xl animate-pulse">
                {t("processing")}
            </div>}
            {!busy && <div onClick={decline}
                class="mx-8 px-24 py-4 text-xl bg-gray-300 hover:bg-gray-100 rounded-md">
                {t("no")}
            </div>}
            {!busy && <div onClick={proceed}
                class="mx-8 px-24 py-4 text-xl bg-green-600 hover:bg-green-400 rounded-md animate-pulse">
                {t("yes")}
            </div>}
        </div>
    </div>;
}
