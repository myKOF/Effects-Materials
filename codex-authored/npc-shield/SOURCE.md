# NPC 護盾細邊（2026-10-18）

Codex 原創 SVG 白色漸層遮罩，沒有匯入、描圖或逐像素複製外部素材。已先檢查 Mote Studio；此項需要精確的向量環形漸層與半高寬，因此使用 SVG 原生幾何。

- thin-shell.svg：512×512，亮邊半高寬 12px，取代原 sphere_41 的約24px亮邊；原亮邊外緣半徑229px保留，中心僅4%白色透明薄膜。
- thin-rim.svg：512×512，亮邊半高寬約16.5px，取代原 circle_02 的約33px亮邊；原亮邊外緣半徑173px保留。
- Preset 的位置、縮放、色彩、alpha、光暈、星芒數量與動畫時序保留；星芒改用add消除既有黑底。

遊戲經正式 asset-scanner 與 export-assets 匯出至同一相對路徑，沿用配置表 Status.eInvuln 的 en-gold-dome，無新增特效來源。Preset 保存位置仍是 codex-authored/npc-vfx-adjustments-20261014/presets/en-gold-dome.json。
