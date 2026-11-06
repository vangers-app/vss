# Spec Delta

## MODIFIED Requirements

### Requirement: Сборка не требует данных игры
Ни одна сборка приложения (desktop, Android, iOS) MUST NOT требовать наличия `resources/game-data.zip` на машине сборки и MUST NOT включать данные игры в бандл. Данные на всех платформах SHALL поставляться скачиванием при первом запуске (спек `game-data-download`).

#### Scenario: Desktop сборка без архива
- **WHEN** `tauri build` запускается для Linux, Windows или macOS без файла `app/src-tauri/resources/game-data.zip`
- **THEN** сборка завершается успешно

#### Scenario: Android сборка без архива
- **WHEN** `tauri android build` запускается без файла `app/src-tauri/resources/game-data.zip`
- **THEN** сборка завершается успешно, в APK и AAB нет ресурса `game-data.zip`

#### Scenario: Архив присутствует локально
- **WHEN** у разработчика в `app/src-tauri/resources/` лежит `game-data.zip`
- **THEN** он игнорируется: в бандл любой платформы не попадает
