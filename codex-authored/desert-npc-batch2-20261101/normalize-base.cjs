'use strict';
// Slice ImageGen's original articulated poses; resize/pad without drawing new poses.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {PNG}=require('pngjs'),sharp=require('sharp'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=__dirname,preview=process.argv[2];if(!preview)throw Error('Pass a preview output directory');
for(const dir of ['exports','mote'])fs.mkdirSync(path.join(root,dir),{recursive:true});fs.mkdirSync(preview,{recursive:true});
const plan=JSON.parse(fs.readFileSync(path.join(root,"plan.json"))); const types=plan.map(c=>[c.key,c.name,c.color]);
const actions=['idle','walk','attack','die'],names=['待機','移動','攻擊','死亡'],durations=[160,100,100,120];
const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)],sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const cutCache=new WeakMap();
function rowCuts(im){
 if(cutCache.has(im))return cutCache.get(im);
 const counts=Array(im.height).fill(0);for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(im.data[(y*im.width+x)*4+3]>=48)counts[y]++;
 const cuts=[0];for(let r=1;r<4;r++){const center=r*im.height/4,lo=Math.floor(center-im.height/14),hi=Math.ceil(center+im.height/14),min=Math.min(...counts.slice(lo,hi));let runs=[],start=null;
  for(let y=lo;y<=hi;y++){if(y<hi&&counts[y]===min){if(start===null)start=y;}else if(start!==null){runs.push([start,y]);start=null;}}
  runs.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]));cuts.push(Math.round((runs[0][0]+runs[0][1])/2));
 }cuts.push(im.height);cutCache.set(im,cuts);return cuts;
}
function parts(im,row,guide){
 const cuts=rowCuts(im),top=cuts[row],bottom=cuts[row+1],seen=new Uint8Array(im.width*(bottom-top)),result=[];
 for(let y=top;y<bottom;y++)for(let x=0;x<im.width;x++){
  const at=(y-top)*im.width+x;if(seen[at]||im.data[(y*im.width+x)*4+3]<48)continue;
  const pending=[at],points=[];seen[at]=1;let l=x,r=x,t=y,b=y,sx=0;
  while(pending.length){const p=pending.pop(),px=p%im.width,py=Math.floor(p/im.width)+top;points.push(p);sx+=px;l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,py);b=Math.max(b,py);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=px+dx,yy=py+dy;if(xx<0||xx>=im.width||yy<top||yy>=bottom)continue;const k=(yy-top)*im.width+xx;if(!seen[k]&&im.data[(yy*im.width+xx)*4+3]>=48){seen[k]=1;pending.push(k)}}
  }result.push({points,l,r,t,b,cx:sx/points.length});
 }
 const mains=result.toSorted((a,b)=>b.points.length-a.points.length).slice(0,6).sort((a,b)=>a.cx-b.cx);
 if(!mains.every((m,i)=>Math.floor(m.cx/im.width*6)===i)&&guide){
  // The color edit can join neighboring sword tips by one pixel. Use the original
  // separate silhouettes to assign those pixels; do not cut off extended weapons.
  const sourceGroups=parts(guide,row),owners=new Int8Array(seen.length);owners.fill(-1);const queue=[];
  for(let col=0;col<6;col++)for(const [x,y,p]of sourceGroups[col].pixels)if(y>=top&&y<bottom&&guide.data[p+3]>=48){const k=(y-top)*im.width+x;owners[k]=col;queue.push(k);}
  for(let at=0;at<queue.length;at++){const p=queue[at],x=p%im.width,y=Math.floor(p/im.width);for(const [xx,yy]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(xx<0||xx>=im.width||yy<0||yy>=bottom-top)continue;const k=yy*im.width+xx;if(owners[k]<0){owners[k]=owners[p];queue.push(k);}}}
  const groups=Array.from({length:6},()=>({pixels:[],l:im.width,r:0,t:im.height,b:0}));
  for(let y=top;y<bottom;y++)for(let x=0;x<im.width;x++){const p=(y*im.width+x)*4;if(!im.data[p+3])continue;const g=groups[owners[(y-top)*im.width+x]];g.pixels.push([x,y,p]);if(im.data[p+3]>=48){g.l=Math.min(g.l,x);g.r=Math.max(g.r,x+1);g.t=Math.min(g.t,y);g.b=Math.max(g.b,y+1);}}
  return groups;
 }
 assert.ok(mains.every((m,i)=>Math.floor(m.cx/im.width*6)===i),'expected six separate characters row '+row+': '+JSON.stringify(mains.map(m=>({n:m.points.length,cx:m.cx,box:[m.l,m.t,m.r,m.b]}))));
 const dist=(x,y,m)=>Math.max(m.l-x,0,x-m.r)**2+Math.max(m.t-y,0,y-m.b)**2+Math.abs(x-m.cx)*.0001;
 const labels=new Int8Array(seen.length);labels.fill(-1);
 for(const p of result){let col=mains.indexOf(p);if(col<0){const cy=(p.t+p.b)/2;col=mains.map(m=>dist(p.cx,cy,m)).indexOf(Math.min(...mains.map(m=>dist(p.cx,cy,m))));
  const m=mains[col],gap=Math.max(m.l-p.r,0,p.l-m.r)**2+Math.max(m.t-p.b,0,p.t-m.b)**2;
  if((gap>22**2&&p.points.length<1000)||(gap>6**2&&p.points.length<40))col=-2;
 }for(const at of p.points)labels[at]=col;}
 const groups=Array.from({length:6},()=>({pixels:[],l:im.width,r:0,t:im.height,b:0}));
 for(let y=top;y<bottom;y++)for(let x=0;x<im.width;x++){
  const p=(y*im.width+x)*4;if(!im.data[p+3])continue;let col=labels[(y-top)*im.width+x];
  if(col===-2)continue;
  if(col<0){let nearby=-1;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<im.width&&yy>=top&&yy<bottom){const owner=labels[(yy-top)*im.width+xx];if(owner>=0)nearby=owner;}}if(nearby<0)continue;col=nearby;}
  const g=groups[col];g.pixels.push([x,y,p]);if(im.data[p+3]>=48){g.l=Math.min(g.l,x);g.r=Math.max(g.r,x+1);g.t=Math.min(g.t,y);g.b=Math.max(g.b,y+1);}
 }
 return groups;
}
function box(im){let l=im.width,r=0,t=im.height,b=0,n=0;for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(im.data[(y*im.width+x)*4+3]){l=Math.min(l,x);r=Math.max(r,x+1);t=Math.min(t,y);b=Math.max(b,y+1);n++;}return{l,r,t,b,n};}
function mote(key,frames,ms){const palette=new Set();const layer='artwork';return{format:'mote',version:3,id:key,name:key,width:128,height:128,regions:[],anchors:[],clips:[],links:[],paletteVersion:1,tags:[],slices:[],layers:[{id:layer,name:'Artwork',visible:true,locked:false,alphaLocked:false,blendMode:'normal',opacity:1}],frames:frames.map((im,i)=>{
  let last=-1,count=0;const runs=[];for(let p=0;p<im.data.length;p+=4){let c=im.data[p+3]?im.data.readUInt32LE(p):0;if(c){palette.add('#'+im.data.subarray(p,p+3).toString('hex'));}if(c===last)count++;else{if(count)runs.push(count,last);last=c;count=1;}}if(count)runs.push(count,last);return{id:key+'-'+i,name:'Frame '+(i+1),duration:ms,cels:{[layer]:runs}};
 }),palette:{id:'generated',name:'Desert NPC color palette',author:'AI-generated for this project',entryIds:[...palette].map((_,i)=>'c-'+i),colors:[...palette]}};}
