# Ancient star size / glow adjustment

Original 128px sources and prior package are preserved. The outer bake blur is reduced from 6 to 5 CSS px in the existing original-size bake units. The game displays the padded output with scale(1.8), or 90% of its previous scale(2). Near/middle blur and outline are retained.

Rebuild: `node tools/ancient-stars/bake-glow.cjs --apply` from this package. Verify: `--check`. The files are copied from this library package to the game, with SHA256 in manifest.json.
