# 荒漠NPC第二批：四款完整動作

2026-11-01～02，使用者要求依NPC表逐批替換舊圖，後續明確授權持續完成封魔塔最後十位BOSS以外的全部缺圖NPC、採推薦方案並完成提交。本批desert_5～desert_8因此納入正式配置。

- desert_5暗影蝠 → desert_shadow_bat：靛紫毛皮、暗紅翼膜、琥珀眼睛；懸停翼拍／前飛／魔法吐息／折翼落地。
- desert_6樹妖 → desert_tree_spirit：枯木褐、苔綠地衣；完整枝冠、雙臂與根足；待機／踏步／枝臂重擊／倒伏。
- desert_7蜥蜴戰士 → desert_lizard_warrior：青綠鱗片、青銅配件、赭紅腰布、卷尾與短矛；待機／行走／突刺／倒地。
- desert_8半獸人 → desert_orc：灰橄欖身形、鐵灰肩甲、赭紅腰布與重砍刀；待機／重步／斬擊／倒地。

來源是內建imagegen為本專案新繪的角色與姿勢，只參考已核准自製骷髏及荒漠首批的深色輪廓、低解析像素與材質陰影；沒有複製第三方圖片或表格emoji。sources保存原稿與留白修正版，prompts.json／spacing-prompts.json保存完整提示。使用者指出直接換腳及只動手的問題後，樹妖／蜥蜴戰士／半獸人的走路另由相鄰npc-walk-cycles-20261102重畫八階段支撐、抬腳經過與落地；該包保存來源、提示與逐幀目視SHA。

normalize-base.cjs保留初始六姿勢整理流程，normalize.cjs再套用新步態。整理器只分離實際角色、排除無關背景點、最近鄰縮放／腳點對齊／共用色盤及封裝，不以位移或變形假造新關節。單格128平方、朝左、anchor(.5,.875)，暗影蝠活體離地18個原生像素、死亡逐步落地。三款雙足walk八幀，其餘動作六幀，合計102張姿勢、16組透明PNG與16份可編輯Mote來源。

GIF在聊天visualizations/desert-batch2：每款512×576，2×2顯示待機／移動／攻擊／死亡，36格×80ms循環；各動作依自身節奏播放，攻擊恢復待命、死亡停終幀後重播。validate.cjs逐點解碼Mote RLE與PNG核對RGBA、尺寸／透明外緣／不同姿勢及GIF延遲；步態量測與目視紀錄由相鄰步態包守門。

重製：安裝package.json依賴後執行node normalize.cjs <preview-directory>，再node validate.cjs <preview-directory>。來源與輸出SHA保存在sources-sha256.json／sha256.json。export.cjs支援<game-root> --source-check／--apply／--check，由遊戲既有export_supplemental.cjs及素材庫設定解析位置。NPC.xlsx仍是動作選用、名稱與所有遊戲數值的權威；本批只更新四階級圖像欄與備註，沒有調整數值、縮放、技能或解鎖條件。詳見遊戲docs/AI_TASKS.md的NPC-ALL-NEW-20261101。
