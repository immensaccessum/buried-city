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
