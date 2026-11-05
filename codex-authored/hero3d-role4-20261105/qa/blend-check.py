import bpy,bmesh,json
from pathlib import Path
base=Path('C:/Users/user/.codex/visualizations/2026/11/03/01a1a127-4f3c-7fb1-b99c-9c6b3a6f9a86/role4-game-20261105')
bpy.ops.wm.open_mainfile(filepath=str(base/'role4.blend'))
report={'meshes':[],'actions':[a.name for a in bpy.data.actions],'images':[]}
for o in bpy.data.objects:
 if o.type!='MESH':continue
 assert not o.data.validate(verbose=True),'Invalid mesh'
 bm=bmesh.new();bm.from_mesh(o.data)
 # Body and its caps only; the independent approved weapon/hand are preserved.
 bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.material_index>1],context='FACES')
 bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
 bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
 boundary=sum(e.is_boundary for e in bm.edges);nonmanifold=sum(len(e.link_faces)>2 for e in bm.edges)
 report['meshes'].append({'name':o.name,'vertices':len(o.data.vertices),'faces':len(o.data.polygons),'bodyWeldedBoundaryEdges':boundary,'bodyWeldedNonmanifoldEdges':nonmanifold});bm.free()
 # Forced spatial welding merges coincident independent armor shells.
 # Actual exported edge parity is checked independently in edges.cjs.
for im in bpy.data.images:
 if im.name=='Render Result':continue
 report['images'].append({'name':im.name,'packed':bool(im.packed_file),'size':list(im.size),'colorSpace':im.colorspace_settings.name});assert im.packed_file
assert len(report['actions'])==6
(base/'blend-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
