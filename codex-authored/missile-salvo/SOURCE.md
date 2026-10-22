# NPC 飛彈：四色晶體彈身與外層光暈

2026-10-22 / Codex / MISSILE-CRYSTAL-20261022

- 使用者指定類似寒冰箭的子彈，同時保留外圍光暈；白／藍／紫／黃各有獨立色調。
- 直接重用本專案原創 codex-authored/icearrow/icicle.png，原製作程式在遊戲 tools/vfx/authoring/author/icearrow-renew.cjs；沒有改原寒冰箭PNG、原Preset或引入外部素材。原圖的切面與透明邊緣完整保留，四色乘色於Preset完成。
- 外暈、短光錐、淡散世界微霧沿用既有PROVENANCE所登記的particle-pack與light-masks-1.0（Kenney CC0）。沒有新獨立圖檔；引用資源集合與出貨索引保持。
- 四層：一張實體晶體、一層外暈、一張起飛短光錐及單一世界粒子層（最多6顆）；沒有Mesh、濾鏡、逐格新圖集或持續大量發射。
- 保留原表定bodyD22與authored radius8契約，以及快速後退、定點停駐2秒、原間距與同拍齊射規則。
- 可重製作者：遊戲 tools/vfx/authoring/author/missile-crystal.cjs，既有enemy-skills製作入口委派至此。
- 效能工具：遊戲 tools/vfx/benchmark-missiles.cjs；Editor估算與真Core／Adapter／Pixi／WebGL同步GPU完成量測分開紀錄，完整結果見遊戲docs/AI_TASKS的同名任務。15ms為本機隔離單份每幀量測目標，不能視為所有硬體／全戰鬥硬即時保證。
- 已檢查Mote Studio可用的像素編輯與PNG／圖集／GIF匯出；本次只組合已授權的現有圖，不需另行作圖。
- 前版柔光錐與使用者手調可由素材庫c7dcbc3／90fbb12及遊戲歷史回復，舊版整組另存user-vfx-tuning-20261022。

## SHA256

- presets/en-missile-white.json: 7620aaaddd3ba8634da15457b1e148df00c9f47cab6c71eba500d8da6fe68e4b
- layouts/en-missile-white.json: 25e3c24c6df57bb8484cf416f3df9a749b871a2c1046266d6c7fcb6eb5aab46f
- presets/en-missile-blue.json: 8163fbff2eb60852faac3264aefc63512d12701acc21c8f554588e82cc32212f
- layouts/en-missile-blue.json: 9f2554cc18e2ffe1f570ed90ef2d5d20ae5881eac1f4d4b920d3afccde88e8a0
- presets/en-missile-purple.json: 13d55628453f5f73dd2a6fd8ee1634f9c8a27cb2f3a8cfda7395ff5e197dc91a
- layouts/en-missile-purple.json: a3612a7fc1b92129723fa1f483bb2f0be8b9d7ddc07fd77df13ab80ad0ae8c2f
- presets/en-missile-yellow.json: fd7c20f0f0e1aab64d81ed128941eba745fa87286f365830d0c12a1eb5613be1
- layouts/en-missile-yellow.json: 80a2b70af5ecaec3ee856923ba81802021d931a66211edffa40c657b1f762b58
