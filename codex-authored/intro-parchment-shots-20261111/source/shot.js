'use strict';

(() => {
  const width = 1920;
  const height = 900;
  const matte = 90;
  const { duration, firstDuration, pullStart, pullEnd } = OPENING_SHOT_TIMING;
  const canvas = document.querySelector('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  const caption = '神界未日…';
  const hero = { x: 480, y: 787, height: 370, anchorX: 0.355, anchorY: 0.94 };
  const clamp = x => Math.max(0, Math.min(1, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, t) => {
    const p = clamp((t - a) / (b - a));
    return p * p * (3 - 2 * p);
  };

  function random(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function layer(w, h, options = { willReadFrequently: true }) {
    const element = document.createElement('canvas');
    element.width = w;
    element.height = h;
    return element.getContext('2d', options);
  }

  function loadImage(name) {
    const image = new Image();
    image.src = 'assets/' + name + '.png';
    return image.decode().then(() => image);
  }

  // Source rectangles isolate the four generated ink silhouettes in the atlas.
  const airDemonPoses = [
    // Each pair contains the raised and lowered wing poses for one species.
    [[16, 10, 508, 514, 284, 228], [12, 551, 499, 440, 262, 141]],
    [[538, 6, 531, 473, 271, 245], [530, 584, 525, 350, 276, 129]],
    [[1093, 43, 413, 448, 230, 192], [1083, 607, 442, 354, 211, 125]]
  ].map(pair => pair.map(([x, y, w, h, ax, ay]) => ({ x, y, w, h, ax, ay })));
  const demonSprites = [[93, 5, 424, 593], [672, 79, 537, 506], [92, 621, 403, 621], [643, 671, 547, 573]];

  // Each fog sheet has a distinct, stationary ink texture. Its translation and
  // amplitude follow the wind independently of the painted landscape.
  function makeFog(seed, tint) {
    const w = 440;
    const h = 162;
    const ctx = layer(w, h);
    const pixels = ctx.createImageData(w, h);
    const rand = random(seed);
    const octaves = [9, 17, 31, 61, 111].map(cols => {
      const rows = Math.ceil(cols / 2);
      return { cols, rows, values: Array.from({ length: (cols + 1) * (rows + 1) }, rand) };
    });
    function sample(grid, u, v) {
      const { cols, rows, values } = grid;
      const x = u * cols;
      const y = v * rows;
      const i = Math.floor(x);
      const j = Math.floor(y);
      const fx = smooth(0, 1, x - i);
      const fy = smooth(0, 1, y - j);
      const k = j * (cols + 1) + i;
      return lerp(lerp(values[k], values[k + 1], fx),
        lerp(values[k + cols + 1], values[k + cols + 2], fx), fy);
    }
    for (let y = 0; y < h; y++) {
      const v = y / h;
      for (let x = 0; x < w; x++) {
        const u = x / w;
        const density = octaves.reduce((sum, grid, i) => sum + sample(grid, u, v) * 0.51 ** i, 0) / 1.98;
        const fold = v - 0.48 - 0.12 * Math.sin(u * 8.4 + seed);
        const envelope = Math.exp(-12 * fold * fold) * Math.sin(Math.PI * u) ** 0.8 * Math.sin(Math.PI * v);
        const alpha = smooth(0.24, 0.77, density) * envelope;
        const offset = (y * w + x) * 4;
        pixels.data.set(tint, offset);
        pixels.data[offset + 3] = Math.round(226 * alpha);
      }
    }
    ctx.putImageData(pixels, 0, 0);
    return ctx.canvas;
  }

  const darkFog = makeFog(198, [44, 23, 24]);
  const warmFog = makeFog(51, [220, 163, 104]);
  const dawnFog = makeFog(158, [246, 206, 145]);
  const veil = makeFog(309, [28, 16, 15]);

  // The valley converges behind the ledge. Compress ground positions toward
  // the horizon, then size each upright sprite independently of the ground.
  const armyHorizon = { x: 1070, y: 542 };
  const armyX = x => lerp(armyHorizon.x, x, 0.83);
  const armyY = y => lerp(armyHorizon.y, y, 0.61);
  const troops = [];
  function addTroop(depth, lane, rng, allowGap) {
    const offset = rng();
    const spread = lerp(1160, 1900, depth);
    const x = lerp(1135, 1195, depth) + (lane - 0.5) * spread + (offset - 0.5) * lerp(43, 102, depth);
    const y = 552 + 280 * depth ** 1.45 + (rng() - 0.5) * lerp(9, 31, depth);
    const size = lerp(10, 84, depth ** 1.63) * lerp(0.72, 1.34, rng());
    const phase = rng() * Math.PI * 2;
    const type = Math.floor(rng() * 4);
    const flip = rng() > 0.5 ? 1 : -1;
    if (allowGap && rng() > 0.48) return;
    troops.push({ x: armyX(x), y: armyY(y), size: size * lerp(0.76, 0.53, depth), phase, type, flip, depth });
  }

  const rankRandom = random(94618);
  const ranks = 17;
  for (let row = 0; row < ranks; row++) {
    const depth = row / (ranks - 1);
    const soldiers = Math.round(lerp(35, 26, depth));
    for (let col = 0; col < soldiers; col++) {
      addTroop(depth, col / (soldiers - 1), rankRandom, (col + row * 2) % 11 === 0);
    }
  }
  const baseTroopCount = troops.length;

  // Stagger the new infantry between the existing ranks to keep the valley
  // footprint and the position of the leading rank stable.
  const reinforcementRandom = random(182017);
  const reinforcementCount = Math.round(baseTroopCount * 0.5);
  const gaps = ranks - 1;
  for (let gap = 0; gap < gaps; gap++) {
    const depth = (gap + 0.5) / gaps;
    const soldiers = Math.round((gap + 1) * reinforcementCount / gaps) -
      Math.round(gap * reinforcementCount / gaps);
    for (let col = 0; col < soldiers; col++) {
      addTroop(depth, (col + 0.5) / soldiers, reinforcementRandom, false);
    }
  }
  troops.sort((a, b) => a.y - b.y);

  const standards = [
    [1493, 598, 47, 2.6], [1085, 630, 63, 0.7], [1750, 657, 74, 4.8],
    [1334, 693, 101, 4.2], [778, 710, 98, 1.9], [1625, 773, 141, 0.3],
    [1067, 816, 154, 3.5], [1890, 844, 153, 1.2]
  ].map(([x, y, size, phase]) => [armyX(x), armyY(y), size * 0.60, phase]);

  function drawBanner(ctx, t, banner, alpha) {
    const [x, y, size, phase] = banner;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x - t * 0.72, y + t * 1.2);
    ctx.rotate(-0.086 + 0.014 * Math.sin(t * 1.8 + phase));
    ctx.scale(size, size);
    ctx.strokeStyle = '#251714';
    ctx.lineWidth = 0.026;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -1.08);
    ctx.stroke();
    ctx.fillStyle = '#241817';
    ctx.beginPath();
    ctx.moveTo(-0.047, -1.02);
    ctx.lineTo(0, -1.17);
    ctx.lineTo(0.045, -1.02);
    ctx.fill();
    const wave = u => Math.sin(t * 3.6 - u * 9 + phase) * 0.047 * u;
    const top = u => -0.98 + u * 0.09 + wave(u);
    for (let i = 0; i < 28; i++) {
      const a = i / 28;
      const b = (i + 1.1) / 28;
      const stripDepth = u => 0.41 - 0.2 * u + 0.042 * Math.sin(u * 21) - (u > 0.8 ? 0.054 : 0);
      const light = 0.5 + 0.5 * Math.sin(t * 3.6 - a * 9 + phase);
      ctx.fillStyle = 'rgb(' + Math.round(53 + 35 * light) + ', ' + Math.round(23 + 14 * light) + ', ' + Math.round(20 + 10 * light) + ')';
      ctx.beginPath();
      ctx.moveTo(-a * 0.66, top(a));
      ctx.lineTo(-b * 0.66, top(b));
      ctx.lineTo(-b * 0.66, top(b) + stripDepth(b));
      ctx.lineTo(-a * 0.66, top(a) + stripDepth(a));
      ctx.fill();
    }
    ctx.strokeStyle = '#a9764b';
    ctx.lineWidth = 0.009;
    ctx.beginPath();
    ctx.moveTo(-0.04, top(0.06) + 0.02);
    for (let i = 2; i <= 26; i++) ctx.lineTo(-i * 0.022, top(i / 30) + 0.02);
    ctx.stroke();
    ctx.restore();
  }


  function makeContactShadow() {
    const ctx = layer(96, 48);
    ctx.translate(48, 24);
    ctx.scale(1, 0.5);
    const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, 46);
    shadow.addColorStop(0, 'rgba(41,19,13,0.58)');
    shadow.addColorStop(0.4, 'rgba(41,19,13,0.35)');
    shadow.addColorStop(1, 'rgba(41,19,13,0)');
    ctx.fillStyle = shadow;
    ctx.fillRect(-48, -48, 96, 96);
    return ctx.canvas;
  }
  const contactShadow = makeContactShadow();


  const heavyArmy = [
    { asset: 'colossus', x: 809, y: 620, size: 125, opacity: 0.51, speed: 3.2, phase: 1.8 },
    { asset: 'siege', x: 1545, y: 627, size: 131, opacity: 0.62, speed: 5.0, phase: 0.5 },
    { asset: 'ember', x: 1103, y: 740, size: 255, opacity: 0.94, speed: 7.0, phase: 0.63 },
    { asset: 'colossus', x: 1400, y: 775, size: 318, opacity: 0.98, speed: 10.1, phase: 0 },
    { asset: 'siege', x: 1745, y: 792, size: 281, opacity: 0.99, speed: 10.8, phase: 2.5 }
  ].map(unit => ({ ...unit, x: armyX(unit.x), y: armyY(unit.y),
    size: unit.size * 0.57, opacity: unit.opacity * 0.84, speed: unit.speed * 0.51 }));

  const emberRandom = random(9741);
  const fireMotes = Array.from({ length: 23 }, () => ({
    spread: emberRandom() - 0.5,
    delay: emberRandom(),
    lift: lerp(0.12, 0.65, emberRandom() ** 1.7),
    bend: lerp(-0.13, 0.17, emberRandom()),
    size: lerp(0.003, 0.011, emberRandom() ** 2)
  }));


  const siegeWheels = [
    { x: 778, y: 1117, rx: 69, ry: 139 },
    { x: 1121, y: 1108, rx: 42, ry: 118 }
  ];

  // The axle and rim belong to the tower. The visible disks roll inside them.
  function drawSiegeWheels(ctx, image, w, h, advance) {
    for (const wheel of siegeWheels) {
      const { x, y, rx, ry } = wheel;
      ctx.save();
      ctx.translate(w * (x / image.width - 0.5), h * (y / image.height - 1));
      ctx.scale(w * rx / image.width, h * ry / image.height);
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.clip();
      ctx.rotate(-advance / (h * ry / image.height));
      ctx.drawImage(image, x - rx, y - ry, 2 * rx, 2 * ry, -1, -1, 2, 2);
      ctx.restore();
    }
  }

  function drawFlame(ctx, x, y, size, t, seed, strength) {
    const pulse = 0.73 + 0.21 * Math.sin(t * 8.3 + seed) + 0.06 * Math.sin(t * 17.1);
    const lean = size * (0.24 + Math.sin(t * 5 + seed) * 0.20);
    const rise = size * pulse;
    const color = ctx.createLinearGradient(x, y, x + lean, y - rise);
    color.addColorStop(0, 'rgba(255,192,74,' + strength * 0.68 + ')');
    color.addColorStop(0.41, 'rgba(231,93,34,' + strength * 0.51 + ')');
    color.addColorStop(1, 'rgba(181,52,17,0)');
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.11, y);
    ctx.bezierCurveTo(x - size * 0.23, y - rise * 0.35, x + lean * 0.25, y - rise * 0.63, x + lean, y - rise);
    ctx.bezierCurveTo(x + lean * 0.68, y - rise * 0.48, x + size * 0.21, y - rise * 0.29, x + size * 0.11, y);
    ctx.fill();
  }

  function drawEmberAura(ctx, t, w, h, strength) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const surge = 0.68 + 0.22 * Math.sin(t * 4.6) + 0.10 * Math.sin(t * 11.7);
    bloom(ctx, -w * 0.07, -h * 0.67, w * 0.41, h * 0.27, '237,73,22', strength * surge * 0.56);
    bloom(ctx, -w * 0.08, -h * 0.72, w * 0.17, h * 0.17, '255,142,39', strength * surge * 0.52);
    drawFlame(ctx, -w * 0.19, -h * 0.81, h * 0.18, t, 1.9, strength);
    drawFlame(ctx, w * 0.20, -h * 0.76, h * 0.14, t, 3.8, strength);
    drawFlame(ctx, -w * 0.06, -h * 0.71, h * 0.09, t, 0.6, strength);
    for (const mote of fireMotes) {
      const life = (t * 0.53 + mote.delay) % 1;
      const alpha = Math.sin(life * Math.PI) ** 1.8 * strength;
      const x = mote.spread * w * 0.46 + h * (mote.bend * life + 0.14 * life ** 2);
      const y = -h * (0.62 + life * mote.lift);
      ctx.strokeStyle = 'rgba(255,169,68,' + alpha * 0.86 + ')';
      ctx.lineWidth = h * mote.size * (1 - life * 0.58);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + h * (0.008 + life * 0.019), y - h * (0.014 + mote.lift * 0.043));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHeavy(ctx, assets, unit, t, reveal) {
    const { asset, x, y, size, opacity, speed, phase } = unit;
    const sheet = assets[asset];
    const { bounds, image } = sheet;
    const [sx, sy, sw, sh] = bounds;
    const w = size * sw / sh;
    const march = Math.max(0, t - pullEnd + 0.46);
    const machine = asset === 'siege';
    const pace = march * (machine ? 5.0 : 4.12) + phase;
    const advance = march * speed;
    const landing = 1 - Math.abs(Math.sin(pace));
    const localReveal = reveal * smooth(pullStart - 0.50, pullEnd + 0.42 + phase * 0.16, t);
    ctx.save();
    ctx.translate(x - advance * (machine ? 1.05 : 0.65), y + advance * 0.67);
    ctx.globalAlpha = localReveal * opacity * 0.87;
    ctx.drawImage(contactShadow, -w * 0.72, -size * 0.07, w * 1.42, size * 0.20);
    ctx.globalAlpha = localReveal * opacity;
    if (asset === 'ember') {
      ctx.drawImage(darkFog, -w * 0.62 + Math.sin(t * 1.18) * w * 0.12,
        -size * 1.40, w * 1.94, size * 0.65);
    }
    const sway = Math.sin(pace * 0.5) * (machine ? 0.004 : 0.013);
    ctx.save();
    ctx.transform(1, 0, -sway, 1 - (machine ? 0.001 : 0.005) * landing, 0, 0);
    ctx.translate(0, machine ? -Math.sin(pace) * size * 0.002 : -(1 - landing) * size * 0.005);
    ctx.drawImage(image, sx, sy, sw, sh, -w * 0.5, -size, w, size);
    if (machine) drawSiegeWheels(ctx, image, w, size, advance);
    if (asset === 'ember') drawEmberAura(ctx, t, w, size, 0.63);
    ctx.restore();
    const trail = machine ? 0.55 : 0.25 + 0.34 * landing;
    ctx.globalAlpha = localReveal * opacity * trail;
    ctx.drawImage(warmFog, -w * 0.56 + Math.sin(pace * 0.45) * w * 0.14,
      -size * 0.15, w * 1.92, size * 0.38);
    ctx.restore();
  }

  function drawArmy(ctx, t, assets) {
    const reveal = smooth(pullStart - 1.02, pullEnd + 0.44, t);
    if (reveal <= 0) return;
    const { sprites, demons: sheet } = assets;
    const clearRanks = smooth(pullStart - 0.14, pullEnd + 0.29, t);
    const armyTime = t - pullStart + 1.6;
    let heavy = 0;
    let banner = 0;
    let veiledRanks = false;
    for (const soldier of troops) {
      const { x, y, size, phase, type, flip, depth } = soldier;
      while (banner < standards.length && standards[banner][1] < y) {
        drawBanner(ctx, armyTime, standards[banner], reveal * lerp(0.48, 0.78, banner / 7));
        banner++;
      }
      if (!veiledRanks && depth > 0.51) {
        ctx.globalAlpha = reveal * 0.48;
        ctx.drawImage(dawnFog, 209 + t * 31, 486 - t * 2, 1860, 220);
        ctx.globalAlpha = 1;
        veiledRanks = true;
      }
      while (heavy < heavyArmy.length && heavyArmy[heavy].y < y) {
        drawHeavy(ctx, assets, heavyArmy[heavy], t, reveal);
        heavy++;
      }
      const pace = armyTime * lerp(4.2, 6.5, depth) + phase;
      const advance = armyTime * lerp(0.18, 4.4, depth ** 1.35);
      const [sx, sy, sw, sh] = sprites[type];
      const w = size * sw / sh;
      ctx.save();
      const throughMist = lerp(1, clearRanks, depth * 0.68);
      ctx.globalAlpha = reveal * throughMist * lerp(0.24, 0.78, depth ** 0.75);
      ctx.translate(x + Math.sin(pace * 0.5) * size * 0.006 - advance * 0.47, y + advance);
      if (size > 23) ctx.drawImage(contactShadow, -w * 0.55, -size * 0.11, w * 1.1, size * 0.26);
      const gait = Math.sin(pace);
      ctx.translate(0, -Math.abs(gait) * size * 0.006);
      ctx.scale(flip * (1 + 0.005 * gait), 1 + 0.005 * Math.cos(pace));
      ctx.rotate(Math.sin(pace * 0.5) * 0.011);
      ctx.drawImage(sheet, sx, sy, sw, sh, -w * 0.5, -size, w, size);
      ctx.restore();
    }
    while (heavy < heavyArmy.length) {
      drawHeavy(ctx, assets, heavyArmy[heavy], t, reveal);
      heavy++;
    }
    while (banner < standards.length) {
      drawBanner(ctx, armyTime, standards[banner], reveal * 0.78);
      banner++;
    }
  }

  function bloom(ctx, x, y, rx, ry, rgb, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    glow.addColorStop(0, 'rgba(' + rgb + ',' + alpha + ')');
    glow.addColorStop(0.4, 'rgba(' + rgb + ',' + (alpha * 0.35) + ')');
    glow.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }



  const wingBackRoots = {
    left: { x: -24, y: -249, angle: 0.42 },
    right: { x: 6, y: -246, angle: 0.29 }
  };

  function positionWing(ctx, side, t, wind) {
    const left = side < 0;
    const root = left ? wingBackRoots.left : wingBackRoots.right;
    ctx.translate(root.x, root.y);
    ctx.scale(left ? 1 : -1, 1);
    ctx.rotate(root.angle + Math.sin(t * 2.04 + side) * 0.075 + wind * 0.15);
  }

  // Paint a few short strands in front of the backplate so their roots
  // are visible while the large ribbons remain behind the silhouette.
  function drawWingAttachment(ctx, side, t, wind) {
    ctx.save();
    positionWing(ctx, side, t, wind);
    ctx.globalCompositeOperation = 'screen';
    const pulse = 0.81 + 0.11 * Math.sin(t * 4.2 + side) + wind * 0.08;
    bloom(ctx, -1, 0, 17, 11, '255,193,104', pulse * 0.43);
    const length = side < 0 ? 64 : 82;
    const shine = ctx.createLinearGradient(0, 0, -length, 0);
    shine.addColorStop(0, 'rgba(255,193,94,0.68)');
    shine.addColorStop(0.30, 'rgba(255,225,160,0.68)');
    shine.addColorStop(0.63, 'rgba(255,229,171,0.28)');
    shine.addColorStop(1, 'rgba(255,224,160,0)');
    ctx.fillStyle = shine;
    for (let i = -1; i <= 1; i++) {
      const len = length * (1 - Math.abs(i) * 0.12);
      const rise = Math.sin(t * 3.7 + side + i) * 3.5;
      const bend = 9 + i * 6.4;
      const thickness = i === 0 ? 5.1 : 2.0;
      ctx.globalAlpha = pulse * (i === 0 ? 0.80 : 0.50);
      ctx.beginPath();
      ctx.moveTo(0.5, i * 1.2);
      ctx.bezierCurveTo(-len * 0.28, bend - thickness, -len * 0.57, -6 + i * 3, -len, i * 7 + rise);
      ctx.bezierCurveTo(-len * 0.55, -4 + i * 3 + thickness, -len * 0.26, bend + thickness, 0.5, i * 1.2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Piecewise shear keeps both sides of every strip on the same curve.
  function drawWing(ctx, image, side, t, wind) {
    const left = side < 0;
    const width = left ? 338 : 354;
    const height = left ? 206 : 214;
    const step = image.width / 48;
    const rootX = image.width * 0.94;
    const xScale = width / image.width;
    const yScale = height / image.height;
    const displacement = x => {
      const u = (x - rootX) / rootX;
      return -u * Math.sin(t * 3.7 + u * 3.3 + side) * (17 + wind * 15);
    };
    ctx.save();
    positionWing(ctx, side, t, wind);
    ctx.globalAlpha = left ? 0.79 : 0.80;
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 48; i++) {
      const x = i * step;
      const y = displacement(x);
      const shear = (displacement(x + step) - y) / step;
      const length = Math.min(step + 0.42, image.width - x);
      ctx.save();
      ctx.transform(xScale, shear, 0, yScale, -rootX * xScale, -height * 0.5 + y - x * shear);
      ctx.drawImage(image, x, 0, length, image.height, x, 0, length, image.height);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawAngel(ctx, assets, t, wind) {
    const { angel, wing } = assets;
    ctx.save();
    ctx.translate(hero.x, hero.y);
    const rocking = 0.012 * Math.sin(t * 1.93) + wind * 0.021;
    ctx.transform(1, 0, -rocking, 1 + 0.007 * Math.sin(t * 2.5), 0, 0);
    bloom(ctx, -9, -248, 224, 131, '255,203,113', 0.15 + wind * 0.09);
    drawWing(ctx, wing, 1, t, wind);
    drawWing(ctx, wing, -1, t, wind);

    const w = hero.height * angel.width / angel.height;
    const x = -w * hero.anchorX;
    const y = -hero.height * hero.anchorY;
    ctx.drawImage(angel, x, y, w, hero.height);
    // Tight glazing darkens the engraved figure without changing its alpha.
    ctx.globalAlpha = 0.39 - 0.10 * smooth(pullStart - 0.09, pullEnd + 0.1, t);
    ctx.drawImage(assets.angelInk, x, y, w, hero.height);
    ctx.globalAlpha = 1;
    drawWingAttachment(ctx, -1, t, wind);
    drawWingAttachment(ctx, 1, t, wind);

    const travel = smooth(0.75, 2.55, t);
    const glint = Math.sin(Math.PI * travel) ** 2;
    // Sample the center of the new sword blade in the source artwork.
    const gx = x + w * lerp(746, 988, travel) / angel.width;
    const gy = y + hero.height * lerp(850, 1180, travel) / angel.height;
    ctx.globalCompositeOperation = 'screen';
    bloom(ctx, gx, gy, 22, 22, '255,225,162', glint * 0.72);
    ctx.strokeStyle = 'rgba(255,235,183,' + glint * 0.78 + ')';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.moveTo(gx - 5.4, gy - 7.5);
    ctx.lineTo(gx + 5.4, gy + 7.5);
    ctx.stroke();
    ctx.restore();
  }


  function softenWingBoundary(image) {
    const { width, height } = image;
    const wing = layer(width, height);
    wing.drawImage(image, 0, 0);
    wing.globalCompositeOperation = 'destination-in';
    const falloff = wing.createLinearGradient(0, 0, 0, height);
    falloff.addColorStop(0, '#000');
    falloff.addColorStop(0.89, '#000');
    falloff.addColorStop(1, 'transparent');
    wing.fillStyle = falloff;
    wing.fillRect(0, 0, width, height);
    return wing.canvas;
  }

  function makeAngelInk(image) {
    const ctx = layer(image.width, image.height);
    ctx.drawImage(image, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#211514';
    ctx.fillRect(0, 0, image.width, image.height);
    return ctx.canvas;
  }

  const dustRandom = random(384);
  const dust = Array.from({ length: 125 }, () => ({
    x: dustRandom() * (width + 200),
    y: dustRandom() * (height + 160),
    size: lerp(0.55, 3.5, dustRandom() ** 2.6),
    phase: dustRandom() * Math.PI * 2,
    speed: lerp(14, 95, dustRandom() ** 2),
    gold: dustRandom() < 0.65
  }));

  function drawDust(ctx, t, wind) {
    for (const speck of dust) {
      const x = (speck.x + t * speck.speed + wind * speck.speed * 0.2) % (width + 130) - 65;
      const y = (speck.y - t * speck.speed * 0.24 + Math.sin(t * 2 + speck.phase) * 13 + height + 60) % (height + 90) - 45;
      const a = 0.09 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.6 + speck.phase));
      ctx.fillStyle = speck.gold ? 'rgba(255,211,140,' + a + ')' : 'rgba(46,20,12,' + a + ')';
      ctx.beginPath();
      ctx.ellipse(x, y, speck.size * (1 + wind * 1.2), speck.size * 0.55, -0.21, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function pageFinish(ctx) {
    ctx.save();
    ctx.translate(width * 0.52, height * 0.48);
    ctx.scale(1, 0.63);
    const shade = ctx.createRadialGradient(0, 0, 271, 0, 0, 1120);
    shade.addColorStop(0, 'rgba(33,15,10,0)');
    shade.addColorStop(0.53, 'rgba(33,15,10,0.09)');
    shade.addColorStop(0.82, 'rgba(29,13,9,0.40)');
    shade.addColorStop(1, 'rgba(17,8,6,0.80)');
    ctx.fillStyle = shade;
    ctx.fillRect(-width, -height, width * 2, height * 2);
    ctx.restore();

    const edge = ctx.createLinearGradient(0, 0, 0, height);
    edge.addColorStop(0, 'rgba(30,14,9,0.60)');
    edge.addColorStop(0.075, 'rgba(44,22,11,0.06)');
    edge.addColorStop(0.5, 'rgba(50,26,15,0)');
    edge.addColorStop(0.88, 'rgba(33,15,11,0.16)');
    edge.addColorStop(1, 'rgba(20,10,8,0.64)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, width, height);
  }

  function drawCaption(ctx, t) {
    ctx.save();
    ctx.globalAlpha = smooth(0.72, 1.31, t) * (1 - smooth(pullEnd + 1.06, pullEnd + 1.66, t));
    ctx.font = '500 49px "Noto Serif TC", "Microsoft JhengHei", MingLiU, serif';
    ctx.letterSpacing = '0.18em';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(22,11,8,0.84)';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.8;
    ctx.shadowColor = 'rgba(19,10,6,0.89)';
    ctx.shadowBlur = 19;
    ctx.strokeText(caption, width * 0.5, 816);
    ctx.fillStyle = '#f7e5be';
    ctx.fillText(caption, width * 0.5, 816);
    ctx.restore();
  }


  function cleanValleyPlate(valley, clean) {
    const { width, height } = valley;
    const plate = layer(width, height);
    const patch = layer(width, height);
    patch.drawImage(clean, 0, 0, width, height);

    // Feather the repaired horizon into the existing paper and leave the
    // lighting, mountains and perspective of the original plate intact.
    patch.globalCompositeOperation = 'destination-in';
    const side = patch.createLinearGradient(0, 0, width, 0);
    side.addColorStop(0.385, 'transparent');
    side.addColorStop(0.435, '#000');
    side.addColorStop(0.665, '#000');
    side.addColorStop(0.698, 'transparent');
    patch.fillStyle = side;
    patch.fillRect(0, 0, width, height);
    const vertical = patch.createLinearGradient(0, 0, 0, height);
    vertical.addColorStop(0.467, 'transparent');
    vertical.addColorStop(0.497, '#000');
    vertical.addColorStop(0.616, '#000');
    vertical.addColorStop(0.661, 'transparent');
    patch.fillStyle = vertical;
    patch.fillRect(0, 0, width, height);

    plate.drawImage(valley, 0, 0);
    plate.drawImage(patch.canvas, 0, 0);
    return plate.canvas;
  }



  const templeRoofPatches = [
    { x: 0.571, y: 0.248, rx: 0.0765, ry: 0.1755, align: -0.008 },
    { x: 0.809, y: 0.477, rx: 0.0705, ry: 0.2205, align: -0.006 }
  ];

  // The main pediment is superseded by the chosen spire. The remaining
  // five marks localize the quieter stone and rubble to the existing city.
  const templeDetailPatches = [
    { x: 0.218, y: 0.680, rx: 0.047, ry: 0.058, align: 0.008 },
    { x: 0.405, y: 0.863, rx: 0.052, ry: 0.071, align: 0.006 },
    { x: 0.665, y: 0.554, rx: 0.026, ry: 0.086, align: -0.002 },
    { x: 0.660, y: 0.879, rx: 0.054, ry: 0.051, align: -0.004 },
    { x: 0.817, y: 0.904, rx: 0.052, ry: 0.043, align: -0.005 }
  ];

  function blendTemplePatches(original, edited, patches) {
    const { width, height } = original;
    const plate = layer(width, height);
    const cut = layer(width, height);
    const mask = layer(width, height);
    plate.drawImage(original, 0, 0);

    for (const patch of patches) {
      mask.clearRect(0, 0, width, height);
      mask.save();
      mask.translate(patch.x * width, patch.y * height);
      mask.scale(patch.rx * width, patch.ry * height);
      const feather = mask.createRadialGradient(0, 0, 0.82, 0, 0, 1);
      feather.addColorStop(0, '#000');
      feather.addColorStop(1, 'transparent');
      mask.fillStyle = feather;
      mask.fillRect(-1, -1, 2, 2);
      mask.restore();

      cut.globalCompositeOperation = 'source-over';
      cut.clearRect(0, 0, width, height);
      cut.drawImage(edited, Math.round(patch.align * width), 0, width, height);
      cut.globalCompositeOperation = 'destination-in';
      cut.drawImage(mask.canvas, 0, 0);

      plate.globalCompositeOperation = 'destination-out';
      plate.drawImage(mask.canvas, 0, 0);
      plate.globalCompositeOperation = 'lighter';
      plate.drawImage(cut.canvas, 0, 0);
    }
    return plate.canvas;
  }

  function templeFoundation(image) {
    const { width, height } = image;
    const ctx = layer(width, height);
    ctx.drawImage(image, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    const mist = ctx.createLinearGradient(0, 0, 0, height);
    mist.addColorStop(0.77, '#000');
    mist.addColorStop(0.86, 'rgba(0,0,0,0.72)');
    mist.addColorStop(0.938, 'transparent');
    ctx.fillStyle = mist;
    ctx.fillRect(0, 0, width, height);
    return ctx.canvas;
  }


  function traceTempleShape(ctx, points, w, h, originX = 0) {
    ctx.beginPath();
    points.forEach(([x, y], index) => {
      const px = (x - originX) * w;
      const py = y * h;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
  }

  function openTempleCenter(image) {
    const { width, height } = image;
    const ctx = layer(width, height);
    ctx.drawImage(image, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.filter = 'blur(3px)';
    traceTempleShape(ctx, [
      [0.495, -0.02], [0.652, -0.02], [0.650, 0.35], [0.647, 0.47],
      [0.642, 0.63], [0.639, 0.93], [0.502, 0.93], [0.499, 0.65],
      [0.501, 0.47], [0.496, 0.35]
    ], width, height);
    ctx.fill();
    return ctx.canvas;
  }

  function templeSpirePlate(image) {
    const { width, height } = image;
    const left = 0.495;
    const ctx = layer(Math.ceil(width * 0.185), Math.ceil(height * 0.97));
    ctx.save();
    traceTempleShape(ctx, [
      [0.548, 0], [0.612, 0], [0.614, 0.18], [0.621, 0.235],
      [0.623, 0.315], [0.635, 0.398], [0.645, 0.490], [0.652, 0.69],
      [0.658, 0.84], [0.680, 0.96], [0.495, 0.96], [0.509, 0.89],
      [0.514, 0.80], [0.518, 0.68], [0.523, 0.54], [0.532, 0.43],
      [0.543, 0.33], [0.549, 0.25], [0.551, 0.14]
    ], width, height, left);
    ctx.clip();
    ctx.drawImage(image, -left * width, 0);
    ctx.restore();
    ctx.globalCompositeOperation = 'destination-in';
    const mist = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    mist.addColorStop(0.87, '#000');
    mist.addColorStop(0.98, 'transparent');
    ctx.fillStyle = mist;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    return ctx.canvas;
  }

  const templeSpirePlacement = { x: 1057, y: 251, width: 176, height: 347 };

  const templePlacement = { x: 594, y: 310, width: 955, height: 292 };

  // Emitter coordinates are relative to the drawn architecture, so smoke
  // stays attached during the push and pull and the lights track their roofs.
  const templeFires = [
    { x: 0.084, y: 0.76, size: 11, phase: 0.40, smoke: 0.61 },
    { x: 0.201, y: 0.52, size: 19, phase: 1.50, smoke: 0.82 },
    { x: 0.336, y: 0.62, size: 14, phase: 0.58, smoke: 0.67 },
    { x: 0.591, y: 0.176, size: 23, phase: 2.70, smoke: 1.06 },
    { x: 0.666, y: 0.570, size: 24, phase: 0.15, smoke: 0.85 },
    { x: 0.841, y: 0.477, size: 22, phase: 3.12, smoke: 0.91 },
    { x: 0.949, y: 0.754, size: 12, phase: 2.00, smoke: 0.55 }
  ];

  const templeSmoke = makeFog(690, [52, 28, 23]);
  const templeSparks = (() => {
    const rng = random(43778);
    return Array.from({ length: 14 }, () => ({
      phase: rng(), height: lerp(1.35, 3.5, rng()), x: rng() - 0.5,
      bright: lerp(0.34, 0.91, rng())
    }));
  })();

  function templePoint(site) {
    const { x, y, width, height } = templePlacement;
    return [x + width * site.x, y + height * site.y];
  }

  function drawTempleSmoke(ctx, t, site, wind, opacity = 1) {
    const [x, y] = templePoint(site);
    const gust = 0.82 + wind * 0.68;
    const { size, phase, smoke } = site;
    ctx.save();
    ctx.globalAlpha = 0.48 * smoke * opacity;
    ctx.drawImage(templeSmoke, x - size * 0.64, y - size * 1.64, size * 1.94, size * 1.82);
    for (let i = 5; i >= 0; i--) {
      const age = (t * 0.38 + i / 6 + phase) % 1;
      const rise = age * size * 5.7 * smoke;
      const drift = size * (age * 1.08 + age * age * 4.9) * gust;
      const w = size * (2.1 + age * 5.1) * smoke;
      const h = size * (1.6 + age * 2.55) * smoke;
      ctx.globalAlpha = Math.sin(Math.PI * age) ** 1.2 * (0.76 - 0.21 * age) * smoke * opacity;
      ctx.drawImage(i % 2 ? templeSmoke : darkFog,
        x + drift - w * 0.50, y - rise - h * 0.52, w, h);
    }
    ctx.restore();
  }


  function drawTempleFlame(ctx, x, y, size, t, phase, pulse) {
    const height = size * (0.76 + 0.18 * Math.sin(t * 7.7 + phase) + 0.11 * Math.sin(t * 12.4 + phase));
    const lean = size * (0.22 + 0.16 * Math.sin(t * 5.3 + phase));
    const gradient = ctx.createLinearGradient(x, y, x + lean, y - height);
    gradient.addColorStop(0, 'rgba(192,59,19,' + pulse * 0.88 + ')');
    gradient.addColorStop(0.21, 'rgba(255,174,47,' + pulse * 0.96 + ')');
    gradient.addColorStop(0.55, 'rgba(238,91,27,' + pulse * 0.76 + ')');
    gradient.addColorStop(1, 'rgba(194,52,18,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.13, y);
    ctx.bezierCurveTo(x - size * 0.28, y - height * 0.25, x + lean * 0.23, y - height * 0.61, x + lean, y - height);
    ctx.bezierCurveTo(x + lean * 0.56, y - height * 0.56, x + size * 0.25, y - height * 0.25, x + size * 0.12, y);
    ctx.fill();
  }

  function drawTempleFire(ctx, t, site, opacity = 1) {
    const [x, y] = templePoint(site);
    const { size, phase } = site;
    const pulse = 0.72 + Math.sin(t * 5.7 + phase) * 0.13 + Math.sin(t * 11.6 + phase) * 0.15;
    ctx.save();
    ctx.globalAlpha *= opacity;
    ctx.globalCompositeOperation = 'screen';
    bloom(ctx, x, y, size * 2.25, size * 1.86, '210,67,18', pulse * 0.40);
    bloom(ctx, x, y - size * 0.17, size * 0.77, size * 0.86, '255,130,39', pulse * 0.54);
    ctx.globalCompositeOperation = 'source-over';
    for (let i = -2; i <= 2; i++) {
      const footX = x + i * size * 0.22;
      const footY = y + Math.abs(i) * size * 0.068;
      const flameHeight = size * (1.48 - Math.abs(i) * 0.2);
      drawTempleFlame(ctx, footX, footY, flameHeight, t, phase + i * 1.6, pulse);
    }
    ctx.globalCompositeOperation = 'screen';
    drawFlame(ctx, x, y, size * 0.78, t, phase + 3, pulse * 0.87);
    for (const spark of templeSparks) {
      const age = (t * 0.57 + phase * 0.37 + spark.phase) % 1;
      const a = Math.sin(Math.PI * age) ** 1.4 * spark.bright;
      const sx = x + size * (spark.x + age * 0.65 + age * age * 2.0);
      const sy = y - size * (0.18 + spark.height * age);
      ctx.fillStyle = 'rgba(255,156,60,' + a + ')';
      ctx.fillRect(sx, sy, 0.7 + spark.bright * 0.92, 0.6 + spark.bright * 0.70);
    }
    ctx.restore();
  }


  function drawTempleSanctum(ctx, t) {
    const [x, y] = templePoint({ x: 0.569, y: 0.459 });
    const glimmer = 0.81 + 0.12 * Math.sin(t * 2.9) + 0.07 * Math.sin(t * 8.4 + 0.7);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    bloom(ctx, x, y, 24, 20, '93,153,228', glimmer * 0.29);
    bloom(ctx, x, y, 10, 9, '199,231,255', glimmer * 0.36);
    const [sideX, sideY] = templePoint({ x: 0.799, y: 0.451 });
    bloom(ctx, sideX, sideY, 15, 16, '133,186,237', glimmer * 0.13);
    ctx.restore();
  }

  function drawTempleRuins(ctx, image, spire, t, wind) {
    const { x, y, width, height } = templePlacement;
    ctx.save();
    ctx.globalAlpha = 0.76;
    ctx.drawImage(image, x, y, width, height);
    const tower = templeSpirePlacement;
    ctx.drawImage(spire, tower.x, tower.y, tower.width, tower.height);
    ctx.restore();
    drawTempleSanctum(ctx, t);
    for (const site of templeFires) drawTempleSmoke(ctx, t, site, wind);
    for (const site of templeFires) drawTempleFire(ctx, t, site);
  }

  function withCamera(ctx, camera, depth, draw) {
    ctx.save();
    ctx.translate(width * 0.5, height * 0.5);
    const z = lerp(1, camera.zoom, depth);
    ctx.scale(z, z);
    ctx.translate(-lerp(width * 0.5, camera.x, depth), -lerp(height * 0.5, camera.y, depth));
    draw();
    ctx.restore();
  }


  function drawBattlefield(ctx, assets, t, wind, camera) {
    withCamera(ctx, camera, 0.52, () => {
      ctx.drawImage(assets.valley, -35, -107, 1990, 1120);
      ctx.globalAlpha = 0.37;
      ctx.drawImage(veil, 605 - t * 14, -170 + t * 4, 1740, 550);
      ctx.globalAlpha = 1;
      assets.airArmy.drawLayer(ctx, t, false);
      drawTempleRuins(ctx, assets.temples, assets.templeSpire, t, wind);
      ctx.globalAlpha = 0.62;
      ctx.drawImage(dawnFog, -160 + t * 17, 425, 2030, 245);
    });
    withCamera(ctx, camera, 0.68, () => assets.airArmy.drawLayer(ctx, t, true));
    withCamera(ctx, camera, 0.78, () => {
      ctx.globalAlpha = 0.65;
      ctx.drawImage(darkFog, 326 - t * 18, 438, 1760, 310);
      ctx.globalAlpha = 1;
      drawArmy(ctx, t, assets);
      ctx.globalAlpha = smooth(pullStart, pullEnd, t) * 0.55;
      ctx.drawImage(dawnFog, 405 + t * 30, 482 - t * 1.9, 1580, 254);
      ctx.globalAlpha = 0.42 + 0.15 * wind;
      ctx.drawImage(warmFog, -60 + t * 44, 522 + 5 * Math.sin(t), 1620, 342);
      ctx.globalAlpha = 0.47;
      ctx.drawImage(darkFog, 830 - t * 63, 639 - t * 6, 1650, 310);
    });
  }

  function drawFocusMist(ctx, t, strength, focalX) {
    ctx.save();
    ctx.translate(focalX, height * 0.43);
    ctx.scale(1, 1.36);
    const falloff = ctx.createRadialGradient(0, 0, 213, 0, 0, 1060);
    falloff.addColorStop(0, 'rgba(25,13,12,0)');
    falloff.addColorStop(0.37, 'rgba(28,15,12,0.13)');
    falloff.addColorStop(0.68, 'rgba(25,13,11,0.44)');
    falloff.addColorStop(1, 'rgba(15,8,8,0.74)');
    ctx.globalAlpha = strength;
    ctx.fillStyle = falloff;
    ctx.fillRect(-width, -height, width * 2, height * 2);
    ctx.restore();

    const wind = t * 29;
    ctx.save();
    ctx.globalAlpha = strength * 0.95;
    ctx.drawImage(veil, focalX - 1440 + wind, 32 + t * 9, 1160, 682);
    ctx.drawImage(veil, focalX + 234 - wind, 100 - t * 13, 1220, 725);
    ctx.globalAlpha = strength * 0.67;
    ctx.drawImage(darkFog, focalX - 1215 - t * 13, 420 - t * 22, 1180, 520);
    ctx.drawImage(darkFog, focalX + 125 + t * 19, 414 + 14 * Math.sin(t * 1.3), 1250, 448);
    ctx.restore();
  }

  function drawDefocusedBattlefield(ctx, backdrop, assets, t, wind, camera, strength) {
    if (strength <= 0) {
      drawBattlefield(ctx, assets, t, wind, camera);
      return;
    }

    drawBattlefield(backdrop, assets, t, wind, camera);
    ctx.drawImage(backdrop.canvas, 0, 0);
    ctx.save();
    ctx.globalAlpha = strength * 0.93;
    ctx.filter = 'blur(' + (1.5 + 6 * strength).toFixed(2) + 'px)';
    ctx.drawImage(backdrop.canvas, 0, 0);
    ctx.restore();

    const focalX = width * 0.5 + (hero.x - camera.x) * camera.zoom;
    drawFocusMist(ctx, t, strength, focalX);
  }


  function drawRecedingBattlefield(ctx, backdrop, assets, t, wind, camera, progress) {
    drawBattlefield(backdrop, assets, t, wind, camera);
    const zoom = 1 - 0.14 * progress;
    const w = width * zoom;
    const h = height * zoom;
    ctx.save();
    ctx.filter = 'blur(' + (19 * progress).toFixed(2) + 'px)';
    ctx.drawImage(backdrop.canvas, -30 * progress, -25 * progress, width + 60 * progress, height + 50 * progress);
    ctx.globalAlpha = 0.88;
    ctx.drawImage(backdrop.canvas, (width - w) * 0.5, (height - h) * 0.5, w, h);
    ctx.restore();
  }

  function makeScene(assets) {
    const backdrop = layer(width, height, { alpha: false });
    backdrop.imageSmoothingQuality = 'high';
    return function render(seconds, transition = 0) {
      const t = Math.max(0, Math.min(firstDuration, seconds));
      const fastPull = smooth(pullStart, pullEnd, t);
      const open = smooth(0, pullStart, t);
      const settle = smooth(pullEnd, firstDuration, t);
      const wind = Math.sin(fastPull * Math.PI) ** 1.6;
      const camera = {
        zoom: lerp(2.38 + 0.78 * open, 1.045 - 0.045 * settle, fastPull),
        x: lerp(505 - 18 * open, 930 + 30 * settle, fastPull),
        y: lerp(614 - 45 * open, 453 - 3 * settle, fastPull)
      };

      const ctx = context;
      ctx.fillStyle = '#0b0807';
      ctx.fillRect(0, 0, width, height + 2 * matte);
      ctx.save();
      ctx.translate(0, matte);
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.clip();
      ctx.imageSmoothingQuality = 'high';

      const focus = 1 - smooth(pullStart - 0.34, pullEnd + 0.39, t);
      if (transition > 0) drawRecedingBattlefield(ctx, backdrop, assets, t, wind, camera, transition);
      else drawDefocusedBattlefield(ctx, backdrop, assets, t, wind, camera, focus);
      withCamera(ctx, camera, 1, () => {
        ctx.drawImage(assets.ledge, -350, 578, 1525, 407);
        ctx.drawImage(contactShadow, hero.x - 74, hero.y - 14, 51, 19);
        ctx.drawImage(contactShadow, hero.x + 13, hero.y - 11, 75, 24);
        drawAngel(ctx, assets, t, wind);
      });
      withCamera(ctx, camera, 0.93, () => {
        ctx.globalAlpha = 0.38 + 0.23 * wind;
        ctx.drawImage(veil, -710 + t * 78, 589 - 16 * Math.sin(t), 2060, 390);
        ctx.globalAlpha = 0.38;
        ctx.drawImage(warmFog, -540 + t * 47, 609, 1570, 368);
      });
      ctx.fillStyle = 'rgba(51,23,15,0.15)';
      ctx.fillRect(0, 0, width, height);
      drawDust(ctx, t, wind);
      pageFinish(ctx);
      drawCaption(ctx, t);

      const ink = 1 - smooth(0, 0.55, t);
      if (ink > 0) {
        ctx.globalAlpha = ink * 0.83;
        ctx.drawImage(veil, -290 + 240 * t, -340, 2510, 1570);
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(18,10,8,' + 0.94 * ink + ')';
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();
    };
  }

  const names = ['valley', 'valley-clean', 'temples', 'temple-roofs', 'temple-details', 'temple-spire', 'angel', 'wing', 'demons', 'air-demon-atlas', 'ledge', 'colossus', 'ember', 'siege', 'heaven-sky', 'cloud-abyss', 'archangel-fall-regalia', 'archangel-hood-edit', 'archangel-right-hand', 'angels-fall-faces', 'collapse-smoke'];
  window.openingShot = {
    duration,
    infantry: Object.freeze({ previous: baseTroopCount, current: troops.length }),
    ready: Promise.all(names.map(loadImage)).then(images => {
      const assets = Object.fromEntries(names.map((name, index) => [name, images[index]]));
      assets.valley = cleanValleyPlate(assets.valley, assets['valley-clean']);
      const roofs = blendTemplePatches(assets.temples, assets['temple-roofs'], templeRoofPatches);
      const cleaned = blendTemplePatches(roofs, assets['temple-details'], templeDetailPatches);
      assets.temples = templeFoundation(openTempleCenter(cleaned));
      assets.templeSpire = templeSpirePlate(assets['temple-spire']);
      assets.sprites = demonSprites;
      assets.airArmy = makeAirArmy(troops.length, assets['air-demon-atlas'], airDemonPoses, {
        random, smooth, lerp, pullStart, pullEnd
      });
      window.openingShot.airborne = assets.airArmy.count;
      for (const name of ['colossus', 'ember', 'siege']) {
        const image = assets[name];
        assets[name] = { image, bounds: [0, 0, image.width, image.height] };
      }
      assets.angelInk = makeAngelInk(assets.angel);
      assets.wing = softenWingBoundary(assets.wing);
      const render = makeOpeningSequence(makeScene(assets), assets, {
        context, width, height, matte, layer, random, lerp, smooth, bloom, pageFinish,
        dawnFog, templePlacement, templeSpirePlacement,
        templeFires, drawTempleSmoke, drawTempleFire
      });
      render(1.35);
      window.openingShot.render = render;
      window.openingShot.sprites = assets.sprites;
    })
  };
})();
