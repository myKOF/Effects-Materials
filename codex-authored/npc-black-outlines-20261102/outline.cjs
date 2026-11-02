'use strict';
// Native source pixels; never redraw or rescale the character. One final outline pass.
const assert=require('node:assert/strict');
const RADIUS=2,ALPHA=128;
function outline(input,w,h){
 assert.equal(input.length,w*h*4);const n=w*h,solid=new Uint8Array(n),exterior=new Uint8Array(n),depth=new Uint8Array(n),seed=new Uint8Array(n),stroke=new Uint8Array(n),queue=[];
 for(let i=0;i<n;i++)solid[i]=input[i*4+3]>=ALPHA?1:0;
 function visit(i){if(!solid[i]&&!exterior[i]){exterior[i]=1;queue.push(i);}}
 for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}
 for(let a=0;a<queue.length;a++){const i=queue[a],x=i%w,y=(i/w)|0;for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h)visit(yy*w+xx);}}
 const isDark=i=>{const p=i*4;return Math.max(input[p],input[p+1],input[p+2])<=48&&(.2126*input[p]+.7152*input[p+1]+.0722*input[p+2])<=32;};
 for(let i=0;i<n;i++)if(solid[i]){const x=i%w,y=(i/w)|0;let d=3;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h||exterior[yy*w+xx])d=Math.min(d,Math.max(Math.abs(dx),Math.abs(dy)));}depth[i]=d;if(!isDark(i)||d>2)seed[i]=1;}
 // Exclude the existing near-black edge from dilation seeds: a 2px slime edge
 // stays 2px instead of acquiring another 2px ring. Enclosed holes stay open.
 for(let i=0;i<n;i++)if(seed[i]){const x=i%w,y=(i/w)|0;for(let dy=-RADIUS;dy<=RADIUS;dy++)for(let dx=-RADIUS;dx<=RADIUS;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;const k=yy*w+xx;if(exterior[k]&&xx>0&&xx<w-1&&yy>0&&yy<h-1)stroke[k]=1;}}
 for(let i=0;i<n;i++)if(solid[i]&&depth[i]<=2&&isDark(i))stroke[i]=1;
 const artwork=Buffer.from(input),edge=Buffer.alloc(input.length),output=Buffer.from(input);let changed=0,added=0;
 for(let i=0;i<n;i++){const p=i*4;if(stroke[i]){if(!solid[i])added++;artwork.fill(0,p,p+4);edge[p+3]=255;output.fill(0,p,p+3);output[p+3]=255;if(!input.subarray(p,p+4).equals(output.subarray(p,p+4)))changed++;}}
 return{artwork,edge,output,changed,added};
}
module.exports={outline,RADIUS,ALPHA};
