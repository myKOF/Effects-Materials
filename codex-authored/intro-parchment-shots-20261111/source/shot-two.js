'use strict';

function makeOpeningSequence(first, assets, helpers) {
  const {
    context, width, height, matte, layer, random, lerp, smooth, bloom, pageFinish,
    dawnFog, templePlacement, templeSpirePlacement, templeFires, drawTempleSmoke, drawTempleFire
  } = helpers;
  const { duration, firstDuration, secondStart, secondDuration, transitionDuration, fallTime, whiteLightAt } = OPENING_SHOT_TIMING;
  const incoming = layer(width, height + matte * 2, { alpha: false });
  const sky = assets['heaven-sky'];
  const abyss = assets['cloud-abyss'];
  const commander = assets['archangel-fall-ivory'];
  const commanderWing = assets.wing;
  const troops = assets['angels-fall-faces'];
  const smoke = assets['collapse-smoke'];
  const lightCloud = makeLightCloud(smoke);
  const ashPuff = makeAshPuff(smoke, false);
  const ashPuffFlipped = makeAshPuff(smoke, true);

  const landing = { x: width * 0.59, y: height * 0.57 };
  const commanderPose = { centerX: 0.582, centerY: 0.599, backX: 0.567, backY: 0.630 };
  const crown = splitSpire(0.38, true);
  const pedestal = splitSpire(0.38, false);
  const distantFires = [templeFires[1], templeFires[3], templeFires[5]];

  function makeLightCloud(image) {
    const ctx = layer(image.width, image.height);
    ctx.drawImage(image, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(224,201,160,0.46)';
    ctx.fillRect(0, 0, image.width, image.height);
    return ctx.canvas;
  }

  function makeAshPuff(image, flip) {
    const ctx = layer(238, 128, { alpha: true });
    if (flip) {
      ctx.translate(238, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(image, 0, 0, 238, 128);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(47,35,35,0.72)';
    ctx.fillRect(0, 0, 238, 128);
    return ctx.canvas;
  }

  function splitSpire(at, top) {
    const image = assets.templeSpire;
    const part = layer(image.width, image.height);
    const y = at * image.height;
    part.beginPath();
    part.moveTo(0, top ? 0 : image.height);
    part.lineTo(0, y - 4);
    part.lineTo(image.width * 0.44, y + 3);
    part.lineTo(image.width * 0.62, y - 5);
    part.lineTo(image.width, y + 3);
    part.lineTo(image.width, top ? 0 : image.height);
    part.closePath();
    part.clip();
    part.drawImage(image, 0, 0);
    return part.canvas;
  }

  // Source positions, stagger and endpoints in the abyss composition.
  const meteorFlight = [
    [-170,  85, 0.58, 2.39, 191, 1, 0.96,  942, 617],
    [ 215, 360, 0.88, 2.22, 128, 0, 0.80,  804, 598],
    [ 404, -77, 1.10, 2.48, 117, 2, 0.83,  927, 497],
    [1475,  28, 0.76, 2.37, 153, 3, 0.94, 1316, 573],
    [1710, 246, 1.02, 2.29, 108, 0, 0.76, 1368, 664],
    [1140,-128, 1.46, 2.41,  95, 1, 0.69, 1166, 484],
    [ 458, 247, 1.35, 2.17,  70, 2, 0.62,  948, 567],
    [1582, 426, 1.67, 2.21,  77, 3, 0.64, 1287, 713],
    [ 736,-154, 1.87, 2.38, 118, 3, 0.79, 1050, 500],
    [  58, 350, 1.53, 2.46, 170, 2, 0.91,  804, 669],
    [1217,  38, 2.34, 2.25,  94, 1, 0.70, 1218, 555],
    [ 631, 109, 2.08, 2.30, 103, 0, 0.74, 1003, 585],
    [1906, 129, 1.66, 2.54, 143, 1, 0.84, 1441, 697],
    [ 317,  18, 2.45, 2.45,  84, 3, 0.65,  869, 573],
    [1371,-121, 2.61, 2.31,  90, 2, 0.69, 1294, 505],
    [1855, 443, 2.30, 2.49, 147, 0, 0.91, 1342, 749],
    [ 108, 114, 2.48, 2.54, 100, 2, 0.71,  925, 716]
  ].map(([x, y, start, travel, size, pose, depth, endX, endY], i) => ({
    x, y, start, travel, size, pose, depth, endX, endY, phase: i * 0.329
  }));
  const commanderFlight = { x: 818, y: 207, start: 2.13, travel: 2.38, endX: 1102, endY: 654 };
  const fallRate = 0.5;
  const crowdDistance = 1.35;

  // Source rectangles and backplate anchors for the four separate drawings.
  const poseBoxes = [
    [41, 76, 534, 421, 0.633, 0.720],
    [645, 65, 538, 428, 0.621, 0.722],
    [38, 698, 540, 396, 0.656, 0.742],
    [633, 707, 555, 369, 0.634, 0.761]
  ];

  const streamRandom = random(90189);
  const sparks = Array.from({ length: 24 }, () => ({
    offset: streamRandom(),
    length: lerp(0.48, 1.72, streamRandom()),
    spread: streamRandom() - 0.5,
    size: lerp(0.004, 0.018, streamRandom() ** 2),
    brightness: lerp(0.41, 1, streamRandom())
  }));
  const airMotes = Array.from({ length: 42 }, () => ({
    x: streamRandom() * (width + 500),
    y: streamRandom() * (height + 400),
    width: lerp(0.4, 1.6, streamRandom()),
    length: lerp(4, 32, streamRandom() ** 1.6),
    speed: lerp(77, 370, streamRandom() ** 1.3),
    opacity: lerp(0.1, 0.68, streamRandom())
  }));

  function cloud(ctx, image, x, y, w, h, alpha, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, -0.18 * w, -0.69 * h, w, h);
    ctx.restore();
  }

  function drawDistantTemples(ctx, t, opacity) {
    t -= 1.82;
    const old = templePlacement;
    const spire = templeSpirePlacement;
    const age = Math.max(0, t - 0.48);
    const x = spire.x + spire.width * 0.51;
    const y = spire.y + spire.height * 0.38;
    ctx.save();
    ctx.translate(158 - t * 28, 104 - t * 38);
    ctx.scale(0.48, 0.48);
    ctx.translate(-old.x, -spire.y);
    ctx.filter = 'blur(1.55px)';
    ctx.globalAlpha = opacity * 0.52;
    ctx.drawImage(assets.temples, old.x, old.y, old.width, old.height);
    ctx.drawImage(pedestal, spire.x, spire.y, spire.width, spire.height);
    ctx.save();
    ctx.translate(x + age * 13, y + age * age * 36);
    ctx.rotate(age * 0.62);
    ctx.drawImage(crown, spire.x - x, spire.y - y, spire.width, spire.height);
    ctx.restore();
    ctx.filter = 'none';
    for (const site of distantFires) {
      drawTempleSmoke(ctx, t + 9, site, 0.18, opacity);
      drawTempleFire(ctx, t + 9, site, opacity);
    }
    ctx.globalAlpha = 0.87 * opacity;
    ctx.drawImage(dawnFog, old.x - 151 + t * 35, old.y + 164, 1290, 305);
    ctx.restore();
    cloud(ctx, lightCloud, 99 - t * 30, 328 - t * 28, 920, 262, 0.66 * opacity, 0.02);
  }

  function drawAtmosphere(ctx, t, pull, group) {
    const depth = smooth(3.9, 6.95, t);
    const close = 1 - smooth(0.92, 3.65, t);
    const cover = Math.max(width / sky.width, height / sky.height) * lerp(1.23, 1.48, close);
    const skyW = sky.width * cover;
    const skyH = sky.height * cover;
    const drift = Math.min(t, 5);
    ctx.save();
    ctx.filter = 'blur(' + (close * 11.8).toFixed(2) + 'px)';
    ctx.drawImage(sky, (width - skyW) * 0.5 - drift * 7,
      (height - skyH) * 0.5 - drift * 13, skyW, skyH);
    ctx.restore();
    if (group > 0 && depth < 1) drawDistantTemples(ctx, t, group * (1 - depth));
    if (depth > 0) {
      ctx.save();
      ctx.globalAlpha = depth;
      const zoom = lerp(1.53, 1, pull);
      ctx.drawImage(abyss, landing.x * (1 - zoom), landing.y * (1 - zoom), width * zoom, height * zoom);
      ctx.restore();
      cloud(ctx, smoke, 1570 - pull * 210, 805 - pull * 157, 911, 471, 0.27 * depth, -0.38);
      cloud(ctx, lightCloud, -127 + pull * 91, 998 - pull * 140, 918, 478, 0.26 * depth, -0.16);
    }
    ctx.fillStyle = 'rgba(36,23,23,' + lerp(0.13, 0.10, depth) + ')';
    ctx.fillRect(0, 0, width, height);
  }

  function drawAir(ctx, t, strength, speed, foreground = false) {
    ctx.save();
    ctx.strokeStyle = '#fff0cb';
    ctx.lineCap = 'round';
    for (const [i, m] of airMotes.entries()) {
      if ((i % 4 === 0) !== foreground) continue;
      const travel = m.speed * (t + 1.29 * (1 - Math.exp(-t / 1.55)));
      const x = (m.x - travel * 0.63 + (width + 500) * 6) % (width + 500) - 240;
      const y = (m.y - travel + (height + 400) * 8) % (height + 400) - 170;
      ctx.globalAlpha = strength * m.opacity * 0.53;
      ctx.lineWidth = m.width;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - m.length * speed * 0.62, y - m.length * speed);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMeteorLight(ctx, x, y, size, heading, t, phase, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);
    ctx.globalCompositeOperation = 'screen';
    bloom(ctx, size * 0.12, 0, size * 0.55, size * 0.22, '229,124,50', alpha * 0.19);
    const tail = ctx.createLinearGradient(0, 0, -size * 1.9, 0);
    tail.addColorStop(0, 'rgba(255,217,153,0.37)');
    tail.addColorStop(0.44, 'rgba(228,141,65,0.16)');
    tail.addColorStop(1, 'rgba(221,130,52,0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = tail;
    ctx.beginPath();
    ctx.moveTo(size * 0.17, 0);
    ctx.quadraticCurveTo(-size * 0.16, -size * 0.11, -size * 1.9, 0);
    ctx.quadraticCurveTo(-size * 0.15, size * 0.11, size * 0.17, 0);
    ctx.fill();

    for (const spark of sparks) {
      const age = (t * (0.9 + spark.brightness * 0.3) + spark.offset + phase) % 1;
      const tailX = -size * (0.10 + age * spark.length);
      const tailY = size * spark.spread * (0.16 + age * 0.79) + Math.sin(age * 6 + phase) * size * 0.047;
      const flare = Math.sin(age * Math.PI) ** 1.12;
      ctx.globalAlpha = alpha * flare * spark.brightness;
      ctx.strokeStyle = spark.brightness > 0.75 ? '#fff4cf' : '#f7b372';
      ctx.lineWidth = Math.max(0.65, size * spark.size);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(tailX - size * (0.019 + spark.size * 4.1) * (1 - 0.44 * age), tailY + tailY * 0.11);
      ctx.stroke();
      if (spark.brightness > 0.73) {
        const glint = Math.max(0.75, size * spark.size * 0.47);
        ctx.fillStyle = '#ffe1a5';
        ctx.beginPath();
        ctx.ellipse(tailX + size * 0.025, tailY, glint * 1.48, glint * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawLightWings(ctx, x, y, size, heading, t, phase, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);
    ctx.globalCompositeOperation = 'screen';
    bloom(ctx, 0, 0, size * 0.19, size * 0.15, '255,210,132', alpha * 0.37);

    for (const side of [-1, 1]) {
      for (let n = 0; n < 4; n++) {
        const spread = size * (0.22 + n * 0.14);
        const len = size * (1.06 + n * 0.165) * (side < 0 ? 0.91 : 1.04);
        const ripple = Math.sin(t * 8.5 + n * 1.57 + phase + side) * size * 0.097;
        const swell = Math.sin(t * 4.5 + n * 0.76 + phase + side) * size * 0.084;
        const start = side * size * (0.052 + n * 0.012);
        const tip = side * (spread * 0.76 + ripple * 0.95);
        const w = size * (0.031 - n * 0.0048);
        const shine = ctx.createLinearGradient(0, 0, -len, 0);
        shine.addColorStop(0, 'rgba(255,227,161,0.92)');
        shine.addColorStop(0.22, 'rgba(255,244,205,0.86)');
        shine.addColorStop(0.65, 'rgba(255,222,164,0.51)');
        shine.addColorStop(1, 'rgba(255,215,155,0)');
        ctx.fillStyle = shine;
        ctx.globalAlpha = alpha * (0.98 - n * 0.10);
        ctx.beginPath();
        ctx.moveTo(size * 0.055, start);
        ctx.bezierCurveTo(-len * 0.17, start + side * (spread + swell),
          -len * 0.56, side * spread + ripple - w, -len, tip);
        ctx.bezierCurveTo(-len * 0.54, side * spread + ripple + side * w * 2.3,
          -len * 0.16, start + side * (spread * 1.12 + swell + w), size * 0.055, start);
        ctx.fill();
        ctx.globalAlpha *= 0.64;
        ctx.strokeStyle = shine;
        ctx.lineWidth = Math.max(0.7, size * 0.009);
        ctx.beginPath();
        ctx.moveTo(size * 0.03, start);
        ctx.bezierCurveTo(-len * 0.19, start + side * (spread * 0.95 + swell),
          -len * 0.54, side * spread + ripple + side * w, -len, tip);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function projectFall(figure, t, pull) {
    const { x, y, start, endX, endY, travel } = figure;
    const age = Math.max(0, (t - start) * fallRate);
    const linear = Math.min(1, age / travel);
    const a = linear * travel;
    const acceleration = 0.70 * a + 0.45 * a * a;
    const pathLength = 0.70 * travel + 0.45 * travel * travel;
    const vertical = acceleration / pathLength;
    const horizontal = linear * 0.75 + vertical * 0.25;
    const worldX = lerp(x, endX, horizontal);
    const worldY = lerp(y, endY, vertical);
    const zoom = lerp(1.25, 1, pull);
    const fallSlope = (0.70 + 0.90 * a) / pathLength;
    return {
      age, linear, zoom,
      px: landing.x + (worldX - landing.x) * zoom,
      py: landing.y + (worldY - landing.y) * zoom,
      approach: 1 - 0.82 * smooth(0.54, 0.99, linear),
      visible: 1 - smooth(0.77, 1, linear),
      heading: Math.atan2((endY - y) * fallSlope, (endX - x) * (0.75 / travel + 0.25 * fallSlope))
    };
  }

  function drawFallingFigure(ctx, figure, t, reveal, pull) {
    const fall = projectFall(figure, t, pull);
    if (fall.age <= 0 || fall.linear >= 1) return;
    const { px, py, age, zoom, approach, heading } = fall;
    const { size, pose, depth, phase } = figure;
    const scale = size * zoom * approach / crowdDistance;
    const alpha = reveal * depth * smooth(0, 0.14, age) * fall.visible;
    if (px < -scale * 4 || px > width + scale * 4 || py < -scale * 2 || py > height + scale * 2) return;
    const tilt = (pose - 1.5) * 0.035 + 0.048 * Math.sin(age * 2.2 + phase * 3);
    const [sx, sy, sw, sh, anchorX, anchorY] = poseBoxes[pose];
    const displayH = scale * sh / sw;

    drawBattleWake(ctx, px, py, scale, heading, t, phase, alpha);
    drawLightWings(ctx, px, py, scale * 0.95, heading, t * 0.7, phase, alpha * 0.70);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(px, py);
    ctx.rotate(tilt);
    ctx.drawImage(troops, sx, sy, sw, sh,
      -scale * anchorX, -displayH * anchorY, scale, displayH);
    ctx.restore();
  }

  function drawBattleWake(ctx, x, y, size, heading, t, phase, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);
    const heat = 0.59 + 0.36 * Math.sin(phase * 8) ** 2;
    for (let i = 0; i < 5; i++) {
      const age = (t * (0.64 + i * 0.014) + i / 5 + phase) % 1;
      const span = size * (0.34 + age * 0.79);
      const dx = -size * (0.21 + 3.55 * age);
      const dy = size * age * 0.21 * Math.sin(age * 7 + phase * 13 + i * 1.2);
      const grow = Math.sin(age * Math.PI) ** 0.82;
      ctx.globalAlpha = alpha * heat * grow * (0.53 + 0.33 * Math.sin(phase * 5 + 0.45) ** 2);
      ctx.drawImage(i % 2 ? ashPuff : ashPuffFlipped, dx - span * 0.55, dy - span * 0.43, span * 1.43, span * 0.88);
    }
    ctx.globalCompositeOperation = 'screen';
    const flicker = 0.84 + 0.16 * Math.sin(t * 19 + phase * 10);
    const burn = alpha * heat * flicker;
    for (let i = 0; i < 4; i++) {
      const sway = Math.sin(t * 8.2 + phase * 16 + i * 1.8);
      bloom(ctx, -size * (0.25 + i * 0.43), sway * size * (0.02 + i * 0.012),
        size * (0.74 + i * 0.16), size * (0.038 + i * 0.026), '230,91,37', burn * (0.48 - i * 0.09));
    }
    const filament = ctx.createLinearGradient(-size * 2.55, 0, size * 0.13, 0);
    filament.addColorStop(0, 'rgba(213,55,18,0)');
    filament.addColorStop(0.43, 'rgba(233,83,28,0.40)');
    filament.addColorStop(0.82, 'rgba(255,158,69,0.64)');
    filament.addColorStop(1, 'rgba(255,227,159,0.96)');
    ctx.globalAlpha = burn;
    ctx.strokeStyle = filament;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const wobble = Math.sin(t * 9.4 + phase * 3.4 + i);
      const side = (i - 1) * size * 0.062;
      ctx.lineWidth = size * (0.008 + 0.005 * i);
      ctx.beginPath();
      ctx.moveTo(size * 0.14, side * 0.36);
      ctx.bezierCurveTo(-size * 0.38, side, -size * 1.21, side * 0.75 + wobble * size * 0.09,
        -size * (1.96 + i * 0.23), -side * 0.81);
      ctx.stroke();
    }
    ctx.restore();
    drawMeteorLight(ctx, x, y, size * 1.24, heading, t, phase, alpha * heat);
  }

  function drawCommanderSmoke(ctx, x, y, size, heading, t, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 8; i++) {
        const age = (i / 8 + t * 0.84 + (side > 0 ? 0.065 : 0)) % 1;
        const distance = -size * (0.05 + age * 3.7);
        const bend = side * size * (0.21 + age * 0.37) + Math.sin(age * 9 + side) * size * age * 0.22;
        const span = size * (0.28 + age * 0.73);
        const opacity = Math.sin(Math.PI * age) ** 0.88 * (1 - age * 0.38);
        ctx.globalAlpha = alpha * opacity * (side < 0 ? 0.73 : 0.58);
        ctx.drawImage(i % 2 ? ashPuff : ashPuffFlipped, distance - span * 0.76, bend - span * 0.36,
          span * 1.65, span * 0.82);
      }
    }
    ctx.restore();
  }

  function drawCommanderWings(ctx, x, y, size, t, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = 'screen';
    const rootX = commanderWing.width * 0.94;
    const step = commanderWing.width / 26;
    for (const side of [-1, 1]) {
      ctx.save();
      const near = side === 1;
      const flutter = Math.sin(t * 3.2 + side * 0.72);
      const span = size * (near ? 0.82 : 0.78);
      const tall = span * (near ? 0.52 : 0.55);
      const sx = span / commanderWing.width;
      const sy = tall / commanderWing.height;
      const displacement = sourceX => {
        const u = (rootX - sourceX) / rootX;
        return u * Math.sin(t * 3.6 - u * 3.35 + side) * span * 0.071;
      };
      ctx.translate(size * (near ? -0.009 : 0.046), size * (near ? 0.035 : -0.022));
      ctx.rotate((near ? -0.49 : -0.54) + flutter * 0.042);
      ctx.scale(side, 1);
      ctx.globalAlpha = alpha * (near ? 0.92 : 0.87);
      for (let i = 0; i < 26; i++) {
        const left = i * step;
        const y = displacement(left);
        const shear = (displacement(left + step) - y) / step;
        const length = Math.min(step + 0.42, commanderWing.width - left);
        ctx.save();
        ctx.transform(sx, shear, 0, sy, -rootX * sx, -tall * 0.5 + y - left * shear);
        ctx.drawImage(commanderWing, left, 0, length, commanderWing.height, left, 0, length, commanderWing.height);
        ctx.restore();
      }
      ctx.restore();
    }
    bloom(ctx, 0, 0, size * 0.14, size * 0.075, '255,235,181', alpha * 0.28);
    ctx.restore();
  }

  function drawCommander(ctx, t, pull, seconds) {
    const fall = projectFall(commanderFlight, t, pull);
    const alpha = fall.visible;
    if (alpha <= 0) return;
    const tracking = smooth(2.14, 5.35, t);
    const size = 1740 / (1 + 7.75 * pull ** 1.28) * fall.approach;
    const h = size * commander.height / commander.width;
    const cx = lerp(width * 0.485, fall.px, tracking) + (1 - tracking) * 8 * Math.sin(seconds * 2.1);
    const cy = lerp(height * 0.484, fall.py, tracking) + (1 - tracking) * 8 * Math.sin(seconds * 2.5);
    const { centerX, centerY, backX, backY } = commanderPose;
    const x = -size * centerX;
    const y = -h * centerY;
    const rootX = x + size * backX;
    const rootY = y + h * backY;
    const heading = lerp(0.83, fall.heading, tracking);
    const close = 1 - smooth(1.85, 4.45, t);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(0.015 * Math.sin(seconds * 2.3) + pull * 0.068);
    drawCommanderSmoke(ctx, rootX + size * 0.035, rootY - h * 0.04,
      size * 0.24, heading, seconds, alpha * close);
    drawBattleWake(ctx, rootX, rootY, size * lerp(0.21, 0.62, pull), heading,
      seconds, 0.45, alpha * (0.59 + 0.23 * (1 - close)));
    drawCommanderWings(ctx, rootX, rootY, size, seconds, alpha);
    ctx.globalAlpha = alpha;
    ctx.drawImage(commander, x, y, size, h);
    ctx.restore();
  }

  function subtitle(ctx, line, opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.font = '500 49px "Noto Serif TC", "Microsoft JhengHei", MingLiU, serif';
    ctx.letterSpacing = '0.18em';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(22,11,8,0.89)';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.8;
    ctx.shadowColor = 'rgba(16,9,7,0.87)';
    ctx.shadowBlur = 20;
    ctx.strokeText(line, width * 0.5, 816);
    ctx.fillStyle = '#f7e5be';
    ctx.fillText(line, width * 0.5, 816);
    ctx.restore();
  }

  function drawWhiteOpening(ctx, t) {
    if (t < whiteLightAt) return;
    const progress = Math.min(1, (t - whiteLightAt) / (secondDuration - whiteLightAt));
    const y = landing.y + matte;
    const radius = 3 + 2220 * progress ** 3.10;
    const light = ctx.createRadialGradient(landing.x, y, 0, landing.x, y, radius);
    light.addColorStop(0, '#fff');
    light.addColorStop(0.22, '#fffff5');
    light.addColorStop(0.49, 'rgba(255,247,219,0.78)');
    light.addColorStop(0.78, 'rgba(255,230,183,0.23)');
    light.addColorStop(1, 'rgba(255,232,190,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = smooth(whiteLightAt, whiteLightAt + 0.11, t);
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, width, height + 2 * matte);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = smooth(secondDuration - 0.52, secondDuration - 0.18, t);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height + 2 * matte);
    ctx.restore();
  }

  function renderSecond(ctx, seconds) {
    const t = fallTime(seconds);
    const pull = smooth(0.92, 7.45, t);
    const group = smooth(1.88, 3.18, t);
    const close = 1 - smooth(0.95, 3.83, t);
    ctx.fillStyle = '#0b0807';
    ctx.fillRect(0, 0, width, height + matte * 2);
    ctx.save();
    ctx.translate(0, matte);
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();
    ctx.imageSmoothingQuality = 'high';

    drawAtmosphere(ctx, t, pull, group);
    drawAir(ctx, seconds, lerp(0.35, 1.44, close) * (1 - 0.88 * smooth(5.30, 8.18, t)), lerp(0.79, 1.8, close));
    if (group > 0) for (const figure of meteorFlight) drawFallingFigure(ctx, figure, t, group, pull);
    drawCommander(ctx, t, pull, seconds);
    drawAir(ctx, seconds, 0.97 * close, 1.67, true);
    pageFinish(ctx);

    subtitle(ctx, '天堂隕落…', smooth(1.19, 1.79, t) * (1 - smooth(3.08, 3.54, t)));
    subtitle(ctx, '聖光將不復存在', smooth(4.0, 4.46, t) * (1 - smooth(6.72, 7.28, t)));
    ctx.restore();
    drawWhiteOpening(ctx, seconds);
  }

  return function render(seconds) {
    const t = Math.max(0, Math.min(duration, seconds));
    if (t <= firstDuration) {
      first(t);
      return;
    }
    if (t >= secondStart) {
      renderSecond(context, t - secondStart);
      return;
    }

    const progress = (t - firstDuration) / transitionDuration;
    first(firstDuration, smooth(0, 1, progress));
    renderSecond(incoming, 0);
    context.save();
    context.globalAlpha = smooth(0.19, 1, progress);
    context.filter = 'blur(' + (13 * (1 - progress)).toFixed(2) + 'px)';
    context.drawImage(incoming.canvas, 0, 0);
    context.restore();
  };
}
