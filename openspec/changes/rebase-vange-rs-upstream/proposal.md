# Proposal

## Why

Submodule `vange-rs` в vss отстал от `origin/master` (kvark/vange-rs) на 237 коммитов: merge-base `7660f39` от 2026-05-16, а upstream ушёл до `85dd159` от 2026-10-27. Чем дольше ждём, тем дороже перенос нашего единственного реального коммита `ffd7de6` (terrain data texture как array layers, см. архив `2026-10-30-terrain-texture-array-layers`), потому что upstream уже переписал именно тот код, который мы правили (upload dirty-прямоугольников в `src/render/terrain/mod.rs`). Второй наш коммит `6f05bf6` (Fix 3D wheel palette) байт-в-байт есть в upstream как `d5b81d4`.

Заодно закрепляем в проекте правило, которое до сих пор держалось в голове: vss собирает `vange-rs` только под `wasm32-unknown-emscripten`; нативные сборки игры не поддерживаются и не проверяются.

## What Changes

- Submodule `vange-rs` перебазируется на `origin/master` (`85dd159`): история становится «upstream + один коммит `Terrain: split level rows across texture array layers`». Коммит `6f05bf6` отбрасывается как уже применённый.
- Коммит с array layers переписывается поверх нового upload-кода upstream (`queue.write_texture` под-прямоугольником через `texture_upload_window` вместо `copy_buffer_to_texture` целыми строками); в uniform `SurfaceConstants` поле `_pad` занимает `rows_per_layer` рядом с новым upstream-полем `void_zero`.
- Пин submodule в vss обновляется на новый SHA; старый `ffd7de6` сохраняется тегом в `caiiiycuk/vange-rs`, чтобы старые коммиты vss оставались воспроизводимыми.
- Создаётся `AGENTS.md` в корне vss с правилом: единственная поддерживаемая цель сборки `vange-rs` в этом проекте — `wasm32-unknown-emscripten` (через `emscripten/` + tauri app для desktop WebKitGTK и Android WebView); нативные сборки игры не поддерживаются и не используются для проверки.
- Вместе с upstream приезжают изменения рендера, которые мы не выбирали: освещение в линейном пространстве с sRGB-палитрой, `void_zero` (высота 0 для мировых карт остаётся solid), клиппинг upload'ов у края карты, новая центровка shadow map. Они проверяются визуально, но не оформляются отдельными требованиями.

## Capabilities

### New Capabilities

Нет.

### Modified Capabilities

Нет. Change ставит `skip_specs: true`: это обновление зависимости и документация проекта. Требования существующего спека `terrain-data-texture` (карта грузится при лимите 8192, fetch прозрачен к слоям, upload уважает слои) не меняются и служат критерием приёмки переноса коммита.

## Impact

- `vange-rs` (submodule): история ветки `master` переписывается; конфликты в `res/shader/object.wgsl`, `res/shader/surface.inc.wgsl`, `src/render/shadow.rs`, `src/render/terrain/mod.rs`. Код array layers переносится в `src/render/terrain/mod.rs` (создание текстуры, два bind group layout, view, upload) и `src/render/mod.rs` (view).
- Проверено до начала работ: ABI `lib/ffi` для `lib/renderer/.../RustVisualBackend.cpp` не менялся; wgpu/naga остались `29.0.1`, форк `wgpu/` перебазировать не нужно; `patches/vange-rs-local-wgpu-lock.patch` накладывается на upstream `Cargo.lock` (dry-run); `res/ffi/*.ron` upstream не трогал, новые поля `settings::Render` имеют `serde(default)`; ffi по-прежнему `terrain: RayTraced`, поэтому TIN/mesh-ветки upstream и их `cfg(target_arch = "wasm32")` для нас не активны по данным.
- vss: пин submodule, новый `AGENTS.md`. Бинарные артефакты `app/src/vangers.wasm` и `vangers.mjs` не отслеживаются git и пересобираются локально.
- Новые зависимости upstream (`libm`, `lib/vot`, `glam` с `scalar-math`) должны собраться под emscripten; это проверяется сборкой, статически не гарантируется.
