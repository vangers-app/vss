# Состояние ветки и следующий шаг

Обновлено 2026-10-03. Продолжение поэтапного мержа, стадия 4 (SDL3).

## Где мы

Ветка `wip-js-runtime-staged-merge` от `backup/pre-source-master-merge`
(`22a66cdb`). **Не запушена.**

```
2b451a76 Merge branch 'up-s3' into wip-js-runtime-staged-merge
c8cd97a0 Merge upstream stage 2: header self-containment, ...
09a40ddc Record upstream's mass clang-format sweep as merged, ...
abd39d71 Restore vcpkg.json so the MSVC build can configure
29cd32e5 Normalise line endings to LF on our side before merging
22a66cdb (backup/pre-source-master-merge)
```

Стадия 4 в процессе. Из ~200 хунков осталось **68** в трёх файлах.

## Главная причина конфликтов (установлена)

Наша ветка осталась в **базовом форматировании** (brace на следующей строке,
`char*` без пробела), upstream перешёл на **clang-format**. Поэтому почти
каждый наш изменённый файл отличается от upstream'а и по существу, и по
стилю — и git конфликтует.

Проверено: в файлах без наших фич (`i_chat.cpp`, `actintml.cpp`, `ikeys.cpp`,
`xjoystick.cpp`, `avi.cpp`, `xsound.cpp`, `controls.cpp`, `xsocket.h`) наши
уникальные строки — это **старые SDL2-версии** тех же конструкций
(`extern char *` против `const char*`, `SDL_net.h`, `GameController`,
`AV_CODEC_PAR`). Содержательного смысла в них нет.

**Практический вывод:** там, где скан не находит наших фич, верный ответ —
взять upstream целиком. Так были закрыты 8 файлов (51 хунк) за одну операцию.

Сканер фич (искать в `HEAD:<file>`):

```
vss|normal_loop|emscripten|readyQuant|tickQuant|runtimeObjectQuant|readyObject|
AbstractCompositor|renderer::|iOptionsDataLoading|FrameModelHandles|
ExternalModel|BindExternalModel|SyncExternalModel|external_body_color|
__use_external_renderer|request_region_update|libopfs|vange-rs|glad::|SCRIPT
```

## Что сделано в стадии 4

Система сборки приведена к SDL3:
- `CMakeLists.txt`: `-sUSE_SDL=3`, `FIND_PACKAGE(SDL3 3.2 CONFIG)`,
  `SDL3::SDL3` / `SDL3::SDL3_net`; добавлен `ADD_SUBDIRECTORY("tests")`
- `xtool`/`xgraph`/`xsound` переведены на схему upstream (ANDROID→OBJECT,
  иначе STATIC). Из-за этого убраны `$<TARGET_OBJECTS:...>` из не-Android
  ветки `src/CMakeLists.txt` (выражение только для OBJECT) и добавлен `glad`
- Подсистема XRecorder удалена целиком, как у upstream: `xrec.h`,
  `xrecorder/`, `RecorderMode`, `#include "xrec.h"` из `xglobal.h`

Закрытые файлы: `palette.cpp`, `vmap.cpp`, `dynamics.cpp`, `mechos.cpp`,
`network.h`, `network.cpp`(частично), `ikeys.h`, `ikeys.cpp`, `iscreen.cpp`,
`iscr_fnc.cpp`, `xjoystick.h/.cpp`, `xsocket.h/.cpp`, `xglobal.h`,
`xside.h/.cpp`, `xbmp.h/.cpp`, `xcritical.h`, `xtcore.h/.cpp`, `avi.h/.cpp`,
`xsound.cpp`, `ogg_stream.cpp`, `xclock.cpp`, `xerrhead.cpp`, `runtime.h`,
`aci_scr.cpp`, `ascr_fnc.cpp`, `sound.cpp`, `iextern.cpp`, `CMakeLists.txt`
(root и все subdir).

## Решения, которые важно не потерять

