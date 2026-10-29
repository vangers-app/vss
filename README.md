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

### iOS

The iOS build is produced by GitHub Actions only (no Mac required to build):
every run of the `Tauri Release` workflow uploads an **unsigned** IPA as the
`Vangers-ios-aarch64` artifact, and tagged releases attach
`Vangers-<tag>-ios-aarch64.ipa` to the
[GitHub Release](https://github.com/vangers-app/vss/releases).

The IPA is not signed, so you sign it yourself with a free Apple ID and install
it over USB with [Sideloadly](https://sideloadly.io/) (Windows/macOS) or
[AltStore](https://altstore.io/). A free Apple ID signature expires after
7 days: re-sideload the same IPA to renew it, the app data stays in place.

Game data is not bundled into the IPA. On first launch the app shows the
"Game data not found" screen with a **Download game data** button: the archive
is downloaded from the URL compiled into the app (`GAME_DATA_URL` in
`app/src-tauri/src/lib.rs`) and unpacked into the app storage. Pack the archive
with `scripts/pack-game-data.sh` as described above.
