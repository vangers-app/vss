# Design

## Context

См. proposal.md — Why. Факты, от которых зависит подход (проверены в `vange-rs/` командами `git fetch`, `git merge --no-commit` с последующим `--abort`, `patch --dry-run`):

- Локально уникален один коммит `ffd7de6`; `6f05bf6` идентичен upstream `d5b81d4`, `git rebase` отбросит его сам.
- Конфликтуют 4 файла. В `object.wgsl` upstream добавил `@interpolate(flat)` к `color_id`. В `shadow.rs` наш diff — только перенос строк rustfmt, upstream вынес логику в `shadow_view()`. В `surface.inc.wgsl` мы добавили `rows_per_layer`, upstream — `void_zero` и `_pad`. В `terrain/mod.rs` upstream переписал upload: `queue.write_texture` окна `(x0..x1, y0..y1)` из `texture_upload_window`, буфер `upload_scratch`, `tracks.patch_row`; плюс добавил второй bind group layout entry для `t_Terrain` (visibility без VERTEX).
- `src/render/object.rs` и `src/render/mod.rs` сливаются автоматически, но view в `render/mod.rs` (~строка 672) upstream создаёт с `TextureViewDescriptor::default()`, его надо перевести в `D2Array` руками.
- Единственное место чтения `t_Terrain` в шейдерах по-прежнему `get_surface_impl` в `surface.inc.wgsl`; mesh/TIN-шейдеры читают через него.
- Emscripten-цель — это `target_arch = "wasm32"`, поэтому upstream-ветки под этим cfg (встроенные шейдеры, `rect_reaches_drawn`, `build_pending`) компилируются и у нас. Встроенные шейдеры были и на merge-base; остальное работает только для `Kind::Mesh`, а ffi использует `RayTraced`.
- Сборка идёт только из `emscripten/` (`ninja vangers` → `cargo build -p rusty-vangers --target wasm32-unknown-emscripten --release` с патчем Cargo.lock через `cmake/ApplyGitPatch.cmake`, затем линк в `app/src/vangers.wasm`). Desktop-проверка — tauri desktop (WebKitGTK), Android — tauri android dev на TECNO AD10.

## Goals / Non-Goals

**Goals:**

- `vange-rs` на `origin/master` + один наш коммит, без merge-коммита.
- Требования `terrain-data-texture` выполняются на новом коде: карта грузится на Mali с лимитом 8192, шов на границе слоёв невидим, dirty-прямоугольники доходят до нужного слоя.
- Старый SHA `ffd7de6` остаётся достижимым в `caiiiycuk/vange-rs`.
- Правило «только emscripten» зафиксировано в `AGENTS.md` проекта.

**Non-Goals:**

- Исправление URL submodule в `.gitmodules` (сейчас указывает на `kvark/vange-rs`, где нашего коммита нет; свежий clone требует добавить remote `caiiiycuk`). Это существующая ситуация, change её не меняет.
- Перевод ffi на TIN/mesh-режим, настройка нового освещения или теней upstream. Их результат принимается как есть, если картинка не сломана.
- Обновление форка `wgpu/`: версия 29.0.1 совпадает.
- Нативная сборка игры и её проверка.

## Decisions

### Rebase, а не merge

Cherry-pick одного коммита на `origin/master` даёт историю «upstream + 1», submodule-пин остаётся честным форком без merge-пузыря. Объём разрешения конфликтов одинаковый в обоих вариантах. Цена rebase — force-push в `caiiiycuk/master`; она гасится тегом на старом SHA (см. ниже). Merge отвергнут: ради одного коммита тащить merge-коммит и второй родитель незачем.

### Тег на старом SHA до force-push

Текущий HEAD vss пинит `ffd7de6`. После force-push `caiiiycuk/master` этот SHA перестанет быть достижимым с веток и может быть собран GC → старые коммиты vss не смогут сделать `submodule update`. Перед push ставится тег вида `vss-pin-2026-11-02` на `ffd7de6` и пушится в `caiiiycuk`. Push ветки делается с `--force-with-lease`.

### Разрешение конфликтов

