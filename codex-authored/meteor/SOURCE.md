# 殞石術特效製作來源

2026-10-21，Codex 依使用者提供的殞石參考圖調整 `proj-meteor-inferno.json`：白黃高溫前端、橘紅外焰、長火尾及逐漸轉灰的煙跡。參考僅限造型、色彩及方向層次，沒有裁切、描圖、複製或匯入附件像素。

本次沒有新增或修改 PNG。組合素材沿用既有 `particle-pack`（Kenney，CC0）及 `new_materials/orb/sphere_23.png`（素材庫 PROVENANCE.md 已登記為 CC0）；各素材的來源與授權以根目錄 PROVENANCE.md 為準。Preset 的所有圖層保存在單一根群組 layout，二者與遊戲副本內容一致。

可重製製作腳本位於 Idle-RPG 遊戲倉庫 `tools/vfx/authoring/author/meteor-comet.cjs`，執行 `node tools/vfx/authoring/author/meteor-comet.cjs`，使用專案既有 Preset kit 與 Core 的 canonical 序列化。腳本只寫本彈體與 layout，不重新製作落地爆炸。

維持既有尺寸契約（custom，14×14米，authored 60×60）、循環與時長；飛行與命中由原遊戲事件控制。此表定 Preset 同時供殞石術及天穹崩裂的火殞石使用；敵方小殞石與地爆天星另有自己的 Preset。

既有 `meteor-cracked.png`、`meteor-stylized.png` 不屬本次新作或修改，本紀錄不變更它們的來源與授權。
