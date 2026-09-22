# Thrust lance（突刺光槍）

Codex 製作，2026-08-15 提交於遊戲 repo（a25223eb「替換窄版透明突刺光槍」，使用者先前在 589c3eab 定案長條形）。
620×1269 RGBA，透明背景，窄版長條光槍。原檔逐位元組保存，未修改。

2026-09-22 從 repo 的 images/vfx/thrust_lance.png 移入素材庫（使用者要求素材統一放在 assets 底下），
由 vfx/runtime-assets.json 登記為「程式直接引用的素材」一起匯出：
- js/battle-renderer.js：突刺舊畫法（spawnThrustLine，Preset 沒接手時）
- css/style.css：高塔 DOM 突刺特效
