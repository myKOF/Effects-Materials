# NPC 飛彈：白／藍／紫／黃同色晶體與光暈

2026-10-22 / Codex / MISSILE-COLOR-20261022

- 使用者回報四色彈身仍偏藍；原冰箭PNG已有藍色，乘色無法去除。改用本任務專用中性灰白crystal-neutral.svg，所有切面RGB三通道等值，沒有冷色底調。
- 晶體切面與輪廓座標沿本專案原創icearrow-renew.cjs，由遊戲tools/vfx/authoring/author/missile-crystal-shape.cjs重製為無濾鏡SVG。原冰箭PNG與技能Preset完全不改；沒有外部圖片／像素挪用。
- 白#ffffff／藍#469fff／紫#bd69ff／黃#ffd342；各份body、glow、短光錐及世界微霧共用相同色值。保留明暗切面、外暈與透明背景；四份共用同一張靜態SVG，不加新層／濾鏡／粒子。
- 光暈、短光錐、微霧沿既有PROVENANCE所登記Kenney CC0來源；新SVG屬Codex本專案自製。Mote Studio於同輪任務已確認PNG／GIF能力，未提供SVG匯出；沿既有程式化切面工具維持精確座標及可重製性。
- 製作入口：遊戲tools/vfx/authoring/author/missile-crystal.cjs，先製作／註冊中性SVG，再寫四份Preset／layout；之後執行tools/vfx/export-assets.cjs同步正式出貨。素材庫來源與遊戲出貨SVG／配對JSON一致。
- 表定bodyD22、4層、世界粒子上限6、原後退／定點停駐2秒／散開間距／齊射規則保持；沒有新特效ID，沿原配置表。
- 真Pixi／WebGL效能工具tools/vfx/benchmark-missiles.cjs；本機隔離單份及四色同播15ms門檻、測量與限制記於遊戲docs/AI_TASKS同名任務。預覽使用正式BattleRenderer一般鏡頭與正常速度，非放大圖。
- 前版晶體PNG乘色可由素材庫5956226、遊戲bcfcbdd5回復；更早使用者微調亦留Git歷史及user-vfx-tuning-20261022。

## SHA256

- crystal-neutral.svg: 1e56bbff93ba42005a59bc17bc7e764acdc5b529a986dbba8c0acd7d323b20f7
- presets/en-missile-white.json: b6980cadb8135b9717ea90e7b0811eef1da5ee19b765e65a4f83bc553b82b210
- presets/en-missile-blue.json: 7d6b3eb9bc74d623683add7ab13528e378a3a989f1a9384548637e6d9d9d1475
- presets/en-missile-purple.json: 967a7cd7a72d3b26acd1b3391b4b3854ad4745cd8834377f0378583f4baa38aa
- presets/en-missile-yellow.json: f0868e9fff962a0588a27ad43ff2f88593647ab0f99e6a0bd157fc03c9d9f9f1
- layouts/en-missile-white.json: 25e3c24c6df57bb8484cf416f3df9a749b871a2c1046266d6c7fcb6eb5aab46f
- layouts/en-missile-blue.json: 9f2554cc18e2ffe1f570ed90ef2d5d20ae5881eac1f4d4b920d3afccde88e8a0
- layouts/en-missile-purple.json: a3612a7fc1b92129723fa1f483bb2f0be8b9d7ddc07fd77df13ab80ad0ae8c2f
- layouts/en-missile-yellow.json: 80a2b70af5ecaec3ee856923ba81802021d931a66211edffa40c657b1f762b58
