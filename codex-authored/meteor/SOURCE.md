# 殞石術特效製作來源

2026-10-21，Codex 依使用者提供的殞石參考圖調整 `proj-meteor-inferno.json`：白黃高溫前端、橘紅外焰、長火尾及逐漸轉灰的煙跡。參考僅限造型、色彩及方向層次，沒有裁切、描圖、複製或匯入附件像素。

本次沒有新增或修改 PNG。組合素材沿用既有 `particle-pack`（Kenney，CC0）及 `new_materials/orb/sphere_23.png`（素材庫 PROVENANCE.md 已登記為 CC0）；各素材的來源與授權以根目錄 PROVENANCE.md 為準。Preset 的所有圖層保存在單一根群組 layout，二者與遊戲副本內容一致。

可重製製作腳本位於 Idle-RPG 遊戲倉庫 `tools/vfx/authoring/author/meteor-comet.cjs`，執行 `node tools/vfx/authoring/author/meteor-comet.cjs`，使用專案既有 Preset kit 與 Core 的 canonical 序列化。腳本只寫本彈體與 layout，不重新製作落地爆炸。

維持既有尺寸契約（custom，14×14米，authored 60×60）、循環與時長；飛行與命中由原遊戲事件控制。此表定 Preset 同時供殞石術及天穹崩裂的火殞石使用；敵方小殞石與地爆天星另有自己的 Preset。

既有 `meteor-cracked.png`、`meteor-stylized.png` 不屬本次新作或修改，本紀錄不變更它們的來源與授權。

2026-10-21 拖尾動態修正：comet-tail-envelope、golden-tail-stream、white-tail-thread 由單張靜態 Sprite 改為持續向後剝離的短命粒子，隨壽命伸展、淡出，並用既有 Core 的平移噪聲表現氣流擾動。保留 14 層群組與所有非尾焰圖層、米制尺寸及飛行命中時序；沒有產出新 PNG 或引入外部素材。製作腳本已同步，遊戲與本庫 Preset 逐位元一致。
