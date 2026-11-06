# Proposal

## Why

Android-сборка существует только локально и тащит 163 МБ данных игры внутри APK, а iOS-сборка качает данные с URL, зашитого в `lib.rs`, который сейчас отвечает 404. Нужен единый способ поставки данных для всех платформ (скачивание с CDN при первом запуске, URL задаётся на уровне GitHub, не в коде) и сборка Android в GitHub Actions в виде AAB для Google Play, подписанного существующим upload key.

## What Changes

- `GAME_DATA_URL` перестаёт быть константой в коде: берётся при сборке из переменной окружения (`option_env!`), которую workflow получает из GitHub Variable `GAME_DATA_URL`. Без переменной сборка проходит, но скачивание возвращает ошибку «GAME_DATA_URL is not set».
- **BREAKING** для Android-сборки: данные игры больше не бандлятся в APK. `tauri.android.conf.json` (`bundle.resources`) удаляется, android-ветка распаковки из ресурсов в `get_local_data_path` удаляется; Android показывает тот же экран «Game data not found» с кнопкой «Download game data», что desktop и iOS.
- Новый job `android` в `.github/workflows/tauri-release.yml`: Ubuntu runner, Android SDK/NDK, `aarch64-linux-android`, `tauri android build --aab --apk --target aarch64`. Артефакты `Vangers-<ref>-android-aarch64.aab` (для Google Play) и `.apk` (для sideload); по тегу попадают в GitHub Release. `release` job → `needs: [build, ios, android]`.
- Подпись Android существующим keystore `vandroid` (upload key приложения `com.caiiiycuk.github.vangers.gp` в Play Console) из секретов `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`; в `gen/android/app/build.gradle.kts` добавляется `signingConfigs` по `key.properties`.
- `versionCode` для Android задаётся в CI как `1100 + github.run_number` через `--config` (последний загруженный в Play — 1027; автоматический из `version: 0.1.0` был бы 1000 и отвергнут).
- README: раздел Android переписывается (CI-артефакты, AAB/APK, данные скачиваются при первом запуске), добавляется описание переменной `GAME_DATA_URL` для локальной сборки.
- Вне репозитория (делает пользователь): GitHub Variable `GAME_DATA_URL` и четыре секрета keystore.

## Capabilities

### New Capabilities
- `android-build`: сборка подписанного Android AAB/APK в CI с монотонным `versionCode`, публикация артефактов и попадание в Release.

### Modified Capabilities
- `game-data-download`: URL источника задаётся при сборке из окружения, а не зашит в код; Android скачивает данные так же, как desktop и iOS (сценарий «Android: распаковка из бандла» заменяется); при отсутствии URL в сборке показывается ошибка.
- `ios-build`: требование «Сборка не требует данных игры» расширяется на Android — бандлинг `resources/game-data.zip` убирается со всех платформ.

Оба модифицируемых спека сейчас существуют только как дельты незаархивированного change `add-ios-build` (в `openspec/specs/` их ещё нет). Этот change MUST архивироваться после `add-ios-build`; при архивации заголовки `### Requirement:` в блоках MODIFIED сверить с уже английскими основными спеками.

## Impact

- `.github/workflows/tauri-release.yml` — `env.GAME_DATA_URL` на уровне workflow, новый job `android`, `release.needs`.
- `app/src-tauri/src/lib.rs` — `GAME_DATA_URL` через `option_env!`, удаление android-ветки в `get_local_data_path` и ставших ненужными импортов `tauri_plugin_fs::{FsExt, OpenOptions}` / `BaseDirectory`.
- `app/src-tauri/tauri.android.conf.json` — удаляется.
- `app/src-tauri/gen/android/app/build.gradle.kts` — `signingConfigs.release` из `key.properties`.
- `README.md` — раздел Android, описание `GAME_DATA_URL`.
- `.gitignore` — строка `app/src-tauri/resources/game-data.zip` становится лишней (убрать).
- Зависимости не добавляются: `@tauri-apps/cli@2.11.2` поддерживает `--aab`, `--apk`, `--target`, `--config` и `bundle.android.versionCode` (проверено по `config.schema.json`).
- Локальная разработка: `tauri dev`/`tauri build` без `GAME_DATA_URL` в окружении собираются, кнопка скачивания показывает ошибку.
- Пользователи старой Android-сборки: данные, распакованные из APK в `app_data/data`, остаются и используются; новое скачивание не запускается.
