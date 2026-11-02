# 玩家模型劍長縮短10%（2026-11-02）

沿用上一層SOURCE.md的既有Meshy／Blender模型與使用者授權，沒有引入外部素材或重新生成造型。Blender 5.2.3 LTS編修護手以外的84個劍身頂點，只改Sword局部長軸；總長比例0.8999999739，寬厚、護手、握柄、人物及全部動畫／蒙皮／貼圖／索引資料保持。原有模型問題不在本項修正。

- input-grips36.glb：修改前的正式模型，SHA256見validation.json。不可對縮短後結果重複套用。
- shorten-sword.py：與遊戲tools/meshy-pipeline/src/shorten-sword.py相同的Blender重建來源。
- sunbrand-knight.blend：完整可編輯、含貼圖、骨架與五動作的縮短後來源。
- sunbrand-knight.glb：正式匯出結果，與上一層及遊戲正式檔逐位相同。
- validation.json：長度、變更範圍、版本與前後SHA驗證。
- preview.png：Blender實際成品三分之四視角，僅作素材預覽；遊戲另有調色及補光。

重建：blender --background --python shorten-sword.py -- input-grips36.glb <output.glb> <editable.blend> <report.json>

Blender mesh頂點執行縮短後將位置寫回原GLB位置緩衝區，避免通用glTF重匯出改動既有動畫、布料頂點序號及權重。之後重新匯入完整成品並保存Blend。護手根部沿用原製作工具BLADE_Y0。總長以原模型Sword剛性頂點的柄端至劍尖量測；為保持握柄，劍身部分壓縮較多。輸出與隔離重建SHA一致，原始動畫資料逐位保持，既有3D模型修正／內測控制與快取相關18項回歸及629檔Build通過。擴大2D方向測試有一項原有DIR-8死亡正則斷言失敗，相關renderer與測試均與HEAD相同，未為本項修改它們。未執行瀏覽器長時間遊玩。
