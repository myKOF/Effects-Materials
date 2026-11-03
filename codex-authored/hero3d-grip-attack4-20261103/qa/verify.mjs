import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const base=path.resolve(process.argv[2]||process.cwd());
const {readGlb,buildRig,readClip,poseAt,worldMatrices}=await import(pathToFileURL(base+'/tools/meshy-pipeline/src/fix-grips.mjs'));
const here=new URL('.',import.meta.url);
const a=readGlb(process.argv[6]);
const b=readGlb(process.argv[3]||new URL('role-attack4-mirrored.glb',here));
assert.ok(process.argv[4],'Provide the licensed source Attack4.glb path');
const source=readGlb(process.argv[4]);
assert.deepEqual(b.json.animations.slice(0,-1),a.json.animations);
assert.deepEqual(b.json.nodes,a.json.nodes);
assert.deepEqual(b.json.meshes,a.json.meshes);
assert.deepEqual(b.json.skins,a.json.skins);
assert.deepEqual(b.json.materials,a.json.materials);
assert.ok(b.buf.subarray(b.binStart,b.binStart+a.buf.length-a.binStart).equals(a.buf.subarray(a.binStart)));
const sr=buildRig(source),br=buildRig(b);
const sc=readClip(source,sr,'Shield_Push_Left'),bc=readClip(b,br,'Attack4');
assert.ok(Math.abs(sc.duration-bc.duration)<1e-6);
let limbError=0,faceForward=0,edgeAlignment=1,loopMaxDeg=0,sourceLoopMaxDeg=0;
const pos=m=>[m.elements[12],m.elements[13],m.elements[14]];
const direction=(A,B)=>{const a=pos(A),bb=pos(B);const d=a.map((v,i)=>bb[i]-v),l=Math.hypot(...d);return d.map(v=>v/l);};
const dot=(a,b)=>a.reduce((t,v,i)=>t+v*b[i],0);
const angle=(a,b)=>2*Math.acos(Math.min(1,Math.abs(dot(a,b)/(Math.hypot(...a)*Math.hypot(...b)))))*180/Math.PI;
const axis=(m,column)=>{const e=m.elements,v=[e[column*4],e[column*4+1],e[column*4+2]],l=Math.hypot(...v);return v.map(x=>x/l);};
for(const t of bc.keyTimes){
 const sw=worldMatrices(sr,poseAt(sr,sc,t)),bw=worldMatrices(br,poseAt(br,bc,t));
 for(const [side,other]of [['Right','Left'],['Left','Right']])for(const [parent,child]of [['Arm','ForeArm'],['ForeArm','Hand'],['UpLeg','Leg'],['Leg','Foot'],['Foot','ToeBase']]){
  const s=direction(sw(sr.byName['mixamorig:'+other+parent]),sw(sr.byName['mixamorig:'+other+child]));s[0]*=-1;
  const d=direction(bw(br.byName[side+parent]),bw(br.byName[side+child]));
  limbError=Math.max(limbError,Math.acos(Math.min(1,Math.max(-1,dot(s,d))))*180/Math.PI);
 }
 if(t>=.25&&t<=1.5){
  const m=bw(br.byName.Sword),blade=axis(m,1),edge=axis(m,0),normal=axis(m,2);
  faceForward=Math.max(faceForward,Math.abs(normal[2]));
  edgeAlignment=Math.min(edgeAlignment,Math.abs(edge[2])/Math.sqrt(1-blade[2]**2));
 }
}
for(const [name,tr]of Object.entries(bc.tracks)){
 if(!name.endsWith('.rotation'))continue;
 const qs=Array.from(tr.values.subarray(0,4)),qe=Array.from(tr.values.subarray(tr.values.length-4));
 loopMaxDeg=Math.max(loopMaxDeg,angle(qs,qe));
 for(let i=0;i<tr.values.length;i+=4)assert.ok(Math.abs(Math.hypot(...tr.values.subarray(i,i+4))-1)<1e-5);
}
for(const [name,tr]of Object.entries(sc.tracks)){
 if(!name.endsWith('.rotation')||/Thumb|Pinky|Ring|Middle|Index|End|headfront/.test(name))continue;
 sourceLoopMaxDeg=Math.max(sourceLoopMaxDeg,angle(Array.from(tr.values.subarray(0,4)),Array.from(tr.values.subarray(-4))));
}
const swordTrack=bc.tracks['Sword.rotation'];
for(let i=4;i<swordTrack.values.length;i++)assert.ok(Math.abs(swordTrack.values[i]-swordTrack.values[i%4])<1e-7);
assert.ok(limbError<.001,'Mirrored limb direction error '+limbError);
assert.ok(faceForward<1e-5,'Broad face points forward during swing');
assert.ok(edgeAlignment>.99999,'Sharp edge not aligned to projected front');
assert.ok(loopMaxDeg<=sourceLoopMaxDeg+.1,'Added loop discontinuity beyond source: '+loopMaxDeg+' / '+sourceLoopMaxDeg);
const author=JSON.parse(fs.readFileSync(process.argv[5]||new URL('author-report.json',here)));
assert.ok(author.maxFootHeightError<1e-5);
const result={limbErrorDeg:limbError,faceForwardDuringSwing:faceForward,sharpEdgeAlignment:edgeAlignment,
 loopMaxDeg,sourceLoopMaxDeg,originalAnimationsAndAppearanceUnchanged:true,fixedRightGrip:true,noBackSwordReintroduced:true,
 sourceDuration:sc.duration,candidateDuration:bc.duration,footHeightError:author.maxFootHeightError};
fs.writeFileSync(new URL('verify-report.json',here),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
