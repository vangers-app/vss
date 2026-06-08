import { useEffect, useState } from "preact/hooks";
import appIconUrl from "../assets/app-icon.png";
import inventoryBgUrl from "../assets/inventory-bg.jpg";
import { t } from "./i18n";
import {
    type InventoryItem,
    reconcileMods,
    writeInventoryItems,
} from "./storage";
import { getModAddons } from "../mods";
import { read_file, vfileUrl } from "../compat";
import { startModsDownload } from "../ui/download-mods";

export function InventoryFrame(props: { closeActiveUi: () => void }) {
    const [items, setItems] = useState<InventoryItem[]>(reconcileMods(getModAddons()));
    const [activeId, setActiveId] = useState<string>("");
    const [readme, setReadme] = useState<string>("");
    const active = items.find((item) => item.id === activeId) ?? null;

    useEffect(() => {
        if (active?.readme === undefined) {
            setReadme("");
            return;
        }
        let cancelled = false;
        read_file(active.readme)
            .then((bytes) => !cancelled && setReadme(new TextDecoder().decode(bytes)))
            .catch(() => !cancelled && setReadme(""));
        return () => {
            cancelled = true;
        };
    }, [active?.readme]);

    function toggleActive() {
        if (active === null) {
            return;
        }
        const enabled = !active.enabled;
        // Mods within a `group` are mutually exclusive: enabling one disables the rest.
        const nextItems = items.map((item) => {
            if (item.id === active.id) {
                return { ...item, enabled };
            }
            if (enabled && active.group !== undefined && item.group === active.group) {
                return { ...item, enabled: false };
            }
            return item;
        });
        writeInventoryItems(nextItems);
        setItems(nextItems);
    }

    function closeInventory() {
        props.closeActiveUi();
        location.reload();
    }

    const background = active?.background !== undefined ? vfileUrl(active.background) : inventoryBgUrl;
    return <div class="inventory-frame h-full flex flex-row" style={{ backgroundImage: `url(${background})` }}>
        <button class="inventory-close absolute right-8 top-4 cursor-pointer"
            onClick={closeInventory} aria-label="Close inventory">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
        <aside class="inventory-list flex flex-col flex-shrink-0 overflow-auto smooth">
            {items.map((item) =>
                <button
                    class={"inventory-card cursor-pointer w-52 my-4 mx-8 overflow-hidden relative border " +
                        "border-slate-800 flex-shrink-0 rounded" +
                        (item.id === activeId ? " outline-double outline-green-400" : "")}
                    onClick={() => setActiveId(item.id)}>
                    <span class="relative block w-full h-32 bg-no-repeat bg-center bg-cover bg-slate-800"
                        style={{ backgroundImage: `url(${item.image !== undefined ? vfileUrl(item.image) : appIconUrl})` }}>
                        <span class={(item.enabled ? "bg-green-200 " : "bg-red-200 ") +
                            "absolute opacity-90 flex flex-row mt-4 px-4 pt-1 text-lg font-bold items-center rounded-r-sm"}>
                            <span class={(item.enabled ? "bg-green-500 " : "bg-red-500 ") +
                                "rounded-full w-2 h-2 mr-2 mb-1"}></span>
                            <span class="overflow-ellipsis whitespace-nowrap">{item.name}</span>
                        </span>
                    </span>
                </button>)}
        </aside>
        <section class="inventory-details flex flex-col flex-grow ml-4 mr-8 overflow-auto">
            <div class="self-end flex flex-row my-4 mr-16">
                <div class="cursor-pointer underline text-yellow-800 text-shadow-sm" onClick={() => startModsDownload()}>
                    {t("refresh")}
                </div>
            </div>
            {active === null &&
                <div class="flex flex-col">
                    <p class="text-2xl">{t("tap_item")}</p>
                </div>}
            {active !== null &&
                <>
                    <div class="flex flex-row items-center">
                        <p class={(active.enabled ? "bg-green-500 " : "bg-red-500 ") +
                            "rounded-full w-2 h-2 mr-2 mb-1"}></p>
                        <p class="text-2xl font-bold">{active.name}</p>
                    </div>
                    {active.description !== undefined &&
                        <p class="mt-2 ml-4 text-lg text-shadow-sm">{active.description}</p>}
                    {active.enabled !== true &&
                        <div onClick={toggleActive}
                            class="cursor-pointer mt-2 ml-4 text-5xl text-green-800 underline text-shadow">
                            {t("enable")}
                        </div>}
                    {active.enabled === true &&
                        <div onClick={toggleActive}
                            class="cursor-pointer mt-2 ml-4 text-5xl text-red-800 underline text-shadow">
                            {t("disable")}
                        </div>}
                    {readme.length > 0 &&
                        <textarea readOnly value={readme}
                            class="mt-4 ml-4 mr-4 flex-grow min-h-48 p-2 bg-black/80 text-slate-50
                                border border-black/70 text-sm font-mono whitespace-pre rounded resize-none" />}
                </>}
        </section>
    </div>;
}
