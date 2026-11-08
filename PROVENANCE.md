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

### codex-authored/tower-boss2-lv2-20261108

- 2026-11-08：使用者提供同一自製／自行生成 BOSS 的 BOSS1_LV2.glb 材質版，要求五動作沿用前版、劍重新拆分另綁骨，指定為第二個 BOSS「骷髏王Ⅱ」。沿用本聊天已確認的本遊戲使用及修改授權。
- 使用新原檔的 PBR／UV，對齊已認可模型，從新融合網格重新拆出劍並重建獨立右手劍骨。保留已認可 MakeHuman CC0 手套／握柄及60fps披風避碰、五動作；MakeHuman版本、原始CC0檔、參數及可編輯手部另保存。
- 本套件包含新原檔、已認可動作GLB、可編輯Blend、正式GLB／透明頭像、製作及匯出工具、來源SHA、原生Excel／蒙皮／幾何／GIF／遊戲接入QA。聊天GIF及中間影格不進Git；前一個BOSS與套件保持。非VFX Preset，不加入VFX專用索引。

### codex-authored/tower-boss1-3d-20261108-v3

- 2026-11-08：使用者已認可 v2 握劍手部，追加披風穿模修正，並指定封魔塔第一種 BOSS 命名「骷髏王」、接入遊戲。
- 原五個 GLB 與角色／貼圖／動作為使用者自製／自行生成，聊天已授權使用及修改；手部沿用官方 MakeHuman MPFB CC0 資產及 v2 的已認可成果。來源、版本、授權與參數完整保留，沒有新增外部美術來源。
- 在已認可 GLB 上以 Blender 增加 15×9 披風骨格，60 fps 烘焙實際身體／衣甲避碰；原手部、前臂、劍骨姿勢與時間逐樣比對。透明頭像由同一 GLB 實際渲染。
- 保存可編輯來源、已認可輸入、製作工具、GLB、正式頭像、來源／輸出 SHA、幾何／GIF／遊戲接入驗證。聊天預覽不納入 Git。詳見套件 manifest 與 project/docs/assets/TOWER_BOSS1_3D_SOURCE.md。非 VFX Preset，不加入 VFX 專用索引；前兩版保留。

### codex-authored/tower-boss1-3d-20261108-v2

- 2026-11-08：封魔塔 BOSS1 披風／握劍修訂，保留第一版套件。五個原始 GLB 為使用者自製／自行生成，已於聊天明確授權本遊戲使用及修改；沿用角色、貼圖、劍裝飾及五動作。
- 新手部採官方 MakeHuman MPFB 的 CC0 人體拓樸，版本 b1a2dc98776da9d1eea751b159d42cf61778fe2e，經 Blender 指骨握拳、擬合與權重修整。套件保存 base.obj、rig／weights.mixamo.json、LICENSE.ASSETS.md、MakeHuman 完整參數／來源 SHA、人體及手部可編輯 Blend，並隨遊戲匯出 CC0 授權原文。
- 使用者的兩張握劍參考圖僅作姿勢判讀，未匯入套件。披風／手臂動畫及握柄由 Codex 編修；五動作保持原時長。第三招正面 0.2 倍速只供聊天 GIF 檢視。
- manifest.json 記錄來源、工具、可編輯檔、GLB 及 QA；project/docs/assets/TOWER_BOSS1_3D_SOURCE.md 記錄重建與限制。PNG／GIF 不納入 Git；保留渲染與 GIF 驗證結果。此 3D 模型不是 VFX Preset，不加入 VFX 專用索引。

### codex-authored/equipment-icons-20261031

- 2026-11-01：依使用者實際裝備欄截圖要求，使用內建 imagegen 對全部28張做黑底移除；新增 alpha-sources，保留原始黑底來源，遊戲匯出改為帶實際alpha的透明RGBA PNG。source.json保留原生圖與去背來源雜湊及提示，alpha-validation.json記錄逐圖透明像素與角落驗證。

- 使用者委託 Codex 使用 OpenAI 內建 imagegen 原創生成，已確認布衣與皮靴風格，並追加授權八張硬甲及全部換上。
- 20 張名稱專屬裝備與 8 張通用硬甲；只參考本專案既有裝備圖及本批已核准生成圖，未匯入外部第三方素材。
- 原生生成 PNG、去背來源、實際提示詞、1024 RGBA PNG 匯出、SHA256 及可重現的尺寸／alpha保留正規化和逐檔複製工具保存在該 package。詳見 source.json；export.cjs 接受遊戲根目錄與 --apply／--check。
- 這些為靜態裝備圖示，沿既有 images/equip 與 images/icon 路徑引用，不是 VFX Preset，不加入 VFX 專屬匯出索引。

| package | 來源 | 授權 | 署名義務 |
|---|---|---|---|
| `codex-authored/start-menu-title-20261106` | Codex 依使用者參考圖委託內建 ImageGen 製作，保留兩張來源及透明 WebP，詳見套件 SOURCE.md | 專案自製 | 無 |
| `third-party/google-fonts/start-menu-20261106` | Google Fonts 的 Cinzel 與 Noto Serif TC，兩份 700 字重 WOFF2 | SIL OFL 1.1 | 隨字型保留著作權及授權原文 |
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
| `GandalfHardcore Hell Asset Pack 32x32`（The Damned Enemies and NPCs） | GandalfHardcore（itch.io），使用者購入 | 套件 READ ME：可用於商業／非商業遊戲並可修改；禁止轉售、重新包裝散布、AI 訓練、NFT、納入遊戲開發工具 | 無署名義務；**不得單獨散布素材檔**。有「covered」（遮蔽）版的角色一律用 covered 版，未遮蔽版未使用。2026-10-31 起以 `tools/npc-sprites/build_npc_sprites.py` 切成 `images/sprites/npc/` 給 NPC 使用 |
| `Monsters Creatures Fantasy 2` | 使用者購入 | **套件內未附授權檔**（使用者 2026-10-31 明確指示使用於遊戲 NPC，並表示為付費取得） | **待補授權文件**；同上，經 `build_npc_sprites.py` 切成 `images/sprites/npc/`（Bat／Mimic／Rat／Slime） |

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
