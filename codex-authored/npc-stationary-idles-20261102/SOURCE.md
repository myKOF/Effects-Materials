# 原地呼吸待機修正（2026-11-02）

使用者要求所有人形待機腳部完全不動，並指定樹妖、玄武岩衛及炭焰蜥蜴。盤點47款既有雙足步態角色、6款原有地面人形、13款落地四足；65款下肢不同，腐爛樹人原單幀已固定，保留。

本包是 **plan.json 列出的65組 idle 的唯一有效修正來源**。原五個製作包保留歷史原作與其驗證，匯出時由本包明確覆蓋同名idle；walk／attack／die依舊由原包供應。匯出器先驗證原包，再驗證及選用修正版，重建不會還原滑步版本。沒有新增角色或改動戰鬥設定。

- `before/`：本次修改前已在專案使用的原始序列，SHA在plan內。皆沿用專案既有自製／已授權角色，未引入外部素材。
- `mote/`：Mote v3可編輯來源，固定下肢圖層鎖定，上半身獨立呼吸圖層。第一幀完整保留原第一幀；其餘只在下肢以上用最近鄰逐行調整1～2像素。沒有全身位移、腳部縮放或交替跨步。
- `author.cjs`：以before＋plan重建原生圖層與PNG，需Node及pngjs。`codec.cjs`／`export.cjs`驗證及遊戲匯出只用Node內建模組。
- `exports/`、`sha256.json`、`validation.json`：逐幀下肢RGBA一致，原幀數、fps、循環、錨點、縮放、其他動作保持。
- Mote網站可開啟，但無WebMCP批次圖層編輯工具，故大量修正以原生Mote格式進行；不使用重新生成圖片，以免改變角色外觀。

重建：`node author.cjs`。遊戲既有入口：`node tools/npc-sprites/export_supplemental.cjs --apply`（或`--check`／`--source-check`）。
