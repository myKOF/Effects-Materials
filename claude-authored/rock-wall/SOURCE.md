# 原創四塊岩壁（2026-10-17）

Codex 依使用者要求重新繪製，無第三方圖像。沿用既有穩定資產ID，保留256×200畫布、(128,140)地面中心及200×67足跡；每面四塊，12角度共用同一組削角幾何。

製作工具：Idle-RPG tools/vfx/authoring/author/rock-wall-slabs.cjs。工具經vfx-library-root解析本機Root，不含絕對路徑。逐面光照、多尺度噪聲石紋、低對比礦物顆粒與裁切裂隙皆自製。Mote Studio可用，但像素畫布不適合保留本系列SVG的多角度幾何，因此採既有向量工具。

匯出：更新asset-index內這12項的大小／SHA256，再執行既有tools/vfx/export-assets.cjs；遊戲副本須與本目錄逐位元相同。沒有更改Preset、layout或實際碰撞。
