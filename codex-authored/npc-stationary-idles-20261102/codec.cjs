'use strict';
const zlib=require('node:zlib'),assert=require('node:assert/strict');
function rle(data){const out=[];let last=-1,n=0;for(let p=0;p<data.length;p+=4){const v=data[p+3]?data.readUInt32LE(p):0;if(v===last)n++;else{if(n)out.push(n,last);last=v;n=1;}}if(n)out.push(n,last);return out;}
function unrle(runs,w,h){const b=Buffer.alloc(w*h*4);let p=0;for(let i=0;i<runs.length;i+=2){assert.ok(Number.isInteger(runs[i])&&runs[i]>0);for(let j=0;j<runs[i];j++){assert.ok(p<b.length);b.writeUInt32LE(runs[i+1]>>>0,p);p+=4;}}assert.equal(p,b.length);return b;}
function render(m){return m.frames.map(f=>{const out=Buffer.alloc(m.width*m.height*4);for(const l of m.layers){assert.ok(l.visible&&l.opacity===1&&l.blendMode==='normal');const b=unrle(f.cels[l.id],m.width,m.height);for(let p=0;p<b.length;p+=4)if(b[p+3]){assert.equal(out[p+3],0,"native layers must not overlap");b.copy(out,p,p,p+4);}}return out;});}
const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function chunk(type,data){const t=Buffer.from(type),b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);t.copy(b,4);data.copy(b,8);let crc=0xffffffff;for(const v of Buffer.concat([t,data]))crc=table[(crc^v)&255]^(crc>>>8);b.writeUInt32BE((crc^0xffffffff)>>>0,b.length-4);return b;}
function png(frames,w,h){const width=w*frames.length,raw=Buffer.alloc((width*4+1)*h);for(let y=0;y<h;y++)for(let i=0;i<frames.length;i++)frames[i].copy(raw,y*(width*4+1)+1+i*w*4,y*w*4,(y+1)*w*4);const ih=Buffer.alloc(13);ih.writeUInt32BE(width);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);}
module.exports={rle,render,png};
