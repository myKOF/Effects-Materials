# 四款全身骷髏與四動作

使用者2026-11-01指出memento_skeleton只有半身，要求以其為原型製作兩位戰士與兩位法師，四動作齊全；先看造型後追加適度豐富、區分色系，最終明確核准替換框選四NPC，並要求兩位法師是移動較慢的魔法遠程怪。

- 骷髏劍盾兵：磚紅盾面／腰布、舊鐵與象牙骨色；替換swamp_10／cheeky_devil。
- 骷髏斧衛：苔綠布料、鐵盔與雙手斧；替換swamp_12／hell_giant。
- 骷髏杖法師：深藍袍／琥珀杖；替換undead_12／the_devil。
- 骷髏咒書師：暗紫披肩／衣擺、淡紫施法、棕皮咒書；替換swamp_8／memento_skeleton。

來源：既有授權購入GandalfHardcore素材的頭骨、骨色與像素風格作參考，沒有裁貼半身角色補腿；內建imagegen新繪四款完整軀幹、骨盆、雙腿、武器與96張實際關節姿勢。原型參考見sources/reference-half-skeleton.png，既有來源授權記錄見素材庫根PROVENANCE.md。新圖為本專案AI生成、以授權原型作風格參考；不宣稱無關第三方原型，未使用其他外來素材或API key。

專案優先RPG Mote Studio已確認可編輯與匯出，但hosted無批次MCP、本機工具未安裝，這次全身新繪與原圖重上色使用內建imagegen，完整提示保留prompts.json／color-prompts.json。棕色初版及上色原生1254平方PNG均保留於sources，斧版經額外留白修正，武器不貼外緣。四款各四排六幀：待機／移動／攻擊／死亡；兩款法師的色彩只增加一個布料主色與少量法術亮色。原圖色系調整使用imagegen，normalize.cjs只分割、對齊、最近鄰縮小、整角色共用調色與格式輸出，未以程式捏造關節動作；色調區隔指四個主色家族，並非每張只有幾個RGB值。

匯出：16張768×128 RGBA橫向圖，每幀128平方、腳點(.5,.875)、面左，可見一般高度54。16份.mote可繼續編修。Imagegen原圖排距不是精確四等分，依透明行縫找切點；相鄰劍尖接觸時用上色前輪廓引導分組，不截斷武器。過遠的小碎片與透明背景微弱雜訊不混入下一組動作，檢查每幀主體完整、留透明邊、六張不同幀。GIF明確設定36格各80ms，總2.88秒，避免單一delay值只套到第一格。預覽輸出放聊天visualizations，未放入正式素材。

candidate-manifest.json為該批匯出metadata（名稱保留自預覽階段）；replacements.json記錄使用者核准的替換，遊戲NPC.xlsx仍是名稱、動作與數值權威，兩法師魔法型／24米／6米每秒由來源表套用。export.cjs與遊戲既有export_supplemental一起匯出並核對SHA；舊四款的PNG與metadata完整保留於遊戲，另列retiredChars，現行NPC不再使用。完整重建須先取得來源套件與此套件，來源檢查在清空輸出前執行。

重製：安裝package.json依賴後`node normalize.cjs <preview-directory>`；需套用時依sha256.json核對16張輸出，再`node export.cjs <game-root> --apply`；`--check`／`--source-check`唯讀驗證。遊戲以既有vfx-library-root解析素材庫位置，沒有本機路徑寫入受控設定。驗證與雙倉庫Commit見遊戲docs/AI_TASKS.md之NPC-SKELETON-FOUR-20261101。

2026-11-02步態修正：依使用者指出的直接換腳／只動手問題，本包落地雙足角色的walk改由相鄰npc-walk-cycles-20261102保存的AI新繪八階段姿勢組成；原製作器保存為*-base.cjs，再套用該包步態。移動八幀、其他三動作保持，原生Mote及SHA同步，原色盤與角色尺寸／朝向保留。最終匯出要求來源／輸出SHA、腳部量測及visual-review.json目視SHA吻合。原來源與授權限制繼續適用。
