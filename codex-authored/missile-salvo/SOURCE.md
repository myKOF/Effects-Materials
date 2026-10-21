# NPC 飛彈：柔光錐與淡散光點

2026-10-21 / Codex / MISSILE-SOFT-CONE-20261021

使用者指出上一版固定光棒尾巴太硬，並指定可改為更好看的光錐。

- 移除tail-core固定細長光棒，改為兩層錐尖貼彈頭的漸層柔光錐。亮內芯與淡彩外層依生命期淡出，兩側向後展開。
- 光錐只在起飛／齊射時短暫出現；世界座標霧點／微光粒子留在真實路徑，低漂移、短發射窗，停駐後散完，不再噴成細長直棒。
- 彈體持續顯示，由既有權威事件結束；原光暈尺寸、四色、判定幾何、飛行／剎停／齊射／傷害時序不變。
- 沿用素材庫PROVENANCE.md記錄的particle-pack、light-masks-1.0（Kenney CC0）與new_materials（CC0）。新增引用的cone_composed_c.png已在遊戲出貨索引，沒有新素材檔案或第三方下載。
- 僅調既有Preset，未繪製／編修獨立點陣圖片。遊戲tools/vfx/authoring/author/enemy-skills.cjs的missile函式可重製。
- 前一版689d9cf保存原小光暈／長尾芯；此版依使用者修正外觀。新時序leg1=0.275、hold=1仍在遊戲param-patches等待使用者BAT，隔離GIF不代表正式配置已套用。

## SHA256

- presets/en-missile-white.json: 424ef266443c4873de72e578c1a9608591beb393620b02d8aadcaab72ab83a40
- layouts/en-missile-white.json: f50e4863bc9d8d1df0e026cab416c107ed2ab8f81313316f9a934d364545973d
- presets/en-missile-blue.json: 705630e0135e2d92dfeac93d6728a9337094720cb969e14250080ac353dd589f
- layouts/en-missile-blue.json: ea3282e605589c6ce9a845085b53cec723bd10cfa1006782fac89a4eb3087e55
- presets/en-missile-purple.json: 10ffe3e552aefc86671af80159be2694d3ca9b68b1cce4cbf35dc27e1dd446bd
- layouts/en-missile-purple.json: f5b72381ca91a3028c18ca0da44955100d47b65e6d2aa163152b854bf640c90a
- presets/en-missile-yellow.json: 9462154859a09db8f79c07c558406ed35eb6ee9d54a70ec7fc933fb7bcc696bf
- layouts/en-missile-yellow.json: 92b38d8c1b806a7766cf77fd87fd72557a78fabc83c8d0f9705a6a2db5542ee0
