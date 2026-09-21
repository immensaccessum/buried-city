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
