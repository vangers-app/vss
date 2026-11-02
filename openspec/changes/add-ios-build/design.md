# Design

## Context

Мотивация — в proposal.md (Why). Что важно для подхода (проверено по коду):

- Игра — WebAssembly (emscripten, `-sASYNCIFY=1`, без pthreads/SharedArrayBuffer), 3D через wgpu-hal GLES → WebGL2 (`src/CMakeLists.txt:150-151`), данные в OPFS через `createSyncAccessHandle` в worker'е. Под iOS компилируется только Rust-оболочка Tauri; wasm тот же, что для desktop/Android.
- CI уже использует `macos-14` runner, emsdk, CMake 4, Rust toolchain; эти шаги переиспользуются.
- Мобильный UI (`app/src/mobile/*`) включается по `pointer: coarse`/UA — на iPhone сработает без правок.
- `lib.rs` уже содержит `cfg(any(android, ios))` для импортов и пустой список Steam-путей; распаковка бандла — только `cfg(android)`.
- `download_mods` (`lib.rs:416-522`) — готовый паттерн: стрим в cache, `Channel<DownloadProgress>`, `CANCEL_DOWNLOAD`, распаковка в tmp, `rename`.
- `@tauri-apps/cli` 2.11.2 в `yarn.lock`; флаг `tauri ios build --no-sign` появился в 2.11.0 (PR tauri-apps/tauri#15061) и кладёт IPA в `gen/apple/build/arm64/<productName>.ipa`.
- Tauri мержит `tauri.<platform>.conf.json` поверх `tauri.conf.json` (tauri-utils `config/parse.rs`) и подхватывает `Info.ios.plist` рядом с конфигом (tauri-utils `config.rs`, `IosConfig`).
- Custom scheme `vfile://localhost/...` в `compat.ts` — форма для macOS/iOS/Linux, iOS совпадает с desktop.

## Goals / Non-Goals

**Goals:**
- Один job в существующем workflow, без секретов, артефакт в том же формате имён.
- Минимум нового кода: переиспользовать `download_and_extract` и модалку прогресса.
- Desktop CI снова зелёный.

**Non-Goals:**
- Подпись в CI, TestFlight, App Store — отдельная работа при появлении платного аккаунта.
- Android CI и изменение способа поставки данных на Android.
- Оптимизация памяти/производительности wasm под iPhone 8 — проверяется первым запуском, правки по результату.
- Локализация экрана `DataNotFound` (сейчас только английский).

## Decisions

### D1. `gen/apple` генерируется в CI, не коммитится
`yarn tauri ios init --ci` в job'е перед сборкой. Нет Mac для локальной регенерации → закоммиченный проект дрейфовал бы от конфига (Tauri ругается на устаревший `gen/apple` при смене `identifier`). Всё, что нужно настроить в Xcode-проекте, выражается через `tauri.conf.json` (`bundle.iOS.*`) и `Info.ios.plist`. Альтернатива — коммит `gen/apple` после первого прогона (скачать как артефакт) — оставлена как запасной путь, если init в CI потребует ручных правок.

### D2. Неподписанный IPA через `tauri ios build --no-sign`
Вместо ручного `xcodebuild archive` + упаковки `Payload/` — флаг CLI делает то же (archive без codesign, вынимает `.app`, пишет IPA). Меньше скриптов в workflow, путь артефакта стабильный: `app/src-tauri/gen/apple/build/arm64/*.ipa`. `--ci` отключает интерактив. Запасной путь при проблемах — `xcodebuild` с `CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO` (описан в tauri-apps/tauri#14940).

### D3. Отдельный job `ios` на Intel-runner'е, а не запись в matrix
Runner — `macos-15-intel`: при проверке (run 40903884033, три перезапуска) GitHub ни разу не выделил macOS arm64 runner («The job was not acquired by Runner of type hosted»), падал и существующий job `macos-aarch64`. Xcode на Intel собирает arm64 iOS-приложение так же (проверено: run 40912033657, 28 мин, Mach-O arm64 в IPA). Шаги сборки отличаются (`ios init`, `ios build` вместо `tauri build --target`), артефакт собирается из другого пути. Шаги подготовки (checkout, emsdk, cmake, rust, node, wasm-сборка, `yarn install`) дублируются; это осознанная плата за читаемость matrix-job'а. `release` job добавляет `needs: [build, ios]`, `download-artifact` с `merge-multiple` подхватит IPA без изменений.

### D4. Ресурсы Android — в `tauri.android.conf.json`
`bundle.resources: ["resources/game-data.zip"]` уезжает из `tauri.conf.json` в `app/src-tauri/tauri.android.conf.json`. Для Linux/Windows/macOS/iOS `resources` становится пустым → `tauri-build` не ищет файл. Rust-код распаковки остаётся под `cfg(target_os = "android")` без изменений.

### D5. iOS-конфигурация
- `tauri.conf.json` → `bundle.iOS.minimumSystemVersion: "15.2"` (OPFS sync access handle в WKWebView с 15.2; WebGL2 с 15.0). iPhone 8 на iOS 16.x проходит.
- `app/src-tauri/Info.ios.plist`: `UISupportedInterfaceOrientations` = landscape left/right, `UIStatusBarHidden = true`, `UIViewControllerBasedStatusBarAppearance = false`, `UIRequiresFullScreen = true`.
- Иконки: `yarn tauri icon app-icon.png` генерирует `icons/ios/*` (и перезаписывает остальные из того же исходника); коммитим только `icons/ios`. Без них xcodebuild падает на отсутствующем AppIcon.

### D6. Скачивание данных — обобщить `download_and_extract`
Одна функция `download_and_extract(url, zip_path, tmp_dir, final_dir, locate_root)`:
- `download_mods`: `locate_root` ищет папку с `mods.json` (как сейчас), `final_dir = app_data/mods`, вложение `scripts/`.
- `download_game_data`: корень архива = корень данных (так пакует `scripts/pack-game-data.sh`), `final_dir = app_data/data`, tmp = `app_data/data-tmp`, архив в `cache/game-data-download.zip`.
Общие: `CANCEL_DOWNLOAD`, прогресс через `Channel<DownloadProgress>`, cleanup при ошибке/отмене. `GAME_DATA_URL` — константа рядом с `MODS_URL`; значение подставляет пользователь (решение: ссылка зашита в код, не вводится в UI). `find_install` → `get_local_data_path` уже возвращает `app_data/data`, если папка существует — правок не нужно.

Альтернатива (поле ввода URL в UI) отвергнута пользователем.

### D7. UI: переиспользовать модалку `DownloadMods`
`DownloadMods` сейчас хардкодит тексты «mods». Компонент параметризуется видом скачивания (`"mods" | "game-data"`) через `download.kind` в store; `startModsDownload` получает парный `startGameDataDownload`, оба вызывают одну функцию запуска с нужной командой и подписью. `DataNotFound` получает кнопку «Download game data» (только при `TAURI_BUILD`, что и так единственный случай показа экрана) и рендерит модалку при `download.active`. По фазе `done` — `location.reload()`, после чего `App` заново вызывает `find_install`. Кнопка Exit скрыта при `__VSS_MOBILE__ === true`.

### D8. Сетевой слой на iOS
`reqwest` с `rustls-tls` ходит raw-сокетами, не через `NSURLSession` → App Transport Security не применяется, `http://` URL (например, LAN-сервер для теста) работать должен. Если окажется иначе — добавить `NSAppTransportSecurity`/`NSAllowsArbitraryLoads` в `Info.ios.plist`.

## Risks / Trade-offs

- [`tauri ios init --ci` потребует development team] → задать `APPLE_DEVELOPMENT_TEAM` с фиктивным значением в env job'а; по отчётам сообщества для init это достаточно.
- [`-sINITIAL_MEMORY=512MB` + рост на iPhone 8 с 2 ГБ RAM, WKWebView убьёт процесс] → проверить первым запуском; при падении понизить стартовую память для сборки wasm (отдельный change, вне scope).
- [Аудио в WKWebView требует жеста пользователя] → мобильный UI уже начинает с тапа; если звука нет — проверить `AudioContext.resume` в мобильном frame.
- [7-дневная подпись бесплатного Apple ID] → документировано в README; переустановка с тем же bundle id сохраняет контейнер приложения (OPFS с данными) — проверить на устройстве.
- [Размер IPA мал, но первое скачивание данных сотни МБ по сети телефона] → прогресс и отмена обязательны (спек `game-data-download`).
- [Дублирование подготовительных шагов между `build` и `ios`] → принято ради простоты; при третьем мобильном job'е вынести в composite action.

## Migration Plan

1. Влить change: desktop CI зеленеет уже на шаге с `tauri.android.conf.json`.
2. Первый прогон iOS job'а — проверка `ios init --ci` и `--no-sign` на runner'е; при падении — запасные пути из D1/D2.
3. Подставить реальный `GAME_DATA_URL`, проверить скачивание на desktop (Linux без Steam-пути), затем на iPhone через Sideloadly.
Откат: удалить job `ios` из workflow; остальные правки безопасны для desktop/Android.

## Open Questions

- ~~Реальное значение `GAME_DATA_URL`~~ — задано 2026-10-30: `https://cdn.dos.zone/kdlab/vangers/1011/vangers.zip` (300 МБ, содержимое `data` в корне, без шифрования); полный цикл скачивание → распаковка → Restart проверен на desktop с этим URL.
