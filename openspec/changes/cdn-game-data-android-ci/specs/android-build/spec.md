# Spec Delta

## Purpose

Сборка Android-приложения в GitHub Actions: подписанный AAB для публикации в Google Play и APK для установки вручную, без данных игры внутри и с монотонно растущим кодом версии.

## ADDED Requirements

### Requirement: CI собирает подписанные Android AAB и APK
Release-workflow SHALL собирать приложение для `aarch64-linux-android` на Linux runner'е и публиковать артефакты `Vangers-<ref>-android-aarch64.aab` и `Vangers-<ref>-android-aarch64.apk`, где `<ref>` — имя ветки или тега с `/` заменённым на `-`. Оба файла MUST быть подписаны ключом из секретов репозитория, сертификат которого совпадает с upload key приложения `com.caiiiycuk.github.vangers.gp` в Google Play Console (keystore `vandroid`). Сборка MUST NOT требовать `resources/game-data.zip`.

#### Scenario: Прогон workflow на ветке
- **WHEN** workflow запускается push'ем в отслеживаемую ветку или вручную и секреты keystore заданы
- **THEN** среди артефактов прогона есть `.aab` и `.apk`, подпись которых проверяется `apksigner verify --print-certs` и даёт SHA-256 сертификата `3A:57:B5:12:…:28:54` (отпечаток keystore `vandroid`)

#### Scenario: Прогон по тегу
- **WHEN** workflow запускается тегом `v*`
- **THEN** AAB и APK прикреплены к GitHub Release рядом с AppImage, exe, dmg и IPA

#### Scenario: APK ставится поверх предыдущей сборки
- **WHEN** на устройстве установлен APK из предыдущего прогона и пользователь ставит APK из нового прогона
- **THEN** установка проходит как обновление, данные приложения (включая скачанные данные игры) сохраняются

### Requirement: Код версии монотонно растёт и выше опубликованного
Каждый прогон workflow SHALL присваивать Android-сборке `versionCode`, строго больший, чем у любого предыдущего прогона, и больший, чем последний загруженный в Google Play (1027). Значение SHALL вычисляться как `1100 + <порядковый номер прогона workflow>`.

#### Scenario: Загрузка в Play Console
- **WHEN** AAB из прогона загружается в Google Play Console после AAB из любого более раннего прогона
- **THEN** Play принимает его как новую версию, не сообщая о занятом коде версии

#### Scenario: Первый прогон
- **WHEN** workflow выполняется впервые после внедрения
- **THEN** `versionCode` в AAB больше 1027

### Requirement: Сборка без секретов подписи не падает
Если секреты keystore не заданы (например, pull request из форка), job Android SHALL собрать неподписанные AAB и APK и завершиться успешно; артефакты при этом публикуются, но не пригодны для Play и установки на устройство.

#### Scenario: Pull request из форка
- **WHEN** workflow запускается для pull request, которому секреты репозитория недоступны
- **THEN** job Android зелёный, в логе явно сказано, что сборка не подписана

### Requirement: Инструкция по Android в README
README SHALL описывать, где взять AAB и APK из Actions, что AAB предназначен для Google Play, APK — для установки вручную, и что данные игры скачиваются приложением при первом запуске.

#### Scenario: Читатель раздела Android
- **WHEN** пользователь читает раздел Android в README
- **THEN** он не находит указаний копировать `game-data.zip` в `resources/` и знает, откуда скачать артефакты прогона
