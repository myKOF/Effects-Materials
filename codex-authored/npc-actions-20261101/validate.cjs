'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{PNG}=require('pngjs');
const game=process.argv[2];if(!game)throw Error('Usage: node validate.cjs <game-root> [Mote-roundtrip-PNG]');
const read=file=>PNG.sync.read(fs.readFileSync(file)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'))),plan=JSON.parse(fs.readFileSync(path.join(__dirname,'plan.json')));
const report={characters:Object.keys(plan.chars).length,actions:{},stems:{}};
for(const [name,hash]of Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname,'sources-sha256.json')))))assert.equal(sha(fs.readFileSync(path.join(__dirname,'sources',name))),hash,name+' source changed');
for(const [stem,meta]of Object.entries(manifest.stems)){
 const im=read(path.join(__dirname,'exports',stem+'.png')),d=plan.chars[meta.char],w=d.meta.cellW,h=d.meta.cellH;
 const src=read(path.join(__dirname,'sources',d.idle+'.png')),palette=new Set();
 for(let p=0;p<src.data.length;p+=4)if(src.data[p+3])palette.add(src.data.subarray(p,p+4).toString('hex'));
 const mote=JSON.parse(fs.readFileSync(path.join(__dirname,'mote',stem+'.mote'))),frames=[];
 assert.equal(mote.frames.length,meta.frames);assert.equal(im.width,w*meta.frames);assert.equal(im.height,h);
 for(let i=0;i<meta.frames;i++){
  const pixels=Buffer.alloc(w*h*4),runs=Object.values(mote.frames[i].cels)[0];let at=0;
  for(let r=0;r<runs.length;r+=2)for(let j=0;j<runs[r];j++){pixels.writeUInt32LE(runs[r+1]>>>0,at);at+=4;}
  assert.equal(at,w*h*4);let visible=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const p=(y*im.width+i*w+x)*4,c=im.data.subarray(p,p+4),q=(y*w+x)*4;
   assert.ok(c.equals(pixels.subarray(q,q+4)),stem+' native pixels');
   if(c[3]){visible++;assert.ok(palette.has(c.toString('hex')),stem+' changed palette');}
  }
  assert.ok(visible>0&&visible<w*h,stem+' alpha');frames.push(pixels);
 }
 const unique=new Set(frames.map(sha));assert.ok(unique.size>=3,stem+' must animate');
 const action=stem.slice(meta.char.length+1);if(action==='attack')assert.ok(frames[0].equals(frames.at(-1)),stem+' return pose');
 assert.equal(meta.loop,action==='walk');assert.equal(meta.hold,action==='die');
 assert.equal(sha(fs.readFileSync(path.join(game,'images/sprites/npc',stem+'.png'))),sha(fs.readFileSync(path.join(__dirname,'exports',stem+'.png'))));
 report.actions[action]=(report.actions[action]||0)+1;report.stems[stem]={frames:meta.frames,unique:unique.size,nativePixels:true,palettePreserved:true,transparent:true};
}
for(const [name,hash]of Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname,'original-game-png-sha256.json')))))assert.equal(sha(fs.readFileSync(path.join(game,'images/sprites/npc',name))),hash,name+' original changed');
if(process.argv[3]){const a=read(process.argv[3]),b=read(path.join(__dirname,'exports/memento_skeleton_attack.png'));assert.equal(a.width,b.width);assert.equal(a.height,b.height);assert.ok(a.data.equals(b.data),'Mote roundtrip pixels');report.moteRoundtrip=true;}
fs.writeFileSync(path.join(__dirname,'validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({characters:report.characters,actions:report.actions,originals:66,moteRoundtrip:report.moteRoundtrip}));
