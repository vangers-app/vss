# Tasks

## 1. Движок: аргументы `-no3d` и `-render-config`

- [x] 1.1 В `src/road.cpp` рядом с `QuickStartGame` объявить `int Use3D = 1;` и `const char* RenderConfigPath = "res/ffi/render-compat.ron";`; в `lib/xtool/xtcore.cpp:main()` добавить ветки `-no3d` → `Use3D = 0` и `-render-config <path>` → `RenderConfigPath` (с сообщением об ошибке без значения, как у `-vss`); проверить `cd emscripten && ninja vangers` собирается
- [x] 1.2 В `xtInitApplication` (`src/road.cpp:487`) создавать `DummyVisualBackend` при `Use3D == 0`, иначе `RustVisualBackend`; в `vrtMap::vrtMap` инициализировать `__use_external_renderer(Use3D)`; в `RustVisualBackend.cpp` подставить `RenderConfigPath` в `.render_config`; проверить: запуск desktop с `?quickstart` при ручном добавлении `-no3d` в `args` показывает карту в 2D и в консоли нет `rv_init`; без аргумента — 3D как раньше

## 2. Пресеты и запуск из `main.tsx`

- [x] 2.1 Создать `app/src/render-presets.ts`: тип `RenderQuality = "high" | "normal" | "low"`, функции `readRenderSettings()`/`writeRenderSettings()` поверх `readCustomProp`/`writeCustomProp` (`render.3d`, `render.quality`, дефолты `"0"` и `normal`) и три строки ron (копия `render-compat.ron` с `shadow.size` 1024/512/0 и `ray_steps` 128/64/64); проверить `cd app && yarn tsc --noEmit` без ошибок
- [x] 2.2 В `main.tsx` перед `callMain`: при 3D выкл. — `args.push("-no3d")`; при вкл. — `Module.FS.writeFile("/res/ffi/render-vss.ron", preset)` и `args.push("-render-config", "/res/ffi/render-vss.ron")`; проверить в desktop: с `render.3d = "1"` и каждым из трёх значений `render.quality` в `localStorage` игра доходит до карты, в консоли есть `Using render: /res/ffi/render-vss.ron` и нет panic; при `low` тени на карте отсутствуют

## 3. Экран настроек в `InventoryFrame`

- [x] 3.1 В `app/src/inventory/i18n.ts` добавить строки en/ru: `settings`, `render_3d`, `render_quality`, `quality_high`, `quality_normal`, `quality_low`, `on`, `off`; проверить `yarn tsc --noEmit`
- [x] 3.2 В `inventory-frame.tsx` добавить закреплённую первую карточку «Настройки» (id `settings`, иконка `app-icon.png`, не входит в `items` модов) и панель с двумя рядами переключателей при `activeId === "settings"`; значения читаются/пишутся через `render-presets.ts` сразу при нажатии; ряд качества при выключенном 3D показан приглушённо и без обработчика; проверить на desktop: выбор сохраняется после `reload`, карточка не попадает в `writeInventoryItems` (список модов в `localStorage` без `settings`)
- [x] 3.3 В `main.tsx` `DesktopFrame` всегда показывать `InventoryOpenButton`, убрать ветку с `DownloadModsButton` (и сам импорт, если больше не используется); проверить: без скачанных модов кнопка открывает фрейм, «Обновить» внутри запускает скачивание

## 4. Проверка на desktop и Android

- [x] 4.1 Desktop (tauri, `yarn tauri dev`): чистый `localStorage` → заезд на карту в 2D (terrain, мехосы, тени-спрайты), в консоли нет `rv_init`; включить 3D в настройках, закрыть фрейм → после reload карта в 3D с нормальным качеством; переключить на низкое → теней нет; на высокое → как в прежней сборке
- [x] 4.2 Android (TECNO AD10, `yarn tauri android dev --host 127.0.0.1`): чистые данные приложения → карта в 2D без артефактов и с рабочим управлением; включить 3D через меню модификаций (`InappOpen`) → карта в 3D; в `adb logcat -s Tauri/Console` нет `Validation Error`/`Aborted`
- [x] 4.3 Закоммитить изменения в vss одним коммитом (сообщение на английском); `git status` чистый, submodule `vange-rs` не тронут
