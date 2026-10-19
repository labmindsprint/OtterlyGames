# 3D art credits

Every sprite in this folder is pre-rendered from 3D models with Blender (`tools/render_sprites.py`, `tools/pack_sprites.py`).

## Enemy models (boss, armor, wisp, runner)

- Source: "Animated Mech Pack" by Quaternius (George, Leela, Mike and Stan, rig and animations included)
  - https://opengameart.org/sites/default/files/animated_mech_pack_-_march_2021.zip
  - https://quaternius.com/packs/animatedmech.html
- Licence: CC0 1.0 Universal (public domain dedication), https://creativecommons.org/publicdomain/zero/1.0/
- No attribution is required; the credit is given as a courtesy. The models were re-lit, re-textured with damage
  materials (scorch, glowing fractures) and re-posed for these sprites.

## Enemy families (boss-scout, boss-walker, boss-brute, boss-crystal, boss-forge, boss-void)

- Derived from the same CC0 Quaternius "Leela" mech: the body and animation are unchanged, and family kits (horns,
  plates, spikes, rings, stacks) were built in Blender from primitives (`tools/sprites/boss-*.json`). No other
  third-party model.
- The ordinary enemies of each family (wisp, runner, armor) are the core atlases re-coloured at load time in the
  game (`src/game/familyArt.ts`); they add no files.

## Turret sprites

- Built procedurally in Blender from primitives (`tools/render_turret.py`); no third-party model.
