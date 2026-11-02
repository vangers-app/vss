# Proposal

## Why

Приложение собирается для Linux/Windows/macOS в GitHub Actions и для Android локально, но у iPhone сборки нет, а локально её сделать нельзя: нет Mac с Xcode. Нужна сборка iOS прямо в Actions с результатом, который можно скачать и поставить на iPhone 8 бесплатным Apple ID через Sideloadly/AltStore. Попутно: desktop CI сломан с коммита `76c20fb` — `bundle.resources` требует `resources/game-data.zip`, которого нет на runner'е (проверено по логу прогона 40895085436: `resource path 'resources/game-data.zip' doesn't exist`).

## What Changes

- Новый job `ios` в `.github/workflows/tauri-release.yml`: сборка на `macos-15-intel` под `aarch64-apple-ios`, неподписанный IPA через `tauri ios build --no-sign`, артефакт `Vangers-<ref>-ios-aarch64.ipa`, попадает в GitHub Release по тегу вместе с остальными.
- Xcode-проект (`gen/apple`) генерируется в CI командой `tauri ios init --ci`, в репозиторий не коммитится.
- iOS-конфигурация приложения: iOS-иконки, минимальная версия iOS, `Info.ios.plist` (только landscape, скрытый status bar, fullscreen).
- `bundle.resources` с `resources/game-data.zip` переезжает в `tauri.android.conf.json` → desktop и iOS сборки перестают требовать архив при сборке; Android продолжает бандлить данные как сейчас.
- Скачивание данных игры в приложении: новая команда `download_game_data` в Rust с URL, зашитым в код (константа рядом с `MODS_URL`), на базе существующего механизма `download_mods` (стрим с прогрессом, распаковка во временную папку, атомарное переименование в `app_data/data`).
- Экран `DataNotFound` получает кнопку «Download game data» и прогресс/ошибку/отмену; после успеха приложение перезапускается и находит данные через существующий `find_install`. Кнопка Exit скрывается на мобильных (iOS не даёт приложению закрыть себя).
- README: раздел iOS — как забрать IPA из Actions и поставить через Sideloadly.

## Capabilities

### New Capabilities
- `ios-build`: сборка неподписанного iOS IPA в CI без Apple-секретов и без данных игры; платформенные условия бандлинга данных (только Android).
- `game-data-download`: скачивание и установка данных игры из приложения, когда локальная установка не найдена.

### Modified Capabilities
<!-- Существующих спеков в проекте нет (`openspec list --specs` пуст). -->

## Impact

- `.github/workflows/tauri-release.yml` — новый job `ios`.
- `app/src-tauri/tauri.conf.json`, новый `tauri.android.conf.json`, новый `Info.ios.plist`, `icons/ios/*`.
- `app/src-tauri/src/lib.rs` — обобщение `download_and_extract`, команда `download_game_data`.
- `app/src/compat.ts`, `app/src/ui/data-not-found.tsx`, `app/src/ui/download-mods.tsx`, `app/src/main.tsx` — UI скачивания.
- `README.md` — инструкция для iOS.
- Зависимости не добавляются: `reqwest`, `zip`, `@tauri-apps/cli@2.11.2` (в lockfile, содержит `--no-sign`) уже есть.
- Побочный эффект: чинится красный desktop CI.
