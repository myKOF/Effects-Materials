# Attack1 硬甲與回旋重劈候選 R6（2026-10-28）

- 任務：HERO3D-ATTACK1-20261028；Owner：Codex；Review。等待使用者確認動畫與局部重建的手臂盔甲外觀。未 Commit、合併或推送，未替換正式遊戲模型。
- 需求：雙手握劍、向角色右後方回旋、舉劍後猛然下劈、深蹲收刀；保留使用者認可的低蹲姿勢，雙手向前盡量伸展。硬甲不可扭曲／拉伸；手腕受限。交付單視角1200px、25%速度動態GIF，使用者OK前不推送。
- 修正原因：舊版混合蒙皮會扭曲硬甲；後續按關節平面逐三角形切分，又切穿了完整護臂／肩甲。僅驗證分割後每片的邊長不變，不能證明完整甲片沒有被折裂；舊版的驗收宣稱不足，不再據此交付。
- 最終變更：肩甲、上臂甲及護臂在Blender中局部重建為六件完整、閉合、各自連通的硬殼；肘杯／護臂本體／腕緣是同一完整物件，肩甲下緣亦不再分給上臂。各硬殼只有一根骨骼、權重1；移動與旋轉由關節帶動，沒有形變Modifier。外觀較原融合模型略簡化，需使用者確認。其餘盔甲保持分件剛性，披風與布襠本輪採保長度隨動，未加入布料模擬。
- 動作：固定兩隻手相對握柄的方向；左手掌握在柄下11cm處。以有限長度雙節IK、穩定肘部旋轉分支及可達距離約束前伸雙臂，不用縮放或拉動關節補距離。保留原速2.375秒；觸地在24fps基準第26格（1.0833秒），收刀劍身向地面27°、骨盆高度0.58m，起手0.92m。接觸時右臂伸展率99.15%、肘彎15°；左臂96.53%、肘彎30.29°。
- 來源：既有使用者授權製作的 `images/models/hero3d/sunbrand-knight.glb`，SHA256 `e1ab976f8b293d6dce29bfb8f7fe2ea7dc9d6f3af4bd4685edd62a3b2c5b4fc3`。既有模型的製作與授權記錄沿用 `images/models/hero3d/SOURCE.md`。本輪新增手臂硬殼／材質及動作均在本機Blender5.2.3製作，未下載或呼叫付費素材API。使用者附件只參考姿勢與問題位置，沒有像素或圖上造型進入素材。
- 檔案：本目錄的可編輯 `sunbrand-knight-attack1.blend`、實際匯出 `sunbrand-knight-attack1.glb`、`authoring.json`、`qa.json` 及本文件。工具為 `tools/meshy-pipeline/blender/{fix_attack1,rigid_armor,qa_attack1,render_attack1}.py`、`tools/meshy-pipeline/package_attack1.py`；同組候選與工具另保存於素材庫 `codex-authored/hero3d/attack1-review/`。GIF／PNG／診斷輸出只保存在本聊天預覽目錄。
- 匯出後QA：457個時間點；六件完整手臂硬殼驗封閉流形／單一連通分量／Euler特徵2，並檢查整件所有不重複幾何頂點對的距離。完整硬殼最大距離誤差0.61微米、全部分件邊長誤差1.42微米，屬浮點範圍。glTF在硬法線／材質邊界拆開重複頂點，因此拓樸稽核只按重合rest位置焊合，不更動實際模型。
- 其他數值：雙手握柄最大補間誤差3.285mm，四肢長度誤差0.0048mm，非root關節位移誤差0.0027mm、縮放誤差4.3e-6；手腕最大偏離自然綁定方向右55.16°／左42.86°，驗收上限65°，嚴於使用者指定90°。劍尖最低距地0.495mm、腳底最低-0.0263mm為浮點／補間微差，循環首尾位置差0。5254三角面，小於6000預算；20個分件，材質／分件成本尚待正式接線時量測。
- 保留與限制：其他四動作的既有25根骨骼關節曲線逐原始格比對：Attack2 77格、CombatIdle 41格、Death 67格、Run 16格，位置最大誤差8.84微米。這只證明關節曲線保留，剛性重綁會改變其外觀，尚未宣稱四動作完整視覺驗收。未做正式遊戲混合動畫、攻速壓縮、其他甲片接縫及長戰GPU驗收；候選仍需視覺確認。
- 重跑：`blender --background --python tools/meshy-pipeline/blender/fix_attack1.py -- images/models/hero3d/sunbrand-knight.glb <候選目錄>`；`blender --background --python tools/meshy-pipeline/blender/qa_attack1.py -- images/models/hero3d/sunbrand-knight.glb <候選GLB> <qa.json>`；`blender --background --python tools/meshy-pipeline/blender/render_attack1.py -- <候選GLB> <聊天預覽目錄>/large -40 1200 --slow`；`python tools/meshy-pipeline/package_attack1.py <聊天預覽目錄>`。QA PASS；`npm.cmd run build`596檔通過、五支Python AST及`git diff --check`通過。
- 預覽：從重新匯入的候選GLB渲染，單一斜側視角，1200×1200畫面加60px標題。229個渲染樣本以約24fps播放，25%原速、約9.54秒循環；相同停留畫面可在GIF編碼合併，不改總時長。不使用並排／靜態分鏡取代動畫。
- 唯讀未改：AI_RULES／AGENTS／AI_WORKFLOW／prompts/codex、原遊戲GLB／SOURCE、hero3d.js／index／LV總表、skin_fix／既有匯出及處理工具／製作規格、獨立MakeHuman候選與其他任務／素材庫進行中修改。新素材無外部參考圖重製、無新字串／VFX／配置／存檔或協議變動。
- Commit：遊戲與素材庫皆無，保留未提交候選待確認。下一步：使用者看GIF確認；確認後再接正式模型與快取，驗其他動作／完整甲片接縫／遊戲混合與時序，完成必要兩庫提交及獲授權推送。目前不可視為已核准合併或推送。
