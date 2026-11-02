# Design

## Context

См. proposal.md — Why. Что уже есть и на что опираемся (проверено по коду и в запущенной игре):

- `InventoryFrame` (`app/src/inventory/inventory-frame.tsx`) — список карточек модов слева, панель деталей справа; на desktop открывается из `DesktopFrame` (`app/src/main.tsx:192`), на mobile — через `mobile/inapp-frame.tsx` (`InappOpen` в `default-controls.tsx` показан всегда). Закрытие вызывает `location.reload()`. В `inventory/storage.ts` есть `readCustomProp`/`writeCustomProp` (произвольные строки в том же объекте `localStorage`, что и список модов), в `i18n.ts` — словарь en/ru.
- На desktop кнопка открытия фрейма (`InventoryOpenButton`) показана только при `modsPresent`; иначе стоит `DownloadModsButton`, которая сразу запускает скачивание.
- `main.tsx` собирает `args` для `Module.callMain` (`-vss`, `-russian`, `-quickstart`); `lib/xtool/xtcore.cpp:main()` парсит их. `Module.FS` доступен в `onRuntimeInitialized` (используется в `vss-browser.ts`), preload `/res/ffi` к этому моменту смонтирован.
- `RustVisualBackend` создаётся в `xtInitApplication` (`src/road.cpp:483-487`) после `XGR_Init`, путь к конфигу захардкожен (`RustVisualBackend.cpp:38`, `res/ffi/render-compat.ron`). `rv_init` читает ron через `ron::de::from_reader`; `shadow.size == 0` даёт `Option<Shadow> = None` (`vange-rs/src/render/mod.rs:648`), `ray_steps` — поле верхнего уровня с `serde(default)`.
- `vMap->__use_external_renderer` (`src/terra/vmap.cpp:320`, по умолчанию `true`) переключает между Rust-рендером и классическим 2D: при `false` работает софтверный путь `vmap.cpp`, спрайты моделей включаются в `3d/optimize.cpp:228`, `renderer->render()` и `SyncExternalModels()` пропускаются (`road.cpp:1995`). Клавиша `\` переключает на лету; 2D-путь на карте проверен визуально 2026-11-02.
- `DummyVisualBackend` (`lib/renderer/.../dummy/`) реализует `AbstractVisualBackend` пустыми методами.

## Goals / Non-Goals

**Goals:**

- Настройки доступны из меню модификаций на desktop и mobile, хранятся в `localStorage`, применяются перезапуском страницы.
- 3D выключено по умолчанию; в этом режиме Rust-контекст не создаётся.
- Три пресета качества как данные vss, без правок submodule.

**Non-Goals:**

- Переключение 3D или качества на лету без перезапуска.
- Масштаб разрешения 3D-рендера относительно окна (главный резерв производительности на desktop; отдельный change).
- Миграция старых пользователей в 3D: без ключа в `localStorage` все стартуют в 2D.
- Изменение `vange-rs` и его `render-compat.ron`.

## Decisions

### Хранение: `customProps` в inventory storage, ключи `render.3d` и `render.quality`

`readCustomProp`/`writeCustomProp` уже обслуживают тот же объект `localStorage`, что и моды, и читаются до `callMain` в том же `main.tsx`. Значения: `render.3d` ∈ {`"1"`, `"0"`}, пусто = `"0"`; `render.quality` ∈ {`high`, `normal`, `low`}, пусто = `normal`. Альтернатива — отдельные ключи `localStorage` как в `mobile/controls/options.tsx` — отвергнута: настройки проекта логично лежат рядом с модами, которые тем же экраном и управляются.

### Применение: аргументы `callMain`, пресет пишется в MEMFS

`main.tsx` перед `callMain`:

```
3d == "0":  args.push("-no3d")
3d == "1":  Module.FS.writeFile("/res/ffi/render-vss.ron", PRESETS[quality]);
            args.push("-render-config", "/res/ffi/render-vss.ron")
```

Пресеты — три строки ron в новом модуле `app/src/render-presets.ts`, копия `render-compat.ron` с другими `shadow.size`/`ray_steps`. Запись в MEMFS, а не файлы в `vange-rs/res/ffi`: пресеты остаются в vss, форк submodule не растёт, позже можно собирать произвольные значения. Запись в `/res/ffi` рядом с preload-файлами допустима: MEMFS, каталог существует.

### C++: два глобала из аргументов

`xtcore.cpp:main()` получает ветки `-no3d` → `Use3D = 0` и `-render-config <path>` → `RenderConfigPath`. Глобалы объявляются в `src/road.cpp` рядом с `QuickStartGame` (`int Use3D = 1; const char* RenderConfigPath = "res/ffi/render-compat.ron";`).

- `xtInitApplication` (`road.cpp:487`): `Use3D ? RustVisualBackend : DummyVisualBackend`. Dummy уже подключён (`road.cpp:107`).
- `RustVisualBackend` конструктор: `.render_config = RenderConfigPath` вместо литерала.
- `vrtMap::vrtMap`: `__use_external_renderer(Use3D)` вместо `true`. Клавиша `\` остаётся отладочным переключателем; при `Use3D = 0` она включит внешний рендер на Dummy-backend, то есть пустую карту — это debug-поведение, не чиним.

Альтернатива — передавать настройки через duktape-аддоны и `option`-квант — отвергнута: решение нужно до `XGR_Init`, а аргументы уже проходят этот путь.

### UI: закреплённая карточка в `InventoryFrame`

Карточка с id `settings` добавляется первой в список (не входит в `items` модов и не пишется в `writeInventoryItems`). При `activeId === "settings"` панель деталей рендерит два ряда переключателей (три/две кнопки в ряд, активная подсвечена как включённый мод) вместо описания и кнопок enable/disable. Качество при `render.3d == "0"` рендерится с `opacity` и без обработчика. Строки `settings`, `render_3d`, `quality_high/normal/low`, `on`, `off` в `i18n.ts` (en/ru).

`DesktopFrame`: `InventoryOpenButton` показывается всегда; ветка с `DownloadModsButton` удаляется (скачивание — через «Обновить» внутри фрейма). Mobile не меняется.

## Risks / Trade-offs

- [2D-путь давно не был основным] → проверен клавишей `\` на карте на desktop; на Android проверяется в задачах. Если на mobile что-то сломано (например, слои `hd`-поверхности), чинится в рамках этого change, потому что 2D становится дефолтом.
- [`Module.FS.writeFile` до `callMain` в каталог preload] → preload монтируется в `preRun`, `onRuntimeInitialized` позже; `vss-browser.ts` уже пишет в MEMFS в этот момент. Если путь занят — ошибка в консоли и fallback на `render-compat.ron` (C++ дефолт).
- [Пресеты дублируют `render-compat.ron`] → при изменении upstream-формата настроек `rv_init` упадёт на `unwrap` при парсе. Задача 2.x закрепляет: парс всех трёх пресетов в сборке под emscripten проверяется запуском каждого.
- [Переключение дефолта на 2D удивит тех, кто играл в 3D] → осознанное решение (proposal, BREAKING); включается одним переключателем.
- [`DummyVisualBackend` возвращает нулевые handle, код может ждать ненулевых] → `optimize.cpp:228` именно так и трактует 0; остальные вызовы через `backend()` безопасны (пустые методы).
