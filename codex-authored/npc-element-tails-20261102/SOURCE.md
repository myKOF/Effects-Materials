# NPC-ELEMENT-TAILS-20261102

本包為兩款元素造型修正的製作與驗收紀錄；有效美術來源仍由原製作包單一管理，沒有另建匯出管線。

- 冰晶元素：`../npc-completion-20261101/batches/batch06/sources/npc_icefield_10.png`。下身為短而不規則的晶簇，取消類似腿腳的長晶根及長針形錐體。
- 元素狂暴體：`../npc-completion-20261101/batches/batch20/sources/npc_god_chaos_8.png`。深藍／暖橙兩個色系，短而圓轉的懸浮旋尾。依使用者最新回覆，在簡化版上增加約20%的肩甲、手臂切面、核心邊框及尾部層次，維持大色面，避免細碎裂紋和雜亂線條。
- 兩款均保留四動作各六幀；移動為懸浮，死亡落為低矮殘骸，無人形腿腳。原先元素狂暴體攻擊第4幀的舊版 `poseOverrides` 已解除，避免插回過於複雜的舊造型；舊來源保留於版本歷史／既有目錄。
- 使用 built-in image_gen 及專案原自製角色作編輯參考，未引入外部素材。Mote 網頁可開啟但未提供 WebMCP 批次改圖工具，因此本次重畫採 image_gen，再沿用既有 normalize／validate／index／export 流程保存可編輯Mote與PNG。
- 提示詞：本目錄 `prompts.json` 為短尾修正、`simplify-prompt.txt` 為雙色簡化方向、`final-detail-prompt.txt` 為最後約+20%細節修正；有效最終提示詞也寫回各批 `prompts.json`。

有效來源、PNG及Mote位於上述兩批原有 `sources/`、`exports/`、`mote/`；`plan.json`、來源SHA、PNG SHA、驗證紀錄及總 `asset-index.json` 已更新。重建沿用兩批 `normalize.cjs`／`validate.cjs`，再執行總包 `index-assets.cjs`，遊戲仍使用 `tools/npc-sprites/export_supplemental.cjs`。

保留NPC表倍率、攻擊屬性／射程／移速、實體錨點、朝向及懸浮離地。元素狂暴體的原生像素高度由64變63，標準化scale相應由0.7188補為0.7302，目標顯示高度仍為46；未改NPC.xlsx配置倍率。

驗收：兩批200幀Mote／PNG像素一致，相關86項測試通過，build630檔通過；正式渲染器載入2角色8動作、Console錯誤／警告0。Mote網頁原生匯出狂暴體待機768×128與遊戲PNG全RGBA差0。僅8張角色PNG變更，其他488張PNG保持SHA；角色索引僅上述標準化補償。`qa/`保留GIF、截圖、色系統計、測試與原生往返核對。
