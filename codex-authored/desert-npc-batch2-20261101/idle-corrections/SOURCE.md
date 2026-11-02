# 半獸人原地待機修正（2026-11-02）

使用者指出原待機逐幀向前滑行再跳回起點。六幀腳底中心原為74、67.5、64、62、60、56.5（跨度17.5px）；只調整每幀原點，保留所有原RGBA像素、六種姿勢、128×128畫格、160ms延遲、角色造型及其他動作。

製作工具是專案優先的RPG Mote Studio https://rpg-mote-studio.vercel.app/。匯入既有desert_orc_idle.mote，逐幀Select All後以方向鍵平移，再取消選取；六幀(dx,dy)為(-10,1)、(-4,0)、(0,1)、(2,0)、(4,1)、(8,1)。原生保存與水平六欄PNG匯出完成，原生PNG與Mote RGBA逐像素完全一致，透明／色彩無差異。沒有重畫、重新生成／引入圖片，沒有調慢動畫或凍結為單幀。

- desert_orc_idle-before.mote：原始六幀歷史來源。
- desert_orc_idle.mote：Mote實際保存的修正版，可繼續原生編輯。
- apply.cjs：讀取修正原生幀，嚴格核對原像素只按上述偏移平移，再渲染正式PNG及同步輸出Mote／SHA／驗證。每次從該原生來源輸出，不對既有PNG重複平移；normalize.cjs在原圖／八幀步態重建後呼叫，export.cjs亦驗證正式PNG與原生來源一致。
- validation.json：來源／輸出SHA、偏移、六幀延遲與像素守門。
- before-after.gif：相同速度／尺度／基準線的前後待機循環對照；四動作GIF另由正式輸出重新渲染，不保留舊待機預覽。
- browser-report.json：正式Pixi／完整renderer四階級四動作播放、攻擊回位／死亡停幀、六幀腳點、errors／warnings驗證。

修正後腳底中心64、63.5、64、64、64、64.5，水平跨度1px，實體腹／腳基線不變（腳底實心alpha>=128於112px）。保留輕微呼吸／持刀變化及原本微小站姿調整；不改walk八幀、attack／die六幀、朝向、metadata尺寸、NPC.xlsx數值或其他NPC。所有動作與陰影仍由原渲染器播放。詳見遊戲任務NPC-ORC-IDLE-20261102。

重建：在素材套件執行 node normalize.cjs <預覽目錄>，再 node validate.cjs <預覽目錄>。獨立再匯出修正idle可執行 node idle-corrections/apply.cjs <預覽目錄>。遊戲執行 node tools/npc-sprites/export_supplemental.cjs --source-check / --apply / --check。相依套件沿既有package與bundled Node環境。
