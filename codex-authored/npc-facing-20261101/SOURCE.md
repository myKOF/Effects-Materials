# NPC 朝向 metadata 修正（2026-11-01）

使用者實拍要求 NPC 面向玩家。逐款放大遊戲既有序列幀，修正七種原圖朝左卻標成朝右的角色：skull_candle、demon_eye、flying_demon_head、cheeky_devil、memento_skeleton、large_skull、imp；facing 由 1 改成 -1。

素材沿用本庫已記錄的使用者購入 GandalfHardcore Hell Asset Pack 32x32，沒有新增外部圖片、描圖或重繪；66 張遊戲 PNG 全部逐位保持。授權依根目錄 PROVENANCE.md 既有記錄，原套件／covered 來源保持。

本目錄保存核准的 npc.json metadata 匯出快照，對應遊戲 images/sprites/npc/npc.json。製作設定由遊戲 tools/npc-sprites/build_npc_sprites.py 維護；以本素材庫為輸入在隔離目錄重新打包，25 角色／66 動作，輸出僅七處 facing 改變，其餘 metadata 與全部 PNG 不變。

`node export.cjs <game-root> --check` 驗證雙庫 metadata 與 PNG SHA256；`--apply` 僅匯出 npc.json，不覆寫 PNG、Excel 或遊戲數值。png-sha256.json 是唯讀驗證清單。
