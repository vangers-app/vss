export type AppLanguage = "en" | "ru";

export const LANGUAGE_STORAGE_KEY = "mobile.language";

export function browserDefaultLanguage(): AppLanguage {
    const language = (navigator.languages?.[0] ?? navigator.language ?? "").toLowerCase();
    return language.startsWith("ru") ? "ru" : "en";
}

export function currentLanguage(): AppLanguage {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "ru") {
        return stored;
    }
    return browserDefaultLanguage();
}

export function setCurrentLanguage(language: AppLanguage) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}