- **`xtcore.cpp`**: взята переписанная upstream `main()`; наши vss-вызовы
  сохранены. `sys_initScripts(argv[i])`, `sys_readyQuant()`,
  `sys_tickQuant()` пережили автослияние сами. Потерялся только
  по-итерационный `sys_runtimeObjectQuant(XObj->ID)` — возвращён вручную
  после `XObj = xtGetRuntimeObject(id);`. Наш `normal_loop()` /
  `em_normal_loop()` **не** восстанавливались: upstream делает то же самое
  инлайном, а emscripten-сборка всё равно не проверялась.
- **`network.h`**: `GLOBAL_CLOCK`/`LOCAL_CLOCK` и `START_TIMER` взяты из
  upstream — по условию задачи тайминги в main корректны. Сохранён наш
  `#ifdef EMSCRIPTEN` с `html::emSleep()` внутри `CHECK_TIMER`, но с
  `Uint64` из upstream.
- **`iscr_fnc.cpp`**: снят `if(!RecorderMode)` (XRecorder удалён), но
  **наш блок localStorage** (`iOptionsDataLoading = 1; ... iSetOptionValue`)
  возвращён в `iLoadData` вручную — при «взять theirs» он пропал.
- **`xgraph.cpp`**: наш compositor против их `SDL_Renderer` — в таких хунках
  берётся ours. Окно событий слито: их audio-pause + наш
  `SDL_EVENT_WINDOW_RESIZED` с `compositor->set_viewport(...)` и
  `VisualBackendContext::...->set_screen_resolution(...)`.
- **Палитра (`xgraph.cpp`)**: там же наш порядок байт R,G,B,A. Не брать
  theirs вслепую.

## Метод работы и две ошибки

`edit` не может надёжно выразить многострочный блок с ведущими табами —
проверено, отказы воспроизводимы. Однострочные замены работают. Поэтому для
блоков с табами используется построчный разбор с проверкой маркеров и баланса
скобок; `edit` — для одиночных строк.

Ошибки, которые пришлось исправлять:
1. Скрипт применился к первому хунку вместо нужного (главный цикл вместо
   window-событий) в `xtcore.cpp`. Восстановлено через `git merge-file`
   вручную: `git merge-file --diff3 ours base theirs`, где base = `up-s3`.
2. `git add -A` во время мера стёр информацию о стадиях, из-за чего
   `git checkout --ours/--theirs` стал недоступен. Стороны берутся через
   `git checkout HEAD -- <file>` и `git checkout up-sN -- <file>`.

## Осталось

| Файл | Хунков | Сложность |
|---|---|---|
| `lib/xgraph/xgraph.cpp` | 14 | Высокая: наш compositor против `SDL_Renderer`, палитра |
| `src/network.cpp` | 22 | Средняя: vss-хуки против SDL3_net |
| `src/road.cpp` | 24 | Высокая: GPU-блок отрисовки, `vss::`, `RecorderMode` |

## Сборка

Ветка до стадии 4 — SDL2, локально установлен SDL3, поэтому стадии 1-3 не
собираются и это ожидаемо. Сборка должна заработать на стадии 4.

```
vcvars64.bat && set PATH=%USERPROFILE%\.cargo\bin;%PATH% && ninja -C build-alpha vangers
```

- vcvars: `C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvars64.bat`
- ninja: `C:\Program Files\Microsoft Visual Studio\18\Community\Common7\IDE\CommonExtensions\Microsoft\CMake\Ninja\ninja.exe`
- clunk: `FIND_PACKAGE(Clunk REQUIRED)` против `external/clunk-install`

## Ограничения, заданные пользователем

1. **В `source/master` физика и тайминги работают корректно.** Не «исправлять»
   без доказательств, что виновата наша сторона.
2. Возможно, причина в сочетании правок обеих веток.
3. **Сначала мерж с минимальным числом конфликтов. Баги — потом.**

## Документы

