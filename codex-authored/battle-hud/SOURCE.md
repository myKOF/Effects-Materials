# 戰鬥 HUD 球側雕刻

- 日期：2026-10-16；作者：Codex／內建 image_gen。
- 來源：依本專案使用者要求全新生成透明圖；沒有匯入第三方美術或對參考截圖描圖。截圖只用於理解暗色立體雕刻與 HUD 連接方式。
- Mote Studio 已確認可存取，但其像素繪圖工作流不適合本次細緻立體浮雕，因此改用內建 imagegen。
- originals/orb-carving.png 保留完整透明母圖；exports/orb-carving.png 為標準512px縮小版，保留原構圖與alpha。exports.json核對母圖及匯出SHA256。
- 遊戲透過tools/battle-hud/export-source.cjs的--make-export／--apply／--check匯出到images/ui/battle-hud/orb-carving.png；CSS鏡像重用於法力球，沒有第二份貼圖。
- 最終生成提示詞見PROMPT.txt；用途為全螢幕HUD兩側浮雕，非VFX Preset。
