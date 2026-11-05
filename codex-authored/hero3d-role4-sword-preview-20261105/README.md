# Role4 sword review candidate — 2026-11-05

User requested an independent sword preview before character integration. This is a first shape-review candidate, not a completed Role4 skin or a claim of exact final replication.

The user supplied Role4.glb and the sword reference, explicitly stating authorization. The licensed originals are preserved under source/. Sword solid geometry is authored in Blender4.5.10; the reference red inlay silhouette is rebuilt as shallow geometry. Fine guard color is baked in Blender from the authorized Role4 material. Hidden reverse-face details use matching symmetric ornament. No external third-party assets or raster editing tools were introduced; this is the mandated Blender 3D workflow.

Editable source retains 13 modeled parts, black 28mm grip, faceted ruby, silver bevels, tapered blade and domed silver pommel. GLB is an independent review export, with no bones or game animations yet. Grip origin (0,0,0), blade +Y / edge +X / front +Z in metres matches the established sword coordinate convention. Actual hand fit is still pending.

Validation: Blender export/reopen and mesh.validate pass; finite coordinates; geometric welding reports 0 boundary edges and 4 nonmanifold edges. The latter are a remaining topology cleanup item before production integration, not a watertight-manifold certification. Native Three/PBR preview uses the project's studio environment; browser errors/warnings0. Turntable800x1055,96frames,24fps; GIF disk readback confirms rotation.

Pending overall task: user shape review and fidelity refinements, topology cleanup, Role4 hand/leg separation, neutral head orientation, removal of back sword, right-hand placement, old six animations, PBR, 4th-rebirth selection and real-game verification. Current game runtime and existing models are unchanged.

Rebuild:
blender -b --python-exit-code 1 --python tools/build_role4_sword.py -- OUTPUT_DIRECTORY source/sword-reference.png source/Role4.glb
