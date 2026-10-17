# Skyfall telegraph

Codex, 2026-10-13. Green landing marker for stormbarrier skyfallStars wind blades.
Reuses the existing project mark-blue preset composition and shipped circle masks; only the two tint colors change. No new external images, no reference pixels, no raster drawing.
Assets: light-masks-1.0/default/circle_b.png and particle-pack/png-black-background/circle_02.png, already used and shipped by this project.
Preset mark-green.json and matching single-root layout are saved here and in the game repository.
Fire uses table-configured mark-red; thunder and wind use registered code mappings mark-blue and mark-green. Runtime uses the falling projectile authored body dimensions and skyScale to size the circle; damage AOEs are unchanged. Each marker expires when its own projectile lands.