'use strict';
const cp=require('child_process'),path=require('path');
(async()=>{const r=cp.spawnSync(process.execPath,[path.join(__dirname,'generate-base.cjs'),...process.argv.slice(2)],{stdio:'inherit'});if(r.status)process.exit(r.status);await require('../npc-walk-cycles-20261102/legacy.cjs').apply(__dirname,process.env.NPC_PREVIEW_DIR);})().catch(e=>{console.error(e);process.exitCode=1});
