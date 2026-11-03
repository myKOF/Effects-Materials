import json,struct,sys
from pathlib import Path
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
p=Path(sys.argv[sys.argv.index('--')+1]);d=p.read_bytes();n=struct.unpack_from('<I',d,12)[0];j=json.loads(d[20:20+n]);b=d[28+n:]
def array(i):
 a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];k={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];dt=np.dtype({5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]);return np.ndarray((a['count'],k),dtype=dt,buffer=b,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',dt.itemsize*k),dt.itemsize)).copy()
pr=j['meshes'][0]['primitives'];hand=pr[-1];hpos=array(hand['attributes']['POSITION']);hidx=array(hand['indices']).reshape((-1,3));ht=BVHTree.FromPolygons([Vector(p)for p in hpos],hidx.tolist(),all_triangles=True)
sw=next(i for i,n in enumerate(j['skins'][0]['joints']) if j['nodes'][n]['name']=='Sword')
collisions=[]
for i,p in enumerate(pr[:-1]):
 js=array(p['attributes']['JOINTS_0']);w=array(p['attributes']['WEIGHTS_0'])
 if not np.all(js[:,0]==sw):continue
 pp=array(p['attributes']['POSITION']);ii=array(p['indices']).reshape((-1,3));tree=BVHTree.FromPolygons([Vector(v)for v in pp],ii.tolist(),all_triangles=True)
 overlap=ht.overlap(tree)
 distances=[tree.find_nearest(Vector(v))[3] for v in hpos]
 collisions.append({'primitive':i,'intersectingTrianglePairs':len(overlap),'minimumSurfaceDistance':min(distances),'verticesWithin1mm':sum(x<.001 for x in distances)})
assert all(x['intersectingTrianglePairs']==0 for x in collisions)
assert any(x['verticesWithin1mm']>100 for x in collisions)
result={'handVsSword':collisions,'handVertices':len(hpos),'passed':True}
Path(__file__).with_name('contact-report.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
