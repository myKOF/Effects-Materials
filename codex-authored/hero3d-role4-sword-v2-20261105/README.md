# Role4 sword revision 2 — 2026-11-05

User requested a symmetric guard, a ruby covering the old red underlay, and evenly distributed blade ornament. This continues the independent sword-review checkpoint; no Role4 character or runtime integration is included.

Source dependency: codex-authored/hero3d-role4-sword-preview-20261105 (commit1fcac01) preserves the user-authorized original Role4.glb and reference. Revision2 preserves a separate editable Blend, GLB, baked guard map, author tool and QA. Original snapshot is unchanged.

Blender4.5.10 clips the original guard to its left silhouette and mirrors geometry about X=0. The baked material is also mirrored. Ruby is enlarged to32x48mm with a raised bezel and a centered apex; the old red guard pigment is neutralized, preventing a fringe even at oblique angles. Existing red collar at the pommel remains.

Blade relief width is normalized against the actual dark core, with smooth non-collapsing width remapping and local color balancing. Reference ornament and overall blade proportions remain. Corner-touching mask components are split before smoothing/solidification, fixing the previous4 nonmanifold edges.

Independent checks: guard mirrored vertex error<1e-7m, texture mirror error0, red underlay pixels0; relative ornament-width CV0.25349 ->0.02188 across18 bands. GLB mesh.validate and finite coordinates pass; welded boundary0/nonmanifold0. Editable Blend has13 parts and used images packed. Three/PBR preview errors/warnings0. GIF800x1055,96frames24fps; disk readback confirms rotation.

Pending: user shape review; Role4 hand/leg separation, neutral head orientation, back sword removal, right-hand fit, old six animations, PBR and 4th-rebirth selection/real-game verification. No final exact-replication or character-integration claim.

Rebuild:
blender -b --python-exit-code 1 --python tools/build_role4_sword.py -- OUTPUT_DIRECTORY ../hero3d-role4-sword-preview-20261105/source/sword-reference.png ../hero3d-role4-sword-preview-20261105/source/Role4.glb
