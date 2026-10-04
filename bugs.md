# Известные баги

## Crash в `regSet` при анимации MLVOT

**Статус:** открыт. Замечено 2026-10-03 на ветке `wip-js-runtime-alpha-fixes`.

### Симптом

`EXCEPTION_ACCESS_VIOLATION` во время игры, не при старте. На старте и в первые
минуты игра работает нормально, падение привязано к определённому моменту в
геймплее, поэтому воспроизводится не сразу.

```
Abort: Error: EXCEPTION_ACCESS_VIOLATION
[0] regSet,             src/terra/land.cpp(937)
[0] MLFrame::quant,     src/units/moveland.cpp(1446)
[0] MobileLocation::quant, src/units/moveland.cpp(1219)
[0] MLquant,            src/units/moveland.cpp(1589)
[0] iGameMap::draw,     src/road.cpp(1993)
[0] gameQuant,          src/road.cpp(1958)
[0] GameQuantRTO::Quant, src/road.cpp(1144)
[0] normal_loop,        lib/xtool/xtcore.cpp(154)
```

Код падения (`src/terra/land.cpp:928-938`):

```cpp
uchar* uw = waterBuf[0],*w = waterBuf[1],*dw = waterBuf[2];
memset(dw,0,sx);
...
for(i = 0,x = x0l;i < sx;i++,x = XCYCL(x + 1),pf++,pfd++){
    if(!x){ pf = pf0; pfd = pfd0; }
    *uw++ = IS_WATER(*pf);
    *w++ = IS_WATER(*pfd);      // <-- 937, падение
}
```

### Анализ

`waterBuf[i]` аллоцируются в `RenderPrepare()` (`src/terra/land.cpp:85-87`)
размером ровно `map_size_x` байт каждый:

```cpp
uchar* p = new uchar[3*map_size_x];
memset(p,0,3*map_size_x);
for(i = 0;i < 3;i++,p += map_size_x) waterBuf[i] = p;
```

Длина прохода задаётся в `regSet` (`src/terra/land.cpp:921`):

```cpp
int sx = getDeltaX(x1,x0) + 3;
```

а `getDeltaX` (`src/terra/vmap.h:162`) возвращает **зацикленную** дельту:

```cpp
inline int getDeltaX(int v0,int v1) { return XCYCL(v0 - v1 + H_SIZE); }
```

Значит `sx` лежит в диапазоне `[3, H_SIZE + 2]`, тогда как буфер равен
`map_size_x`. Две версии, обе требуют проверки:

1. **`sx` превышает `map_size_x`.** Если `map_size_x == H_SIZE`, то уже при
   `getDeltaX == H_SIZE - 1` получаем `sx == H_SIZE + 2`, то есть выход за
   границу на 2 байта и больше. Это происходит, когда два сравниваемых ML-кадра
   расположены почти на всю ширину карты друг от друга — то есть редко, отсюда
   и «падает не сразу».
2. **`RenderPrepare()` не перевыделяет буферы при смене размера карты.**
   Выделение защищено `if(!shadowParent)` (`src/terra/land.cpp:82`), поэтому при
   переходе на карту/эскаву другого размера `waterBuf` остаётся sized по
   предыдущей карте. Если новая карта шире — переполнение гарантировано.

Обе гипотезы согласуются с тем, что падение происходит в игре, а не на старте.

### Что делать

- Проверить соотношение `sx` и размера буфера; безопасное условие — сравнивать
  `sx` с фактическим размером буфера, а не с `map_size_x` из предположения.
- Перевести выделение `waterBuf`/`shadowParent` на перевыделение при изменении
  `map_size_x` (например, хранить выделенный размер и сравнивать).
- Проверить, нет ли той же проблемы в `shadowParent` (`4*map_size_x`).

### Не связано с изменениями рендерера

Падение происходит в воксельной анимации MLVOT (`iGameMap::draw`, `road.cpp:1993`),
то есть **до** блока внешнего рендерера (`road.cpp:2000+`). Правки
`msvc-fixes` (MSVC-сборка) и анимации `.a3d` ни `land.cpp`, ни `moveland.cpp`,
ни `waterBuf` не затрагивают.

Замечено при прогоне `wip-js-runtime-alpha-fixes`, но баг старый — код в
`land.cpp`/`vmap.h` не менялся в этих коммитах. Требуется отдельная проверка на
чистом `wip-js-runtime-alpha`.
## ~~settings тест падал на Windows~~ - исправлено upstream на этапе 6

Было открыто на этапе 5, наш merge его не вызывал: src/settings/* и
	ests/settings_test.cpp побайтово совпадали с up-s5.

Симптом: ctest давал FAIL: a concurrent settings save failed, детерминированно
(3 прогона из 3).

Причина была в eplace_file (src/settings/settings_io.cpp): на Windows он
один раз вызывал MoveFileExW(..., MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH)
и любой отказ считал фатальным - повторов не было. Тест запускает 24 потока,
каждый делает load() + save() по одному пути, и Windows в этот момент может
вернуть ERROR_ACCESS_DENIED или ERROR_SHARING_VIOLATION, потому что цель
мгновенно занята заменой другого потока; tomic_write удалял временный файл и
возвращал alse. В ветке #else стоит std::filesystem::rename, который в
POSIX атомарно перезаписывает цель, поэтому на Linux тест проходил.

Исправлено нами не было: файлы побайтово совпадали с up-s5. Upstream починил
это сам в 4d226088 Harden gamepad PR compatibility and Windows settings writes
на этапе 6: добавлен std::mutex, сериализующий замену внутри процесса, и до 32
повторов с экспоненциальной задержкой на ERROR_ACCESS_DENIED,
ERROR_SHARING_VIOLATION, ERROR_LOCK_VIOLATION и ERROR_USER_MAPPED_FILE.
На этапе 6 ctest даёт 8 из 8.

Оставлено в ugs.md, потому что приём пригодился: уникальные временные имена
не делают замену общей цели надёжной, нужен ещё и сериализующий замок.