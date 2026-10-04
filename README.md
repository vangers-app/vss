# Vangers: Soup Supervisor

![Vangers](http://cdn.akamai.steamstatic.com/steam/apps/264080/header.jpg?t=1447359431)

[![Tauri Release](https://github.com/vangers-app/vss/actions/workflows/tauri-release.yml/badge.svg)](https://github.com/vangers-app/vss/actions/workflows/tauri-release.yml)
[![Join the chat at https://t.me/vangers_mobile](https://patrolavia.github.io/telegram-badge/chat.svg)](https://t.me/vangers_mobile)

[![OSS Linux Build](https://github.com/KranX/Vangers/actions/workflows/oss_linux_build.yml/badge.svg?branch=master)](https://github.com/KranX/Vangers/actions/workflows/oss_linux_build.yml)
[![OSS Windows 64bit Build](https://github.com/KranX/Vangers/actions/workflows/oss_windows_64_build.yml/badge.svg?branch=master)](https://github.com/KranX/Vangers/actions/workflows/oss_windows_64_build.yml)
[![OSS MacOS Build](https://github.com/KranX/Vangers/actions/workflows/oss_macos_build.yml/badge.svg?branch=master)](https://github.com/KranX/Vangers/actions/workflows/oss_macos_build.yml)
[![Clang Format](https://github.com/KranX/Vangers/actions/workflows/clang_format.yml/badge.svg?branch=master)](https://github.com/KranX/Vangers/actions/workflows/clang_format.yml)
[![Join the chat at https://t.me/vangers](https://patrolavia.github.io/telegram-badge/chat.svg)](https://t.me/vangers)

**Vangers: Soup Supervisor** is a deep rework of the original *Vangers* — a unique
video game that blends racing and role-playing across surreal alien worlds. It
extends the original game with first-class modding support and tools for
supervising the soup of creatures that inhabit its worlds.

All source code is published under the GPLv3 license.

## Download

The Fostral world data in [`data/thechain/fostral`](data/thechain/fostral) is
published by Association K-D Lab under the
[Creative Commons Attribution-ShareAlike 4.0 International
license](https://creativecommons.org/licenses/by-sa/4.0/). See
[`LICENSES.md`](LICENSES.md) for the exact licensing scope and attribution.

Grab the latest build for your platform from the
[GitHub Releases page](https://github.com/vangers-app/vss/releases).

You also need the original game resources (maps, sounds, textures, etc.), which you can take from the game purchased on [Steam](http://store.steampowered.com/app/264080) or [GOG](http://www.gog.com/game/vangers).

## Desktop APP (Linux, Windows, MacOS)

Follow action build script `.github\workflows\tauri-release.yml`

* SDL 3.2 or newer
* SDL_net 3.2 or newer
* libvorbis
* SDL3-native clunk from the upstream `master` branch (https://github.com/stalkerg/clunk)
* ffmpeg 6.0 or newer
* toml11 4.4.x
* zlib

## User settings

Vangers stores user preferences and input bindings in the UTF-8
`settings.toml` file. On the first launch after updating, existing
`options.dat` and `controls.dat` files are imported automatically. The legacy
files are kept byte-for-byte unchanged so an older game build can still use
them, but subsequent changes made by the new build are saved only to
`settings.toml`. Save-game files are not affected by this migration.

## Gamepad input

SDL3-compatible gamepads are detected and mapped automatically, including
hot-plugging. With the current default bindings, the left stick steers; the
right and left triggers control forward and reverse throttle. The right stick
moves the UI cursor and, during gameplay, controls side impulses and RIG
movement. Face buttons provide actions, the handbrake, the jump spring and
fire-all; pressing the left stick activates Vector. D-pad up opens inventory,
while right/down/left fire weapon slots 2/3/4. In menus, the D-pad navigates
focus instead. These defaults can be overridden in user settings.
Gamepad buttons can be assigned on the regular controls screen or changed in
`[input.sdl_gamepad.bindings]` in `settings.toml`. Stick axes and trigger
bindings can be changed in
`[input.sdl_gamepad.axes]` and `[input.sdl_gamepad.bindings]`. The game uses one
active gamepad and falls back to the next connected device if it is unplugged.
Strong collisions involving the player's mechos use SDL gamepad rumble when
`input.controller.rumble` is enabled.

The open-source build does not call Steam Input directly. It keeps the active
`SDL_Gamepad`, so a Steam build can associate the same SDL-managed device with
Steam Input without introducing a second device manager.

## Development plans and status

The plans distinguish implemented features, intentional deferrals and runtime
checks still requiring recorded results:

- [Multiplayer refactor](multiplayer-network-refactor-plan.md): matching client
  and Rust-server revisions, completed item/snapshot/latency work and backlog.
- [NetID and ownership architecture](multiplayer-netid-architecture-notes.md):
  current station/owner model and deferred logical-item/generation design.
- [Historical desync investigation](multiplayer-desync-investigation-2026-05-17.md):
  original evidence, superseded as implementation guidance by the network plan.

## Server

The maintained multiplayer server is the separate Rust project
[stalkerg/vangers-srv](https://github.com/stalkerg/vangers-srv).
Use its `master` branch with the current Vangers client: both use network
protocol `6`. Servers using older protocol versions are not compatible with
the current client.

The audited Rust baseline is `29fb0cb`, after merging
`integration/open-prs-2026-04-10` into `master`. See the
[network plan](multiplayer-network-refactor-plan.md) for exact source baselines.
This describes source compatibility, not the revision deployed on a public host.

The legacy C++ server (`vangers_server`) is no longer built or shipped in this
repository, including CI artifacts and Flatpak bundles. Multiplayer client
support is unchanged; hosting a game requires running the Rust server separately.

To build and run the server with a current stable Rust toolchain:

```sh
git clone --branch master https://github.com/stalkerg/vangers-srv.git
cd vangers-srv
cargo run --release --locked -p vangers-srv
```

The default port is TCP `2197`; use `--port` or `VANGERS_PORT` to change it
(for example, `cargo run --release --locked -p vangers-srv -- --port 2198`).
See the server repository's
[environment settings](https://github.com/stalkerg/vangers-srv/blob/master/.env.example),
[Dockerfile](https://github.com/stalkerg/vangers-srv/blob/master/Dockerfile), and
[Compose configuration](https://github.com/stalkerg/vangers-srv/blob/master/compose.yml)
for deployment configuration.

Native clients connect over TCP and do not need WSS or TLS certificates. The
old Docker/websockify launcher has also been removed from this repository;
WebSocket/WSS access for web clients requires a separate proxy and is not built
into the Rust server.


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
