# Design

## Context

Мотивация — в proposal.md (Why). Что определяет подход (проверено по коду и окружению):

- `download_game_data` в `app/src-tauri/src/lib.rs` не ограничена платформой; кнопка «Download game data» и модалка прогресса/ошибки (`app/src/ui/download-mods.tsx`) уже показываются на всех платформах, Exit скрыт при `__VSS_MOBILE__`. Единственное android-специфичное — ветка в `get_local_data_path` (`lib.rs:164-176`), распаковывающая `resources/game-data.zip` из бандла, и `tauri.android.conf.json` с `bundle.resources`.
- `extract_zip_file` используется и в `download_archive` (`lib.rs:384`) — остаётся. Импорты `tauri_plugin_fs::{FsExt, OpenOptions}` и `BaseDirectory` под `cfg(any(android, ios))` нужны только android-ветке. Регистрация `tauri_plugin_fs::init()` остаётся: плагин может использовать frontend.
- Workflow `.github/workflows/tauri-release.yml`: job'ы `build` (matrix), `ios`, `release`; шаги подготовки (emsdk 5.0.2, CMake 4, Rust, Node 20, wasm-сборка) уже дублируются между `build` и `ios`.
- `app/src-tauri/gen/android` закоммичен (40 файлов): `build.gradle.kts` без `signingConfigs`, `key.properties`/`keystore.properties` в `.gitignore`, Gradle 8.14.3, `compileSdk = 36`, `minSdk = 24`. `tauri android init` в CI не нужен.
- `@tauri-apps/cli` 2.11.2: `tauri android build` принимает `--aab`, `--apk`, `--target`, `--config`, `--ci`; `bundle.android.versionCode` есть в `config.schema.json`. Без него versionCode = `0*1000000 + 1*1000 + 0 = 1000` из `version: 0.1.0`.
- Google Play для `com.caiiiycuk.github.vangers.gp`: последний загруженный versionCode 1027 (`vangers-android/app/build.gradle`), upload key — `vangers-android/etc/vandroid.keystore` (JKS, alias `vandroid`, SHA-256 `3A:57:B5:12:…:28:54`). Play App Signing переподписывает AAB своим ключом, но проверяет сертификат upload key → новый ключ не примет.
- CDN-файл: `https://cdn.dos.zone/kdlab/vss/v1/game-data-v1.zip`, HTTP 200, 171 049 448 байт, etag = md5 локального `etc/game-data-v1.zip`, содержимое папки `data` в корне — формат, который ждёт `download_game_data`.

## Goals / Non-Goals

**Goals:**
- Один механизм поставки данных на всех платформах; URL меняется в GitHub без коммита.
- Android job в том же workflow и с теми же соглашениями об именах артефактов, что `build` и `ios`.
- Воспроизводимая подпись upload key, чтобы APK обновлялись поверх друг друга и AAB принимался Play.

**Non-Goals:**
- Автоматическая загрузка AAB в Play Console (service account, `upload-google-play`) — отдельный change.
- RuStore-сборка (в старом проекте был отдельный flavor).
- Сборка под `armv7`/`x86_64`: Play требует 64-bit, целевые устройства arm64; 32-битные не поддерживаются wasm с `INITIAL_MEMORY=512MB` по памяти.
- Вынос общих шагов workflow в composite action (третий мобильный job — повод, но не в этом change).
- Изменение `version` в `tauri.conf.json` (`versionName` остаётся `0.1.0`).

## Decisions

### D1. `GAME_DATA_URL` фиксируется во frontend-бандле (Vite), не в Rust
`vite.config.ts` добавляет `GAME_DATA_URL` в `envPrefix` → `import.meta.env.GAME_DATA_URL` подставляется при `yarn build`; `compat.ts` передаёт его аргументом `url` в `download_game_data`, которая при пустой строке возвращает `Err("GAME_DATA_URL is not set at build time")` — модалка уже показывает текст ошибки с Retry/Close. Первый вариант — `option_env!("GAME_DATA_URL")` в `lib.rs` — отвергнут по результату прогона 42176076849: на Linux и Android URL попал в бинарь, а в IPA — нет, потому что `tauri ios build` запускает cargo из script-фазы Xcode без окружения job'а. `yarn build` (`beforeBuildCommand`) выполняется самим Tauri CLI в шелле job'а на всех платформах, поэтому Vite-переменная доходит везде; локально работает `GAME_DATA_URL=... yarn tauri dev` (Vite dev-сервер тоже наследует окружение). `env!` отвергнут: ломал бы локальную сборку и pull request из форка. Константа с дефолтом отвергнута: URL должен меняться без коммита.

### D2. Переменная репозитория, не секрет, на уровне workflow
`env: GAME_DATA_URL: ${{ vars.GAME_DATA_URL }}` в корне workflow → достаётся `build`, `ios`, `android` без дублирования. URL не секретный (извлекается из бинаря), а секрет маскировал бы его в логах при отладке скачивания. Pull request из форка не получает `vars` → сборка без URL, что допускает D1.

