# Поэтапный мерж source/master — план второй попытки

Статус: план составлен, выполнение не начато.
Дата анализа: 2026-10-03.

## Зачем переделывать

Первая попытка (merge-коммит `41318e0b`) слила всё одним куском и дала 85
конфликтов. Разбор показал, что почти все они — не смысловые, а шум двух
трансформаций: нормализация переводов строк и массовое clang-format. Из-за
этого настоящие изменения (SDL3, геймплей, настройки) пришлось разрешать
вместе с шумом, и часть ошибок проскочила незамеченной — например, порядок
вызовов в конструкторе `Object` (краш на выходе) и порядок байт в палитре
(синий сдвиг).

Пользователь верно указал: виноваты именно SDL3 и форматирование.

## Ключевая идея: отформатировать себя заранее

Вместо того чтобы согласовывать форматирование с upstream, мы применяем его
сами **до** любых мержей. После этого контекст строк у нас и у upstream
совпадает, и:

- мерж самого clang-format становится почти пустым;
- каждый последующий мерж имеет чистый контекст;
- переводы строк приводятся к LF один раз, а не в каждом конфликте.

Это убирает обе трансформации из пространства конфликтов.

### Что для этого уже есть

| Что | Состояние |
|---|---|
| `.clang-format` | Есть у нас, **содержимое идентично upstream** (разница только CRLF/LF) |
| `.gitattributes` | Есть у нас, **содержимое идентично upstream** (разница только CRLF/LF), содержит `*.cpp text eol=lf` и т.д. |
| clang-format | Есть: `C:\Program Files\Microsoft Visual Studio\18\Community\VC\Tools\Llvm\x64\bin\clang-format.exe`, версия **22.1.3** |
| C++ файлов под формат | 272 |

Уже в индексе как LF: `.clang-format`, `.gitattributes` — то есть конфиг
корректно подхвачен.

## Состояние переводов строк (перепроверено)

Ранее считалось, что переводы строк — главный источник конфликтов. Сейчас
картина лучше: `.gitattributes` нормализует индекс, и рабочее дерево просто
не обновлялось.

- 53 C++ файла имеют CRLF **в рабочем дереве**
- из них только **5 имеют CRLF в индексе** — то есть по-настоящему не нормализованы
- остальные 48 уже `i/lf`, то есть это шум checkout, а не данных

Пять настоящих файлов (все — наш код рендерера, upstream их не трогает):

```
lib/renderer/src/renderer/ResourceId.h
lib/renderer/src/renderer/ResourceStorage.h
lib/renderer/src/renderer/common.cpp
lib/renderer/src/renderer/common.h
lib/renderer/src/renderer/exception.h
```

Вывод: проблема переводов строк почти закрыта, чинить надо 5 файлов, а не
дерево.

## Разбор 116 коммитов upstream

Топология: 20 merge-коммитов, остальные — линейные прогоны в ветках PR.
Значит диапазоны режутся чисто, и каждый этап можно слить отдельным
`git merge` промежуточной ветки.

Из 116 коммитов **69 трогают C++**, 47 — только документация, CI, скрипты,
данные. Эти 47 сливаются тривиально и конфликтов не дают.

### Этап 0 — Подготовка (без мержа)

1. Привести 5 файлов из списка выше к LF в индексе
   (`git add --renormalize .`).
2. Прогнать clang-format 22 по всем 272 C++ файлам с конфигом из репозитория.
3. Убедиться, что сборка всё ещё собирается.
4. Один коммит: «Adopt upstream formatting before merging».

Этап 0 — самый важный. Он превращает 85 конфликтов в единицы.

### Этап 1 — Геймплейные правки до форматирования (12 коммитов)

Верхняя граница: `f0476d99` (Use protocol v5 default multiplayer host).

```
83dd7e78 Document multiplayer NetID ownership model
db83ef91 Fix multiplayer mushroom growth cadence
47f4a325 Fix Threall lava damage cadence at 60 FPS
93a9ee23 Fix update station retrigger after inventory redraw
7432aea6 Restore singleplayer mature mushroom cadence
667d279b Guard Passembloss compass route lookup on hMok
2ccdf5eb Fix Parapheen passenger task softlock
65141027 Fix zero-radius quicksand physics
81ae5853 Preserve zero-radius quicksand enable timing
7c55a6c5 Block trunk close after item move
c9ab0d44 Shorten trunk item-move close guard
f0476d99 Use protocol v5 default multiplayer host
```

Приоритет: **это самые вероятные кандидаты на жалобы пользователя**.
`47f4a325` — «урон лавой на 60 FPS», то есть ровно тот класс, что описывался
как «мгновенный урон». `65141027` / `81ae5853` — физика.

### Этап 2 — clang-format и самодостаточность заголовков (14 коммитов)

