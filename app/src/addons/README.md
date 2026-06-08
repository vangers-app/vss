# Vangers Scripting Subsystem (vss)

`vss` is the entry point to the in-game API. In the current (browser/Tauri) runtime it
lives in [`vss.ts`](./vss.ts) — the engine forwards game *quants* to JS, and addons
attach listeners to those quants to modify the game.

> The legacy Duktape runtime (the `scripting/` folder, `require`-based loader and the
> in-game **F8** hot-reload) is deprecated and being removed. Addons are now plain TS
> modules in this folder, wired up in [`../vss-browser.ts`](../vss-browser.ts).

## The `vss` object

```ts
import vss from "./vss";

vss.addQuantListener("file_open", (payload, stopPropagation) => {
    // inspect payload, optionally return a result to override engine behavior
});
```

Supported quants and their payload/result types are defined by `VssQuantMap` in
`vss.ts`. Use **VS Code + TypeScript** for autocomplete. Multiple listeners may be
attached to the same quant; results are merged (later listener wins), and Promises are
accumulated so a listener can resolve a file/value asynchronously.

## Two classes of mods

### 1. Built-in addons (hardcoded in this folder)

These ship with the app, are not user-installable, and do not appear in the inventory:
mobile controls, camera (`vss-default-options`, `traction`, `ui-options`), fullscreen
(`vss-fullscreen-game`), UI selection (`ui-type-selector`), frame/redraw plumbing, etc.

They are registered in the `addonManifest` array in `vss-browser.ts`. Each entry has an
`id` and a `loader()` that attaches the addon's quant listeners; `isAddonActive`
decides whether to run it. To add one: create a module here exposing an init/loader and
add it to `addonManifest`.

### 2. Downloadable mods (declarative)

User-installable mods (voxels, new models, soundtrack, world jumps, …) are **not** coded
per-mod here. Instead:

- Their **data** is downloaded from GitHub releases and unpacked by the Rust host.
- Their **declaration** lives in `mods.json` inside the
  [vss-geerah-super-set](https://github.com/vangers-app/vss-geerah-super-set) repo
  (`mods` branch) — see that repo's README for the full schema.
- Their **runtime behavior** is implemented here as reusable *behavior types* in
  [`mod-behaviors.ts`](./mod-behaviors.ts), selected and parameterized by each mod's
  `behavior` field:
  - `jump` — teleport to an escave (`{ escaveId }`).
  - `random-file` — random file substitution from a pool of variants
    (`{ folder, pattern, keepOriginalChance }`, see [`random-file.ts`](./random-file.ts)).
  - mods without a `behavior` are pure **file overlays**: their `folders` simply override
    game files with the same relative path (handled generically in `vss-browser.ts`).

To add a new downloadable behavior: implement it as a new entry in the `behaviors` map in
`mod-behaviors.ts`, then reference it by `type` from `mods.json`.