| Файл | Содержание |
|---|---|
| `MERGE_PLAN_STAGED.md` | План: 8 стадий, разбор 116 коммитов |
| `STATUS.md` | Этот файл |
| `bugs.md` | Открытые баги |
| `MERGE_NOTES.md` | Справочный: ручные разрешения первой попытки |
## Stage 4 (SDL2 -> SDL3): merged AND building

Status as of commit eab10725 on wip-js-runtime-staged-merge. Not pushed.

Conflict resolution finished at zero conflicts across the whole tree, then the
build was driven to green. That second half mattered: choosing a side per hunk
also discards whatever the other side closed, so several functions came out
truncated.

What the compiler found that static checking could not:

- CMake could not resolve Clunk::Clunk at all. Our branch fetched clunk via
  ExternalDependency, which exports Clunk::clunk, while every subdirectory links
  against the Clunk::Clunk that FindClunk.cmake defines. Fixed by setting
  CLUNK_ROOT to the prebuilt external/clunk-install and using FIND_PACKAGE,
  which is what upstream does.
- xtcore.cpp had lost a stray #endif and then lost its entire tail, taking
  xtClearMessageQueue, xtRegisterSysMsgFnc, set_key_handlers, the
  xtMsgHandlerObject constructor and the hWnd accessors with it. Restored from
  upstream.
- xgraph.cpp had lost the closing brace of the else block in the window-destroy
  branch, and the SDL_INIT branch had picked up a duplicate closing brace.
- SDL3 renames that -Xignore-space-change cannot see: includes move to SDL3/...,
  SDL_INIT_EVERYTHING is gone, SDL_CreateWindow lost its x/y screen coordinates,
  SDL_WINDOW_FULLSCREEN_DESKTOP is gone, SDL_ConvertSurfaceFormat dropped its
  flags argument, SDL_GetKeyFromScancode takes modstate and key_event,
  SDL_GetKeyName takes SDL_Keycode, and SDL_GL_GetProcAddress returns
  SDL_FunctionPointer rather than a plain function pointer.

Two defects that were already upstream's, not ours:

- i_chat.cpp declared the 62 iSTR_* strings as char* while iscr_fnc.cpp defines
  all 62 as const char*, so the chat strings did not link. Declarations corrected;
  the two arrays that only read them became const.
- multiplayer.h had no include guard whatsoever, which was harmless until the
  SDL3 include graph made it reachable by two paths in one TU. Given the usual
  #ifndef guard the other 92 headers use.

Deleted xtcore.cpp.BASE.cpp, xtcore.cpp.LOCAL.cpp and xtcore.cpp.REMOTE.cpp:
merge scaffolding from the first single-merge attempt that had been committed by
mistake. Nothing referenced them.

A PowerShell trap worth recording for the remaining stages: variable names are
case-insensitive, so declaring  = [char]9 silently overwrote , the variable
holding the file text. One script wrote a 2510-line C++ file as a single
character. Always use distinct names such as  and # Состояние ветки и следующий шаг

Обновлено 2026-10-03. Продолжение поэтапного мержа, стадия 4 (SDL3).

## Где мы

Ветка `wip-js-runtime-staged-merge` от `backup/pre-source-master-merge`
(`22a66cdb`). **Не запушена.**

```
2b451a76 Merge branch 'up-s3' into wip-js-runtime-staged-merge
c8cd97a0 Merge upstream stage 2: header self-containment, ...
09a40ddc Record upstream's mass clang-format sweep as merged, ...
abd39d71 Restore vcpkg.json so the MSVC build can configure
29cd32e5 Normalise line endings to LF on our side before merging
22a66cdb (backup/pre-source-master-merge)
```

Стадия 4 в процессе. Из ~200 хунков осталось **68** в трёх файлах.

## Главная причина конфликтов (установлена)

Наша ветка осталась в **базовом форматировании** (brace на следующей строке,
`char*` без пробела), upstream перешёл на **clang-format**. Поэтому почти
каждый наш изменённый файл отличается от upstream'а и по существу, и по
стилю — и git конфликтует.

