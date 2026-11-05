import bpy,json,numpy as np
from pathlib import Path
from mathutils import Vector,kdtree
base=Path('C:/Users/user/.codex/visualizations/2026/11/03/01a1a127-4f3c-7fb1-b99c-9c6b3a6f9a86')
root=base/'role4-sword-v2-20261105'
def distribution(file):
 bpy.ops.wm.open_mainfile(filepath=str(file))
 blade=next(o for o in bpy.context.scene.objects if o.name.startswith('Straight tapered'))
 core=set(v for p in blade.data.polygons if p.material_index==0 for v in p.vertices)
 profile=sorted({(round(blade.data.vertices[i].co.z,7),round(abs(blade.data.vertices[i].co.x),7))for i in core})
 inlay=next(o for o in bpy.context.scene.objects if o.name.startswith('Reference red vine relief'))
 ps=np.array([v.co[:]for v in inlay.data.vertices]);lo,hi=ps[:,2].min(),ps[:,2].max();ratios=[]
 for y in np.linspace(lo+.02,hi-.02,18):
  near=ps[abs(ps[:,2]-y)<.012]
  if not len(near):continue
  width=np.interp(y,[p[0]for p in profile],[p[1]for p in profile])*2
  ratios.append(float((near[:,0].max()-near[:,0].min())/width))
 return {'normalizedWidths':ratios,'mean':float(np.mean(ratios)),'coefficientOfVariation':float(np.std(ratios)/np.mean(ratios))}
old=distribution(base/'role4-20261105/role4-sword.blend');new=distribution(root/'role4-sword.blend')
guard=next(o for o in bpy.context.scene.objects if o.name.startswith('Swept hooked'))
tree=kdtree.KDTree(len(guard.data.vertices))
for i,v in enumerate(guard.data.vertices):tree.insert(v.co,i)
tree.balance();error=max(tree.find(Vector((-v.co.x,v.co.y,v.co.z)))[2]for v in guard.data.vertices)
assert error<1e-7,error
image=next(i for i in bpy.data.images if i.name=='guard-detail.png');w,h=image.size;p=np.empty(w*h*4,dtype=np.float32);image.pixels.foreach_get(p);p=p.reshape(h,w,4)
texture_error=float(np.max(abs(p[:,:w//2]-p[:,w//2:][:,::-1])))
assert texture_error<1e-6,texture_error
r,g,b=p[:,:,0],p[:,:,1],p[:,:,2];red=int(np.count_nonzero((r>g*1.4)&(r>b*1.35)&(r>.025)))
assert red==0,red
assert new['coefficientOfVariation']<old['coefficientOfVariation']*.6,(old,new)
report={'guardGeometryMirrorErrorMeters':error,'guardTextureMirrorError':texture_error,'exposedRedUnderlayPixels':red,'ornamentBefore':old,'ornamentAfter':new,'rubyWidthMeters':.032,'rubyHeightMeters':.048}
(root/'revision-validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
