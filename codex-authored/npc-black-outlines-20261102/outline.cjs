'use strict';
// Native source pixels; never redraw or rescale the character. One final outline pass.
const assert=require('node:assert/strict');
const RADIUS=1,ALPHA=128;
function outline(input,w,h,existingEdgeDepth=2){
 assert.equal(input.length,w*h*4);const n=w*h,solid=new Uint8Array(n),exterior=new Uint8Array(n),depth=new Uint8Array(n),seed=new Uint8Array(n),stroke=new Uint8Array(n),queue=[];
 for(let i=0;i<n;i++)solid[i]=input[i*4+3]>=ALPHA?1:0;
 function visit(i){if(!solid[i]&&!exterior[i]){exterior[i]=1;queue.push(i);}}
 for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}
 for(let a=0;a<queue.length;a++){const i=queue[a],x=i%w,y=(i/w)|0;for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h)visit(yy*w+xx);}}
 const isDark=i=>{const p=i*4;return Math.max(input[p],input[p+1],input[p+2])<=48&&(.2126*input[p]+.7152*input[p+1]+.0722*input[p+2])<=32;};
 for(let i=0;i<n;i++)if(solid[i]){const x=i%w,y=(i/w)|0;let d=existingEdgeDepth+1;for(let dy=-existingEdgeDepth;dy<=existingEdgeDepth;dy++)for(let dx=-existingEdgeDepth;dx<=existingEdgeDepth;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h||exterior[yy*w+xx])d=Math.min(d,Math.max(Math.abs(dx),Math.abs(dy)));}depth[i]=d;if(!isDark(i)||d>existingEdgeDepth)seed[i]=1;}
 // Rebuild from the unoutlined artwork. Old dark edge pixels one pixel too far
 // from the core are removed, so changing radius also thins the original 2px rim.
 const nearCore=new Uint8Array(n),protectedArt=new Uint8Array(n),search=existingEdgeDepth+1;
 for(let i=0;i<n;i++)if(seed[i]){const x=i%w,y=(i/w)|0;for(let dy=-search;dy<=search;dy++)for(let dx=-search;dx<=search;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;const k=yy*w+xx,d=Math.max(Math.abs(dx),Math.abs(dy));if(d)nearCore[k]=nearCore[k]?Math.min(nearCore[k],d):d;if(d<=RADIUS&&d>0&&((exterior[k]&&xx>0&&xx<w-1&&yy>0&&yy<h-1)||(solid[k]&&depth[k]<=existingEdgeDepth&&isDark(k))))stroke[k]=1;}}
 // Isolated thin dark linework is artwork, not a removable rim. Preserve its
 // connection to the body while trimming the old broad contour and faint fringe.
 for(let i=0;i<n;i++)if(solid[i]&&isDark(i)&&depth[i]<=existingEdgeDepth&&(!nearCore[i]||nearCore[i]>existingEdgeDepth)){const x=i%w,y=(i/w)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h){const k=yy*w+xx;if(solid[k]&&isDark(k))protectedArt[k]=1;}}}
 const artwork=Buffer.from(input),edge=Buffer.alloc(input.length),output=Buffer.from(input);let changed=0,added=0;
 for(let i=0;i<n;i++){const p=i*4,oldRim=solid[i]?depth[i]<=existingEdgeDepth&&nearCore[i]<=existingEdgeDepth:exterior[i]&&input[p+3]>0;if(isDark(i)&&oldRim&&nearCore[i]>RADIUS&&!seed[i]&&!protectedArt[i]){artwork.fill(0,p,p+4);output.fill(0,p,p+4);changed++;}else if(protectedArt[i]&&!seed[i]){artwork.fill(0,p,p+3);output.fill(0,p,p+3);if(!input.subarray(p,p+4).equals(output.subarray(p,p+4)))changed++;}else if(stroke[i]&&!protectedArt[i]){if(!solid[i])added++;artwork.fill(0,p,p+4);edge[p+3]=255;output.fill(0,p,p+3);output[p+3]=255;if(!input.subarray(p,p+4).equals(output.subarray(p,p+4)))changed++;}}
 return{artwork,edge,output,changed,added};
}
module.exports={outline,RADIUS,ALPHA};
