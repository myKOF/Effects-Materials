'use strict';
// Native pixel animation authoring. No resampling blur, new palette, or external art.
// Dependencies: pngjs. Optional preview dependencies: sharp, @napi-rs/canvas.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { PNG } = require('pngjs');
const plan = JSON.parse(fs.readFileSync(path.join(__dirname, 'plan.json')));
const out = path.join(__dirname, 'exports'), native = path.join(__dirname, 'mote');
fs.mkdirSync(out, { recursive: true }); fs.mkdirSync(native, { recursive: true });
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const read = file => PNG.sync.read(fs.readFileSync(file));
function cell(strip, w, h, i) {
  const dst = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) strip.data.copy(dst.data, y*w*4, (y*strip.width+i*w)*4, (y*strip.width+(i+1)*w)*4);
  return dst;
}
function box(im) {
  let l=im.width,t=im.height,r=0,b=0;
  for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(im.data[(y*im.width+x)*4+3]){l=Math.min(l,x);r=Math.max(r,x+1);t=Math.min(t,y);b=Math.max(b,y+1);}
  return {l,t,r,b,w:r-l,h:b-t};
}
// Inverse nearest-pixel mapping keeps enclosed regions continuous (including mouths).
function pose(src, opts) {
  const bb=box(src), w=src.width,h=src.height, cx=(bb.l+bb.r-1)/2, cy=bb.b-1;
  const a=opts.angle||0, co=Math.cos(a), si=Math.sin(a), sx=opts.sx||1,sy=opts.sy||1;
  const verts=[[bb.l,bb.t],[bb.r-1,bb.t],[bb.l,bb.b-1],[bb.r-1,bb.b-1]].map(([x,y])=>{
    x=(x-cx)*sx; y=(y-cy)*sy; return [x*co-y*si+cx,y*co+x*si+cy];
  });
  let dx=opts.dx||0,dy=opts.dy||0;
  const minX=Math.min(...verts.map(p=>p[0])),maxX=Math.max(...verts.map(p=>p[0]));
  const minY=Math.min(...verts.map(p=>p[1])),maxY=Math.max(...verts.map(p=>p[1]));
  dx=Math.max(-minX,Math.min(w-1-maxX,dx)); dy=Math.max(-minY,Math.min(h-1-maxY,dy));
  const dst=new PNG({width:w,height:h});
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    let xx=x-cx-dx, yy=y-cy-dy;
    let px=(xx*co+yy*si)/sx+cx,py=(yy*co-xx*si)/sy+cy;
    if(opts.stride){
      const rel=(py-bb.t)/Math.max(1,bb.h-1);
      // Feet/roots sway in opposite phase to the torso, blending across the hips.
      px-=opts.stride*Math.max(0,(rel-.5)*2)*(px<cx?-1:1);
    }
    if(opts.bend)px-=opts.bend*Math.sin(Math.max(0,Math.min(1,(py-bb.t)/Math.max(1,bb.h)))*Math.PI);
    px=Math.round(px);py=Math.round(py);
    if(px>=0&&px<w&&py>=0&&py<h){const s=(py*w+px)*4,d=(y*w+x)*4;if(src.data[s+3])src.data.copy(dst.data,d,s,s+4);}
  }
  return dst;
}
function encodeMote(stem,frames,ms) {
  const layer='artwork', rle = im => {
    const runs=[];let last=-1,n=0;
    for(let p=0;p<im.data.length;p+=4){const color=im.data[p+3] ? (im.data[p]|im.data[p+1]<<8|im.data[p+2]<<16|im.data[p+3]<<24)>>>0:0;
      if(color===last)n++;else{if(n)runs.push(n,last);last=color;n=1;}}
    if(n)runs.push(n,last);return runs;
  };
  const colors=new Set();for(const f of frames)for(let p=0;p<f.data.length;p+=4)if(f.data[p+3])colors.add('#'+f.data.subarray(p,p+3).toString('hex'));
  return {format:'mote',version:3,id:stem,name:stem,width:frames[0].width,height:frames[0].height,
    regions:[],anchors:[],clips:[],links:[],paletteVersion:1,tags:[],slices:[],
    palette:{id:'source',name:'Original sprite palette',author:stem.startsWith('bat_')?'Monsters Creatures Fantasy 2 (user-purchased)':'GandalfHardcore',colors:[...colors],entryIds:[...colors].map((_,i)=>'color-'+i)},
    layers:[{id:layer,name:'Artwork',visible:true,locked:false,alphaLocked:false,blendMode:'normal',opacity:1}],
    frames:frames.map((im,i)=>({id:'frame-'+i,name:'Frame '+(i+1),duration:ms,cels:{[layer]:rle(im)}}))};
}
function writeStrip(frames,file){const w=frames[0].width,h=frames[0].height,dst=new PNG({width:w*frames.length,height:h});frames.forEach((im,i)=>{for(let y=0;y<h;y++)im.data.copy(dst.data,(y*dst.width+i*w)*4,y*w*4,(y+1)*w*4);});fs.writeFileSync(file,PNG.sync.write(dst));}
const flying = new Set(['burning_skull','burning_skull_blue','demon_eye','demon_mine','plague_flies','flying_demon_head','skull_candle','large_skull','bat']);
const stems={}, hashes={}, previews=[];
for(const d of Object.values(plan.chars)) {
  const sourcePath=path.join(__dirname,'sources',d.idle+'.png'),strip=read(sourcePath),w=d.meta.cellW,h=d.meta.cellH;
  const src=Array.from({length:d.idleMeta.frames},(_,i)=>cell(strip,w,h,i));
  for(const action of d.missing){
    const stem=d.char+'_'+action,file=path.join(out,stem+'.png');let frames,fps=12,ms=83;
    if(stem==='flying_demon_head_attack'){
      fs.copyFileSync(path.join(__dirname,'sources',stem+'.png'),file);
      fs.copyFileSync(path.join(__dirname,'sources',stem+'.mote'),path.join(native,stem+'.mote'));
      const approved=read(file);frames=Array.from({length:6},(_,i)=>cell(approved,w,h,i));fps=1000/83;
    }else if(action==='walk'){
      frames=Array.from({length:8},(_,i)=>{
        const phase=i/8*Math.PI*2,s=Math.sin(phase),f=src[d.char==='memento_skeleton'?0:Math.floor(i/8*src.length)];
        if(flying.has(d.char))return pose(f,{dx:Math.round(s),dy:Math.round(-1.5*s),angle:Math.sin(phase)*.025});
        return pose(f,{dy:Math.round(-Math.abs(s)*2),angle:s*.018,stride:s*2,bend:d.char==='tree_damned'?s*2:0});
      });
    }else if(action==='attack'){
      const dir=d.meta.facing,progress=[0,-.3,.8,1,.35,0];
      frames=progress.map((p,i)=>{
        const f=src[d.char==='memento_skeleton'||i===0||i===5?0:Math.min(src.length-1,i)];
        return pose(f,{dx:Math.round(dir*p*(flying.has(d.char)?7:4)),dy:Math.round(-Math.max(0,p)*2),
          angle:dir*p*(flying.has(d.char)?-.055:.1),sx:1+Math.max(0,p)*.07,sy:1-Math.max(0,p)*.06,
          bend:dir*p*(d.char==='tree_damned'?4:1)});
      });
    }else{
      frames=Array.from({length:8},(_,i)=>{const p=i/7;
        return pose(src[0],{sx:1-p*.2,sy:1-p*.68,angle:d.meta.facing*p*.5,dy:Math.round((1-d.meta.anchorY)*h*p)});
      });
    }
    if(stem!=='flying_demon_head_attack'){
      writeStrip(frames,file);fs.writeFileSync(path.join(native,stem+'.mote'),JSON.stringify(encodeMote(stem,frames,ms),null,2)+'\n');
    }
    stems[stem]={char:d.char,frames:frames.length,fps,loop:action==='walk',hold:action==='die'};
    hashes[stem+'.png']=sha(fs.readFileSync(file));previews.push({stem,action,frames,d});
  }
}
fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify({stems},null,1)+'\n');
fs.writeFileSync(path.join(__dirname,'sha256.json'),JSON.stringify(hashes,null,2)+'\n');
console.log('Authored '+previews.length+' native animation strips.');
if(process.argv.includes('--previews'))(async()=>{
  const {createCanvas,loadImage}=require('@napi-rs/canvas'),sharp=require('sharp');
  const previewDir=process.env.NPC_PREVIEW_DIR||path.join(__dirname,'previews');fs.mkdirSync(previewDir,{recursive:true});
  for(let start=0;start<previews.length;start+=12){
    const page=previews.slice(start,start+12),canvas=createCanvas(1120,page.length*126),ctx=canvas.getContext('2d');ctx.fillStyle='#2c2936';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;ctx.font='14px Arial';ctx.fillStyle='white';
    for(let j=0;j<page.length;j++){const p=page[j];ctx.fillStyle='white';ctx.fillText(p.stem,8,j*126+18);for(let i=0;i<p.frames.length;i++){const png=PNG.sync.write(p.frames[i]),im=await loadImage(png),k=Math.min(1.6,112/im.width,95/im.height);ctx.drawImage(im,260+i*105,j*126+22,im.width*k,im.height*k);}}
    fs.writeFileSync(path.join(previewDir,'filmstrip-'+(start/12+1)+'.png'),canvas.toBuffer('image/png'));
  }
  // One animation overview per action; original sprites stay pixel sharp.
  for(const action of ['walk','attack','die']){
    const ps=previews.filter(p=>p.action===action),cols=4,rows=Math.ceil(ps.length/cols),cw=960,ch=rows*192,raw=[];
    for(let n=0;n<12;n++){
      const canvas=createCanvas(cw,ch),ctx=canvas.getContext('2d');ctx.fillStyle='#e7e4ed';ctx.fillRect(0,0,cw,ch);ctx.imageSmoothingEnabled=false;ctx.font='13px Arial';
      for(let j=0;j<ps.length;j++){const p=ps[j],f=p.frames[Math.min(p.frames.length-1,Math.floor(n/12*p.frames.length))],im=await loadImage(PNG.sync.write(f)),k=Math.min(2,210/im.width,158/im.height),x=j%cols*240,y=Math.floor(j/cols)*192;ctx.fillStyle='#211b2c';ctx.fillText(p.d.char,x+6,y+18);ctx.drawImage(im,x+(240-im.width*k)/2,y+28,im.width*k,im.height*k);}raw.push(await sharp(canvas.toBuffer('image/png')).ensureAlpha().raw().toBuffer());
    }
    await sharp(Buffer.concat(raw),{raw:{width:cw,height:ch*raw.length,channels:4,pageHeight:ch}}).gif({loop:0,delay:100,effort:3}).toFile(path.join(previewDir,action+'-overview.gif'));
  }
})();
