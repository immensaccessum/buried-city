# Buried City — Web Port Notes

Derivative work of **Buried City** (mod by ArithSeq of BuriedTown 1.4.3 by Locojoy/Dice7).
See `license.txt` — non-commercial, must stay open source, original credits untouched.

## Part 1 — Source audit
- Repo contains the full, unobfuscated game JS: `assets/main.js`, `assets/src/**` (game, ui, data, util),
  `assets/res/**` (sprite sheets, music, sfx), plus the native JSB glue in `assets/script/` (not used on web).
- No `project.json` in the repo (the APK build generated/ignored it) — the web build adds its own.
- No APK download was needed.
- `src/jsList.js` lists all game scripts; `src/data/string/string.js` is a placeholder name that the loader
  swaps for `string_en.js` / `string_zh.js` at runtime.
- Engine marker: `script/jsb_cocos2d.js` → `cc.ENGINE_VERSION = "Cocos2d-JS v3.6"`.

## Part 2 — Web build on cocos2d-html5 v3.6
- Engine: cocos2d-html5 tag `Cocos2d-html5-v3.6` (matches `Cocos2d-JS v3.6` in the JSB glue).
- `tools/build-engine.js` concatenates the modules the game needs (`cocos2d`, `extensions`, `ccui`)
  into `assets/frameworks/cocos2d-js-v3.6.js` (one request instead of ~270). Engine checkout lives in
  `tools/.cache/` (git-ignored): `git clone --depth 1 -b Cocos2d-html5-v3.6 https://github.com/cocos2d/cocos2d-html5 tools/.cache/cocos2d-html5`.
- `assets/index.html` + `assets/project.json` are the web entry points; `assets/main.js` is unchanged.
- `src/util/preloading.js` now calls `WebBoot.run()` when not native. `src/web/webBoot.js` does what the
  native `AssetsManagerLoaderScene` did: picks the language string table, loads `src/jsList.js`,
  preloads textures, starts `MenuScene`.

## Part 3 — Textures
- 10 atlases were still `.pvr.ccz` (zlib CCZ around PVR v2 RGBA4444 / PVR v3 RGBA8888, straight alpha),
  which cocos2d-html5 cannot decode. `tools/convert_pvr.py` converted them to PNG, repointed each `.plist`
  and removed the `.pvr.ccz` files. PNG also works on native, so the Android layout is not broken.
- `tools/build-res-list.js` writes `src/web/resList.js` (all plists + images, preloaded at boot).
  Re-run it after adding images.

## Part 4 — Native-only calls
All stand-ins live in `assets/src/web/` and never contact a server.
| Native call | Web behaviour | File |
|---|---|---|
| `jsb.reflection` → `CommonUtil.gotoUrl` | `window.open` new tab | platform.js |
| `CommonUtil.md5` (radio achievement backup/restore) | JS MD5, same hex output | platform.js |
| `CommonUtil.getMetaData`, `getLocaleLanguage` | `""`, `navigator.language` | platform.js |
| `PayHelper.init` / `exitGame` (IAP SDK, back-button exit) | no-op (IAP is already free in the mod) | platform.js |
| `jsb.fileUtils` search paths / `isFileExist` | in-memory paths / HTTP HEAD | platform.js |
| JSB `require` / `__cleanScript` (language switch) | sync XHR + global eval | platform.js |
| Update check (studio.code.org JSON) | disabled | webOverrides.js |
| Message wall `chatScene` (code.org datablock server) | shows an offline notice | webOverrides.js |
| `ccui.WebView` credits page (`DialogMoreGame`) | DOM iframe overlay of `index_en.html` | webOverrides.js |
| Ads, Google Play, leaderboards, analytics | already removed by the mod (adHelper is local; "rank" is the local cemetery log) | — |
| Radio | local in-game feature, no network | — |

Engine differences fixed (`engineCompat.js`, `uiUtil.js`): `new cc.ControlButton(label)` semantics, and the
game's `cc.LabelTTF` wrapper (calls a class without `new`, JSB-only) is now native-only.
The native font `FZDaHei-B02S` is mapped to system sans-serif fonts via `@font-face local()` in index.html.
- Follow-up: the repo's `res/new_temp.plist/png` is older than the release_6 APK's and lacks frames the
  code uses (`icon_iap_111.png`, ...). Replaced with the APK's copy. The APK's other assets match the repo.

## Part 5 — Saves
Every read/write of persistent data in the game goes through `cc.sys.localStorage.getItem/setItem/removeItem`
(`src/game/record.js`, `game.js`, `SaveFileScene.js`, `MenuScene.js`, `medal.js`, `achievement.js`, `radioNode.js`,
...). On Android the JSB engine backs that object with the encrypted sqlite3 db. On the web it is replaced by
**`src/web/saveStore.js`** (`SaveStore`), loaded first:
- Same synchronous API, served from an in-memory copy, written through to `window.localStorage` under the
  `buriedcity:` prefix. Falls back to memory-only if storage is blocked.
- Slot data: `record` holds `player<N>`, `time<N>`, `navigation<N>` for all slots; per-slot extras are
  `chosenTalent<N>`, `radio<N>`, `medalTemp<N>`, `ad<N>`, `weather<N>`. Cross-save: `achievement`, `medal`,
  `dataLog` (cemetery), `lastScore`, `cheat`. Settings/device: `language`, `sound`, `music`, `screenfix`, `ftue`,
  `modVer`, `uuid`, `username`.
- Hooks for a future sync layer (not implemented): `SaveStore.onChange(fn)`, `exportAll()`, `importAll(obj, merge)`,
  `keys()`.

## Part 6 — Phone fit, touch, run
- Portrait 640x1136 design size. On web the default screen mode is the game's own "Full" setting
  (`screenfix` = 2 → SHOW_ALL letterbox) instead of the native "shrink" mode, which cropped the sides on
  tall phones. Changeable in Settings. Viewport meta disables zoom; CSS disables scroll/overscroll/selection.
- Touch works through the engine's touch listeners (tested with emulated touch taps).
- Default language English (`WebBoot` forces `en` unless the player picked Chinese in Settings).
- Robustness (`engineCompat.js`): JSB logs script errors and keeps going; html5 froze the frame loop and
  wedged the touch dispatcher on the first error. Both now log and continue. Added `cc.Node#removeChildByName`.
  `SettingLayer` calls two selectors the mod removed; stubbed. Fixed `gsetItem` typo in the v29/30 save migration.
- Verified in headless Chrome (Pixel-sized viewport, touch): menu renders, new game → talents → intro → shelter
  → gate → map; slot 1 persists across a page reload and a full browser restart and resumes into the game.

Run locally:  `python -m http.server 8080 -d assets`  → http://localhost:8080/
(any static server works; opening index.html from file:// does not, the engine loads files via XHR).

Known gaps: background music is `.ogg` (older iOS Safari cannot play it; transcode to .mp3/.m4a if needed).
The message wall and update check are offline. On mobile browsers the engine requests fullscreen on the
first tap (a harmless "Permissions check failed" is logged on load).
