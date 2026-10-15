# BuriedTown 1.5 — foundation

Derivative of Buried City (ArithSeq's mod of BuriedTown 1.4.3 by Locojoy/Dice7).
Original credits stay where they are. This work is non-commercial and stays open source.
See `license.txt`.

This branch is the extension host for the later systems (expeditions,
events, zombies, shelter, residents, mood, story).
A sample item, Binoculars (`1106061`), proves the pipeline: config, strings, loot hook,
loose sprites, save field.

`ext/city` is the living city. Districts are no longer closed forever: loot
returns after a few days, repeat visits deplete it, and ignored districts fill
with the dead. Day bands (1–10, 11–30, 31–60, 61+) scale loot and difficulty.
The map icon shows the danger. `bt.city()` prints the phase and per-site state.

`ext/expedition` is the trip. The site dialog on the map shows noise and bag load.
Binoculars (`1106061`) add a scout line. A heavy bag slows travel and makes dodging
a road encounter take longer. A loud kit (gun, dog, motorcycle) draws more encounters
and sometimes one extra zombie in a battle room. Meat (`1103041`) is bait: the fight
screen offers to spend one and pull zombies off that room. `bt.exp()` prints the levels.

## Run in a browser

From this directory:

```
python3 -m http.server 8080 -d assets
```

Open http://localhost:8080/ . `file://` does not work; the engine loads scripts with XHR.

In the browser console, after a game has started:

```
bt.skipDays(10)
bt.setDay(31)
bt.give(1106061, 1)
bt.dump()
bt.city()
bt.exp()
```

## Check

```
node --experimental-websocket tools/smoke.mjs
python3 localizationChecker/check.py
node tools/build-res-list.js
```

`tools/smoke.mjs` loads the menu in headless Chrome, checks the extension globals,
supermarket loot, the binoculars sprite, and that a v45 save (no `ext` field)
migrates via `onNewGame` and then round-trips.

## Where extensions live

`assets/src/ext/extList.js` is loaded after `jsList.js` on both web (`src/web/webBoot.js`)
and Android (`src/util/AssetsManager.js`). A system is a folder:

- `config.js` — data edits
- `logic.js` — `Hooks.add`, `Ext.register`
- `strings_en.js`, `strings_zh.js`
- `ui.js` when it needs screens

`Hooks.filter` changes values at the seams in site generation, travel, home defense,
and mood. `utils.emitter` carries `site.enter`, `site.roomEnd`, `site.leave`,
`battle.end`, `day.start`, `night.start`, `day.midnight`, `day.oneAM`, `hour`.
Subsystem state is one `ext` object inside the player save. `ClientData.MOD_VERSION`
is 100; a slot without `ext` runs each module's `onNewGame`.

Sprites: `assets/res/ext/` plus `tools/ART.md`. Do not repack atlases.

## Android later

The native loader already pulls `extList.js`. Shipping still means replacing `assets/`
inside the release APK, then zipalign and sign. Not part of this branch.
