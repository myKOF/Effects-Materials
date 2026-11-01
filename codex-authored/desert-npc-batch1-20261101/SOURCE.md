# 荒漠NPC第一批：四款正式動作

2026-11-01，依使用者要求按NPC來源表順序逐批替換仍使用舊圖者，每次四款、四動作齊全，先交GIF。四份GIF已由使用者回覆「好commit吧」核准，依原要求接線荒漠前四款並提交；沒有再改動核准圖像，未啟動下一批。

- desert_1史萊姆 → desert_slime，青綠凝膠、冰藍核心，呼吸／蠕動跳躍／凝膠突刺／攤成膠液。
- desert_2哥布林 → desert_goblin，橄欖綠膚色、棕皮甲與赭紅領巾，短刀攻擊。
- desert_3野狼 → desert_wolf，灰褐皮毛配冷灰藍背部，完整四足與狼尾，撲咬。
- desert_4骷髏兵 → desert_skeleton，骨白、青銅盔盾與青綠腰布，彎刀攻擊。與上一批不同的荒漠步兵造型。

來源皆內建imagegen為本專案新繪，只以已核准自製四色骷髏的低解析像素、深輪廓與材質陰影作風格參考。沒有挪用舊emoji、第三方圖片或API key。原始完整動作稿及留白修正版保存在sources；prompts.json及spacing-prompts.json為完整提示。第二輪只要求縮小每幀、留透明間隔、補完整尾巴／武器邊界，不改角色與動作。

RPG Mote Studio已確認可開啟128平方六幀原生來源；hosted沒有目前可用的批次繪圖端點，這次四種新造型與96姿勢由內建imagegen完成。normalize.cjs只隔離各幀輪廓、排除非角色的微小背景片段及無連接的低alpha雜點、腳點對齊、最近鄰縮小與共用調色；沒有以程式捏造肢體動作。全部24幀同角色使用同一比例，保留攻擊伸展與死亡倒伏。每款四組各六幀，輸出16張768×128透明PNG、16份可在Mote編修的.mote及metadata（保留原candidate-manifest.json檔名）。每幀128平方、朝左、共同腳點(.5,.875)，各物種相對高度分開記錄；遊戲縮放沿用來源表原1.5。

GIF為預覽，放本聊天visualizations/desert-batch1：每款512×576，2×2標示待機／移動／攻擊／死亡，36格每格80ms、總2.88秒循環；各動作依自己的幀時序播放，攻擊恢復待命、死亡停終幀後重播。validate.cjs獨立解碼Mote RLE與96幀PNG逐點比RGBA，檢查四動作、每組六個不同姿勢、透明外緣及GIF明確延遲。遊戲NPC.xlsx仍是配置權威，本批四款四階級只更新動作及圖像備註，名稱／回退外觀／數值／技能／解鎖保持原值。

重製：安裝package.json依賴後 `node normalize.cjs <preview-directory>`；再 `node validate.cjs <preview-directory>`。來源及輸出SHA見sources-sha256.json／sha256.json，驗證見validation.json／asset-checks.json。`node export.cjs <game-root> --apply`同步16PNG與metadata，`--check`／`--source-check`唯讀核對。遊戲export_supplemental依本機素材庫設定解析本套件，打包前先檢查來源，不在正式目錄直接做破壞性重建；先素材庫再遊戲Commit，詳見遊戲docs/AI_TASKS.md之NPC-DESERT-BATCH1-20261101。
