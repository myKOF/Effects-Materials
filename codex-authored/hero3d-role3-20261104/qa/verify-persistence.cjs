const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root='D:/MyGame/Idle-RPG/codex',out=__dirname,errors=[],warnings=[];
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}const file=path.join(root,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname));fs.readFile(file,(err,bytes)=>{res.writeHead(err?404:200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'})[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(err?'missing':bytes);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const context=await browser.newContext({viewport:{width:1100,height:800}});
 await context.addInitScript(()=>localStorage.setItem('idle-rpg.hero3d.v1','1'));
 async function open(){const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForFunction(()=>window.Hero3D?.instance&&WorkerBridge.status().booted&&uiHeaderPanelSnapshot()?.player,{},{timeout:60000});return p;}
 let p=await open();console.log('booted');
 const r=await p.evaluate(()=>WorkerBridge.send('gm.exec',{line:'reincarnation 3'}));assert.ok(r.ok);await p.waitForFunction(()=>uiHeaderPanelSnapshot()?.player?.reincarnations===3&&Hero3D.instance?.skinIndex===3,{},{timeout:60000});console.log('Role3 ready');
 await p.evaluate(()=>WorkerBridge.send('combat.togglePaused',{}));await p.evaluate(()=>WorkerBridge.saveAutoNow());console.log('saved');
 const saved=await p.evaluate(()=>({skin:Hero3D.instance.skinIndex,model:Hero3D.instance.modelUrl,reincarnations:uiHeaderPanelSnapshot().player.reincarnations}));
 await p.close();p=await open();await p.waitForFunction(()=>uiHeaderPanelSnapshot()?.player?.reincarnations===3&&Hero3D.instance?.skinIndex===3,{},{timeout:60000});
 const loaded=await p.evaluate(()=>({skin:Hero3D.instance.skinIndex,model:Hero3D.instance.modelUrl,reincarnations:uiHeaderPanelSnapshot().player.reincarnations}));assert.deepEqual(loaded,saved);assert.deepEqual(errors,[]);
 const report={saved,loaded,errors,warnings};fs.writeFileSync(out+'/persistence-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
