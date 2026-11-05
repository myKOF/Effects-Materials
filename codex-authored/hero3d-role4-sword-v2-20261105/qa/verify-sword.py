import bpy,bmesh,json,math
from pathlib import Path
root=Path('C:/Users/user/.codex/visualizations/2026/11/03/01a1a127-4f3c-7fb1-b99c-9c6b3a6f9a86/role4-sword-v2-20261105')
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(root/'role4-sword.glb'))
report={'glbBytes':(root/'role4-sword.glb').stat().st_size,'meshes':[]}
for obj in bpy.context.scene.objects:
 if obj.type!='MESH':continue
 mesh=obj.data;changed=mesh.validate();assert not changed,'Invalid exported mesh'
 assert all(math.isfinite(v)for p in mesh.vertices for v in p.co)
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
 boundary=sum(e.is_boundary for e in bm.edges);nonmanifold=sum(not e.is_manifold for e in bm.edges);assert boundary==0 and nonmanifold==0,(boundary,nonmanifold)
 report['meshes'].append({'vertices':len(mesh.vertices),'triangles':len(mesh.polygons),'boundaryEdgesAfterWeld':boundary,'nonmanifoldEdgesAfterWeld':nonmanifold,'validated':True})
 bm.free()
bpy.ops.wm.open_mainfile(filepath=str(root/'role4-sword.blend'))
report['editableParts']=len([o for o in bpy.context.scene.objects if o.type in ['MESH','CURVE']]);report['packedUsedImages']=all(im.packed_file for im in bpy.data.images if im.users and im.type=='IMAGE')
assert report['packedUsedImages'] and report['editableParts']>8
(root/'sword-validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
