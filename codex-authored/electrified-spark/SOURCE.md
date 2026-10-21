# NPC帶電：跳動電流

2026-10-21，Codex原創SVG。僅參考使用者提供藍色電團截圖的鋸齒輪廓、分岔與深藍光暈，不使用／描摹附件像素或第三方素材。Mote Studio可用，已檢查Export只有PNG／Sprite sheet／GIF，沒有本次原生SVG匯出，因此使用專案原生向量作者流程。

2026-10-22依使用者圈選改為只有一段持續扭動的電流：以圈出的斜向線段為基準，沿線段延長50%，各層線寬加倍。移除外環、內網、分叉與面積光暈；其後依使用者要求改成兩條獨立種子的隨機扭動電流，兩條基準軸幾乎重疊、獨立隨機扭動幅度增加30%，64格32fps／2秒圖層循環；單一sprite不旋轉、不發射粒子。保留en-spark既有0.5秒loop與projectile-circle／authored.radius=22尺寸契約，沿用表定bodyD與飛行事件。

重製：node tools/vfx/authoring/author/electrified-spark.cjs，再執行node tools/vfx/export-assets.cjs。Preset與layout存於同目錄的presets／layouts，遊戲與素材庫皆需提交。

2026-10-22：依使用者一併Commit要求保存VFX Editor最新已儲存設定，逐位元同步遊戲：presets/en-spark.json。不以離線作者重製覆蓋使用者值；完整本輪快照在codex-authored/user-vfx-tuning-20261022。

本次使用者最終Preset：duration=2、固定rotation=0.693156、scale=0.7115×0.3785；離線作者預設與測試同步這些明確編輯值，不重製覆寫遊戲檔。
