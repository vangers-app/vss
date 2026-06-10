# Vangers: Soup Supervisor

![Vangers](http://cdn.akamai.steamstatic.com/steam/apps/264080/header.jpg?t=1447359431)

[![Tauri Release](https://github.com/vangers-app/vss/actions/workflows/tauri-release.yml/badge.svg)](https://github.com/vangers-app/vss/actions/workflows/tauri-release.yml)
[![Join the chat at https://t.me/vangers_mobile](https://patrolavia.github.io/telegram-badge/chat.svg)](https://t.me/vangers_mobile)

**Vangers: Soup Supervisor** is a deep rework of the original *Vangers* — a unique
video game that blends racing and role-playing across surreal alien worlds. It
extends the original game with first-class modding support and tools for
supervising the soup of creatures that inhabit its worlds.

All source code is published under the GPLv3 license.

## Download

Grab the latest build for your platform from the
[GitHub Releases page](https://github.com/vangers-app/vss/releases).

You also need the original game resources (maps, sounds, textures, etc.), which you can take from the game purchased on [Steam](http://store.steampowered.com/app/264080) or [GOG](http://www.gog.com/game/vangers).

## Desktop APP (Linux, Windows, MacOS)

Follow action build script `.github\workflows\tauri-release.yml`

## Mobile APP 

You must provide game data files, to do this use handy script:

```
./scripts/pack-game-data.sh <folder with data> <version>
```

Example:
```
./scripts/pack-game-data.sh Vangers-Steam/game_data v1
```

The output will be in etc folder.

### Android

Copy actual data to `src-tauri/resources/game-data.zip`:

Example:
```
mkdir -p app/src-tauri/resources/ && cp etc/game-data-v1.zip app/src-tauri/resources/game-data.zip
```
