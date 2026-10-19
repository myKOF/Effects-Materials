# 深淵火獄地面熔火池

2026-10-19，Codex依使用者指定，只保留地面熔火池，無上冒火焰／煙霧／火星粒子。後續依要求稍微偏黃，僅調整兩個tint為#ff5810與#c4460c。

- 原創組合配置參考專案NPC瘟疫 en-toxic-pool 的 sludge／murk 兩個貼地圖層，調整為略偏黃的橘紅熔火色；沒有引入或重畫圖片。
- 兩張貼圖：light-masks-1.0/default/circle_a_noise.png、light-masks-1.0/transparent/circle_b.png，均為既有 Kenney CC0 素材；授權見素材庫 PROVENANCE.md。
- Preset保持兩個sprite、零particle；圓形author半徑60px，標準六米。生命由遊戲權威事件控制，四秒後停止。
- RPG Mote不適用此引擎原生JSON組合／投影配置，未進行點陣繪圖。
- 遊戲來源 tools/vfx/authoring/author/mire-inferno-pool.cjs；在遊戲倉庫執行 node tools/vfx/authoring/author/mire-inferno-pool.cjs 可重建Preset與單根layout。author副本使用遊戲倉庫既有preset-kit；reference保存本次NPC參考快照。
- Preset SHA256：4777b55ee3d5b4af3b95984982d0cb517cd5d73bd3b234eb02d56fd3ecfeddc5
- 參考快照 SHA256：d407de98bf386e28ef05a256f9069eb015bc65b8156fa53a26fb0f783b387a87

預覽GIF屬聊天展示，不作為正式素材保存；舊上冒版本未納入素材庫。
