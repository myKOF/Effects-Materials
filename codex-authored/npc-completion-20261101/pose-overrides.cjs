'use strict';
// Normalize separately ImageGen-authored replacement poses; never invent pixel geometry.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{PNG}=require('pngjs'),sharp=require('sharp');
async function apply(spec,groups,root,idleH,headOffset){
 for(const[action,poses]of Object.entries(spec.poseOverrides||{}))for(const[index,p]of Object.entries(poses)){const a=['idle','walk','attack','die'].indexOf(action),i=Number(index);assert.ok(a>=0&&i>=0&&i<6);const file=path.resolve(root,p.file);assert.ok(file.startsWith(path.resolve(root)+path.sep));const im=PNG.sync.read(fs.readFileSync(file));let l=im.width,r=0,t=im.height,b=0;for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(im.data[(y*im.width+x)*4+3]>=48){l=Math.min(l,x);r=Math.max(r,x+1);t=Math.min(t,y);b=Math.max(b,y+1);}assert.ok(l>=3&&r<=im.width-3&&t>=3&&b<=im.height-3,spec.key+' separate pose must be complete with alpha padding');const h=Math.round(idleH*(p.heightRatio||1)),w=Math.round((r-l)*h/(b-t)),src=PNG.sync.read(await sharp(PNG.sync.write(im)).extract({left:l,top:t,width:r-l,height:b-t}).resize(w,h,{kernel:'nearest'}).png().toBuffer()),pixels=[];let sx=0,n=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const at=(y*w+x)*4;if(src.data[at+3])pixels.push([x,y,at]);if(y<h*.22&&src.data[at+3]>=96){sx+=x;n++;}}assert.ok(n>0);groups[a*6+i]={l:0,r:w,t:0,b:h,pixels,originX:sx/n-headOffset,sourceImage:src};
 }
}
module.exports={apply};
