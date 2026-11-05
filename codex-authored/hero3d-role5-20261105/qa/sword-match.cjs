'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root='D:/MyGame/Idle-RPG/codex';
function glb(name){const b=fs.readFileSync((name.includes(':')?name:root+'/images/models/hero3d/'+name)),n=b.readUInt32LE(12);return{json:JSON.parse(b.subarray(20,20+n)),buf:b,binStart:28+n};}
function array(g,i){const a=g.json.accessors[i],v=g.json.bufferViews[a.bufferView],k={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type],size={5121:1,5123:2,5125:4,5126:4}[a.componentType],read={5121:'readUInt8',5123:'readUInt16LE',5125:'readUInt32LE',5126:'readFloatLE'}[a.componentType];return Array.from({length:a.count},(_,row)=>Array.from({length:k},(_,col)=>g.buf[read](g.binStart+(v.byteOffset||0)+(a.byteOffset||0)+row*(v.byteStride||k*size)+col*size)));}
const base=glb('role1.glb'),skin=glb('role5.glb');
(async()=>{
const T=await import(pathToFileURL(root+'/js/vendor/three/three.module.min.js'));
const w=glb('D:/MyGame/Asset/codex-authored/hero3d-role4-sword-v2-20261105/exports/role4-sword.glb'),j=skin.json,sk=j.skins[0],names=sk.joints.map(n=>j.nodes[n].name),sw=names.indexOf('Sword'),S=new T.Matrix4().fromArray(array(skin,sk.inverseBindMatrices)[sw]),grip=new T.Vector3(...j.asset.extras.gripFrame.gripPointInSword);
let maxPositionError=0,vertices=0;for(let k=0;k<9;k++){const a=w.json.meshes[0].primitives[k],b=j.meshes[0].primitives[k+2],ps=array(w,a.attributes.POSITION),qs=array(skin,b.attributes.POSITION);assert.equal(qs.length,ps.length);assert.deepEqual(array(w,a.indices),array(skin,b.indices));for(let i=0;i<ps.length;i++){const q=new T.Vector3(...qs[i]).applyMatrix4(S).sub(grip).multiplyScalar(.01);maxPositionError=Math.max(maxPositionError,q.distanceTo(new T.Vector3(...ps[i])));vertices++;}}
assert.ok(maxPositionError<1e-6);const report={approvedSwordVertices:vertices,maxPositionErrorMetres:maxPositionError,geometryAndIndicesMatch:true};fs.writeFileSync(__dirname+'/sword-match.json',JSON.stringify(report,null,2));console.log(report);
})().catch(e=>{console.error(e);process.exitCode=1});
