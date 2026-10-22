# 毒素加持：連續毒水

2026-10-22 Codex 原創 SVG 16 格流動圖集。僅參考使用者所附網路截圖的狹長毒水、破碎邊緣、明暗流紋與細泡沫；未下載、描摹或使用參考圖像素。Mote Studio 可存取，Export 僅 PNG／Sprite sheet／GIF，不支援本次原生 SVG，改採專案向量作者。

遊戲使用表定長度／球半徑作為水帶長度／半寬、speed 決定前緣速度，四臂從中心連續伸展；不再逐顆放球。編輯器預覽採既有表定預設。重製：node tools/vfx/authoring/author/poison-trail.cjs，再執行 node tools/vfx/export-assets.cjs。

使用者審閱第一版後指出等寬直條像刷漆，已改為左右偏移、寬窄起伏的非對稱輪廓，以重疊不規則色塊、局部渦流、細泡沫及柔霧邊緣構成；四臂使用不同圖集播放速率。沒有沿整條水路排列的平行線。
