# Otterly Space Academy: store and launcher icon assets

Brand: deep-navy space (`#102237`), teal (`#83E3D1`) and orange (`#ff8a1f`) accents, comic ink outline (`#2b2b2b`).
Focal idea: **Ringo the otter looking out of a rocket's canopy** (Ringo art copied from `ringo()` in `js/space-academy/pitstop/ui.mjs`, mood `cheer`; rocket shape and palette follow `pitstop/ships/class-1.mjs`). No text on any icon.

Nothing here is wired into the Android project yet. These files are staged so they can be reviewed first.

## Files

| File | Size | Use |
| --- | --- | --- |
| `icon-master.svg` | 512x512 | Master for the Play Store icon and the legacy launcher icons. Full-bleed, square corners, opaque. |
| `icon-512.png` | 512x512, 32-bit RGBA, fully opaque, ~127 KB | **Play Console > Store settings / Main store listing > App icon** (needs 512x512 32-bit PNG, under 1 MB). Google applies the mask. |
| `feature-graphic.svg` | 1024x500 | Source for the feature graphic. Uses Patrick Hand from `fonts/` (the game's comic font). |
| `feature-graphic-1024x500.png` | 1024x500, ~320 KB | **Play Console > Main store listing > Feature graphic**. Title, tagline and rocket sit in the central area. |
| `ic_launcher_background.svg` | 108x108dp | Adaptive-icon background layer (navy space, teal glow, orange planet, stars). |
| `ic_launcher_foreground.svg` | 108x108dp | Adaptive-icon foreground layer. All key art is inside the central 66dp safe circle. |
| `ic_launcher_monochrome.svg` | 108x108dp | Android 13+ themed-icon layer. Single-colour silhouette; alpha only, the system tints it. |
| `res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png` | 48 / 72 / 96 / 144 / 192 px | Legacy (API < 26) rounded-square icon. |
| `res/mipmap-*/ic_launcher_round.png` | 48 / 72 / 96 / 144 / 192 px | Legacy round icon. |
| `res/mipmap-*/ic_launcher_foreground.png` | 108 / 162 / 216 / 324 / 432 px | Adaptive foreground (transparent). |
| `res/mipmap-*/ic_launcher_background.png` | 108 / 162 / 216 / 324 / 432 px | Adaptive background (opaque). |
| `res/mipmap-*/ic_launcher_monochrome.png` | 108 / 162 / 216 / 324 / 432 px | Themed-icon layer (alpha only). |
| `res/mipmap-anydpi-v26/ic_launcher.xml`, `ic_launcher_round.xml` | n/a | Adaptive icon definitions (background, foreground, monochrome). minSdk is 26, so no older XML is needed. |
| `preview-masks.png` | ~984x582 | QA sheet: circle, squircle and rounded-square masks, safe-zone overlay, themed icon (light, dark, lilac) and legacy icons. |
| `preview-small.png` | 860x480 | QA sheet: `icon-512.png` at 48, 96 and 192 px on light and dark, plus 48 px zoomed 4x. |
| `fonts/patrick-hand-latin.woff2` | 24 KB | Copy of `/fonts/patrick-hand-latin.woff2`, so the feature graphic renders the same on any machine. |
| `build-icons.py` | n/a | Regenerates every PNG and preview, then verifies size, mode and file size. |

## Regenerate

```powershell
pip install playwright pillow
playwright install chromium
python "android\space-academy\store-assets\build-icons.py"
```

The script renders the SVGs with headless Chromium (Playwright) and fails loudly if the font does not load or any dimension is wrong. Edit the SVG masters, then re-run. `ic_launcher_foreground.svg`, `icon-master.svg` and `feature-graphic.svg` share one copy-pasted rocket group; change all three together.

## Install into the Android project (not done yet)

Run from `android\space-academy`:

```powershell
Copy-Item store-assets\res\* app\src\main\res -Recurse -Force
# remove the old vector launcher icon and its anydpi / anydpi-v33 XML, which would override the new icons
Remove-Item app\src\main\res\mipmap-anydpi, app\src\main\res\mipmap-anydpi-v33 -Recurse
Remove-Item app\src\main\res\drawable\ic_launcher_foreground.xml, app\src\main\res\drawable\ic_launcher_monochrome.xml
```

Then in `AndroidManifest.xml` set `android:roundIcon="@mipmap/ic_launcher_round"` (it currently points at `@mipmap/ic_launcher`). `values/colors.xml` `launcher_background` can stay or be removed.
