# Extension art

New sprites are loose PNGs in `assets/res/ext/`, named exactly like atlas frames
(`icon_item_<id>.png`, `dig_item_<id>.png`, `monster_dig_type_<id>.png`,
`build_<bid>_<level>.png`, `site_<id>.png`). `ExtAssets` registers each file
under that filename, so UI code does not change and atlases are not repacked.

Sizes measured from the original plists:

| Kind | Frame | Pixels |
| --- | --- | --- |
| Item icon | `icon.plist` | 84 x 84 |
| Item dig art | `dig_item.plist` | 446 x 264 |
| Monster dig art | `dig_monster.plist` | 526 x 230 |

## Style

Monochrome pencil sketch on a plain white background, matching Buried City's
dig art: rough graphite, no color, no text, no frame, subject centered with
empty margin. White is stripped to transparency by `tools/prep-sprite.py`.

## Prompt template

"Monochrome graphite pencil sketch of SUBJECT, Buried Town survival-game item
art, rough pencil hatching, plain white background, centered, no text, no border."

## Pipeline

1. Generate the image.
2. Fit it:

```
python3 tools/prep-sprite.py raw.png assets/res/ext/icon_item_1106061.png 84 84
python3 tools/prep-sprite.py raw.png assets/res/ext/dig_item_1106061.png 446 264
```

3. `node tools/build-res-list.js` so the web preload list includes `res/ext/`.
4. Reference the frame from config or `ExtAssets.add("icon_item_1106061.png")`.
