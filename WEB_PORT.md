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
