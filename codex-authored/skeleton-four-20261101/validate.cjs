'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{PNG}=require('pngjs');
const game=process.argv[2],roundtrip=process.argv[3],read=f=>PNG.sync.read(fs.readFileSync(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'candidate-manifest.json'))),report={characters:4,strips:0,poses:0,nativePixels:true,originalImages:100};
for(const [stem,meta]of Object.entries(manifest.stems)){
 const im=read(path.join(__dirname,'exports',stem+'.png')),mote=JSON.parse(fs.readFileSync(path.join(__dirname,'mote',stem+'.mote')));assert.equal(im.width,768);assert.equal(im.height,128);assert.equal(mote.frames.length,6);
 for(let i=0;i<6;i++){
  let at=0;const pixels=Buffer.alloc(128*128*4),runs=Object.values(mote.frames[i].cels)[0];for(let p=0;p<runs.length;p+=2)for(let n=0;n<runs[p];n++){pixels.writeUInt32LE(runs[p+1]>>>0,at);at+=4;}assert.equal(at,pixels.length);
  for(let y=0;y<128;y++)assert.ok(pixels.subarray(y*128*4,(y+1)*128*4).equals(im.data.subarray((y*768+i*128)*4,(y*768+(i+1)*128)*4)),stem+' native pixels');
  for(const [x,y]of [[0,0],[127,0],[0,127],[127,127]])assert.equal(pixels[(y*128+x)*4+3],0,stem+' true alpha');
 }
 assert.ok(fs.readFileSync(path.join(game,'images/sprites/npc',stem+'.png')).equals(fs.readFileSync(path.join(__dirname,'exports',stem+'.png'))));report.strips++;report.poses+=6;
}
const prior=path.join(__dirname,'../npc-actions-20261101');
for(const list of ['original-game-png-sha256.json','sha256.json'])for(const [name,hash]of Object.entries(JSON.parse(fs.readFileSync(path.join(prior,list)))))assert.equal(sha(fs.readFileSync(path.join(game,'images/sprites/npc',name))),hash,name+' original changed');
if(roundtrip){const a=read(roundtrip),b=read(path.join(__dirname,'exports/skeleton_mage_staff_attack.png'));assert.equal(a.width,b.width);assert.equal(a.height,b.height);for(let i=0;i<a.data.length;i+=4){assert.equal(a.data[i+3],b.data[i+3]);if(b.data[i+3]===255)assert.ok(a.data.subarray(i,i+3).equals(b.data.subarray(i,i+3)));}report.moteRoundtrip=true;}
fs.writeFileSync(path.join(__dirname,'asset-checks.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'sources-sha256.json'),JSON.stringify(Object.fromEntries(fs.readdirSync(path.join(__dirname,'sources')).map(n=>[n,sha(fs.readFileSync(path.join(__dirname,'sources',n)))])),null,2)+'\n');console.log(JSON.stringify(report));
