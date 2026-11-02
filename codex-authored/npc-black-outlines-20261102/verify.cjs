'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{PNG}=require('pngjs'),codec=require('../npc-stationary-idles-20261102/codec.cjs'),{outline}=require('./outline.cjs');
function fixtures(){
 const w=11,h=11,src=Buffer.alloc(w*h*4);for(let y=2;y<=8;y++)for(let x=2;x<=8;x++)src.set(x>=4&&x<=6&&y>=4&&y<=6?[60,160,60,255]:[10,12,10,255],(y*w+x)*4);const a=outline(src,w,h);assert.equal(a.added,0,'existing two-pixel black edge must not grow');for(let y=4;y<=6;y++)for(let x=4;x<=6;x++)assert.deepEqual(a.output.subarray((y*w+x)*4,(y*w+x+1)*4),src.subarray((y*w+x)*4,(y*w+x+1)*4));
 const blank=Buffer.alloc(w*h*4);blank.set([200,90,60,255],(5*w+5)*4);const b=outline(blank,w,h);let added=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(b.output[(y*w+x)*4+3]&&!blank[(y*w+x)*4+3]){added++;assert.ok(Math.max(Math.abs(x-5),Math.abs(y-5))<=2);}assert.equal(added,24);
 const ring=Buffer.alloc(w*h*4);for(let y=2;y<=8;y++)for(let x=2;x<=8;x++)if(x===2||x===8||y===2||y===8)ring.set([200,90,60,255],(y*w+x)*4);assert.equal(outline(ring,w,h).output[(5*w+5)*4+3],0,'enclosed transparent detail stays transparent');
}
function verify(){fixtures();const root=__dirname,d=require('./export.cjs').verify(),report={assets:0,frames:0,newOpaquePixels:0,originalColoredPixelsPreserved:0,addedAtFrameBoundary:0};
 for(const r of d.records){const before=PNG.sync.read(fs.readFileSync(path.join(root,'before',r.stem+'.png'))),after=PNG.sync.read(fs.readFileSync(path.join(root,'exports',r.stem+'.png'))),native=JSON.parse(fs.readFileSync(path.join(root,'mote',r.stem+'.mote'))),frames=codec.render(native);assert.equal(before.width,after.width);assert.equal(before.height,after.height);assert.equal(frames.length,r.frames);
  for(let i=0;i<r.frames;i++){const col=i%r.columns,row=Math.floor(i/r.columns),base=(x,y)=>(((row*r.cellH+y)*before.width+col*r.cellW+x)*4);for(let y=0;y<r.cellH;y++)for(let x=0;x<r.cellW;x++){const at=base(x,y),a=before.data.subarray(at,at+4),b=after.data.subarray(at,at+4),np=(y*r.cellW+x)*4;assert.deepEqual(frames[i].subarray(np,np+4),b,r.stem+' native pixels');
   const dark=Math.max(...a.subarray(0,3))<=48&&a[0]*.2126+a[1]*.7152+a[2]*.0722<=32;if(a[3]>=128&&!dark){assert.deepEqual(b,a,r.stem+' colored body detail changed');report.originalColoredPixelsPreserved++;}
   if(a[3]<128&&b[3]>=128){assert.deepEqual([...b],[0,0,0,255]);let near=false;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<r.cellW&&yy>=0&&yy<r.cellH&&before.data[base(xx,yy)+3]>=128)near=true;}assert.ok(near,r.stem+' outline exceeded 2px');report.newOpaquePixels++;if(x===0||y===0||x===r.cellW-1||y===r.cellH-1)report.addedAtFrameBoundary++;}
  }report.frames++;}report.assets++;if(report.assets%100===0)console.log('Verified '+report.assets+'/'+d.records.length);}
 fs.writeFileSync(path.join(root,'rgba-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(report);return report;
}
module.exports={verify};if(require.main===module)verify();
