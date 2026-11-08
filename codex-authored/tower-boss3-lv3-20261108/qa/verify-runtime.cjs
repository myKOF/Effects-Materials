const {chromium}=require('C:/Users/alway/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-webgl']});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage(),errors=[],warnings=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
 try{
  await page.goto('http://127.0.0.1:18993/',{waitUntil:'load'});
  await page.getByRole('button',{name:'新遊戲',exact:true}).click({timeout:20000});
  await page.waitForFunction(()=>WorkerBridge.status().booted&&BattleRenderer.active(),{timeout:20000});
  await page.evaluate(async()=>{
   window.npcPlays=[];window.createdDefs=[];window.npcDisposed=0;
   var create=Npc3D.create,play=Npc3D.play,dispose=Npc3D.dispose;
   Npc3D.create=async function(def){createdDefs.push(def);return create(def);};
   Npc3D.play=function(body,name,rate){var cfg=play(body,name,rate);npcPlays.push({name,clip:cfg&&cfg.clip});return cfg;};
   Npc3D.dispose=function(body){if(body&&body.npc3d&&!body.npc3d.disposed)npcDisposed++;dispose(body);};
   for(var line of ['gold 10000000','god on','damage 1','tower_jump 3'])await WorkerBridge.send('gm.exec',{line});
   await WorkerBridge.send('tower.setAutoAdvance',{on:false});
   await WorkerBridge.send('tower.start',{floor:3});
  });
  await page.waitForFunction(()=>BattleRenderer._debug().entities.some(e=>e.npc==='tower_boss_3'&&e.npc3d),{timeout:30000});
  await page.waitForFunction(()=>npcPlays.some(p=>p.clip==='Attack3'),{timeout:30000});
  await page.getByRole('button',{name:'封魔塔',exact:true}).click();
  await page.locator('[data-tower-pick="3"]').click();
  await page.waitForFunction(()=>Array.from(document.images).some(im=>im.src.includes('boss_skeleton_king_lv3.png')&&im.complete&&im.naturalWidth>0));
  await page.screenshot({path:path.join(__dirname,'boss3-runtime.png')});
  const variant=await page.evaluate(()=>({name:peekUiPanelData('battle').tower.boss.name,
   entities:BattleRenderer._debug().entities,plays:npcPlays.slice(),createdDefs:createdDefs.slice(),disposed:npcDisposed,
   portrait:Array.from(document.images).filter(im=>im.src.includes('boss_skeleton_king_lv3.png')).map(im=>({src:im.getAttribute('src'),width:im.naturalWidth}))}));
  assert.equal(variant.name,'第3層・骷髏王Ⅲ');assert.equal(variant.createdDefs.length,1);
  assert.equal(variant.createdDefs[0].file,'images/models/npc3d/boss3.glb');assert.ok(variant.portrait.length);
  for(const clip of ['Walk','Attack1','Attack2','Attack3'])assert.ok(variant.plays.some(p=>p.clip===clip),clip);
  await page.evaluate(()=>WorkerBridge.send('gm.exec',{line:'damage 100%'}));
  await page.waitForFunction(()=>npcPlays.some(p=>p.clip==='Die'),{timeout:20000});
  await page.waitForFunction(()=>npcDisposed===1,{timeout:10000});
  const death=await page.evaluate(()=>({plays:npcPlays.slice(-4),created:createdDefs.length,disposed:npcDisposed}));
  await page.evaluate(async()=>{
   await WorkerBridge.send('tower.confirmResult',{});
   for(var line of ['damage 1','tower_jump 4'])await WorkerBridge.send('gm.exec',{line});
   await WorkerBridge.send('tower.start',{floor:4});
  });
  await page.waitForFunction(()=>BattleRenderer._debug().entities.some(e=>e.npc==='tower_boss_4'),{timeout:10000});
  const fourth=await page.evaluate(()=>({entities:BattleRenderer._debug().entities,created:createdDefs.length,disposed:npcDisposed}));
  assert.ok(fourth.entities.every(e=>!e.npc3d));assert.equal(fourth.created,1);
  await page.evaluate(async()=>{
   await WorkerBridge.send('tower.flee',{});
   await WorkerBridge.send('tower.confirmResult',{});
   await WorkerBridge.send('tower.start',{floor:1});
  });
  await page.waitForFunction(()=>BattleRenderer._debug().entities.some(e=>e.npc==='tower_boss_1'&&e.npc3d),{timeout:30000});
  const first=await page.evaluate(()=>({name:peekUiPanelData('battle').tower.boss.name,createdDefs:createdDefs.slice(),disposed:npcDisposed}));
  assert.equal(first.name,'第1層・骷髏王');assert.equal(first.createdDefs[1].file,'images/models/npc3d/boss1.glb');
  await page.evaluate(()=>WorkerBridge.send('tower.flee',{}));
  await page.waitForFunction(()=>npcDisposed===2,{timeout:10000});
  const report={variant,death,fourth,first,errors,warnings,viewport:[1440,1000],isolatedContext:true};
  fs.writeFileSync(path.join(__dirname,'runtime-verification.json'),JSON.stringify(report,null,2));
  assert.deepEqual(errors,[]);
  console.log('RUNTIME_PASS: boss3 all motions/death/disposal; boss1 and boss4 preserved; zero errors');
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
