# 素材庫來源與授權

素材庫本身不進版控（機器本地），所以這份清單是唯一集中記錄來源的地方。
**新增 package 時請一併更新這裡。**

## 為什麼需要這份檔案

2026-09-08 之前，庫裡的 package 全部是 CC0——不必署名、不必列出用了哪些，
所以授權從來不必想。`sci-fi-effects` 是第一個 **CC-BY** 素材：
用了就**必須署名**，而且那是跟著產品走的義務。

判斷點在**匯出**而不是收進庫裡：`tools/vfx/export-assets.cjs` 只匯出
preset 實際引用到的素材。所以

> 只要有任何一份 preset 引用了 CC-BY 的素材，遊戲就必須附上署名。

`vfx/shipped-assets.json` 是那份「實際出貨了什麼」的清單，
要確認目前有沒有這個義務，查它就知道。

## 各 package

| package | 來源 | 授權 | 署名義務 |
|---|---|---|---|
| `particle-pack` | Kenney (kenney.nl) | CC0 | 無 |
| `light-masks-1.0` | Kenney (kenney.nl) | CC0 | 無 |
| `smoke-particles` | Kenney (kenney.nl) | CC0 | 無 |
| `splat-pack` | Kenney (kenney.nl) | CC0 | 無 |
| `foliage-sprites` | Kenney (kenney.nl) | CC0 | 無 |
| `new_materials` | 匯整自多個 CC0 來源 | CC0 | 無 |
| `shape-alpha` | 紋章／裝飾剪影包 | `PDAlpha_017.png`：使用者2026-10-22確認已授權可用於本專案；其餘未提供授權資訊 | 僅確認本次指定檔案，不推定整包為CC0 |
| `spritemancer-vfx` | CodeManu「VFX Free Pack」(OpenGameArt) | CC0 | 無 |
| `spritemancer-vfx-256` | 上者的衍生（shrink-sheets.cjs 降解析） | CC0 | 無 |
| `sci-fi-effects` | **Skorpio** (OpenGameArt) | **CC-BY 4.0** | **要署名** |
| `sci-fi-effects-sheets` | 上者的衍生（pack-sequence.cjs 拼成圖集） | **CC-BY 4.0** | **要署名** |
| `spell-sheets` | 使用者提供，來源不明 | **未附授權檔** | **待確認** |
| `claude-authored` | Claude 以程式產生（各子目錄附 SOURCE.md 與產生器，可重現），不含第三方素材 | 專案自製 | 無 |
| `characters/knight-hd` | 使用者提供的「2D HD Character Knight」素材包（2026-09-22，只收用到的 6 個動作，說明見套件內 README） | **未附授權檔** | **待確認**（遊戲主角已經在用，不走 export-assets 匯出，由 `tools/build_character_sprites.cjs` 產生遊戲版） |

## sci-fi-effects — 署名怎麼寫

作者自己在 Readme.txt 裡寫的要求：

> Just add my nickname "Skorpio" to the credits and list which assets you use
> with the corresponding license. You can also add a link to the specific page
> on opengameart.org if you want.

也就是要：**署名 Skorpio ＋ 列出用到哪些素材與其授權**。
衍生的 `sci-fi-effects-sheets` 只是把同一批圖拼成圖集，義務完全相同。

## 兩個待確認的

`shape-alpha/PDAlpha_017.png`：2026-10-22，使用者在提交確認中直接回覆「已授權」，確認可用於本專案；本次由 en-wall-warn 引用。此紀錄不自行推定CC0或擴及同套件其他圖片。

其餘 `shape-alpha` 與 `spell-sheets` 尚未在本紀錄提供來源與授權；新增使用前仍須逐項確認。
