# 戰鬥 HUD 球側雕刻

- 日期：2026-10-16；作者：Codex／內建 image_gen。
- 來源：依本專案使用者要求全新生成透明圖；沒有匯入第三方美術或對參考截圖描圖。截圖只用於理解暗色立體雕刻與 HUD 連接方式。
- Mote Studio 已確認可存取，但其像素繪圖工作流不適合本次細緻立體浮雕，因此改用內建 imagegen。
- originals/orb-carving.png 保留完整透明母圖；exports/orb-carving.png 為標準512px縮小版，保留原構圖與alpha。exports.json核對母圖及匯出SHA256。
- 遊戲透過tools/battle-hud/export-source.cjs的--make-export／--apply／--check匯出到images/ui/battle-hud/orb-carving.png；CSS鏡像重用於法力球，沒有第二份貼圖。
- 最終生成提示詞見PROMPT.txt；用途為全螢幕HUD兩側浮雕，非VFX Preset。
- 2026-10-16修訂：使用者要求細部複雜度與紋理減約20%，並套用一般戰鬥區。內建image_gen以原母圖編修，保持大輪廓／圓孔／主要卷葉，減少細小卷紋與粗糙度；20%為美術調整目標，非可精確量化的像素減量。編修提示詞見PROMPT-refine.txt，初版母圖及初版提示詞保留在素材庫Git歷史11b766c及PROMPT.txt。
- 使用者進一步圈選外側卷葉，要求邊緣不要複雜；最終母圖依PROMPT-edge.txt收為少量寬葉與兩個主要外側卷紋，保留內弧／圓孔／底腳位置。PROMPT-refine.txt為前一輪編修提示詞；最後使用版本以PROMPT-edge.txt及exports.json為準。