Проверено: в файлах без наших фич (`i_chat.cpp`, `actintml.cpp`, `ikeys.cpp`,
`xjoystick.cpp`, `avi.cpp`, `xsound.cpp`, `controls.cpp`, `xsocket.h`) наши
уникальные строки — это **старые SDL2-версии** тех же конструкций
(`extern char *` против `const char*`, `SDL_net.h`, `GameController`,
`AV_CODEC_PAR`). Содержательного смысла в них нет.

**Практический вывод:** там, где скан не находит наших фич, верный ответ —
взять upstream целиком. Так были закрыты 8 файлов (51 хунк) за одну операцию.

Сканер фич (искать в `HEAD:<file>`):

```
vss|normal_loop|emscripten|readyQuant|tickQuant|runtimeObjectQuant|readyObject|
AbstractCompositor|renderer::|iOptionsDataLoading|FrameModelHandles|
ExternalModel|BindExternalModel|SyncExternalModel|external_body_color|
__use_external_renderer|request_region_update|libopfs|vange-rs|glad::|SCRIPT
```

## Что сделано в стадии 4

Система сборки приведена к SDL3:
- `CMakeLists.txt`: `-sUSE_SDL=3`, `FIND_PACKAGE(SDL3 3.2 CONFIG)`,
  `SDL3::SDL3` / `SDL3::SDL3_net`; добавлен `ADD_SUBDIRECTORY("tests")`
- `xtool`/`xgraph`/`xsound` переведены на схему upstream (ANDROID→OBJECT,
  иначе STATIC). Из-за этого убраны `$<TARGET_OBJECTS:...>` из не-Android
  ветки `src/CMakeLists.txt` (выражение только для OBJECT) и добавлен `glad`
- Подсистема XRecorder удалена целиком, как у upstream: `xrec.h`,
  `xrecorder/`, `RecorderMode`, `#include "xrec.h"` из `xglobal.h`

Закрытые файлы: `palette.cpp`, `vmap.cpp`, `dynamics.cpp`, `mechos.cpp`,
`network.h`, `network.cpp`(частично), `ikeys.h`, `ikeys.cpp`, `iscreen.cpp`,
`iscr_fnc.cpp`, `xjoystick.h/.cpp`, `xsocket.h/.cpp`, `xglobal.h`,
`xside.h/.cpp`, `xbmp.h/.cpp`, `xcritical.h`, `xtcore.h/.cpp`, `avi.h/.cpp`,
`xsound.cpp`, `ogg_stream.cpp`, `xclock.cpp`, `xerrhead.cpp`, `runtime.h`,
`aci_scr.cpp`, `ascr_fnc.cpp`, `sound.cpp`, `iextern.cpp`, `CMakeLists.txt`
(root и все subdir).

## Решения, которые важно не потерять

- **`xtcore.cpp`**: взята переписанная upstream `main()`; наши vss-вызовы
  сохранены. `sys_initScripts(argv[i])`, `sys_readyQuant()`,
  `sys_tickQuant()` пережили автослияние сами. Потерялся только
  по-итерационный `sys_runtimeObjectQuant(XObj->ID)` — возвращён вручную
  после `XObj = xtGetRuntimeObject(id);`. Наш `normal_loop()` /
  `em_normal_loop()` **не** восстанавливались: upstream делает то же самое
  инлайном, а emscripten-сборка всё равно не проверялась.
- **`network.h`**: `GLOBAL_CLOCK`/`LOCAL_CLOCK` и `START_TIMER` взяты из
  upstream — по условию задачи тайминги в main корректны. Сохранён наш
  `#ifdef EMSCRIPTEN` с `html::emSleep()` внутри `CHECK_TIMER`, но с
  `Uint64` из upstream.
