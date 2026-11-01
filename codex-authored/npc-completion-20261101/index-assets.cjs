'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),root=__dirname,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifest={chars:{},stems:{}},assets=[],characters=[],hashes={},nativeHashes={};
for(const folder of fs.readdirSync(root+'/batches').filter(f=>/^batch\d{2}$/.test(f)).sort()){
 const pkg=path.join(root,'batches',folder),plan=JSON.parse(fs.readFileSync(pkg+'/plan.json')),m=JSON.parse(fs.readFileSync(pkg+'/candidate-manifest.json')),checks=JSON.parse(fs.readFileSync(pkg+'/sha256.json'));
 assert.ok(plan.length>=1&&plan.length<=4);assert.equal(Object.keys(m.chars).length,plan.length);assert.equal(Object.keys(m.stems).length,plan.length*4);
 for(const p of plan){assert.ok(!manifest.chars[p.key],p.key+' duplicate');characters.push({id:p.id,name:p.name,char:p.key,folder});}
 for(const[stem,meta]of Object.entries(m.stems)){assert.ok(!manifest.stems[stem],stem+' duplicate');const file='batches/'+folder+'/exports/'+stem+'.png',native='batches/'+folder+'/mote/'+stem+'.mote',bytes=fs.readFileSync(root+'/'+file),mote=fs.readFileSync(root+'/'+native);assert.equal(sha(bytes),checks[stem+'.png']);const doc=JSON.parse(mote),c=m.chars[meta.char];assert.equal(bytes.readUInt32BE(16),c.cellW*meta.frames);assert.equal(bytes.readUInt32BE(20),c.cellH);assert.equal(doc.frames.length,meta.frames);assert.equal(doc.width,c.cellW);assert.equal(doc.height,c.cellH);assets.push({stem,file,native,sha256:sha(bytes),nativeSHA256:sha(mote)});hashes[stem+'.png']=sha(bytes);nativeHashes[stem+'.mote']=sha(mote);}
 Object.assign(manifest.chars,m.chars);Object.assign(manifest.stems,m.stems);
}
assert.equal(characters.length,87);assert.equal(assets.length,348);assert.equal(new Set(characters.map(c=>c.id)).size,87);
for(const[file,data]of Object.entries({'candidate-manifest.json':manifest,'asset-index.json':{version:1,characters,assets},'sha256.json':hashes,'native-sha256.json':nativeHashes}))fs.writeFileSync(root+'/'+file,JSON.stringify(data,null,2)+'\n');
console.log('Indexed 87 original NPCs, 348 PNGs and 348 editable Mote sources.');
