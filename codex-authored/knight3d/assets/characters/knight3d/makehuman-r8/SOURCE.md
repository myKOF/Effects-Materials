# Silver knight R8 — six MakeHuman + Blender actions

R8 continues the R7 static silver knight after the user allowed work to resume.
It does not replace earlier candidates or install a new character into the game.

## Authorship and license

The human foundation, standard rig/weights and low-poly eyes are the official
MakeHuman Community CC0-1.0 core assets, inherited from the delivered R7 Blend.
`LICENSE.ASSETS.md` contains that license. MakeHuman upstream revision
`a8bc2d54ff0ac92e78ff71431b1023eda42bf482` and MPFB upstream revision
`b1a2dc98776da9d1eea751b159d42cf61778fe2e` are recorded in R7's manifest.

- https://github.com/makehumancommunity/makehuman
- https://github.com/makehumancommunity/mpfb2
- https://static.makehumancommunity.org/about/license.html

The armor, helmet, sword, palette, control additions and animation are authored
for this project with Blender over that licensed human foundation. The unchanged
game sprite sheets inform the poses/timing and appear only in comparison boards;
no sprite pixels are imported as geometry, textures, sword trails or runtime VFX.
The old source shield is preserved in comparisons; R8 has no shield or trails.

## Reproducible sources

`knight.mhm` and `knight-human.json` are the unchanged R7 MakeHuman phenotype
presets. The editable `knight_animated.blend` retains full hidden human anatomy,
shape keys, separate armor and six named skeletal Actions. The new production
tool `tools/knight3d/animate_makehuman.py` starts from the R7 Blend; source-file
SHA-256 values are recorded in `manifest.json` and verified after production.

The human skeleton retains its 53 bones, with one rigid sword control and two
hinged tasset controls added (56 total). Those additions preserve the initial
R7 guard shape and let the blade and hanging plates articulate during a step or
turn. The runtime mesh is joined with one palette material and a four-influence
weight budget; the saved Blender source keeps the independent editing objects.
The hidden object `SilverKnight_MakeHuman_R8_Runtime` is the exact export mesh.

Six clips are `idle` (1 s), `walk` (0.5 s), `attack1` (0.5 s), `attack2` (0.5 s),
`cast` (0.5 s), and `die` (1 s), matching the source's full 15-frame durations.
The original game's first-frame skip is deliberately not used in the comparison,
so anticipation is visible. The death end pose is held; idle/run are cyclic.
Quaternion channels are baked at 30 fps, including the exact cyclic endpoint.

The motion uses authored continuous pose curves, hip/chest separation, a planted
foot reach constraint, alternating circular steps in turns and a forward collapse.
The free left fist faces forward during the combat guard and follows the moving
torso. No online motion library or unlicensed motion data is used.

## Comparison and validation

`package_makehuman_motion.py` checks the actual GLB skin, weights, animation
durations, index bounds, packed images, floor contact, full-body motion, wrist
orientation and frozen R7 hashes before composing comparisons.

Every image is rendered from the saved Blend's Actions after reopening it.
The same fixed SE camera, scale and world-origin anchor apply to all poses;
neither model nor source image is mirrored and no frame is individually fitted.
The small six-pair GIF uses the actual configured sprite scale, ordinary battle
camera distance and centre perspective for a 600 CSS-pixel panel at 100% zoom.
It is a size estimate, not a screenshot of a live game replacement. Six larger
pair GIFs and a phase sheet permit motion/shape review. Shadows derived from
foot projections are presentation only and absent from the runtime character.

This remains a candidate for visual acceptance. Live integration, movement speed
matching in the game, attack-event alignment and target-device GPU FPS remain
outside this preview batch.
