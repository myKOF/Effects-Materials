'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{PNG}=require('pngjs'),sharp=require('sharp');
const root=__dirname,preview=process.argv[2],roundtrip=process.argv[3],sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const plan=JSON.parse(fs.readFileSync(path.join(root,'plan.json'))),manifest=JSON.parse(fs.readFileSync(path.join(root,'candidate-manifest.json')));
(async()=>{
 assert.equal(plan.length,4);assert.equal(Object.keys(manifest.chars).length,4);assert.equal(Object.keys(manifest.stems).length,16);
 const report={status:'Approved GIF — replacement authorized',characters:4,strips:0,poses:0,nativePixels:true,gifs:{}},hashes={};
 for(const spec of plan){
  for(const action of ['idle','walk','attack','die']){
   const expectedFrames=action==='walk'&&fs.existsSync(path.join(root,'../npc-walk-cycles-20261102/sources',spec.key+'.png'))?8:6;
   const stem=spec.key+'_'+action,bytes=fs.readFileSync(path.join(root,'exports',stem+'.png')),im=PNG.sync.read(bytes),mote=JSON.parse(fs.readFileSync(path.join(root,'mote',stem+'.mote'))),unique=new Set();
   assert.equal(im.width,128*expectedFrames);assert.equal(im.height,128);assert.equal(mote.width,128);assert.equal(mote.height,128);assert.equal(mote.frames.length,expectedFrames);
   assert.equal(manifest.stems[stem].frames,expectedFrames);assert.equal(manifest.stems[stem].hold,action==='die');assert.equal(manifest.stems[stem].loop,action==='idle'||action==='walk');
   for(let i=0;i<expectedFrames;i++){
    const pixels=Buffer.alloc(128*128*4),runs=Object.values(mote.frames[i].cels)[0];let at=0;
    for(let r=0;r<runs.length;r+=2)for(let n=0;n<runs[r];n++){pixels.writeUInt32LE(runs[r+1]>>>0,at);at+=4;}assert.equal(at,pixels.length);
    let visible=0;
    for(let y=0;y<128;y++){
     assert.ok(pixels.subarray(y*128*4,(y+1)*128*4).equals(im.data.subarray((y*im.width+i*128)*4,(y*im.width+(i+1)*128)*4)),stem+' native RGBA');
     for(let x=0;x<128;x++)if(pixels[(y*128+x)*4+3]){visible++;assert.ok(x>=3&&x<125&&y>=3&&y<125,stem+' transparent margin');}
    }
    assert.ok(visible>100,stem+' visible full sprite');unique.add(sha(pixels));report.poses++;
   }
   assert.equal(unique.size,expectedFrames,stem+' distinct poses');hashes[stem+'.png']=sha(bytes);report.strips++;
  }
  const gif=await sharp(path.join(preview,spec.key+'.gif'),{animated:true}).metadata();assert.equal(gif.pages,36);assert.equal(gif.width,512);assert.equal(gif.pageHeight,576);assert.ok(gif.delay.every(n=>n===80));
  report.gifs[spec.key]={frames:gif.pages,frameMs:80,totalMs:gif.delay.reduce((a,b)=>a+b,0),loop:gif.loop,width:gif.width,height:gif.pageHeight};assert.equal(report.gifs[spec.key].totalMs,2880);assert.equal(gif.loop,0);
 }
 if(roundtrip){const a=PNG.sync.read(fs.readFileSync(roundtrip)),b=PNG.sync.read(fs.readFileSync(path.join(root,'exports/desert_skeleton_attack.png')));assert.equal(a.width,b.width);assert.equal(a.height,b.height);for(let p=0;p<a.data.length;p+=4){assert.equal(a.data[p+3],b.data[p+3]);if(b.data[p+3]===255)assert.ok(a.data.subarray(p,p+3).equals(b.data.subarray(p,p+3)));}report.moteRoundtrip=true;}
 fs.writeFileSync(path.join(root,'sha256.json'),JSON.stringify(hashes,null,2)+'\n');
 fs.writeFileSync(path.join(root,'sources-sha256.json'),JSON.stringify(Object.fromEntries(fs.readdirSync(path.join(root,'sources')).map(f=>[f,sha(fs.readFileSync(path.join(root,'sources',f)))])),null,2)+'\n');
 fs.writeFileSync(path.join(root,'asset-checks.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1});
