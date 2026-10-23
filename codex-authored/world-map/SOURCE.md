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
