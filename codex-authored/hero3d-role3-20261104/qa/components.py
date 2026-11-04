import numpy as np,json,pathlib
p=pathlib.Path(__file__).parent;z=np.load(p/'role3.npz');pos=z['fitted_positions'];src=z['source_positions'];f=z['faces'];keys={};ix=[]
for v in pos:
 k=tuple(np.round(v,5));ix.append(keys.setdefault(k,len(keys)))
ix=np.array(ix);parent=list(range(len(keys)))
def find(x):
 while x!=parent[x]:parent[x]=parent[parent[x]];x=parent[x]
 return x
for a,b,c in ix[f]:
 a=find(a)
 for k in [b,c]:parent[find(k)]=a
groups={}
for i,t in enumerate(ix[f]):groups.setdefault(find(t[0]),[]).append(i)
r=[]
for tris in groups.values():
 ids=f[tris].ravel();pts=src[ids];r.append({'faces':len(tris),'center':pts.mean(0).tolist(),'min':pts.min(0).tolist(),'max':pts.max(0).tolist()})
r.sort(key=lambda x:-x['faces']);(p/'components.json').write_text(json.dumps(r,indent=2));print(json.dumps(r[:25],indent=2))
