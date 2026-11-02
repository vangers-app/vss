# Design

## Context

См. proposal.md — Why. Что есть сейчас (по коду):

- `mobile/frame.tsx:FrameWithBridge` держит state `mirrored`, `cameraFollow`, `roadZoom`, `controlsKind` (из `controls/options.tsx`, ключи `ui.*` в `localStorage`; `setCameraFollow`/`setRoadZoom` дублируют значение в `bridge.native.setStorageItem`). При `controlsKind === null` рендерится полноэкранный `ControlSelector` с `selected="way83+"`; подтверждение (галочка) вызывает `setControlsKind` и показывает `main-menu`. Тот же `ControlSelector` открывается по `uiType "controls-select"` из `MobileButton` в `default-controls.tsx`.
- `ControlSelector` (`controls/control-selector.tsx`): `CommonProps` (три тумблера), список типов с картинками (`assets/controls/way83+.jpeg`, `way83+ru.jpeg`, `gamepix+.jpg`), различает `opened` (развёрнутая картинка) и `selected` (подтверждено). Язык картинки берёт из `bridge.native.language()`.
- `inventory/inventory-frame.tsx`: карточка `settings` активна при открытии, панель с двумя рядами `SettingOption`, значения через `render-presets.ts`; закрытие — `location.reload()`. На mobile фрейм живёт внутри `BridgeContext` (`InappFrame`), на desktop — без bridge. `inventory/i18n.t()` работает без bridge.
- `mirrored` из state `FrameWithBridge` передаётся в `renderMapFrame`; `cameraFollow`/`roadZoom` читает нативная сторона через storage; `controlsKind` выбирает `Road`/`Way83` в `map-frame.tsx`.

## Goals / Non-Goals

**Goals:**

- Один компонент панели настроек с двумя точками монтирования: панель деталей `InventoryFrame` и полноэкранный фрейм первого запуска.
- Секция управления — только mobile; desktop-панель не меняется визуально.
- Удаление `ControlSelector`, `controls-select`, `MobileButton`.

**Non-Goals:**

- Перенос ключей `ui.*` в `vss:addons`.customProps — хранение не меняется.
- Применение типа управления «на лету» в открытом меню модификаций (там по-прежнему reload при закрытии).
- Изменение набора или семантики самих тумблеров управления.

## Decisions

### Структура: `app/src/settings/settings-panel.tsx` и `settings-frame.tsx`

`SettingsPanel` — секция «Рендер» (переезжает из `inventory-frame.tsx` вместе с `SettingOption`) и секция «Управление» (переезжает из `control-selector.tsx`: тумблеры, список типов, картинки). Секция «Управление» рендерится при `(window as any).__VSS_MOBILE__ === true`, как уже делает `main.tsx` для выбора `DesktopFrame`/`MobileFrame`. `InventoryFrame` при `activeId === "settings"` рендерит `<SettingsPanel />`.

`SettingsFrame` — полноэкранная рамка для первого запуска: фон `inventory-bg.jpg`, кнопка-крестик как `.inventory-close`, внутри `SettingsPanel`. Пропс `onClose`.

Альтернатива — `InventoryFrame` с пропом `settingsOnly` (скрыть список и «Обновить») — отвергнута: `InventoryFrame` при монтировании вызывает `reconcileMods(getModAddons())` и пишет storage, а при первом запуске на mobile это лишняя работа и лишняя связность.

### Состояние секции управления — внутри панели, без state в `FrameWithBridge`

`SettingsPanel` читает начальные значения из `options.tsx` (`isMirroredEnabled` и т.д.) в локальный `useState` и пишет через те же сеттеры сразу при нажатии. `FrameWithBridge` перестаёт держать `mirrored`/`cameraFollow`/`roadZoom` как редактируемый state: после закрытия `SettingsFrame` он перечитывает `getControlsKind()` и `isMirroredEnabled()` из storage (единственное, что ему нужно для `renderMapFrame`). В пути через меню модификаций перечитывание не нужно — `location.reload()`.

Альтернатива — пробрасывать сеттеры из `FrameWithBridge` в панель через пропсы, как сейчас в `ControlSelector`, — отвергнута: панель должна работать и внутри `InventoryFrame`, где `FrameWithBridge` до неё не дотягивается.

### Выбор типа управления — одно состояние вместо `opened`/`selected`

Нажатие на тип сразу вызывает `setControlsKind` и разворачивает картинку; галочка подтверждения удаляется. `controls.sort(...)` по `opened` из `ControlSelector` (мутация модуля при каждом рендере) не переносится: выбранный тип просто рендерится первым через `[selected, ...rest]`.

### Закрытие стартового фрейма: reload только при изменении `render.*`

`SettingsFrame` при монтировании запоминает `readRenderSettings()`; при закрытии сначала вызывает `props.onClose`, затем, если текущие `readRenderSettings()` отличаются от запомненных, — `location.reload()`. `FrameWithBridge` в `onClose` пишет `setControlsKind(getControlsKind() ?? "way83+")` (чтобы фрейм не показался снова — в том числе после reload) и переводит state `controlsKind` из `null`.

Альтернатива — всегда reload — отвергнута: лишний рестарт игры у всех новых игроков ради редкого случая.

### Язык картинок — как в `inventory/i18n.t()`

`useContext(BridgeContext)?.native.language()` с fallback на `currentLanguage()`; тот же порядок, что в `t()`. Так панель не падает без bridge (desktop), хотя секция там и не рендерится.

### Строки — в `inventory/i18n.ts`

Шесть строк секции управления (`select_controls_type`, `controls_options`, `mirrored_controls`, `follow_camera`, `follow_camera_desc`, `road_zoom`) используются только `control-selector.tsx`; они переезжают в `inventory/i18n.ts` (там уже есть `enable`/`disable`), из `mobile/i18n.ts` удаляются. Панель импортирует один `t`.

### Удаления

`controls/control-selector.tsx`; ветка `controls-select` и `"controls-select"` в `api.ts:UIType`; `MobileButton` в `keys.tsx` с импортом `assets/mobile.png` (сам файл удаляется, других использований нет); проп `showControlsSelector` в `DefaultControls`; `.inventory-setting` в `index.css`.

## Risks / Trade-offs

- [`setCameraFollow`/`setRoadZoom` из `options.tsx` вызывают `bridge.native.setStorageItem` через модульную переменную `bridge`, которая инициализируется в `Bridge`] → на desktop секция не рендерится, сеттеры не вызываются; на mobile `Bridge` создан до любого фрейма. Риска нет, но зависимость неявная — зафиксировать комментарием `// SAFETY` у вызова не нужно, достаточно того, что секция под `__VSS_MOBILE__`.
- [Картинки типов управления (`w-96`, развёрнутая — `w-full`) внутри панели деталей `InventoryFrame`] → панель `overflow-auto`; на телефоне в landscape ширина деталей ~600+ CSS px. Проверяется на устройстве в задачах; при тесноте — ограничить развёрнутую картинку `max-w-xl`.
- [Игрок, привыкший к кнопке справа внизу] → осознанное решение (proposal, BREAKING); карточка «Настройки» активна при открытии меню модификаций, путь — одно нажатие.
- [`prevUiType` в `frame.tsx` после удаления ветки `controls-select`] → логика `setUiType`/`closeActiveUi` не зависит от этой ветки, остаётся как есть.
