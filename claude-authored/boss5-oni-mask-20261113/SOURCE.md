# BOSS5 鬼面（般若面具）來源與交接

- 任務：BOSS5-ONI-MASK-20261113，Claude。使用者提供未綁骨的鬼面模型 `BOSS5.glb`（使用者自製／生成，授權沿用本專案「使用者自製／生成素材可用於遊戲並修改」的既有確認），要求補後腦、眼睛紅光、紅霧拖尾與五個動作。沒有引入其他外部素材。
- 重建：`node tools/boss5/build_all.cjs <BOSS5_source_user.glb> <輸出資料夾> [--previews]`（遊戲專案內的工具；需 Blender 4.5+，預覽另需 Chrome）。

## 檔案與 SHA-256

| 檔案 | 說明 | SHA-256 |
| --- | --- | --- |
| `BOSS5_source_user.glb` | 使用者原始模型（單一網格 12,020 頂點／10,307 面，PBR 三張 2048 貼圖，無骨架） | `e4d44597e7d3858ac58e0876c07f4aa94efeec5663ea268f882049e5230c4791` |
| `boss5.glb` | 補後腦＋綁骨＋五動作成品 | `005debb315af7e4c866bb7bc51f0ccd52c76eaaa5fa01a6040b7efdc6902ea05` |
| `boss5_skull.glb` | 綠色小骷髏子彈（鬼面縮小減面改綠，1,775 三角面） | `06eb30cd94cf534d2c3d4fee63526aa5dbbe923d4813d4375b8a5102ed8acb69` |
| `boss5_dome_albedo.png` | 後腦貼圖 1024×1024（來自正臉額頭花紋的正射投影） | `8072264d030b208b68c2af50370022e1b8df0b44c1dc3b3b8fb52f5007636ea4` |
| `front_albedo.png` | 後腦貼圖的來源：原模型正面正射的平光顏色 | `a3e7b3aebd54426899c0d2b32c191f3b585ffa1fbf1a90d637a9cc6708287174` |

## 模型改造

1. **補後腦**：原模型是「薄殼面具」，背面是凹腔（開口）。用面具自己的開口輪廓（內外殼交界的 3D 邊界，含下顎斜面）生成一個顱頂圓頂（深度 0.55），輪廓外推到面具外皮、並向腔內多延伸一圈裙邊封住縫隙。圓頂用獨立材質 `DomeMat`（金屬 0／粗糙 0.45，與原貼圖平均值一致）。
2. **後腦貼圖**：把原模型正面正射渲染，去掉角、眼、鼻、嘴，留額頭的火焰與雲紋，向下漸變為朱紅底色，再以 (x,z) 平面投影貼到圓頂，花紋與頭頂白色火焰自然接續。
3. **眼睛**：兩顆紅色自發光橢球放在眼窩內（`EyeGlow`，emissive 強度 6，使用 `KHR_materials_emissive_strength`），骨骼 `Eye_L`／`Eye_R` 的縮放在每個動作裡做閃爍。
4. 座標：模型高約 2 m，面朝 glTF +Z；面具中心離地 1.5 m（下巴離地約 0.5 m，飄浮）。

## 骨架（18 根）

`Root`（地面）→ `Body`（面具中心，所有位移／前傾／起伏）→ `Eye_L`（角色左，+X）、`Eye_R`、`Shard_01`～`Shard_14`（死亡碎片，平時與 Body 完全同動）。
全部權重 1.0（剛體，無混合）。碎片以面中心的最遠點取樣＋Voronoi 分成 14 塊，每塊頂點獨立（不與鄰塊共用）。
掛點（Body 的子節點）：`Fx_Mouth`（嘴前，噴火／吐骷髏起點）、`Fx_Back`（腦後，紅霧發射點）。

## 動作（30 fps，每個動作都對 18 根骨骼逐格打鍵）

