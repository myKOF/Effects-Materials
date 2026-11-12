'use strict';

function makeBattleReinforcements({ layer, random, smooth, lerp, ground, infantry, air, poses }) {
  const randomGround = random(974109);
  const randomAir = random(882731);
  const tau = Math.PI * 2;

  function inkSprite(sheet, box, color) {
    const [x, y, w, h] = box;
    const ctx = layer(w, h);
    ctx.drawImage(sheet, x, y, w, h, 0, 0, w, h);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    return ctx.canvas;
  }

  const foot = infantry.map(box => inkSprite(ground, box, 'rgba(34,23,24,.72)'));
  const wings = poses.map(pair => pair.map(p => ({
    sprite: inkSprite(air, [p.x,p.y,p.w,p.h], 'rgba(37,26,29,.75)'),
    anchorX: p.ax / p.w, anchorY: p.ay / p.h
  })));

  const farStrata = [];
  const originY = 550;
  const ranks = 27;
  const groundCounts = { deep: 0, transition: 0 };
  // The deepest ranks are most compressed and fill more of each row.
  // Staggered paths and variations in the ranks keep the outline irregular.
  for (let stratum = 0; stratum < 3; stratum++) {
    const ctx = layer(1920, 104);
    ctx.imageSmoothingQuality = 'high';
    for (let row = stratum * 9; row < (stratum + 1) * 9; row++) {
      const v = row / (ranks - 1);
      const deep = row < 19;
      const spacing = deep ? Math.round(lerp(192, 128, v / .70)) : Math.round(lerp(96, 56, (v - .70) / .30));
      const feetY = 569 + 62 * v ** 1.40;
      const width = lerp(1130, 1285, v);
      const center = 1129 + 28 * Math.sin(v * 4.9) - 26 * v;
      const jitter = (randomGround() - .5) * 12;
      for (let i = 0; i < spacing; i++) {
        const u = (i + randomGround() * .90) / spacing;
        const fringe = smooth(0,.065,u) * (1 - smooth(.935,1,u));
        const formation = .68 + .32 * Math.sin(u * 11.9 + v * 3.1) ** 2;
        if (randomGround() > fringe * formation * (deep ? 1.18 : .79)) continue;
        const x = center + (u - .5) * width + (randomGround() - .5) * lerp(8, 25, v) + jitter;
        const terrain = 8.9 * Math.sin(u * 6.7 + .7) + 4.6 * Math.sin(u * 16.2 + v * 2.5);
        const y = feetY + terrain * (1 - v * .52) + (randomGround() - .5) * lerp(7.5, 14, v);
        const size = lerp(4.9, 13.7, v ** 1.7) * lerp(.73, 1.47, randomGround());
        const sprite = foot[Math.floor(randomGround() * foot.length)];
        const w = size * sprite.width / sprite.height;
        ctx.save();
        ctx.globalAlpha = lerp(.61,.83,randomGround()) * (deep ? lerp(.83,1,smooth(0,.17,v)) : .90);
        ctx.translate(x, y - originY);
        ctx.scale(randomGround() < .49 ? -1 : 1, 1);
        ctx.drawImage(sprite, -w / 2, -size, w, size);
        if (deep && randomGround() > .78) {
          ctx.strokeStyle = '#37272a';
          ctx.lineWidth = Math.max(.43,size * .064);
          ctx.beginPath();
          ctx.moveTo(w * .14, -size * .14);
          ctx.lineTo(w * .52, -size * (1.06 + randomGround() * .42));
          ctx.stroke();
        }
        ctx.restore();
        groundCounts[deep ? 'deep' : 'transition']++;
      }
    }
    farStrata.push(ctx.canvas);
  }

  const wingsInFormation = [
    // Above the central spire, across the right cloud, and just over the left roofs.
    { x:906, y:297, w:126, h:44, n:112, direction:-1 },
    { x:984, y:323, w:122, h:50, n:151, direction:-1 },
    { x:1036, y:364, w:87, h:39, n:89, direction:-1 },
    { x:1103, y:285, w:108, h:39, n:63, direction:-1 },
    { x:1391, y:240, w:92, h:53, n:119, direction:-1 },
    { x:1454, y:276, w:80, h:48, n:120, direction:-1 },
    { x:1388, y:325, w:78, h:41, n:93, direction:-1 },
    { x:1513, y:286, w:95, h:46, n:53, direction:-1 },
    { x:779, y:434, w:122, h:26, n:125, direction:-1 },
    { x:884, y:438, w:121, h:33, n:139, direction:-1 },
    { x:979, y:451, w:101, h:26, n:98, direction:-1 },
    { x:1195, y:378, w:97, h:31, n:51, direction:-1 }
  ];

  function stampWing(ctx, wing, x, y, span, flip, bank, alpha) {
    const { sprite, anchorX, anchorY } = wing;
    const h = span * sprite.height / sprite.width;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x,y);
    ctx.rotate(bank);
    ctx.scale(flip,1);
    ctx.drawImage(sprite,-span * anchorX,-h * anchorY,span,h);
    ctx.restore();
  }

  const packs = [], advanceGuard = [];
  for (const [j, pack] of wingsInFormation.entries()) {
    const w = Math.ceil(pack.w * 2.45), h = Math.ceil(pack.h * 2.72);
    const ctx = layer(w,h);
    ctx.imageSmoothingQuality = 'high';
    const x0 = pack.x - w / 2, y0 = pack.y - h / 2;
    for (let i = 0; i < pack.n; i++) {
      const angle = randomAir() * tau;
      const radius = randomAir() ** .60;
      const u = Math.cos(angle) * radius;
      const v = Math.sin(angle) * radius;
      const x = pack.x + u * pack.w + Math.sin(v * 5 + j) * 11;
      const y = pack.y + v * pack.h + u * pack.h * .38 + Math.sin(u * 7 + j * .85) * 7;
      const species = Math.floor(randomAir() * wings.length);
      const span = lerp(3.6,11.4,randomAir() ** 1.55) * (j >= 8 ? .87 : 1);
      const flip = randomAir() > .12 ? pack.direction : -pack.direction;
      const bank = lerp(-.30,.29,randomAir());
      const alpha = lerp(.42,.78,randomAir()) * (1 - radius * .16);
      stampWing(ctx,wings[species][i % 3 === 0 ? 1 : 0],x - x0,y - y0,span,flip,bank,alpha);
      if (i % 13 === 0) {
        advanceGuard.push({ x: x + 14, y: y + 8, species, span: span + lerp(4,13,randomAir()),
          flip, bank, phase: randomAir() * tau, alpha: .61 + randomAir() * .17, pace: 5 + randomAir() * 8 });
      }
    }
    packs.push({ plane:ctx.canvas,x0,y0, phase:randomAir() * tau, speed:3.3 + randomAir() * 3.5 });
  }

  function drawGround(ctx, t) {
    const visible = smooth(5.20,9.22,t);
    if (visible <= 0) return;
    ctx.save();
    for (const [i, plane] of farStrata.entries()) {
      const tAdvance = Math.max(0,t - 7.2);
      ctx.globalAlpha = visible * (i === 2 ? .84 : .96);
      ctx.drawImage(plane, -tAdvance * (.30 + i * .22), originY + tAdvance * (.45 + i * .32) + .32 * Math.sin(t * 1.8 + i));
    }
    ctx.restore();
  }

  function drawAir(ctx, t) {
    const visible = smooth(5.37,9.30,t);
    if (visible <= 0) return;
    const travel = t - 9;
    ctx.save();
    ctx.globalAlpha = visible * .88;
    for (const { plane,x0,y0,phase,speed } of packs) {
      ctx.drawImage(plane, x0 - travel * speed + Math.sin(t * .54 + phase) * 7,
        y0 + travel * 1.08 + Math.sin(t * .73 + phase) * 4);
    }
    ctx.globalAlpha = visible;
    for (const unit of advanceGuard) {
      const flight = t * 1.17 + unit.phase;
      const beat = Math.sin(t * 5.2 + unit.phase);
      const wing = wings[unit.species][beat < -.23 ? 1 : 0];
      stampWing(ctx,wing,unit.x - travel * unit.pace + 6 * Math.sin(flight),
        unit.y + travel * 1.7 + 4 * Math.cos(flight),unit.span,unit.flip,unit.bank + .07 * beat,unit.alpha);
    }
    ctx.restore();
  }

  const counts = Object.freeze({ ...groundCounts, distantAir: wingsInFormation.reduce((sum,pack) => sum + pack.n,0), airGuard:advanceGuard.length });
  return { drawGround, drawAir, counts };
}