(async()=>{
 const manifest={chars:{},stems:{}},report={status:'Review — preview only, not configured',characters:{},sources:{}},allFrames=[];
 for(const [key,label,color]of types){
  const source=fs.readFileSync(path.join(root,'sources',key+'.png')),im=PNG.sync.read(source);report.sources[key]=sha(source);
  const spec=plan.find(c=>c.key===key),guide=undefined;
  const rows=Array.from({length:4},(_,r)=>parts(im,r,guide)),groups=rows.flat(),colW=im.width/6;
  const foot=rows[0].map((g,col)=>{let l=im.width,r=0;for(const [x,y,p]of g.pixels)if(y>=g.b-12&&im.data[p+3]>=96){l=Math.min(l,x);r=Math.max(r,x);}return(l+r)/2-col*colW;});
  const anchorX=median(foot),idleH=median(rows[0].map(g=>g.b-g.t));let scale=spec.nativeHeight/idleH;
  for(let i=0;i<24;i++){const g=groups[i],origin=i%6*colW+anchorX;scale=Math.min(scale,60/Math.max(origin-g.l,g.r-origin),106/(g.b-g.t));}
  const rawFrames=[];
  for(let i=0;i<24;i++){
   const g=groups[i],crop=new PNG({width:g.r-g.l,height:g.b-g.t});for(const [x,y,p]of g.pixels)if(x>=g.l&&x<g.r&&y>=g.t&&y<g.b)im.data.copy(crop.data,((y-g.t)*crop.width+x-g.l)*4,p,p+4);
   const width=Math.round(crop.width*scale),height=Math.round(crop.height*scale),left=Math.round(64+(g.l-(i%6*colW+anchorX))*scale),top=112-height-(spec.hoverLift?(i<18?spec.hoverLift:[18,12,6,0,0,0][i-18]):0);
   assert.ok(left>=3&&left+width<=125&&top>=3,'frame would clip: '+key+' '+i);
   const small=PNG.sync.read(await sharp(PNG.sync.write(crop)).resize(width,height,{kernel:'nearest'}).png().toBuffer()),frame=new PNG({width:128,height:128});
   for(let y=0;y<height;y++)small.data.copy(frame.data,((top+y)*128+left)*4,y*width*4,(y+1)*width*4);rawFrames.push(frame);
  }
  // Quantize the whole character together, so every action shares the same palette.
  const atlas=new PNG({width:768,height:512});for(let i=0;i<24;i++)for(let y=0;y<128;y++)rawFrames[i].data.copy(atlas.data,(((Math.floor(i/6)*128+y)*768)+(i%6)*128)*4,y*128*4,(y+1)*128*4);
  const paletteBytes=await sharp(PNG.sync.write(atlas)).png({palette:true,colours:48,dither:0}).toBuffer(),quantized=PNG.sync.read(paletteBytes),frames=[];
  fs.writeFileSync(path.join(preview,key+'-sheet.png'),paletteBytes);
  for(let i=0;i<24;i++){const f=new PNG({width:128,height:128});for(let y=0;y<128;y++)quantized.data.copy(f.data,y*128*4,((Math.floor(i/6)*128+y)*768+(i%6)*128)*4,((Math.floor(i/6)*128+y)*768+(i%6+1)*128)*4);for(let p=0;p<f.data.length;p+=4)if(!f.data[p+3])f.data.fill(0,p,p+4);frames.push(f);}
  const height=median(frames.slice(0,6).map(f=>{const b=box(f);return b.b-b.t;}));manifest.chars[key]={cellW:128,cellH:128,anchorX:.5,anchorY:.875,scale:Number((spec.height/height).toFixed(4)),facing:-1,height:spec.height};
  assert.ok(height>=spec.nativeHeight*.65&&height<=spec.nativeHeight*1.15,key+' native body idle height: '+height);
  report.characters[key]={label,color,sourceSize:[im.width,im.height],rowCuts:rowCuts(im),scale,anchorX,actions:{}};
  for(let a=0;a<4;a++){
   const strip=new PNG({width:768,height:128}),set=frames.slice(a*6,a*6+6),stem=key+'_'+actions[a];
   for(let i=0;i<6;i++)for(let y=0;y<128;y++)set[i].data.copy(strip.data,(y*768+i*128)*4,y*128*4,(y+1)*128*4);
   const bytes=PNG.sync.write(strip);fs.writeFileSync(path.join(root,'exports',stem+'.png'),bytes);fs.writeFileSync(path.join(root,'mote',stem+'.mote'),JSON.stringify(mote(stem,set,durations[a]),null,2)+'\n');
   manifest.stems[stem]={char:key,frames:6,fps:1000/durations[a],loop:a<2,hold:a===3};
   const bounds=set.map(box);assert.ok(bounds.every(b=>b.l>=3&&b.r<=125&&b.t>=3&&b.b<=113&&b.n>100),'alpha bounds '+stem);
   assert.equal(new Set(set.map(f=>sha(f.data))).size,6,'each generated pose should be distinct');
   report.characters[key].actions[actions[a]]={frames:6,sha256:sha(bytes),bounds};
  }
  allFrames.push({key,label,color,frames});
  const buffers=[],width=512,height2=576;
  for(let tick=0;tick<36;tick++){
   const t=tick*80,canvas=createCanvas(width,height2),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
   ctx.fillStyle='#e9e6ed';ctx.fillRect(0,0,width,height2);ctx.font='bold 18px Microsoft JhengHei';ctx.textBaseline='top';
   for(let a=0;a<4;a++){const x=a%2*256,y=Math.floor(a/2)*288;ctx.fillStyle='#302b38';ctx.fillText(names[a],x+14,y+9);ctx.strokeStyle='#cbc5d2';ctx.beginPath();ctx.moveTo(x+12,y+254);ctx.lineTo(x+244,y+254);ctx.stroke();
    let frame;if(a===0)frame=Math.floor((t%960)/160);else if(a===1)frame=Math.floor((t%600)/100);else if(a===2)frame=Math.min(5,Math.floor((t%960)/100));else frame=Math.min(5,Math.floor((t%1440)/120));
    const picture=await loadImage(PNG.sync.write(frames[a*6+frame]));ctx.drawImage(picture,x,y+28,256,256);
   }
   buffers.push(await sharp(canvas.toBuffer('image/png')).ensureAlpha().raw().toBuffer());
  }
  const gif=path.join(preview,key+'.gif');await sharp(Buffer.concat(buffers),{raw:{width,height:height2*buffers.length,channels:4,pageHeight:height2}}).gif({loop:0,delay:Array(buffers.length).fill(80),keepDuplicateFrames:true,effort:4}).toFile(gif);
  const meta=await sharp(gif,{animated:true}).metadata();report.characters[key].gif={frames:meta.pages,width:meta.width,height:meta.pageHeight,duration:meta.delay.reduce((a,b)=>a+b,0)};
  console.log(key,report.characters[key].gif);
 }
 const canvas=createCanvas(800,280),ctx=canvas.getContext('2d');ctx.fillStyle='#eeeaf1';ctx.fillRect(0,0,800,280);ctx.imageSmoothingEnabled=false;ctx.font='16px Microsoft JhengHei';ctx.textBaseline='top';
 for(let i=0;i<allFrames.length;i++){const p=allFrames[i],im=await loadImage(PNG.sync.write(p.frames[0]));ctx.fillStyle='#302b38';ctx.fillText(p.label+'・'+p.color,i*200+12,12);ctx.drawImage(im,i*200-28,30,256,256);}
 fs.writeFileSync(path.join(preview,'four-characters.png'),canvas.toBuffer('image/png'));
 fs.writeFileSync(path.join(root,'candidate-manifest.json'),JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(path.join(root,'validation.json'),JSON.stringify(report,null,2)+'\n');
 console.log('Complete: four characters, 16 action strips, 96 articulated poses.');
})().catch(e=>{console.error(e);process.exitCode=1});