Верхняя граница: `aa8f6f78` (Merge PR #667 clang-format).

```
7338af38 Apply clang-format to C++ sources
0f687092 Make xrec header self-contained
b69eafd6 Make AVI header self-contained
c4f17148 Make zip resource header self-contained
d129e7f9 Make terrain render header self-contained
7c689fbb Make actint headers include their dependencies
b6c70fad Make palette header include terrain dependencies
f61786a8 Make effect header include particle dependencies
6885daf2 Make 3D math header declare utility dependencies
4f1a0dcd Make UVS screen headers include their dependencies
f6e60cd8 Enable include sorting in clang-format
c2b8e571 Make item header declare unit dependencies
310fda20 Add clang-format check workflow
aa8f6f78 Merge pull request #667 from KranX/clang-format
```

Ожидание: почти без конфликтов, потому что этап 0 уже применил
`7338af38`. Остаётся только 12 добавлений `#include` (механика, безопасно)
и CI-workflow.

### Этап 3 — Геймплейные правки, второй заход (12 коммитов)

Верхняя граница: `e1300ab2` (Merge PR #673).

```
cb446261 Block mechos hotkeys while chat owns keyboard
36a57f3b Reset carried road state on mechos purchase
772635e2 Fix pause menu state after multiplayer respawn
42d30d2d Limit remote spheroid activation sounds
23bfc759 Ignore hidden files during resource discovery
6711be3c Unify normal and forced pause cleanup
359af3e3 Use actual visibility for spheroid activation sounds
+ merge-коммиты PR #670..#673
```

Приоритет: **`b2cda62f` Merge PR #671 — «Fix escave same mechos armor»**
(коммит внутри `b2cda62f`), то есть прямо по теме «выталкивание мехоса из
эскейва». Разбирать этот PR первым делом.

### Этап 4 — Миграция на SDL3 (17 коммитов)

Верхняя граница: `7799f53e` (Merge PR #676 sdl3-migration).

```
8fbff4fa Restore the original startup intro on SDL platforms
90034135 Require FFmpeg 6 for AVI playback
a20a996e Remove the unused XRecorder subsystem
c5b9ee94 Migrate the engine and legacy server to native SDL3
765f2bd7 Fix native SDL3 CI dependencies on all desktop platforms
d73811ed Make legacy data compatibility tests work in OSS checkouts
68b4c736 Pin Clunk with a packageable Windows runtime layout
cd42e6fe Apply saved resolution before startup videos
84e28e57 Fix startup options formatting
6e2d017f Accept serialized controller bindings in compatibility tests
46851e2a Preserve network backpressure with SDL3_net
b6638e59 Bypass realtime backpressure for synchronous requests
```

Здесь конфликты будут настоящие, и это ожидаемо: меняются API. Изолированный
этап означает, что каждый конфликт разбирается только по поводу SDL3, а не
вместе с форматированием.

Подзадачи, которые уже частично решены в первой попытке и должны быть
проверены заново:

- `a20a996e` — удаление XRecorder. В первой попытке я выбросил блок `XRec`
  при восстановлении `xgraph`. Нужно убедиться, что upstream-вариант
  удаления совместим.
- `c5b9ee94` — clunk. Нативно `FIND_PACKAGE(Clunk REQUIRED)` против
  `external/clunk-install` (уже собран на upstream-коммите `b52d1fda`).
  Для emscripten остаётся `ExternalDependency`, потому что upstream не умеет
  кросс-компилировать clunk под wasm.
- `cd42e6fe` / `84e28e57` — разрешение и формат опций при старте. Связано с
  жалобой на масштабирование (см. открытые баги).

### Этап 5 — Настройки на TOML (10 коммитов)

Верхняя граница: `9f9e32ec` (Harden TOML groundwork for gamepad bindings).

```
1721db47 Add typed TOML settings foundation
81255955 Centralize CP966 and UTF-8 conversion
42b82c5a Import legacy settings without modifying them
f62ed997 Migrate legacy settings on first TOML launch
519d19ca Use GameSettings for startup, UI, and controls
71e9420c Remove obsolete binary settings persistence
1d5c4f3b Provision toml11 in OSS builds
e9cd6663 Harden TOML defaults and legacy UI adaptation
4ba0a91f Simplify stable keyboard binding serialization
9f9e32ec Harden TOML groundwork for gamepad bindings
```

Нужно помнить: `71e9420c` удаляет бинарную персистентность настроек. Наша
ветка читает опции через `vss` (localStorage в браузере). Проверить, что
`iGetOptionValue` не сломался после удаления.

### Этап 6 — Геймпад SDL3 (13 коммитов)

Верхняя граница: `3e8afe8c` (Merge PR #678 sdl3-gamepad-support).

```
aa462a7d Render legacy AVI frames as opaque video
3be29d00 Add native SDL3 gamepad controls
5d23e40b Complete the default SDL3 gamepad experience
3cf449e9 Make source script parsing independent of line endings
1919d6aa Fix gamepad navigation and multiplayer input
b43ef39d Add standalone interface compiler and focus navigation
7f841d73 Complete SDL3 gamepad navigation and driving controls
629e9aa7 Separate road controls from UI cursor navigation
f1dc5075 Align traction decay with legacy frame cadence
9b85cfd9 Separate menu focus from selection visuals
4d226088 Harden gamepad PR compatibility and Windows settings writes
b73032b5 Make filesystem error tests portable
```

Важно: `aa462a7d` «Render legacy AVI frames as opaque video» — вероятное
лечение синего сдвига в ролике. В первой попытке `lib/xsound/avi.cpp` был
взят из upstream, а браузерная версия была потеряна. Проверить.

`f1dc5075` «Align traction decay with legacy frame cadence» — прямо
касается сцепления, которое мы восстанавливали (`MECHOS_TRACTION_QUANT`).

`3cf449e9` «Make source script parsing independent of line endings» — важно
для нашего JS-рантайма.

### Этап 7 — Мелочи и данные (7 коммитов)

Верхняя граница: `24adfc7f`, затем `71e95b86`.

```
6e4b0923 Do not abort on fullscreen synchronization timeout
f1ad7d79 Publish Fostral world data under CC BY-SA 4.0
```

### Этап 8 — Удаление C++-сервера и сборочная инфраструктура (22 коммита)

Верхняя граница: `8713913f`.

```
3ce6e499 Remove legacy C++ multiplayer server and use standalone Rust server
991aef6b Ignore local build variants and development tool files
acd8eed5 Update multiplayer documentation and current Rust server status
605b16e4 Add MSVC build support
937d7c14 Add MSVC build and run helper scripts
619cc872 Add MSVC GitHub Actions workflow
d3a2cabe Add MSYS2 build and run helper scripts
...
399ea1e7 Update clunk to upstream master b52d1fda
b5f74258 Cap Gluek healing at the vehicle's maximum armor
ab7689ac Keep Gluek armor restoration in VangerUnit
...
8713913f Merge pull request #684 from DileSoft/windows_scripts
```

Проверить: `3ce6e499` удаляет C++-сервер. Наша ветка держит `vange-rs` как
сабмодуль/подкаталог. Нужно понять, удаляет ли upstream что-то из того, что
нам нужно для JS-рантайма.

`b5f74258` (Gluek armor cap) — геймплейная правка, возможно связана с
«выталкиванием из эскейва».

### Этап 9 — Финальная сверка

1. `git log --oneline source/master..HEAD` — должны остаться только наши
   изменения (внешний рендерер, vss, JS-рантайм).
2. Нормализованный построчный diff `b503141b..22a66cdb` против рабочего
   дерева — должен давать пустую выборку по нашим правкам.
3. Сборка и запуск, проверка жалоб пользователя.

## Как делать каждый этап технически

Создать промежуточные ветки на границах и сливать по одной:

```
git branch up-s1 f0476d99
git branch up-s2 aa8f6f78
git branch up-s3 e1300ab2
git branch up-s4 7799f53e
git branch up-s5 9f9e32ec
git branch up-s6 3e8afe8c
git branch up-s7 71e95b86
git branch up-s8 8713913f
```

Затем на новой ветке от `backup/pre-source-master-merge`:

```
git checkout -b wip-js-runtime-staged-merge backup/pre-source-master-merge
# этап 0
git merge --no-ff up-s1     # разрешить, собрать, закоммитить
git merge --no-ff up-s2
...
```

Каждый `merge` приносит только новые коммиты, потому что предыдущие уже
слиты. Конфликт локализован внутри этапа.

После каждого этапа: сборка (`ninja -C build-alpha vangers`) и коммит.

## Чего не делать

- Не согласовывать переводы строк вручную. Только `git add --renormalize`.
- Не брать `7338af38` как источник истины для форматирования — применить
  clang-format самим на этапе 0.
- Не смешивать этапы: если на этапе 4 приходится разрешать конфликт,
  вызванный форматированием, значит этап 0 сделан неполно.
- Не пушить до проверки пользователем.

## Известные ограничения

- wasm-сборка ни разу не компилировалась (нет emsdk и rust wasm-таргета).
  Этапы, трогающие emscripten (`lib/xtool/html5.cpp`, `ExternalDependency`),
  проверить не удастся.
- `thechain/fostral/output.vmt` — в `.gitignore`, отсутствует в обоих
  деревьях.
- `lib/xtool/html5.cpp` всё ещё делает `#include <SDL.h>`, но не входит ни в
  одну цель — SDL3-портировать его нечем, пока он не используется.

## Связанные документы

- `MERGE_NOTES.md` — что было разрешено вручную в первой попытке.
  Остаётся справочным: состав ручных разрешений не изменился.
- `bugs.md` — открытые баги, часть из которых связана с этим мержем.
- `STATUS.md` — текущее состояние ветки и следующий шаг.