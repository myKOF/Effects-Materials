# 六套防具及十四款首飾

日期：2026-11-02。任務：EQUIPMENT-ART-SETS-20261102。

使用者提供的既有裝備總覽只用於品質、材質細節與遊戲用途參考，沒有從截圖裁切、描摹或複製像素。62款新圖由本專案以OpenAI內建imagegen逐款原創生成，沒有引入第三方下載素材。Mote Studio可開啟，但其像素筆刷工作流程不適合本次高細節手繪裝備圖，因此使用imagegen。

原始生成圖在`raw/`；遊戲使用版本在`export/`，僅做透明邊界留白、等比縮小及PNG匯出。`legacy/`保存本次由遊戲原有位置搬入images/equipment的43張既有圖，內容逐位保持、沿用專案既有來源與授權，本次沒有重新生成或改色。原圖歷史可由遊戲提交df6baf2e追溯。

`armor-accessories-20261102.json`保存構圖、各套材質配色、每個部位及首飾描述；`catalog.json`列出62款的完整提示、名稱、String編號。第一張晨曦織紋兜帽的實際初始提示另存`first-hood-prompt.txt`；清理透明邊緣時的後續提示另存`hood-cleanup-prompt.txt`。所有提示採內建工具模式，未使用CLI/API替代模式。

`export-equipment-art.cjs`是遊戲匯出器的版本快照，於遊戲專案內執行`node tools/equipment-ui/export-equipment-art.cjs`可重建512×512 RGBA匯出，加`--check`逐位核對遊戲及素材庫版本。素材庫路徑由遊戲既有vfx-library-root解析，不將本機絕對路徑寫進遊戲設定。`hashes.json`保存62款正式PNG及原稿的SHA256。

驗證：62款新圖及43張搬移原圖逐位同步；正式生成／名稱前綴／JSON往返及舊圖相容等79項回歸通過，Build631檔通過。String新增62列並以原生Excel儲存及正常重開兩輪，既有15617格資料／有效格式保持；字串同步2292條、寫死0條。隔離Edge載正式產出／背包格／標題函式與CSS，1440及390寬檢查62款新圖、43款舊圖、八次詳情選取，106個image解碼成功，錯圖／HTTP失敗／Console Error及Warning皆0。既有品質數量兩項測試在原始df6baf2e的隔離副本同樣失敗，沒有修改數值或放寬斷言。完整報告見validation。
