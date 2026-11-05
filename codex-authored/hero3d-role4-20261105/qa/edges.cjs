'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root='D:/MyGame/Idle-RPG/codex';
function glb(name){const b=fs.readFileSync((name.includes(':')?name:root+'/images/models/hero3d/'+name)),n=b.readUInt32LE(12);return{json:JSON.parse(b.subarray(20,20+n)),buf:b,binStart:28+n};}
function array(g,i){const a=g.json.accessors[i],v=g.json.bufferViews[a.bufferView],k={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type],size={5121:1,5123:2,5125:4,5126:4}[a.componentType],read={5121:'readUInt8',5123:'readUInt16LE',5125:'readUInt32LE',5126:'readFloatLE'}[a.componentType];return Array.from({length:a.count},(_,row)=>Array.from({length:k},(_,col)=>g.buf[read](g.binStart+(v.byteOffset||0)+(a.byteOffset||0)+row*(v.byteStride||k*size)+col*size)));}
const base=glb('role1.glb'),skin=glb('role4.glb');

const p=skin.json.meshes[0].primitives[0],ps=array(skin,p.attributes.POSITION),idx=skin.json.meshes[0].primitives.slice(0,2).flatMap(p=>array(skin,p.indices).flat());
for(const factor of [1e4,1e5,1e6]){
 const edges=new Map(),ids=ps.map(p=>p.map(v=>Math.round(v*factor)).join(','));
 for(let i=0;i<idx.length;i+=3)for(let e=0;e<3;e++){const a=ids[idx[i+e]],b=ids[idx[i+(e+1)%3]];if(a===b)continue;const key=[a,b].sort().join('|');edges.set(key,(edges.get(key)||0)+1);}
 const once=[...edges].filter(([k,n])=>n===1);console.log('EDGES',factor,'one',once.length,'odd',[...edges.values()].filter(n=>n%2).length,'many',[...edges.values()].filter(n=>n>2).length);fs.writeFileSync(__dirname+'/edges-'+factor+'.json',JSON.stringify(once));
}
