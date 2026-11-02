'use strict';
// Render the Mote-authored stationary idle; never accumulate offsets on a rebuild.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {PNG}=require('pngjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const key='desert_orc_idle',shifts=[[-10,1],[-4,0],[0,1],[2,0],[4,1],[8,1]];
function decode(d){
 assert.equal(d.width,128);assert.equal(d.height,128);assert.equal(d.frames.length,6);
 return d.frames.map(fr=>{assert.equal(fr.duration,160);const b=Buffer.alloc(128*128*4);let at=0;
  const r=fr.cels.artwork;for(let i=0;i<r.length;i+=2)for(let j=0;j<r[i];j++){b.writeUInt32LE(r[i+1]>>>0,at);at+=4;}
  assert.equal(at,b.length);return b;});
}
function source(){
 const original=decode(JSON.parse(fs.readFileSync(path.join(__dirname,key+'-before.mote'))));
 const bytes=fs.readFileSync(path.join(__dirname,key+'.mote')),frames=decode(JSON.parse(bytes));
 for(let i=0;i<6;i++){
  const expected=Buffer.alloc(128*128*4),[dx,dy]=shifts[i];
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
   const p=(y*128+x)*4,xx=x+dx,yy=y+dy;
   if(original[i][p+3])assert.ok(xx>=3&&xx<125&&yy>=3&&yy<125,'no original pixels clipped');
   if(xx>=0&&xx<128&&yy>=0&&yy<128)original[i].copy(expected,(yy*128+xx)*4,p,p+4);
  }
  assert.ok(expected.equals(frames[i]),'Mote edit must preserve original pixels at planned offset '+i);
 }
 return{bytes,frames,original};
}
function strip(frames){const im=new PNG({width:768,height:128});for(let i=0;i<6;i++)for(let y=0;y<128;y++)frames[i].copy(im.data,(y*768+i*128)*4,y*128*4,(y+1)*128*4);return im;}
function verify(pkg){
 const s=source(),actual=PNG.sync.read(fs.readFileSync(path.join(pkg,'exports',key+'.png')));
 assert.ok(actual.data.equals(strip(s.frames).data),'stationary idle PNG must equal editable Mote');
 assert.ok(fs.readFileSync(path.join(pkg,'mote',key+'.mote')).equals(s.bytes),'exported editable source');
 return s;
}
async function preview(s,dir,pkg){
 if(!dir)return;fs.mkdirSync(dir,{recursive:true});
 const {createCanvas,loadImage}=require('@napi-rs/canvas'),sharp=require('sharp'),buffers=[];
 for(let i=0;i<6;i++){
  const canvas=createCanvas(640,320),ctx=canvas.getContext('2d');ctx.fillStyle='#202b32';ctx.fillRect(0,0,640,320);ctx.imageSmoothingEnabled=false;
  ctx.font='bold 20px Microsoft JhengHei';ctx.fillStyle='#f3ebd8';ctx.fillText('修正前：向前滑動',24,30);ctx.fillText('修正後：原地待機',344,30);
  for(let j=0;j<2;j++){const x=32+j*320,y=44;ctx.strokeStyle='#74868b';ctx.beginPath();ctx.moveTo(x,y+224);ctx.lineTo(x+256,y+224);ctx.moveTo(x+128,y+90);ctx.lineTo(x+128,y+234);ctx.stroke();
   const frame=new PNG({width:128,height:128});(j?s.frames:s.original)[i].copy(frame.data);ctx.drawImage(await loadImage(PNG.sync.write(frame)),x,y,256,256);
  }
  const bytes=canvas.toBuffer('image/png');if(i===5)fs.writeFileSync(path.join(dir,'comparison.png'),bytes);
  buffers.push(await sharp(bytes).ensureAlpha().raw().toBuffer());
 }
 await sharp(Buffer.concat(buffers),{raw:{width:640,height:320*6,channels:4,pageHeight:320}}).gif({loop:0,delay:Array(6).fill(160),keepDuplicateFrames:true}).toFile(path.join(dir,'before-after.gif'));
 // Refresh the four-action preview after applying the corrected idle as well.
 const actions=['idle','walk','attack','die'],names=['待機','移動','攻擊','死亡'],m=JSON.parse(fs.readFileSync(path.join(pkg,'candidate-manifest.json'))),pictures={};
 for(const a of actions)pictures[a]=await loadImage(fs.readFileSync(path.join(pkg,'exports','desert_orc_'+a+'.png')));
 const full=[];for(let tick=0;tick<36;tick++){
  const t=tick*80,canvas=createCanvas(512,576),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#e9e6ed';ctx.fillRect(0,0,512,576);ctx.font='bold 18px Microsoft JhengHei';
  for(let i=0;i<4;i++){const a=actions[i],meta=m.stems['desert_orc_'+a],period=i<2?meta.frames*1000/meta.fps:(i===2?960:1440),phase=Math.floor(t%period*meta.fps/1000),f=meta.loop?phase%meta.frames:Math.min(meta.frames-1,phase),x=i%2*256,y=Math.floor(i/2)*288;
   ctx.fillStyle='#302b38';ctx.fillText(names[i],x+14,y+24);ctx.drawImage(pictures[a],f*128,0,128,128,x,y+28,256,256);
  }full.push(await sharp(canvas.toBuffer('image/png')).ensureAlpha().raw().toBuffer());
 }
 await sharp(Buffer.concat(full),{raw:{width:512,height:576*36,channels:4,pageHeight:576}}).gif({loop:0,delay:Array(36).fill(80),keepDuplicateFrames:true}).toFile(path.join(dir,'desert_orc.gif'));
}
async function apply(pkg,dir){
 const s=source(),bytes=PNG.sync.write(strip(s.frames));
 fs.writeFileSync(path.join(pkg,'exports',key+'.png'),bytes);fs.writeFileSync(path.join(pkg,'mote',key+'.mote'),s.bytes);
 const file=path.join(pkg,'sha256.json'),hashes=JSON.parse(fs.readFileSync(file));hashes[key+'.png']=sha(bytes);fs.writeFileSync(file,JSON.stringify(hashes,null,2)+'\n');
 const report={authoringTool:'RPG Mote Studio',shifts,sourceSHA256:sha(s.bytes),outputSHA256:sha(bytes),frames:6,frameMs:160,originalPixelsPreserved:true};
 fs.writeFileSync(path.join(__dirname,'validation.json'),JSON.stringify(report,null,2)+'\n');verify(pkg);await preview(s,dir,pkg);
 const validationFile=path.join(pkg,'validation.json'),validation=JSON.parse(fs.readFileSync(validationFile));
 const idle=validation.characters.desert_orc.actions.idle;idle.sha256=sha(bytes);
 idle.bounds=s.frames.map(pixels=>{let l=128,r=0,t=128,b=0,n=0;for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(pixels[(y*128+x)*4+3]){l=Math.min(l,x);r=Math.max(r,x+1);t=Math.min(t,y);b=Math.max(b,y+1);n++;}return{l,r,t,b,n};});
 validation.characters.desert_orc.idleCorrection=report;fs.writeFileSync(validationFile,JSON.stringify(validation,null,2)+'\n');
 console.log('Stationary orc idle: Mote RGBA, six original poses and 160ms timing preserved.');
}
module.exports={apply,verify};if(require.main===module)apply(path.resolve(__dirname,'..'),process.argv[2]).catch(e=>{console.error(e);process.exitCode=1});
