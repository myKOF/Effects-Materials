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
| `shape-alpha` | 紋章／裝飾剪影包 | 未附授權檔 | **待確認** |
| `spritemancer-vfx` | CodeManu「VFX Free Pack」(OpenGameArt) | CC0 | 無 |
| `spritemancer-vfx-256` | 上者的衍生（shrink-sheets.cjs 降解析） | CC0 | 無 |
| `sci-fi-effects` | **Skorpio** (OpenGameArt) | **CC-BY 4.0** | **要署名** |
| `sci-fi-effects-sheets` | 上者的衍生（pack-sequence.cjs 拼成圖集） | **CC-BY 4.0** | **要署名** |
| `spell-sheets` | 使用者提供，來源不明 | **未附授權檔** | **待確認** |

## sci-fi-effects — 署名怎麼寫

作者自己在 Readme.txt 裡寫的要求：

> Just add my nickname "Skorpio" to the credits and list which assets you use
> with the corresponding license. You can also add a link to the specific page
> on opengameart.org if you want.

也就是要：**署名 Skorpio ＋ 列出用到哪些素材與其授權**。
衍生的 `sci-fi-effects-sheets` 只是把同一批圖拼成圖集，義務完全相同。

## 兩個待確認的

`shape-alpha`（177 張紋章與裝飾剪影）與 `spell-sheets`（5 張法術圖集）
都沒有附授權檔。目前**沒有任何 preset 引用它們**，所以還沒有出貨、
也還沒有義務；要用之前得先把來源與授權確認清楚。
