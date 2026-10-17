# 不屈鬥魂：金色護罩與天降白光

作者：Codex，2026-10-12。使用者要求的技能特效，預覽後已授權接入正式技能。

- presets/st-indomitable-gold.json：金黃色直立橢圓護罩，半透明光膜及雙圈邊光；循環播放，遊戲事件持續時間與無敵狀態共用技能參數，時間到立即回收。
- presets/pillar-indomitable-white.json：白光從上方落下至角色腳底，預設 2 秒後消失，不循環；事件時間由 Skills2 的 lightSec 控制。

使用者參考圖僅供金色色彩與包覆感參考，沒有匯入、描摹或複製參考圖像素。Preset 圖層組合、色彩與時序為本次原創製作；沿用專案已在使用且已匯出的既有素材，未引入新的外部素材：

- light-masks-1.0/default/circle_b.png
- light-masks-1.0/default/circle_b_noise.png
- light-masks-1.0/default/ring_a.png
- light-masks-1.0/default/water_caustics_a.png
- light-masks-1.0/default/cone_b.png
- light-masks-1.0/default/streaks_composed_d.png
- light-masks-1.0/default/streaks_composed_b.png

遊戲副本：vfx/presets/ 下同名檔案。配置權威：config/Excel/Skills2.xlsx 的 counter／indomitable 列，金色護罩填「觸發地板特效」、白光填「觸發命中特效」；兩者均依作者尺寸跟隨角色腳底，不套用控制範圍或場景倍率。擊退距離亦由同列 pushM 控制，現為 30 米。