| 動作 | 秒數 | 內容 | 事件時間 |
| --- | --- | --- | --- |
| `Walk` | 1.000（循環） | 飄浮前傾 20°（±2.5°）、上下起伏 ±0.12 m、輕微左右擺 | — |
| `Attack1` | 1.800 | 蓄力後仰＋後退 0.8 m → 約 0.17 s 衝出 6.0 m 撞擊（壓扁＋震動）→ 0.9 s 飄回原位 | 撞擊 0.633～0.8 s |
| `Attack2` | 1.333 | 後仰吸氣（膨脹 14%）→ 猛然前傾吐出 → 回彈 | 子彈生成 0.467 s（`Fx_Mouth`） |
| `Attack3` | 2.200 | 後仰 32° 顫抖蓄勢 → 前撲噴火持續 → 收回 | 火焰 0.733～1.6 s（`Fx_Mouth`） |
| `Die` | 4.000 | 緩慢上升 1.3 m、愈來愈劇烈抖動、縫隙漸裂、眼睛爆亮 → 2.0 s 碎裂成 14 塊（拋射、彈跳 ≤3 次、翻面落定）散落地面 | 碎裂 2.0 s |

位移寫在 `Body` 骨骼上（動作內位移，非 Root motion）；遊戲若自己驅動位移，攻擊 1 需把 `Body` 的前進量改成由程式控制。

## 執行期特效（GLB 放不下的部分，預覽用的參數）

預覽程式 `tools/boss5/viewer/viewer.js` 以 three.js 實作，可作為日後做成 VFX Preset 的參考：

- **眼睛紅光**：每眼一個加色光點＋大光暈，隨 `Eye_*` 縮放閃爍，另外每眼約 30 顆／秒的橘紅火星。
- **紅霧拖尾**：從 `Fx_Back` 發射，世界座標粒子，壽命 1.1～1.7 s，尺寸 0.3→1.0～1.6，顏色深紅→暗紫，噪點邊緣；發射率 30 + 5×速度（顆／秒）。
- **攻擊1**：撞擊點橘白火花＋閃光＋地面煙塵。
- **攻擊2**：三顆 `boss5_skull.glb`，速度 26 m/s，方向 0°、+30°、−30°，各飛 60 m（約 2.3 s）後爆成綠色火花；綠色拖尾。
- **攻擊3**：從 `Fx_Mouth` 水平噴出，速度 19.5～21.5 m/s、壽命約 0.75 s（射程約 15 m）、圓錐散射約 ±2.6°，三層（橘紅火焰＋白熱核心＋深色煙）。
- **死亡**：抖動期間隨機紅色火花（愈來愈密），碎裂瞬間紅霧球＋閃光＋火花；碎片落地時揚塵。

## 未完成／注意

- 尚未接進遊戲（沒有改 `NPC.csv`、沒有進 `images/models/npc3d/`）；要上線時依 BOSS3 的流程匯出，並依遊戲 VFX 規範（`AI_RULES.md` 8.4）把上述特效做成 Preset 登記。
- 沒有獨立的 Idle／Hit 動作；站立可停在 `Walk` 首幀。
- 碎片是單層薄殼（雙面材質），沒有補斷面厚度。

## 單位說明（重要）

動作與預覽裡的「米」是模型自己的座標（1 單位＝1 m，面具高約 2 m），**不等於遊戲的米**（遊戲 1 米＝10 座標單位，3D 模型另依 NPC 表「縮放比」縮放上畫面）。攻擊 1 的 6 m、火焰 15 m、骷髏 60 m 是設計意圖，接進遊戲時要以遊戲米重新換算。見遊戲專案 `docs/assets/BOSS5_SOURCE.md`。

## 遊戲用版本（2026-11-13 接入第5隻封魔塔BOSS）

| 檔案 | 說明 | SHA-256 |
| --- | --- | --- |
| `boss5_game.glb` | 遊戲用 GLB（與 `images/models/npc3d/boss5.glb` 逐位元相同）：Walk／攻擊2／攻擊3 的水平位移固定；攻擊1 因 BOSS 改近戰只保留 0.9 m 前撲；死亡碎片散布限制在 NPC 畫布內（深度 ≤ 3.0 m、橫向 ≤ 2.4 m）；面具與後腦材質 baseColorFactor 乘 0.5（遊戲 ACES 曝光會把飽和朱紅曬成粉紅，`tools/boss5/patch-game-glb.cjs`） | `c72afd9ed63fd8351e7d9b288e0538dc1e219c434b4588b6329fa9518e444ff8` |
| `boss5_oni.png` | 1080×1080 透明頭像（Walk 首格、右前方 22°），與 `images/sprites/boss/boss5_oni.png` 相同 | `ef098e32138dfd6b01841eb0f650db9e12f4fe4ab9a48f9999b63017c7d00519` |

