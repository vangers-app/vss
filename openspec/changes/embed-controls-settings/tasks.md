# Tasks

## 1. Общая панель настроек

- [x] 1.1 Перенести строки `select_controls_type`, `controls_options`, `mirrored_controls`, `follow_camera`, `follow_camera_desc`, `road_zoom` (en/ru) из `app/src/mobile/i18n.ts` в `app/src/inventory/i18n.ts`; проверить `cd app && yarn tsc --noEmit`
- [x] 1.2 Создать `app/src/settings/settings-panel.tsx`: `SettingsPanel` с секцией «Рендер» (перенос разметки и `SettingOption` из `inventory-frame.tsx`, значения через `render-presets.ts`) и секцией «Управление» (тумблеры и список типов из `control-selector.tsx`, локальный state из `options.tsx`, запись сразу при нажатии, выбранный тип первым и развёрнут, язык картинки через `BridgeContext` с fallback на `currentLanguage()`), секция «Управление» только при `__VSS_MOBILE__`; в `inventory-frame.tsx` рендерить `<SettingsPanel />` при `activeId === "settings"` и убрать перенесённый код; проверить `yarn tsc --noEmit` и на desktop (tauri): панель «Настройки» выглядит как прежде, секции «Управление» нет
- [x] 1.3 Создать `app/src/settings/settings-frame.tsx`: `SettingsFrame` с фоном `inventory-bg.jpg`, крестиком `.inventory-close` и `<SettingsPanel />`; при монтировании запоминать `readRenderSettings()`, при закрытии — `location.reload()`, если значения изменились, иначе `props.onClose()`; проверить `yarn tsc --noEmit`

## 2. Mobile: первый запуск и удаление старого экрана

- [x] 2.1 В `app/src/mobile/frame.tsx` при `controlsKind === null` рендерить `SettingsFrame` в `BridgeContext.Provider`; в `onClose` вызывать `setControlsKind(getControlsKind() ?? "way83+")` и перечитывать `isMirroredEnabled()`; убрать state и сеттеры `mirrored`/`cameraFollow`/`roadZoom`, оставив `mirrored` как значение для `renderMapFrame`; удалить ветку `case "controls-select"`; проверить `yarn tsc --noEmit`
- [x] 2.2 Удалить `"controls-select"` из `UIType` в `app/src/mobile/api.ts`, проп `showControlsSelector` и кнопку `MobileButton` из `default-controls.tsx` и `frame.tsx`, `MobileButton` и импорт `mobile.png` из `keys.tsx`, файл `app/src/assets/mobile.png`, файл `app/src/mobile/controls/control-selector.tsx`, правило `.inventory-setting` из `app/src/index.css`; проверить `yarn tsc --noEmit` и `grep -rn "controls-select\|ControlSelector\|MobileButton\|inventory-setting" app/src` пустой

## 3. Проверка на устройствах

- [x] 3.1 Android (TECNO AD10, `yarn tauri android dev --host 127.0.0.1`), `localStorage` без `ui.controls.kind`: при старте показан полноэкранный фрейм настроек без списка модов; выбор GamePix+ и закрытие → главное меню без перезапуска, на карте управление GamePix+; перезапуск приложения → фрейм не показывается, в главном меню нет кнопки справа внизу
- [x] 3.2 Android, снова без `ui.controls.kind`: включить 3D в стартовом фрейме и закрыть → игра перезапускается (в `adb logcat -s Tauri/Console` второй `Runtime initialized` и `.render_config=`), карта в 3D, фрейм не показывается повторно
- [x] 3.3 Android: открыть меню модификаций → карточка «Настройки» активна, под рендером секция «Управление»; нажать «Отдаление камеры» при 1.9 → 1.0; выбрать Way83+ и закрыть меню → после reload на карте Way83+; картинки влезают в панель деталей в landscape без горизонтального скролла
- [x] 3.4 Desktop (tauri): меню модификаций → «Настройки» без секции «Управление», переключатели рендера работают как прежде
- [x] 3.5 Закоммитить изменения одним коммитом (сообщение на английском); `git status` чистый, `vange-rs` не тронут
