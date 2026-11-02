'use strict';
// Build all four source animations, then apply the separately authored eight-phase walk.
const cp=require('child_process'),path=require('path');
(async()=>{const r=cp.spawnSync(process.execPath,[path.join(__dirname,'normalize-base.cjs'),...process.argv.slice(2)],{stdio:'inherit'});if(r.error)throw r.error;await require('./../npc-walk-cycles-20261102/apply.cjs').apply(__dirname,process.argv[2]);await require('./idle-corrections/apply.cjs').apply(__dirname,process.argv[2]);process.exitCode=r.status||0;})().catch(e=>{console.error(e);process.exitCode=1});
