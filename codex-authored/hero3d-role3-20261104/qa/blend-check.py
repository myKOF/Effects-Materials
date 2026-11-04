import bpy,json
from pathlib import Path
p=Path(r'C:\Users\user\.codex\visualizations\2026\11\04\01a1a66c-3015-7813-b1ff-580016b36036\role3')
bpy.ops.wm.open_mainfile(filepath=str(p/'role3.blend'))
images=[i for i in bpy.data.images if i.users and i.type!='RENDER_RESULT']
assert len(bpy.data.actions)==6 and all(i.packed_file for i in images)
r={'actions':len(bpy.data.actions),'allImagesPacked':True,'images':len(images)}
(p/'blend-report.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r))
