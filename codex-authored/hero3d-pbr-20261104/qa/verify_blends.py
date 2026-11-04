import bpy,json
from pathlib import Path
root=Path('D:/MyGame/Asset/codex-authored/hero3d-pbr-20261104/source')
report={}
for role in ['role','role1','role2','role3']:
 bpy.ops.wm.open_mainfile(filepath=str(root/(role+'-pbr.blend')))
 images=[im for im in bpy.data.images if im.users and im.type=='IMAGE']
 normals=[]
 for mat in bpy.data.materials:
  if not mat.use_nodes:continue
  for node in mat.node_tree.nodes:
   if node.type=='NORMAL_MAP':
    for link in node.inputs['Color'].links:
     if link.from_node.type=='TEX_IMAGE':normals.append(link.from_node.image.colorspace_settings.name)
 report[role]={'actions':len(bpy.data.actions),'usedImages':len(images),'allPacked':all(im.packed_file for im in images),'normalColorSpaces':normals}
 assert report[role]['actions']==6 and report[role]['allPacked'] and normals and all(c=='Non-Color'for c in normals)
Path('C:/Users/user/.codex/visualizations/2026/11/03/01a1a127-4f3c-7fb1-b99c-9c6b3a6f9a86/pbr-20261104/blend-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