### D3. Структура job `android`
`ubuntu-22.04`, по образцу `ios`:
1. checkout с submodules, `actions/setup-java@v4` (temurin 17 — Gradle 8.14 и AGP требуют JDK 17+), `android-actions/setup-android@v3` с `packages: "platforms;android-36 build-tools;36.0.0 ndk;27.2.12479018 platform-tools"`, `NDK_HOME=$ANDROID_HOME/ndk/27.2.12479018` в env job'а (Tauri/cargo-mobile2 ищет `NDK_HOME`).
2. Ninja, emsdk 5.0.2, CMake 4, Rust с `aarch64-linux-android,wasm32-unknown-emscripten`, `rust-cache` с key `android-aarch64`, Node 20, wasm-сборка (копия шага из `ios`), `yarn install --frozen-lockfile`.
3. Подпись (D4), затем `yarn tauri android build --aab --apk --target aarch64 --ci --config '{"bundle":{"android":{"versionCode":<N>}}}'` (D5).
4. Сбор: `gen/android/app/build/outputs/bundle/universalRelease/*.aab` и `.../apk/universal/release/*.apk` → `dist-artifacts/Vangers-<ref>-android-aarch64.{aab,apk}`; `upload-artifact` с именем `Vangers-android-aarch64`; `release.needs: [build, ios, android]`.
Linux system deps для WebKitGTK не нужны: `tauri android build` не собирает desktop-бинарь. Альтернатива — строка в matrix `build` — отвергнута по той же причине, что для iOS (другие команды сборки и пути артефактов).

### D4. Подпись через `key.properties`, условная
`build.gradle.kts` получает стандартный для Tauri блок: читает `rootProject.file("key.properties")`, если файл есть — `signingConfigs.create("release")` с `storeFile`, `storePassword`, `keyAlias`, `keyPassword` и `buildTypes.release.signingConfig`; если файла нет — release остаётся неподписанным (сборка проходит, спек «Сборка без секретов подписи не падает»). Шаг workflow с `if: secrets.ANDROID_KEYSTORE_BASE64 != ''` (через `env` + bash-проверка, т.к. `secrets` в `if` недоступны напрямую) декодирует keystore в `$RUNNER_TEMP/vandroid.keystore` и пишет `gen/android/key.properties` с абсолютным путём; иначе печатает предупреждение. `key.properties` уже в `.gitignore`, keystore вне дерева репозитория. Отдельные `storePassword`/`keyPassword` вместо одного `password` из доков Tauri — у keystore `vandroid` они могут различаться. Альтернатива — `apksigner` поверх неподписанного APK — не покрывает AAB (нужен `jarsigner`) и дублирует логику; отвергнута.

### D5. `versionCode = 1100 + github.run_number`
Выше 1027 с запасом, монотонно внутри workflow-файла, без ручного бампа. Подставляется через `--config` в CI; локальные сборки получают автоматический 1000 — для устройства это не важно (APK из CI поверх локального потребует переустановки, это принято). Счётчик `run_number` привязан к пути `tauri-release.yml`: при переименовании файла он обнуляется, но смещение 1100 всё равно выше последнего Play-кода; если к тому моменту в Play будут коды > 1100, смещение поднять. Альтернатива — бамп `version` перед каждой заливкой — отвергнута как ручная и конфликтующая с desktop-версией.

### D6. Android переходит на общий путь скачивания
Удаляются `tauri.android.conf.json` целиком (в нём только `bundle.resources`), android-ветка в `get_local_data_path`, ненужные cfg-импорты, строка `app/src-tauri/resources/game-data.zip` в `.gitignore`. Rust- и TS-код скачивания не меняется. Уже распакованные старой сборкой данные лежат в `app_data/data` → `get_local_data_path` находит их без изменений (сценарий «после обновления со старой сборки»). `INTERNET` permission в манифесте уже есть.

### D7. Один прогон — и AAB, и APK
`--aab --apk` в одной команде: один Rust/Gradle-билд, два выхода. APK нужен для установки на устройство без Play (тест, sideload), AAB — для консоли. Оба подписаны одним upload key, поэтому APK из CI обновляется поверх APK из CI.

## Risks / Trade-offs

- [Версия NDK/SDK в `setup-android` не совместима с cargo-mobile2 или AGP из `gen/android`] → первый прогон; при падении взять NDK, который ставит локальная среда пользователя (`sdkmanager --list_installed`), и зафиксировать её в workflow.
- [Имена выходных файлов Gradle отличаются от `app-universal-release.*`] → шаг сбора использует glob по каталогу `outputs/bundle/**/*.aab` и `outputs/apk/**/*.apk` и падает с `::error`, если пусто; уточнить после первого прогона.
- [`option_env!` и `rust-cache`: старое значение URL из кэша] → проверка на первом прогоне после смены переменной (`strings` по `.so` в APK); при проблеме добавить `GAME_DATA_URL` в `key` rust-cache.
- [Пароли keystore утеряны] → без них подпись невозможна; проверить `keytool -list -storepass` локально до создания секретов.
- [Play отвергнет первый AAB: `targetSdk`/политики, отсутствие 64-bit для других ABI] → `targetSdk = 36`, arm64 есть; консоль покажет конкретную причину, правка — отдельно.
- [Пользователь старой Android-сборки без данных (не запускал её)] → увидит экран скачивания, как новый пользователь; приемлемо.
- [Дублирование шагов подготовки в третьем job'е] → принято; composite action — вне scope.

## Migration Plan

1. Пользователь: `gh variable set GAME_DATA_URL -R vangers-app/vss --body "<url>"`, четыре секрета keystore из `vangers-android/etc/vandroid.keystore`.
2. Влить change; первый прогон `workflow_dispatch`: проверить подпись (`apksigner verify --print-certs`), versionCode (`aapt dump badging` или `bundletool dump manifest`), URL в бинаре.
3. Загрузить AAB во внутренний трек Play Console вручную; поставить APK на устройство, пройти скачивание данных.
Откат: вернуть `tauri.android.conf.json` и android-ветку в `lib.rs`, удалить job — desktop/iOS не затронуты; переменная и секреты безвредны.

## Open Questions

- Точные пути `.aab`/`.apk` в `gen/android/app/build/outputs/` для `--target aarch64` (universal или per-ABI) — уточняются первым прогоном, на спеки и задачи не влияют (glob).
