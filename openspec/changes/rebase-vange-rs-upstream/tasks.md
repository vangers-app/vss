# Tasks

## 1. Сохранить старую точку и перебазировать submodule

- [x] 1.1 В `vange-rs/`: `git fetch origin caiiiycuk`, поставить тег `vss-pin-2026-11-02` на `ffd7de6` и запушить его в `caiiiycuk`; проверить `git ls-remote --tags caiiiycuk | grep vss-pin-2026-11-02`
- [x] 1.2 В `vange-rs/`: `git rebase origin/master`; убедиться, что `6f05bf6` отброшен как уже применённый и остановка только на `ffd7de6` с конфликтами в `res/shader/surface.inc.wgsl`, `src/render/shadow.rs`, `src/render/terrain/mod.rs` (`git status`); факт: `object.wgsl` не конфликтует, его правил только отброшенный `6f05bf6`
- [x] 1.3 Разрешить `object.wgsl` и `shadow.rs` версией upstream (`git checkout --theirs` в терминах rebase = upstream, перепроверить содержимое глазами: `@interpolate(flat)` на месте, `shadow_view()` используется); проверить `git diff origin/master -- res/shader/object.wgsl src/render/shadow.rs` пустой
- [x] 1.4 Разрешить `surface.inc.wgsl`: оставить `texture_2d_array<u32>`, fetch по слоям и поле `rows_per_layer` вместо `_pad` после `void_zero`; проверить, что struct содержит `texture_scale, terrain_bits, delta_mode, void_zero, rows_per_layer` и ничего больше

## 2. Перенести array layers на новый terrain-код upstream

- [x] 2.1 В `src/render/terrain/mod.rs` разрешить конфликт, взяв upstream за базу: `rows_per_layer` вместо `pad1` в `SurfaceConstants` (инициализация и заполнение в `update_dirty`), расчёт `layer_count`/`rows_per_layer` из `device.limits()` с `assert!` на `max_texture_array_layers`, текстура `Terrain data` с `height = rows_per_layer, depth_or_array_layers = layer_count`, поле `rows_per_layer` в `Context`; проверить `git diff origin/master -- src/render/terrain/mod.rs` содержит только эти hunks плюс 2.2–2.3
- [x] 2.2 Bind group layout entry для `t_Terrain` в `terrain/mod.rs` и `create_view` там же, а также `create_view` в `src/render/mod.rs` перевести в `TextureViewDimension::D2Array`; проверить `grep -n "D2Array" src/render/terrain/mod.rs src/render/mod.rs src/render/object.rs` показывает 2 layout + 2 view (object.rs слился автоматически; факт: в `terrain/mod.rs` только один layout entry для `t_Terrain`, binding 5 — это table map)
- [x] 2.3 В `update_dirty` поверх upstream `queue.write_texture` добавить цикл по слоям окна `(y0, y1)`: `origin = (x0/2, start - layer_start, layer)`, данные `&self.upload_scratch[(start - y0) * row_bytes ..]`, высота `end - start`; проверить `cargo test -p vangers --test shaders` проходит (парсинг всех terrain-шейдеров) и `git rebase --continue` завершает rebase одним коммитом поверх `85dd159` (`git log --oneline origin/master..HEAD` = 1 строка)

## 3. Собрать под emscripten и проверить на desktop

- [x] 3.1 `cd emscripten && ninja vangers`: патч Cargo.lock накладывается, `cargo build --target wasm32-unknown-emscripten` собирает новые зависимости upstream, `app/src/vangers.wasm` и `vangers.mjs` обновлены (mtime); при ошибках сборки правка идёт в наш верхний коммит submodule
- [x] 3.2 Tauri desktop (`cd app && yarn tauri dev`): выехать из эскейва на Fostral, в консоли WebKitGTK нет `Validation Error`/panic; картинка по яркости и теням не отличается заметно от прежней сборки, край карты (wrap) без артефактов
- [x] 3.3 На desktop проверить обновление ландшафта: выстрелы/воронки и moving land появляются на карте без задержек и смещений (upload под-прямоугольником по слоям работает)

## 4. Проверить на Android

- [x] 4.1 `adb reverse tcp:1420 tcp:1420; adb reverse tcp:1421 tcp:1421`, `yarn tauri android dev --host 127.0.0.1` на TECNO AD10; в `adb logcat -s Tauri/Console` нет `Validation Error`/`Aborted` при входе на Fostral, карта отрисована
- [x] 4.2 Доехать до границы слоёв (строки 8191/8192 на Fostral) и сделать воронку рядом с ней: шва нет, воронка видна и не смещена (сценарий «Dirty rectangle across the layer boundary»)

## 5. Зафиксировать в vss

- [x] 5.1 Запушить `vange-rs` `master` в `caiiiycuk` с `--force-with-lease`; проверить `git ls-remote caiiiycuk master` = новый SHA и тег из 1.1 на месте
- [x] 5.2 Создать `AGENTS.md` в корне vss: единственная поддерживаемая цель `vange-rs` — `wasm32-unknown-emscripten` через `emscripten/` + tauri app; проверка работоспособности — tauri desktop и Android; нативные сборки игры не поддерживаются и как проверка не принимаются; проверить, что файл читается (`cat AGENTS.md`) и не противоречит `README.html5.md`
- [x] 5.3 Закоммитить в vss новый пин submodule и `AGENTS.md` одним коммитом (сообщение на английском); проверить `git submodule status` показывает новый SHA без `+`, `git status` чистый