- **`iscr_fnc.cpp`**: снят `if(!RecorderMode)` (XRecorder удалён), но
  **наш блок localStorage** (`iOptionsDataLoading = 1; ... iSetOptionValue`)
  возвращён в `iLoadData` вручную — при «взять theirs» он пропал.
- **`xgraph.cpp`**: наш compositor против их `SDL_Renderer` — в таких хунках
  берётся ours. Окно событий слито: их audio-pause + наш
  `SDL_EVENT_WINDOW_RESIZED` с `compositor->set_viewport(...)` и
  `VisualBackendContext::...->set_screen_resolution(...)`.
- **Палитра (`xgraph.cpp`)**: там же наш порядок байт R,G,B,A. Не брать
  theirs вслепую.

## Метод работы и две ошибки

`edit` не может надёжно выразить многострочный блок с ведущими табами —
проверено, отказы воспроизводимы. Однострочные замены работают. Поэтому для
блоков с табами используется построчный разбор с проверкой маркеров и баланса
скобок; `edit` — для одиночных строк.

Ошибки, которые пришлось исправлять:
1. Скрипт применился к первому хунку вместо нужного (главный цикл вместо
   window-событий) в `xtcore.cpp`. Восстановлено через `git merge-file`
   вручную: `git merge-file --diff3 ours base theirs`, где base = `up-s3`.
2. `git add -A` во время мера стёр информацию о стадиях, из-за чего
   `git checkout --ours/--theirs` стал недоступен. Стороны берутся через
   `git checkout HEAD -- <file>` и `git checkout up-sN -- <file>`.

## Осталось

| Файл | Хунков | Сложность |
|---|---|---|
| `lib/xgraph/xgraph.cpp` | 14 | Высокая: наш compositor против `SDL_Renderer`, палитра |
| `src/network.cpp` | 22 | Средняя: vss-хуки против SDL3_net |
| `src/road.cpp` | 24 | Высокая: GPU-блок отрисовки, `vss::`, `RecorderMode` |

## Сборка

Ветка до стадии 4 — SDL2, локально установлен SDL3, поэтому стадии 1-3 не
собираются и это ожидаемо. Сборка должна заработать на стадии 4.

```
vcvars64.bat && set PATH=%USERPROFILE%\.cargo\bin;%PATH% && ninja -C build-alpha vangers
```

- vcvars: `C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvars64.bat`
- ninja: `C:\Program Files\Microsoft Visual Studio\18\Community\Common7\IDE\CommonExtensions\Microsoft\CMake\Ninja\ninja.exe`
- clunk: `FIND_PACKAGE(Clunk REQUIRED)` против `external/clunk-install`

## Ограничения, заданные пользователем

1. **В `source/master` физика и тайминги работают корректно.** Не «исправлять»
   без доказательств, что виновата наша сторона.
2. Возможно, причина в сочетании правок обеих веток.
3. **Сначала мерж с минимальным числом конфликтов. Баги — потом.**

## Документы

| Файл | Содержание |
|---|---|
| `MERGE_PLAN_STAGED.md` | План: 8 стадий, разбор 116 коммитов |
| `STATUS.md` | Этот файл |
| `bugs.md` | Открытые баги |
| `MERGE_NOTES.md` | Справочный: ручные разрешения первой попытки |, and re-verify the
line count after every write.

vangers.exe builds clean. Stages 5 to 8 are still to do:
up-s5 59f9e32ec, up-s6 3e8afe8c, up-s7 71e95b86, up-s8 8713913f, then
reconcile vcpkg.json at stage 8 and push.
## Stages 5 to 8: all upstream merged, branch is not pushed

Final state at be50f016 on wip-js-runtime-staged-merge.

Verification: HEAD..source/master is zero commits, so the whole upstream history
is inside our branch. vangers.exe builds, every target builds, and all eight
ctest cases pass.

Conflict counts per stage, with -Xignore-space-change:

