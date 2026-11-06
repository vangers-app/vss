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

The output will be in etc folder. Upload the archive to a CDN: game data is
not bundled into the apps, every platform downloads it on first launch.

### Game data URL

The download URL is compiled into the app from the `GAME_DATA_URL`
environment variable at build time. The `Tauri Release` workflow takes it from
the repository variable of the same name:

```
gh variable set GAME_DATA_URL -R vangers-app/vss --body "https://example.com/game-data-v1.zip"
```

For a local build export it before `tauri dev` / `tauri build`:

```
GAME_DATA_URL=https://example.com/game-data-v1.zip yarn tauri dev
```

Without the variable the app still builds, but **Download game data** reports
`GAME_DATA_URL is not set at build time`.

### Android

The Android build is produced by GitHub Actions: every run of the
`Tauri Release` workflow uploads the `Vangers-android-aarch64` artifact with
`Vangers-<ref>-android-aarch64.aab` (upload it to Google Play Console) and
`Vangers-<ref>-android-aarch64.apk` (install it directly with `adb install -r`
or from the phone). Tagged releases attach both files to the
[GitHub Release](https://github.com/vangers-app/vss/releases).

Both files are signed with the Play upload key stored in repository secrets;
without the secrets (for example in a pull request from a fork) the build is
unsigned and cannot be installed:

```
gh secret set ANDROID_KEYSTORE_BASE64 -R vangers-app/vss --body "$(base64 -w0 path/to/upload.keystore)"
gh secret set ANDROID_KEYSTORE_PASSWORD -R vangers-app/vss
gh secret set ANDROID_KEY_ALIAS -R vangers-app/vss
gh secret set ANDROID_KEY_PASSWORD -R vangers-app/vss
```

`versionCode` is `1100 + <workflow run number>`, so every run can be uploaded
to Play after the previous one. The first launch shows the
"Game data not found" screen with **Download game data**.

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
is downloaded from the URL compiled into the app (see "Game data URL" above)
and unpacked into the app storage.
