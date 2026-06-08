import { t } from "./i18n";

export function Credits(props: {
    closeActiveUi: () => void,
}) {
    function proceed() {
        props.closeActiveUi();
    }

    return <div class="credits w-full h-full flex flex-col items-center bg-green-700">
        <div class="text-4xl text-red-600 text-shadow my-4">
            {t("header")}
        </div>
        <div class="my-2 ml-20 self-start text-shadow text-2xl text-yellow-400">
            <a class="underline" href="https://github.com/caiiiycuk/" target="_blank">{t("dev")}</a>
        </div>
        <div class="my-2 ml-20 self-start text-shadow text-2xl text-yellow-400">
            <a class="underline" href="https://t.me/vangers_mobile" target="_blank">{t("telegram")}</a>
        </div>
        <div class="my-2 ml-20 self-start text-shadow text-2xl text-yellow-400">
            <a class="underline" href="https://github.com/vangers-app" target="_blank">{t("github")}</a>
        </div>
        <div class="my-2 ml-20 self-start text-shadow text-2xl text-yellow-400">
            <a class="underline"
                href="https://play.google.com/store/apps/details?id=com.caiiiycuk.github.vangers" target="_blank">
                {t("gp")}
            </a>
        </div>
        <div class="flex-grow"></div>
        <div onClick={proceed} class="text-5xl text-yellow-400 text-shadow mt-4 mb-8 animate-pulse">
            {t("next")}
        </div>
    </div>;
}
