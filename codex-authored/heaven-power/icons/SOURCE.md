# 天堂威能：84枚原創聖印圖示

- 來源：Codex內建imagegen於2026-10-18原創生成；使用者確認完整84枚圖集後，明確要求全部接入。
- 母圖：originals/turn-01.png至turn-10.png，十張原樣保存；approved-atlas.png為使用者核定圖集。完整提示詞與自製風格參照記錄在prompts.json。
- 參考：僅觀察D:/MyGame/4000 icon圖像的一般辨識輪廓、金屬層次及寶石質感。沒有把第三方圖像交給生成工具，沒有複製、描圖、改色或拼貼其像素。所有交付圖示均為本次原創；後九張只以本次原創第一張作材質風格參照。
- 設計：暗金、銀白浮雕與幽暗琺瑯的神授徽記；同類不同轉數各自繪製，使用84個威能ID對應，無技能圖示或第三方素材混入。
- 匯出：遊戲tools/heaven-power/export-icons.cjs；沿共用本機素材庫Root解析。layout.json保存母圖SHA256與逐圖裁切範圍；只按核定分格裁切並縮小到128×128，不重畫或修改原稿配色。
- 重製：設置既有Node環境與sharp後執行--make-icons，再--apply同步到images/ui/heaven-power/icons/；--check逐項確認母圖、素材庫輸出與遊戲SHA256。exports.json記錄84張輸出hash，exports/保留逐張正式輸出。
- 所有受Git管理的素材引用均為相對路徑；本機來源資料夾僅作來源說明，不是執行時依賴。
