# 毒蚊群追擊朝向修正（2026-11-02）

使用者實拍swamp_7毒蚊群在玩家左側追擊，原圖頭部／眼睛／口器朝左，但遊戲metadata.facing=1，導致追向右側玩家時不翻面。只將plague_flies.facing改為-1，與遊戲build_npc_sprites.py的來源設定同步；既有renderer翻面邏輯保持。

沒有新增或修改圖片；既有購入並授權於本專案使用的Plague Flies原圖及四組補製PNG保持原位元，授權沿既有PROVENANCE與npc-actions-20261101/SOURCE。不需Mote或imagegen，因本次僅編修metadata。飛行anchorY、尺寸、幀數、節奏／死亡定位、四階級與全部NPC數值保持。

metadata-review.json記錄單一欄位before/after、毒蚊群四PNG雜湊及全部496張NPC PNG的彙總雜湊；這是本次交付驗證記錄，不是第二套配置。遊戲來源打包工具生成npc.json，既有npc-actions/plan.json仍保存當初補幀時的歷史參數，不改該製作快照造成原攻擊像素重生不同。

執行 node verify.cjs <game-root> 驗朝向、飛行錨點與全部PNG保持；隔離完整打包重建另核對全部metadata／496PNG。npc-facing回歸新增毒蚊群獨立原圖朝向斷言，涵蓋四階級左右追擊、玩家跨越、攻擊及死亡方向。實際Pixi before/after從左右兩側持續移動接近玩家，舊metadata八實體皆反向、修正後八實體皆朝向玩家；未操作原玩家存檔。