- `object.wgsl`, `shadow.rs` → версия upstream целиком. Наш вклад в оба файла либо уже в upstream, либо чисто косметический.
- `surface.inc.wgsl` и Rust `SurfaceConstants` → `rows_per_layer` занимает место `_pad`/`pad1`: `texture_scale` (16) + `terrain_bits`, `delta_mode`, `void_zero`, `rows_per_layer` (4×4) = 32 байта, выравнивание uniform не меняется, доппадинг не нужен. `t_Terrain` остаётся `texture_2d_array<u32>`, fetch — `textureLoad(t_Terrain, vec2(tci.x/2, tci.y % rows), tci.y / rows, 0)`.
- `terrain/mod.rs` → берём upstream как базу и накладываем наш коммит заново: расчёт `layer_count`/`rows_per_layer` из `device.limits()` с `assert!` на `max_texture_array_layers`, текстура `height = rows_per_layer, depth_or_array_layers = layer_count`, поле `rows_per_layer` в `Context` и в uniform, оба layout entry для `t_Terrain` → `D2Array`, оба `create_view` (`terrain/mod.rs`, `render/mod.rs`) → `D2Array`.

### Разбиение upload по слоям поверх `write_texture`

Upstream уже вычислил окно `(x0, x1, y0, y1)` и заполнил `upload_scratch` строками по `row_bytes`. Поверх этого — цикл по слоям `y0 / rows_per_layer ..= (y1 - 1) / rows_per_layer`; для каждого слоя `start = max(y0, layer_start)`, `end = min(y1, layer_start + rows_per_layer)`, вызов `queue.write_texture` с `origin = (x0/2, start - layer_start, layer)`, данными `&upload_scratch[(start - y0) * row_bytes ..]`, `bytes_per_row = row_bytes`, высотой `end - start`. Альтернатива — вернуть `copy_buffer_to_texture` из нашего коммита — отвергнута: теряется upstream-оптимизация под-прямоугольника, ради которой он и переписывал upload. Логика `tracks.patch_row` и `rect_reaches_drawn` не трогается, они работают в координатах уровня, не текстуры.

### Проверка только под emscripten

Продуктовая сборка одна: `cd emscripten && ninja vangers`. Шейдерный тест `cargo test -p vangers --test shaders` (парсинг naga) остаётся как дешёвая host-side проверка синтаксиса `surface.inc.wgsl`; он не сборка игры и правилу «только emscripten» не противоречит. `AGENTS.md` формулирует правило так: поддерживаемая цель `vange-rs` в vss — `wasm32-unknown-emscripten`; проверка работоспособности — tauri desktop и Android; нативные сборки игры (`cargo build` без target, нативный CMake) не поддерживаются и как доказательство работоспособности не принимаются.

## Risks / Trade-offs

- [Новые зависимости upstream не соберутся под emscripten] → первая же `ninja vangers` покажет; `libm` и `lib/vot` без platform-кода, `glam scalar-math` для wasm штатный путь. Если что-то не соберётся, править в нашем коммите-сверху, не в истории upstream.
- [Картинка изменится из-за sRGB-освещения upstream] → ffi уже отдаёт `Rgba8UnormSrgb`, палитра выбирается под формат target'а (`Palette::format_for_target`), ожидаем ту же картинку; проверяется глазами на desktop. Если заметно темнее/светлее — отдельный change, здесь только фиксируем.
- [`void_zero`, клиппинг у края, новая центровка теней] → смотреть край карты и тени на desktop; принимаем upstream-поведение.
- [Патч Cargo.lock перестанет накладываться] → dry-run прошёл со смещениями; `ApplyGitPatch.cmake` делает `git checkout -f Cargo.lock` перед каждым apply, поэтому сборка сама сообщит о провале.
- [Force-push сломает старые пины vss] → тег на `ffd7de6`, `--force-with-lease`.
- [Ошибка в offset'ах при разбиении по слоям] → сценарии спека `terrain-data-texture` «Dirty rectangle across the layer boundary» и «Full initial upload»: на Android проверить шов 8191/8192 на Fostral и обновление ландшафта после выстрелов/воронок.
