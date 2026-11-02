# Tasks

## 1. Конфигурация сборки: ресурсы и iOS

- [x] 1.1 Перенести `bundle.resources` из `app/src-tauri/tauri.conf.json` в новый `app/src-tauri/tauri.android.conf.json`; проверить: `cd app && yarn install --frozen-lockfile && cargo build --manifest-path src-tauri/Cargo.toml` на Linux без `resources/game-data.zip` проходит (раньше падало с `resource path ... doesn't exist`).
- [x] 1.2 Добавить `bundle.iOS.minimumSystemVersion: "15.2"` в `tauri.conf.json`; проверить: `yarn tauri build --help` не ругается на конфиг, `cargo build` из 1.1 проходит.
- [x] 1.3 Создать `app/src-tauri/Info.ios.plist` (landscape left/right, `UIStatusBarHidden`, `UIViewControllerBasedStatusBarAppearance=false`, `UIRequiresFullScreen`); проверить: `plutil -lint` на macOS runner'е или `python3 -I -c "import plistlib,sys; plistlib.load(open(sys.argv[1],'rb'))" app/src-tauri/Info.ios.plist` локально.
- [x] 1.4 (иконки `icons/ios/*` уже были закоммичены, генерация не потребовалась) Сгенерировать iOS-иконки `cd app && yarn tauri icon src-tauri/app-icon.png`, закоммитить только `src-tauri/icons/ios/`, остальные сгенерированные файлы откатить `git checkout`; проверить: `git status` показывает только `icons/ios/*`, в папке есть `AppIcon-512@2x.png`.

## 2. Rust: скачивание данных игры

- [x] 2.1 Обобщить `download_and_extract` в `app/src-tauri/src/lib.rs` до `(url, zip_path, tmp_dir, final_dir, locate_root)` и перевести `download_mods` на неё без изменения поведения; проверить: `cargo build` проходит, `download_mods` на desktop ставит моды в `app_data/mods/scripts` как раньше.
- [x] 2.2 Добавить константу `GAME_DATA_URL` рядом с `MODS_URL` (значение — плейсхолдер, подставляет пользователь) и команду `download_game_data(app, on_progress)`: архив в `cache/game-data-download.zip`, распаковка в `app_data/data-tmp`, `rename` в `app_data/data`, cleanup при ошибке/отмене; зарегистрировать в `generate_handler!`; проверить: `cargo build`, на Linux с переименованным Steam-путём скачивание создаёт `app_data/data`, после чего `find_install` возвращает файлы.
- [x] 2.3 Проверить отмену и ошибку: во время скачивания вызвать `cancel_download` → `data-tmp` и zip удалены, `app_data/data` не создана; при недоступном URL команда возвращает `Err` с текстом ошибки.

## 3. Frontend: экран скачивания

- [x] 3.1 Добавить `download_game_data` в `app/src/compat.ts` по образцу `download_mods` и `kind: "mods" | "game-data"` в `DownloadState` (`app/src/store.ts`); проверить: `cd app && yarn build` (tsc) проходит.
- [x] 3.2 Параметризовать `app/src/ui/download-mods.tsx` по `download.kind` (заголовки, подписи, функция retry) и добавить `startGameDataDownload`; по фазе `done` для `game-data` кнопка Restart делает `location.reload()`; проверить: `yarn build` проходит, модалка модов выглядит и ведёт себя как раньше.
- [x] 3.3 В `app/src/ui/data-not-found.tsx` добавить кнопку «Download game data», рендер модалки при `download.active`, скрыть Exit при `window.__VSS_MOBILE__ === true`; проверить: на Linux без Steam-пути нажатие кнопки показывает прогресс, после Restart игра стартует; при эмуляции мобильного (`pointer: coarse` в devtools) кнопки Exit нет.
- [x] 3.4 Проверить повторный запуск: после установки данных перезапуск приложения стартует игру сразу, без экрана «Game data not found» и без сетевых запросов к `GAME_DATA_URL`.

## 4. GitHub Actions: job `ios`

- [x] 4.1 Добавить job `ios` в `.github/workflows/tauri-release.yml` на `macos-15-intel` (arm64-runner'ы `macos-14` трижды не выделялись, см. design D3): checkout с submodules, Ninja, emsdk 5.0.2, CMake 4, Rust с `aarch64-apple-ios`, rust-cache (key `ios-aarch64`), Node 20, сборка wasm (копия шага из `build`), `yarn install --frozen-lockfile`, `yarn tauri ios init --ci` (env `APPLE_DEVELOPMENT_TEAM` с фиктивным значением), `yarn tauri ios build --ci --no-sign`; проверить: `actionlint` или просмотр в GitHub без ошибок синтаксиса.
- [x] 4.2 Сбор артефакта: найти `app/src-tauri/gen/apple/build/arm64/*.ipa`, скопировать в `dist-artifacts/Vangers-<ref>-ios-aarch64.ipa`, `upload-artifact` с именем `Vangers-ios-aarch64`; `release` job — `needs: [build, ios]`; проверить: `workflow_dispatch` прогон на ветке зелёный, артефакт скачивается, `unzip -l` показывает `Payload/*.app/Info.plist`.
- [x] 4.3 Проверить содержимое `Info.plist` в артефакте: `UISupportedInterfaceOrientations` только landscape, `UIStatusBarHidden` true, `MinimumOSVersion` 15.2, иконка AppIcon присутствует (`unzip -l | grep AppIcon`).

## 5. Документация и проверка на устройстве

- [x] 5.1 README: раздел «iOS» в «Mobile APP» — где взять IPA (артефакт прогона / Release), установка через Sideloadly или AltStore бесплатным Apple ID, 7-дневный срок, первый запуск скачивает данные; проверить: ссылки в разделе открываются.
- [ ] 5.2 Интеграционная проверка на iPhone 8: подписать IPA через Sideloadly, запустить, скачать данные, дойти до игрового экрана; зафиксировать в комментарии к PR результат по памяти (приложение не убито WKWebView) и звуку; при провале — завести отдельные issue, не расширяя этот change.
