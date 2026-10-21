# NPC 飛彈：縮光暈、長尾跡與剎停齊射

2026-10-21 / Codex / MISSILE-SALVO-20261021

使用者依專案既有飛彈的GIF要求：縮小光暈、拉長尾跡，後退速度至少加倍，剎停1秒後齊射。

- 既有光暈直徑縮至40%、透明度減半，光芯與彈頭收細；細長尾芯與世界座標粒子讓方向清楚，保持四色。
- 沿用既有 particle-pack（Kenney CC0）及 new_materials（素材庫PROVENANCE.md記載CC0）的 light_03、flare_16、circle_05、smoke_04；沒有新增或複製第三方圖片。
- 本次僅調整既有Preset，不繪製／編修獨立圖片，因此不需點陣繪圖工具。素材製作由遊戲tools/vfx/authoring/author/enemy-skills.cjs的missile函式重現。
- loop由遊戲權威飛行／停駐事件結束；粒子依真實時間播放，抵達後自然淡出。幾何與傷害判定仍由模擬層決定。
- 候選配置leg1=0.275秒（原0.55秒）、hold=1秒及說明已保存遊戲param-patches，尚待使用者BAT套用；不將隔離預覽當成正式參數已更新。
- Preset與layout是必要可編輯來源，與遊戲同名版本逐位元一致。無新bitmap、無素材索引／匯出PNG變更。

## SHA256

- presets/en-missile-white.json: eaa75dea52efa842a9e99f2d54f7ae0ab8d464459d4514b69a370e6410eddb04
- layouts/en-missile-white.json: 0c14748e861b045c7ffa9491fa3c9f2effddc25a81c2c27438acf4a77828b2fa
- presets/en-missile-blue.json: 09bad1b1656b24c6fde1325604eed3a390749a21ca13a6e74e2b7089b5d4cc9b
- layouts/en-missile-blue.json: 28e7a5f7bd23cfd1fb25dd9a3b713a2ab6507f6d87883f327cb4d992b203a085
- presets/en-missile-purple.json: d60e1460996775abe048966c58eadd806cb1c588d2bf482b3a78e11ef35599ce
- layouts/en-missile-purple.json: ec4dd9408bdfbe336ec08ef98e21d0ed9d38894fab15191942527b985700e06b
- presets/en-missile-yellow.json: dee3f9b6f3bc6230cab207b7c86b12596a353c7951507238c86a71071c156036
- layouts/en-missile-yellow.json: da3077c3c9b5ce59d210aea249e27c6e5de7d690ed422e33d260806fdd4878a0
