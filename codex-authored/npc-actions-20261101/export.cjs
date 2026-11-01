'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
function exportAssets(game,mode){
  assert.ok(['--apply','--check','--source-check'].includes(mode),'--apply, --check or --source-check required');
  const target=path.join(path.resolve(game),'images/sprites/npc'),manifestPath=path.join(target,'npc.json');
  const extra=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json')));
  const plan=JSON.parse(fs.readFileSync(path.join(__dirname,'plan.json')));
  const manifest=mode==='--source-check'?{chars:Object.fromEntries(Object.entries(plan.chars).map(([key,d])=>[key,d.meta])),stems:extra.stems}:JSON.parse(fs.readFileSync(manifestPath));
  const hashes=JSON.parse(fs.readFileSync(path.join(__dirname,'sha256.json'))),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
  for(const [stem,meta] of Object.entries(extra.stems)){
    const bytes=fs.readFileSync(path.join(__dirname,'exports',stem+'.png')),c=manifest.chars[meta.char];assert.ok(c,meta.char);
    assert.equal(sha(bytes),hashes[stem+'.png'],stem+' source hash');
    assert.equal(bytes.readUInt32BE(16),c.cellW*meta.frames,stem+' width');assert.equal(bytes.readUInt32BE(20),c.cellH,stem+' height');
    if(mode==='--source-check')continue;
    if(mode==='--apply')fs.writeFileSync(path.join(target,stem+'.png'),bytes);
    assert.equal(sha(fs.readFileSync(path.join(target,stem+'.png'))),hashes[stem+'.png'],stem+' game hash');
    if(mode==='--apply')manifest.stems[stem]=meta;
    assert.deepEqual(manifest.stems[stem],meta,stem+' metadata');
  }
  if(mode==='--apply')fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,1)+'\n');
  console.log((mode==='--source-check'?'Supplemental NPC sources: ':'Supplemental NPC assets: ')+Object.keys(extra.stems).length+' PNG hashes and animation metadata match.');
}
if(require.main===module)exportAssets(process.argv[2],process.argv[3]);
module.exports={exportAssets};