- 產生方式：`build_rig.py --game`、`render_portrait.py`（`node tools/boss5/build_all.cjs` 會一併產出）。`boss5.glb` 仍保留含 6 m 衝撞位移的版本供日後由程式驅動時使用。

## 戰鬥特效 Preset（2026-11-13）

- `vfx/oni-skull-green.png`（SHA-256 `7039b85ed101c3590be6fa5d94433ee57b9b8a817d3cd37fe31d263c208fc07a`）：綠色小骷髏側面 256×256 透明圖，由 `boss5_skull.glb` 渲染（`render_skull_sprite.py`），供 `boss-oni-skull`／`boss-oni-ram-hit`／`boss-oni-skull-hit` 使用。
- 八份 Preset 在遊戲專案 `vfx/presets/boss-oni-*.json`（製作腳本 `tools/vfx/authoring/author/boss-oni.cjs`），播放邏輯 `js/boss-oni-fx.js`，說明見 `docs/assets/BOSS5_SOURCE.md`。

## 另外兩個貼圖版本（2026-11-13，Lv2 藍／Lv3 紫）

使用者提供 `BOSS5_2.glb`（藍）、`BOSS5_3.glb`（紫）：與原版同一個網格（12,021 頂點，只多一個 UV 接縫頂點）、不同的三張 PBR 貼圖。動作與骨架整套重做套用（`node tools/boss5/build_all.cjs <來源> <輸出> ` ；變體要設 `BOSS5_HORN_REF=<原版輸出>/_work/front_albedo.png`，角的位置才從原版紅色面具取得，後腦底色改取臉部最常見色）。遊戲用檔案與頭像：

| 檔案 | SHA-256 |
| --- | --- |
| `BOSS5_2_source_user.glb` | `1de23247a6d62247aae72048eb8f3675c77cb8d287cdc9d5ade6087d998a6bff` |
| `BOSS5_3_source_user.glb` | `861b4b8e5c96c25e6499b823121b47d8cca011b83ddb26528f9c6283690000c8` |
| `boss5_lv2_game.glb`（＝ images/models/npc3d/boss5_lv2.glb） | `04814f6f30a6b5ddb5904d74e240e194344b42e5f70d878031cf48237bd1171e` |
| `boss5_lv3_game.glb`（＝ boss5_lv3.glb） | `7a03402cfa3a746b6d5ef9212acf8e914a230d5f89d623d8b18a699e943138e8` |
| `boss5_oni_lv2.png` | `1ce37b4bdee90ac919348e43df9c5af3e0077f79d6e22f5377940ec96e416712` |
| `boss5_oni_lv3.png` | `28e174d4546849d5bd8dc04d959a5ee3a9ec365781500c0d621d7a220bacbe43` |

## 藍／紫版的小骷髏與火焰顏色（2026-11-13）

- 紅版（第5層）：綠色小骷髏＋橘色火焰；藍版（第15層）：青藍小骷髏＋藍白火焰；紫版（第25層）：紫色小骷髏＋紫色火焰。眼睛紅光、紅霧、撞擊、碎裂三版共用。
- 小骷髏貼圖由綠版色相轉換（`tools/boss5/hue_shift.py`）：`vfx/oni-skull-blue.png`（SHA-256 `79266501e0bf4e416554ce645fcd387e02c1f5da2f9b445bce19f7966505d34f`）、`vfx/oni-skull-purple.png`（`498a71f08e88e28118bb77c4a52d0523d3f3e124bc7a10b5f4a252b6fed9a77f`）。Preset 為 `boss-oni-{spit,skull,skull-hit,flame}-{blue,purple}`（`tools/vfx/authoring/author/boss-oni.cjs` 的 PALETTES）。
