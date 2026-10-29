# Spec Delta

## Purpose

Сборка приложения для iPhone в GitHub Actions без Mac у разработчика и без платного Apple Developer аккаунта: результат — неподписанный IPA, который пользователь подписывает сам и ставит на устройство.

## ADDED Requirements

### Requirement: CI собирает неподписанный iOS IPA
Release-workflow SHALL собирать приложение для `aarch64-apple-ios` на macOS runner'е и публиковать артефакт `Vangers-<ref>-ios-aarch64.ipa`, где `<ref>` — имя ветки или тега с `/` заменённым на `-`. Сборка MUST проходить без Apple-сертификатов, provisioning profile и App Store Connect ключей.

#### Scenario: Прогон workflow на ветке
- **WHEN** workflow запускается push'ем в отслеживаемую ветку или вручную
- **THEN** среди артефактов прогона есть `Vangers-<ref>-ios-aarch64.ipa`, внутри которого `Payload/*.app`

#### Scenario: Прогон по тегу
- **WHEN** workflow запускается тегом `v*`
- **THEN** IPA прикреплён к GitHub Release рядом с AppImage, exe и dmg

#### Scenario: Отсутствие секретов
- **WHEN** в репозитории нет ни одного секрета, связанного с Apple
- **THEN** job iOS завершается успешно

### Requirement: Сборка не требует данных игры
Ни desktop, ни iOS сборка MUST NOT требовать наличия `resources/game-data.zip` на машине сборки. Бандлинг архива с данными SHALL оставаться только в Android-сборке.

#### Scenario: Desktop сборка без архива
- **WHEN** `tauri build` запускается для Linux, Windows или macOS без файла `app/src-tauri/resources/game-data.zip`
- **THEN** сборка завершается успешно

#### Scenario: Android сборка с архивом
- **WHEN** `tauri android build` запускается с `app/src-tauri/resources/game-data.zip`
- **THEN** архив попадает в APK как ресурс и распаковывается при первом запуске, как раньше

### Requirement: iOS-приложение запускается в игровой ориентации
iOS-сборка SHALL разрешать только landscape-ориентации, скрывать системный status bar и требовать fullscreen. Минимальная версия iOS SHALL быть 15.2 или выше (WebGL2 и OPFS sync access handle в WKWebView).

#### Scenario: Запуск на iPhone 8 с iOS 16
- **WHEN** подписанный IPA установлен и запущен на iPhone 8 (iOS 16.x)
- **THEN** приложение открывается в landscape без status bar и показывает мобильный интерфейс (как на Android)

#### Scenario: Поворот устройства в портрет
- **WHEN** пользователь поворачивает телефон в портретную ориентацию
- **THEN** интерфейс остаётся в landscape

### Requirement: Инструкция по установке на iPhone
README SHALL описывать, где взять IPA из Actions и как поставить его на iPhone бесплатным Apple ID (Sideloadly/AltStore), включая 7-дневный срок подписи.

#### Scenario: Пользователь без Mac-разработки
- **WHEN** пользователь читает раздел iOS в README
- **THEN** он может скачать артефакт прогона и повторить установку без дополнительных источников
