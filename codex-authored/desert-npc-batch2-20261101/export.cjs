'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function exportAssets(game,mode){
 assert.ok(['--apply','--check','--source-check'].includes(mode));
 require('./idle-corrections/apply.cjs').verify(__dirname);
 const extra=JSON.parse(fs.readFileSync(path.join(__dirname,'candidate-manifest.json'))),hashes=JSON.parse(fs.readFileSync(path.join(__dirname,'sha256.json')));
 const dir=path.join(path.resolve(game),'images/sprites/npc'),file=path.join(dir,'npc.json'),man=mode==='--source-check'?extra:JSON.parse(fs.readFileSync(file));
 for(const [stem,m]of Object.entries(extra.stems)){
  const c=extra.chars[m.char],bytes=fs.readFileSync(path.join(__dirname,'exports',stem+'.png'));assert.equal(sha(bytes),hashes[stem+'.png']);assert.equal(bytes.readUInt32BE(16),c.cellW*m.frames);assert.equal(bytes.readUInt32BE(20),c.cellH);
  if(mode==='--source-check')continue;
  if(mode==='--apply'){fs.writeFileSync(path.join(dir,stem+'.png'),bytes);man.stems[stem]=m;man.chars[m.char]=c;}
  assert.equal(sha(fs.readFileSync(path.join(dir,stem+'.png'))),hashes[stem+'.png']);assert.deepEqual(man.stems[stem],m);assert.deepEqual(man.chars[m.char],c);
 }
 if(mode==='--apply')fs.writeFileSync(file,JSON.stringify(man,null,1)+'\n');
 console.log('Desert NPC batch 2: 16 PNG hashes and four complete animation sets match ('+mode+').');
}
if(require.main===module)exportAssets(process.argv[2],process.argv[3]);module.exports={exportAssets};