| stage | subject | files | hunks left to resolve |
|---|---|---|---|
| 4 | SDL2 to SDL3 | 65 | 68, then fixed by the compiler |
| 5 | TOML settings | 12 | 18 |
| 6 | SDL3 gamepad | 15 | 41 |
| 7 | Fostral licensing | 1 | 1 |
| 8 | C++ server removal, MSVC/MSYS2 | 34 | 61 |

Only four resolutions across stages 5 to 8 needed judgement; everything else was
upstream's side.

### iLoadData, stage 5

The one that mattered. Upstream deleted the binary persistence and replaced
iScrDisp->load_data with apply_settings_to_interface(), and that call is what our
branch depended on, because iGetOptionValue() routes through vss to localStorage.
Order is now deliberate: apply_settings_to_interface() runs first and performs the
one-time migration, then our block reads each option back through vss and writes
it into the C++ option state, so localStorage still wins over settings.toml.
Verified beforehand that the vss hook sits at line 994 in iextern.cpp and the
localStorage block at 2164 in iscr_fnc.cpp, both outside every conflict range.

### __WORDSIZE in xglobal.h, stage 8

Taking upstream reintroduced a block we had dropped at stage 4. It defines
__WORDSIZE as "__WORDSIZE = 32" whenever __LP64__ is absent, which is wrong twice
over: the spaces make the macro expand to a bare "= 32" that duk_config.h then
evaluates inside an #if, and MSVC does not define __LP64__, so an x64 build would
claim 32-bit pointers. Our vss bridge is what exposes it, because dynamics.cpp and
road.cpp include global.h before vss/sys.h, so xglobal.h reaches duktape.
duk_config.h is the only reader and has a documented fallback for the
neither-32-nor-64 case, which is what stages 4 to 7 built in. The block stays out,
with a comment explaining why.

### surmap and lib/utils stay absent

I restored both at stage 8, because upstream actively builds them and our branch
had dropped them at stage 6 on the mistaken reading that they were dead. They are
not dead, but they cannot be built against our integration: surmap compiles
src/3d/dynamics.cpp and so needs duktape headers plus the vss symbols, and
lib/utils links xtool while sys_fileOpenQuant lives in vangers' own sources
rather than in a library. Upstream can build them because it has no vss bridge.
Decision was to keep them absent rather than restructure the build around a vss
static library at the last stage. If they are wanted later, the work is to extract
src/vss into a library that vangers, surmap and xtool all link.

### Renderer include roots moved to the root CMakeLists

Structural rather than a merge decision. Stage 5 needed lib/renderer/src added to
sdl_event_buffer_test, stage 6 needed it again for network_control_flags_test, and
stages 7 and 8 add more tests. xgraph.h and 3dobject.h both expose the renderer in
their own headers, so the roots now sit in the root CMakeLists and every target
inherits them. The per-test duplication stage 5 introduced was removed.

### Other keeps

mechos.cpp keeps both vss/sys.h and cstdint, since ours serves the vss::sys()
camera hook. xgraph.cpp keeps the compositor path for HDBackgroundTexture, since
upstream would substitute SDL_SetTextureColorMod on an SDL_Texture we do not have.
.gitignore keeps the vss build artefacts. README keeps both badge sets and both
Mobile APP and Server sections. vcpkg.json is the add/add reconciliation the plan
asked for: ours is a strict superset, same six dependencies plus a
builtin-baseline that pins versions. xcompat.h keeps _CRT_NONSTDC_NO_DEPRECATE
because that is the macro our CMakeLists actually defines.

### Bugs

bugs.md records one item and it is now closed: the settings test failed
deterministically on stage 5, diagnosed as replace_file calling MoveFileExW with
MOVEFILE_REPLACE_EXISTING once and no retry, and upstream fixed exactly that in
4d226088 at stage 6 by adding a process-wide mutex and a bounded retry on the
transient Windows errors. Reasoning kept, because unique temporary names do not
make replacement of a shared destination reliable.

The open bugs from bugs.md that predate this merge are untouched: the MLVOT crash,
the terrain buffer overruns, and the video palette blue shift. Those come next.