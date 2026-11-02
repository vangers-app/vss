# Proposal

## Why

Профилирование desktop (WebKitGTK, iGPU AMD Raphael) показало, что в режиме карты игра упирается в GPU: ray-march terrain в vange-rs исполняется дважды за кадр (shadow-проход 1024² и основной проход в полный размер canvas) с `ray_steps = 128`, и кадр занимает ~100 мс (10 FPS). Замеры: shadow 512 + `ray_steps` 64 → ~49 мс; без теней ещё дешевле. На слабом GPU и на мобильных единственный способ играть — классический 2D-рендер через CPU, который в движке есть (`vMap->__use_external_renderer`, переключается клавишей `\`, проверен на карте), но пользователю недоступен. Нужен экран настроек проекта, где игрок выбирает: 3D вкл/выкл и качество 3D.

## What Changes

- В меню модификаций (`InventoryFrame`, открывается кнопкой в левом верхнем углу главного меню на desktop и mobile) появляется закреплённая первая карточка «Настройки». При её выборе правая панель показывает два переключателя: **3D** (включено / выключено) и **качество 3D** (высокое / нормальное / низкое). Значения пишутся в `localStorage` сразу; применяются при закрытии фрейма, которое уже делает `location.reload()`.
- Кнопка открытия `InventoryFrame` на desktop показывается всегда (сейчас без скачанных модов вместо неё кнопка скачивания, и фрейм недостижим). Скачивание модов остаётся внутри фрейма («Обновить»).
- **BREAKING (поведение по умолчанию):** 3D по умолчанию выключено. Без сохранённой настройки игра стартует в классическом 2D: `RustVisualBackend` не создаётся, вместо него `DummyVisualBackend`, `vMap->__use_external_renderer = false`. Это касается и Android, и тех, кто уже играл в 3D.
- Качество по умолчанию — нормальное. Пресеты: высокое — shadow 1024 / `ray_steps` 128 (нынешний `render-compat.ron`), нормальное — 512 / 64, низкое — теней нет (`shadow.size = 0`) / 64. Переключатель качества при выключенном 3D виден, но неактивен.
- Доставка в движок: `main.tsx` перед `callMain` читает настройки и добавляет аргументы `-no3d` либо `-render-config <path>`; пресеты хранятся строками ron в TS и записываются в MEMFS (`Module.FS.writeFile`) в `/res/ffi/render-vss.ron`. `lib/xtool/xtcore.cpp:main()` парсит аргументы в глобалы; `RustVisualBackend` берёт путь из глобала с fallback на `res/ffi/render-compat.ron`; `vrtMap` берёт `__use_external_renderer` из глобала.

## Capabilities

### New Capabilities

- `render-settings`: пользовательские настройки рендера проекта (3D вкл/выкл, качество 3D), их хранение, экран в меню модификаций и применение при старте игры.

### Modified Capabilities

Нет.

## Impact

- `app/src/inventory/inventory-frame.tsx`, `storage.ts` (`readCustomProp`/`writeCustomProp` уже есть), `i18n.ts` — карточка и панель настроек, строки en/ru.
- `app/src/main.tsx` — кнопка открытия фрейма всегда видна; сборка `args` и запись пресета в MEMFS перед `callMain`. Mobile получает экран через `mobile/inapp-frame.tsx` без изменений.
- `lib/xtool/xtcore.cpp` — аргументы `-no3d`, `-render-config`; `src/road.cpp` — выбор `DummyVisualBackend`/`RustVisualBackend` при `XGR_Init`; `src/terra/vmap.cpp` — начальное значение `__use_external_renderer`; `lib/renderer/.../RustVisualBackend.cpp` — путь к конфигу.
- `vange-rs` не меняется: `render-compat.ron` остаётся, пресеты живут в vss.
- Поведение по умолчанию меняется для всех пользователей (2D вместо 3D); память GPU при выключенном 3D не расходуется на terrain-текстуру и проходы.
- Проверка только emscripten: tauri desktop и Android.
