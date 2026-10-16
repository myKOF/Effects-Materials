# 岩甲符文雙色資源球框

- 日期：2026-10-16；執行者：Codex；製作工具：內建 image_gen。
- 已授權參考：references/authorized-reference.png。使用者在本聊天明確回答「已取得可重製及遊戲使用授權」，並要求依圖重製。授權依使用者明確聲明記錄，不另推定第三方作者或授權名稱。
- 產出：紅色岩甲／符文／火裂紋／紅寶石框，兩根內伸尖刺縮短；藍色版由紅版編修，裂紋／符文／寶石改成藍色，暗灰岩甲保持。兩張原圖由使用者在localhost12102預覽後確認接入。完整提示詞及授權聲明見PROMPTS.json。
- originals保留1254×1254 RGBA母圖，透明背景及中央圓孔。exports為標準512px縮小圖；不裁切、不另行重畫。frames.json核對兩份母圖、匯出與遊戲副本SHA256及圓孔配置。
- 遊戲：tools/battle-hud/export-frames.cjs --make-export／--apply／--check，沿tools/vfx/vfx-library-root.cjs解析本機位置，不在受管理設定寫絕對路徑。遊戲使用images/ui/battle-hud/orb-frame-health.png與orb-frame-mana.png，右側CSS鏡像。
- 構圖：frameSize／glassDiameter=1.9，孔中心為畫布(0.599,0.518)，依使用者接入驗收恢復原底座高度與球底5px，不抬升；下緣由原畫布收邊。底部短刺只略微伸入液體，原玻璃／光環裁切沿用遊戲程式。
- 沒有新增VFX Preset；舊版orb-carving母圖、匯出及工具保留，不納本輪變更。參考圖僅素材庫追溯，未作為遊戲貼圖載入。

- 使用者追加接入間距：雙球連框相對原位置各向外10px；不移動技能列或放大底座。
