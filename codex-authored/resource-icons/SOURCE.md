# 貨幣與材料透明圖示

既有專案六張資源圖示以內建 image_gen background-extraction 編修，不引入外部參考素材。

- before/：本次修改前原圖，保留回溯。
- transparent/：已驗收透明 PNG，保持工具輸出 alpha。
- source.json：完整提示詞、各圖 SHA256 與 alpha 驗證。主體alpha多為253，外緣最大1／255，背景大量alpha0；保留工具像素，未再閾值去背或重畫。

RPG Mote Studio 可開啟，但像素選取與一般濾鏡不適合本批高解析發光邊緣，因此改用 image_gen。
由遊戲的 tools/resource-icons/sync-library.cjs --apply 匯出，--check 驗證兩庫一致；不在執行期去背。
