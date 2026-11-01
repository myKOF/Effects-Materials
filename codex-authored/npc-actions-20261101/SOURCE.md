# Supplemental NPC actions — 2026-11-01

使用者先核准 flying_demon_head_attack 的 Mote v2 GIF（嘴內透明斷層已修正），指示接入遊戲，再要求備註「新版正式圖像」的 NPC 缺動作全部補齊。

範圍：16 種角色、34 組補製動作：15 組移動、14 組攻擊、5 組死亡。`plan.json` 記錄逐角色原始動作、目標與當時的尺寸／錨點；遊戲 npc.json 仍是播放設定的權威來源。已存在的正式動作不替換。

來源：`sources/*_idle.png` 是遊戲既有、使用者購入並允許於此專案修改的素材。15 種來自 GandalfHardcore Hell Asset Pack 32x32；bat 來自 Monsters Creatures Fantasy 2。授權與取得記錄沿用根目錄 PROVENANCE.md，後者原套件授權文件仍待補，不宣稱 CC0。這是購入素材的修改版，非全新原創角色；不得單獨對外散布或用於 AI 訓練、NFT。沒有另行下載或引入外部圖像。

製作：飛首攻擊在專案指定 RPG Mote Studio 原生編輯，保留 .mote；其餘在確認 hosted Mote 無批次 MCP／本機工具未安裝後，以 generate.cjs 做可重現的原像素變形，最近鄰反向取樣，保留調色及透明背景。移動使用振翅／漂移／身體與腳部擺動，攻擊為後縮、傾身出手、回位，死亡為倒伏／收縮。沒有新增傷害判定或 VFX Preset；不宣稱手繪完整骨架動畫。枯骨抄寫者補幀只用完整角色姿勢，避免原待機圖含書本畫面造成跳換。`mote/` 每組皆保留可開啟的原生來源；`.mote` 的預覽通常循環，遊戲攻擊／死亡則依 manifest 單次播放。

重建：安裝 package.json 依賴後執行 `node generate.cjs`；`--previews` 可產預覽，NPC_PREVIEW_DIR 可指定不受 Git 管理的輸出位置。`node export.cjs <game-root> --apply|--check` 同步／檢查 PNG SHA256 與動作 metadata，不覆寫既有角色尺寸／朝向。`--source-check` 不修改遊戲，可在打包器清空輸出前先確認來源完整。遊戲工具 `tools/npc-sprites/export_supplemental.cjs` 透過既有 vfx-library-root 解析素材庫位置，不在受控檔案保存本機絕對路徑。

驗證：sources-sha256.json 保留輸入雜湊，original-game-png-sha256.json 保存34張以外的原66張遊戲圖雜湊；sha256.json 保存本次34張匯出。validation.json 包含逐像素調色、透明、幀數、首尾與原生來源一致性。Mote 實際開啟並重匯出枯骨抄寫者攻擊，與輸出像素一致。正式 Pixi 載入16組角色與64個階級實體，驗四動作載入、攻擊接回當下待機／移動、死亡停幀及覆光；測試與交付詳見遊戲 docs/AI_TASKS.md。
