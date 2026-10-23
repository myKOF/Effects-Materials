# 薩爾維恩世界地圖

- 來源：使用者提供的 Gemini 生成地圖，在本聊天依使用者指示，以內建 imagegen 直接編修原圖。
- 使用依據：使用者於 2026-10-23 明確要求將本聊天核准版本加入本遊戲世界地圖功能。此記錄僅針對該圖，不推定其他外部素材的授權。
- 核准版本：亡靈山脈位於冰原與落雷峰之間；落雷峰南移、沼澤東南擴張；移除左下海獸並修正火山煙。
- 標題只顯示「薩爾維恩」。英文 Salvien，意為「神聖與黑暗力量的交界」，僅為世界設定。
- 原圖不再重新生成、調色或縮放；salvien.png 為完整保留的核准母圖。source.json 記錄其尺寸與 SHA256。
- 遊戲以 tools/world-map/export-source.cjs --apply 匯出至 images/world-map/salvien.png；--check 驗證兩庫內容一致。
- 製作方式：內建 imagegen。編修要求為維持原圖陰鬱低飽和墨線風格、七大地貌、移除指定標籤與影片介面、依核准位置調整區域及圖標；非新增現成素材包。

## 所在地旋轉游標

依使用者提供的簡單導航箭頭參考，以內建imagegen自行製作透明底游標。使用者要求橫向縮窄約20%、深綠／淺綠兩側分面，並指定改成遊戲地圖用的卡通畫風。參考僅用來描述造型；成品為本聊天自行生成，非直接裁切外部圖片。廢棄的華麗羅盤與商用漸層候選不納入正式素材。

最終提示詞：Edit the narrow dark-green/light-green upright navigation arrow into a simple hand-painted cartoon RPG world-map location cursor. Preserve pointed silhouette, flared lower tips and concave bottom, narrow proportion and two green faces. Thick dark forest-green ink outline, rounded tips, flat cel shading, restrained painted highlights, readable at32px. No corporate gradients, glass, glossy3D, neon, gems, compass ornaments, rings, text or surrounding UI. Single isolated sprite, transparent background.

母圖保留location-cursor-original.png；標準匯出僅依透明邊界裁切、等比縮小至112px並加8px透明邊界，得到128px的location-cursor.png；source.json核對兩者SHA。遊戲以CSS旋轉並微幅上下浮動，下方淡光圈亦由CSS繪製，沒有逐幀生成圖片或新增技能VFX。

## 場景名稱局部覆片（2026-10-24）

使用者要求hover放大名稱時隱藏圖內原字，避免疊字。以內建imagegen直接編修本庫salvien.png，只去除七個地貌名稱、補回相鄰地貌，保留底部世界標題。輸出salvien-labels-cleared-original.png為1672×941，僅作裁切母來源；遊戲不載入／不替換整張圖。salvien.png的SHA及內容保持原樣。

提示詞：Precise inpainting edit of this exact existing game map, NOT a redraw. Remove ONLY the seven regional name labels 冰原、亡靈山脈、迷霧森林、熔岩山、落雷峰、荒漠、月影沼澤. Fill erased glyphs with directly underlying natural terrain matching adjacent colors and texture. Preserve the exact canvas, framing, borders, coastlines, every feature and its position; keep bottom title 薩爾維恩 unchanged. No zoom, shift, redesign, palette, linework or lighting changes. Only tiny local patches beneath names will be used.

七張label-cover-*.png僅從新母來源裁出各名稱周圍的小矩形，高42px、寬=名稱字數×22+24px，位置及SHA完整記錄於source.json的labelCovers。依同處熱區中心定位，前端以容器比例顯示，CSS對邊緣作淡出；只在hover／focus／選取時顯示覆片及放大名稱，離開恢復核准原圖。沒有動到其他區域或引用外部現成素材。匯出工具同步及核對全部覆片和兩張編修母來源SHA。
