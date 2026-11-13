'use strict';

function makeExtendedFall(assets, helpers) {
  const { context, width, height, matte, layer, random, lerp, smooth, bloom, pageFinish } = helpers;
  const timing = OPENING_SHOT_TIMING;
  const incoming = layer(width, height + matte * 2, { alpha: false });
  const sky = assets['heaven-sky'];
  const abyss = assets['cloud-abyss'];
  const commander = makeReferenceCommander(assets.commanderReference, assets.commanderChin, assets.commanderChinEdge, layer);
  const commanderWing = assets.wing;
  const troops = assets['angels-fall-faces'];
  const smoke = assets['collapse-smoke'];
  const cloudVapour = makeCloudVapour(605113);
  const closeVapour = makeCloudVapour(21381);
  const ashPuff = makeAshPuff(smoke, false);
  const ashPuffFlipped = makeAshPuff(smoke, true);

  const landing = { x: width * 0.59, y: height * 0.57 };
  const flashOrigin = { x: width * 0.572, y: matte + height * 0.784 };
  const commanderPose = { centerX: 0.587, centerY: 0.597, backX: 0.608, backY: 0.591 };
  // Anchors follow the painted armor and tabard in the commander cel.
  const commanderBurnSites = [
    // u, v, flame scale, intensity, phase offset, flow deflection
    [0.663, 0.470, 0.083, 0.92, 0.13,  0.03],
    [0.507, 0.558, 0.105, 1.00, 0.62, -0.11],
    [0.606, 0.745, 0.081, 0.92, 1.34,  0.13],
    [0.380, 0.462, 0.093, 0.96, 0.93, -0.19],
    [0.290, 0.295, 0.075, 0.89, 1.75, -0.09],
    [0.369, 0.358, 0.067, 0.78, 1.10,  0.08],
    [0.506, 0.807, 0.050, 0.64, 2.09,  0.14]
  ];
  const commanderCombustion = makeCommanderCombustion(layer, random, smooth);
  const commanderAsh = makeCommanderAsh(commanderCombustion, random, lerp, smooth, bloom);
  const commanderLighting = layer(commander.width, commander.height, { alpha: true });
  const debrisRandom = random(528941);
  const commanderDebris = Array.from({ length: 36 }, (_, i) => ({
    phase: debrisRandom(),
    speed: lerp(0.61, 1.52, debrisRandom()),
    distance: lerp(1.55, 4.9, debrisRandom()),
    offset: lerp(-0.86, 0.86, debrisRandom()),
    size: lerp(0.013, 0.061, debrisRandom() ** 1.8),
    spin: lerp(-7, 7, debrisRandom()),
    ember: i % 5 < 2
  }));

  function braceAt(t) {
    return smooth(0.95, timing.reach, t) * (1 - smooth(timing.wingPeak + 0.16, timing.wingBreak + 0.68, t));
  }

  function recoilAt(t) {
    return smooth(timing.wingPeak + 0.12, timing.wingBreak, t) *
      (1 - smooth(timing.wingBreak + 0.13, timing.wingBreak + 1.2, t));
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
    [ 108, 114, 2.48, 2.54, 100, 2, 0.71,  925, 716],
    // Additional trajectories occupy gaps across the sky and remain visible into the descent.
    [-222, 374, 2.19, 2.58, 140, 2, 0.85, 822, 709],
    [-68, -30, 2.25, 2.62, 93, 0, 0.70, 794, 597],
    [107, 268, 2.76, 2.37, 97, 3, 0.81, 972, 758],
    [306, 143, 2.14, 2.62, 136, 1, 0.74, 1006, 674],
    [425, 115, 2.68, 2.38, 90, 0, 0.81, 1036, 515],
    [594, 454, 1.83, 2.57, 111, 2, 0.84, 1063, 744],
    [799, 98, 2.87, 2.23, 126, 3, 0.80, 1101, 652],
    [897, 246, 2.70, 2.41, 93, 1, 0.82, 1151, 762],
    [999, 435, 2.07, 2.60, 78, 0, 0.78, 1152, 768],
    [1110, 217, 2.98, 2.27, 138, 2, 0.82, 1156, 683],
    [1275, 351, 2.30, 2.61, 95, 3, 0.81, 1228, 768],
    [1307, 139, 2.91, 2.29, 106, 1, 0.72, 1289, 777],
    [1509, 65, 2.68, 2.33, 119, 0, 0.74, 1323, 552],
    [1593, 141, 2.94, 2.24, 95, 2, 0.83, 1345, 737],
    [1766, 70, 2.64, 2.36, 93, 3, 0.67, 1379, 485],
    [2015, 200, 2.63, 2.44, 128, 0, 0.69, 1411, 598],
    [2146, 395, 2.14, 2.60, 105, 1, 0.83, 1456, 777]
  ].map(([x, y, start, travel, size, pose, depth, endX, endY], i) => {
    const band = i < 9 ? 0 : i < 23 ? 1 : 2;
    const onset = [4.80, 7.04, 9.92][band] + (start - 0.55) * [0.64, 0.65, 0.78][band];
    const duration = [4.66, 4.24, 3.96][band] + (travel - 2) * 0.77;
    return {
      x: (x - width * 0.52) * [1.12, 1.01, 0.87][band] + width * 0.52,
      y: y - 138 - band * 58,
      start: onset,
      travel: i === 30 ? timing.lastTrail - onset : Math.min(duration, timing.lastTrail - onset),
      size: size * [1.31, 0.98, 0.69][band],
      pose,
      depth: depth * [1.04, 0.90, 0.72][band],
      endX: endX + (i % 4 - 1.5) * 29,
      endY: endY + 17 + band * 14,
      phase: i * 0.329,
      band
    };
  }).sort((a, b) => b.band - a.band || a.depth - b.depth);
  const commanderFlight = { x: 825, y: 181, start: 3.10, travel: 9.75, endX: 1133, endY: 659 };
  const crowdDistance = 1.16;

  // Source rectangles and backplate anchors for the four separate drawings.
  const poseBoxes = [
    [41, 76, 534, 421, 0.633, 0.720],
    [645, 65, 538, 428, 0.621, 0.722],
    [38, 698, 540, 396, 0.656, 0.742],
    [633, 707, 555, 369, 0.634, 0.761]
  ];

  // A unit cycle also accepts negative time during the incoming dissolve.
  const cyclePhase = phase => phase - Math.floor(phase);
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

  function drawAtmosphere(ctx, t, pull) {
    const depth = smooth(3.8, 10.0, t);
    const close = 1 - smooth(0.83, 6.7, t);
    const cover = Math.max(width / sky.width, height / sky.height) * lerp(1.24, 1.52, close);
    const skyW = sky.width * cover;
    const skyH = sky.height * cover;
    ctx.save();
    ctx.filter = 'blur(' + (close * 12.8).toFixed(2) + 'px)';
    ctx.drawImage(sky, (width - skyW) * 0.5 - Math.min(t, 7) * 9,
      (height - skyH) * 0.5 - Math.min(t, 7) * 14, skyW, skyH);
    ctx.restore();
    if (depth > 0) {
      ctx.save();
      ctx.globalAlpha = depth;
      const zoom = lerp(1.48, 1.012, pull) + 0.038 * smooth(13.2, timing.duration, t);
      ctx.drawImage(abyss, landing.x * (1 - zoom), landing.y * (1 - zoom), width * zoom, height * zoom);
      ctx.restore();
    }
    const dim = smooth(10.9, 15.6, t);
    const glaze = ctx.createLinearGradient(0, 0, width * 0.24, height);
    glaze.addColorStop(0, 'rgba(53,29,20,' + (0.08 + dim * 0.20) + ')');
    glaze.addColorStop(0.44, 'rgba(32,28,32,' + (0.08 + dim * 0.28) + ')');
    glaze.addColorStop(1, 'rgba(17,15,23,' + (0.14 + dim * 0.49) + ')');
    ctx.fillStyle = glaze;
    ctx.fillRect(0, 0, width, height);
  }

  function makeCloudVapour(seed) {
    const w = 480, h = 264;
    const vapour = layer(w, h, { alpha: true });
    const image = vapour.createImageData(w, h);
    const rng = random(seed);
    const octaves = [
      [7, 5, 0.54], [14, 10, 0.25], [28, 20, 0.13], [56, 40, 0.06], [112, 80, 0.02]
    ].map(([columns, rows, weight]) => ({
      columns, rows, weight,
      samples: Array.from({ length: (columns + 1) * (rows + 1) }, rng)
    }));
    function sample({ columns, rows, samples }, u, v) {
      const gx = u * columns, gy = v * rows;
      const x = Math.floor(gx), y = Math.floor(gy);
      const sx = smooth(0, 1, gx - x), sy = smooth(0, 1, gy - y);
      const i = y * (columns + 1) + x;
      return lerp(lerp(samples[i], samples[i + 1], sx),
        lerp(samples[i + columns + 1], samples[i + columns + 2], sx), sy);
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const u = x / w, v = y / h;
        const billow = octaves.reduce((value, field) => value + sample(field, u, v) * field.weight, 0);
        // A soft opening keeps the abyss legible while the camera backs into cloud.
        const depth = Math.hypot((u - 0.54) * 1.62, (v - 0.49) * 1.47);
        const cover = 0.28 + 0.72 * smooth(0.18, 0.68, depth);
        const density = smooth(0.25, 0.78, billow) * cover;
        const i = (y * w + x) * 4;
        image.data[i] = Math.round(lerp(108, 178, billow));
        image.data[i + 1] = Math.round(lerp(96, 149, billow));
        image.data[i + 2] = Math.round(lerp(83, 119, billow));
        image.data[i + 3] = Math.round(255 * density);
      }
    }
    vapour.putImageData(image, 0, 0);
    return vapour.canvas;
  }

  function drawCameraCloud(ctx, t, foreground) {
    const depth = smooth(foreground ? 7.15 : 4.95, foreground ? 15.55 : 14.75, t);
    if (depth <= 0) return;
    const scale = foreground ? 1.06 + 0.68 * depth : 1.04 + 0.35 * depth;
    const originX = width * 0.54;
    const originY = height * 0.49;
    ctx.save();
    ctx.globalAlpha = depth * (foreground ? 0.93 : 0.65);
    ctx.filter = foreground ? 'blur(18px)' : 'blur(6px)';
    ctx.drawImage(foreground ? closeVapour : cloudVapour,
      originX * (1 - scale), originY * (1 - scale), width * scale, height * scale);
    ctx.restore();
    if (foreground) {
      const haze = ctx.createRadialGradient(originX, originY, height * 0.12, originX, originY, width * 0.57);
      haze.addColorStop(0, 'rgba(117,103,94,' + depth * 0.082 + ')');
      haze.addColorStop(0.62, 'rgba(120,105,95,' + depth * 0.19 + ')');
      haze.addColorStop(1, 'rgba(124,107,94,' + depth * 0.44 + ')');
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, width, height);
    }
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
      const age = cyclePhase(t * (0.9 + spark.brightness * 0.3) + spark.offset + phase);
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
    const age = Math.max(0, t - start);
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
    const cloudEdge = smooth(0.07, 0.28 + figure.band * 0.04, fall.linear);
    const alpha = reveal * depth * smooth(0, 0.33, age) * fall.visible * (0.37 + 0.63 * cloudEdge);
    if (px < -scale * 4 || px > width + scale * 4 || py < -scale * 2 || py > height + scale * 2) return;
    const tilt = (pose - 1.5) * 0.035 + 0.048 * Math.sin(age * 2.2 + phase * 3);
    const [sx, sy, sw, sh, anchorX, anchorY] = poseBoxes[pose];
    const displayH = scale * sh / sw;

    drawBattleWake(ctx, px, py, scale * 1.16, heading, t, phase, alpha);
    drawLightWings(ctx, px, py, scale * 0.95, heading, t * 0.7, phase, alpha * 0.70);
    ctx.save();
    ctx.globalAlpha = alpha * 0.91;
    if (figure.band > 0) ctx.filter = 'blur(' + (0.52 + figure.band * 0.55) + 'px)';
    ctx.translate(px, py);
    ctx.rotate(tilt);
    ctx.scale(figure.endX < figure.x ? -1 : 1, 1);
    ctx.drawImage(troops, sx, sy, sw, sh,
      -scale * anchorX, -displayH * anchorY, scale, displayH);
    ctx.restore();
    drawCrowdCombustion(ctx, px, py, scale, heading, t, phase, alpha);
  }

  function drawCrowdCombustion(ctx, x, y, size, heading, t, phase, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);
    ctx.globalCompositeOperation = 'screen';

    const flicker = 0.72 + 0.28 * Math.sin(t * 19 + phase * 6) ** 2;
    const length = size * (3.05 + 0.65 * Math.sin(phase * 7) ** 2);
    const trail = ctx.createLinearGradient(-length, 0, size * 0.35, 0);
    trail.addColorStop(0, 'rgba(193,65,24,0)');
    trail.addColorStop(0.35, 'rgba(220,84,28,0.22)');
    trail.addColorStop(0.76, 'rgba(255,143,60,0.56)');
    trail.addColorStop(1, 'rgba(255,213,141,0.83)');
    ctx.fillStyle = trail;
    ctx.globalAlpha = alpha * flicker * 0.54;
    for (const side of [-1, 1]) {
      const wave = Math.sin(t * 10.5 + phase * 9 + side);
      const offset = side * size * 0.091;
      const tongue = length * (side === 1 ? 0.71 : 1);
      ctx.beginPath();
      ctx.moveTo(size * 0.30, offset * 0.40);
      ctx.bezierCurveTo(-size * 0.02, offset * 2.4, -tongue * 0.48, offset * (1.7 + wave), -tongue, offset * 0.65);
      ctx.bezierCurveTo(-tongue * 0.51, offset * (0.48 + wave), -size * 0.38, offset * 0.30, size * 0.30, offset * 0.40);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    bloom(ctx, size * 0.12, 0, size * 0.56, size * 0.27, '255,128,53', alpha * 0.42 * flicker);
    bloom(ctx, size * 0.17, 0, size * 0.22, size * 0.097, '255,222,155', alpha * 0.37 * flicker);
    ctx.restore();
  }

  function drawBattleWake(ctx, x, y, size, heading, t, phase, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);
    const heat = 0.59 + 0.36 * Math.sin(phase * 8) ** 2;
    for (let i = 0; i < 5; i++) {
      const age = cyclePhase(t * (0.64 + i * 0.014) + i / 5 + phase);
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
        const age = cyclePhase(i / 8 + t * 0.84 + (side > 0 ? 0.065 : 0));
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

  function commanderFirelight(t, alpha) {
    if (alpha <= 0.001) return commander;
    const ctx = commanderLighting;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, commander.width, commander.height);
    ctx.drawImage(commander, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    for (const [u, v, span, energy, phase] of commanderBurnSites) {
      const radius = commander.width * span;
      const x = commander.width * u;
      const y = commander.height * v;
      const pulse = 0.67 + 0.25 * Math.sin(t * 12.8 + phase * 9) + 0.08 * Math.sin(t * 21.1);
      const heat = alpha * energy;
      bloom(ctx, x - radius * 0.22, y - radius * 0.12, radius * 1.12, radius * 0.65, '76,40,23', heat * 0.24);
      bloom(ctx, x, y, radius * 0.78, radius * 0.53, '253,127,47', heat * pulse * 0.40);
      bloom(ctx, x + radius * 0.08, y + radius * 0.06, radius * 0.34, radius * 0.23,
        '255,213,139', heat * pulse * 0.52);
    }
    return ctx.canvas;
  }

  function drawCommanderFlames(ctx, radius, t, phase, alpha) {
    const pulse = 0.78 + 0.16 * Math.sin(t * 13.6 + phase * 7) + 0.06 * Math.sin(t * 26.1 + phase * 13);
    ctx.globalCompositeOperation = 'screen';
    bloom(ctx, -radius * 0.29, 0, radius * 1.65, radius * 0.72, '217,78,28', alpha * pulse * 0.61);
    bloom(ctx, radius * 0.016, 0, radius * 0.48, radius * 0.28, '255,172,77', alpha * pulse * 0.66);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = alpha * (0.81 + pulse * 0.19);
    commanderCombustion.fire(ctx, radius, t + phase);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = alpha * pulse * 0.41;
    ctx.scale(1.20, 0.74);
    commanderCombustion.fire(ctx, radius * 0.74, t * 1.13 + phase + 0.18);
    ctx.restore();
  }

  function drawCommanderDebris(ctx, radius, t, phase, alpha) {
    for (const particle of commanderDebris) {
      const { speed, distance, offset, size, spin, ember } = particle;
      const age = cyclePhase(particle.phase + phase * 0.17 + t * speed);
      const flight = Math.sin(Math.PI * age) ** 0.78 * (1 - age * 0.38);
      const trailing = -radius * (0.1 + distance * age + 0.39 * age * age);
      const crosswind = radius * (offset * (0.32 + age * 1.67) +
        age * 0.24 * Math.sin(9.2 * age + particle.phase * 5 + phase));
      const chip = Math.max(0.6, radius * size * (1 - age * 0.45));
      ctx.globalCompositeOperation = ember ? 'screen' : 'source-over';
      ctx.globalAlpha = alpha * flight * (ember ? 1 : 0.81);
      if (ember) {
        const streak = radius * (0.045 + size * 3.0) * (1 - age * 0.42);
        const hue = Math.round(lerp(197, 105, age));
        const edge = crosswind + streak * offset * 0.13;
        const glow = ctx.createLinearGradient(trailing - streak, edge, trailing, crosswind);
        glow.addColorStop(0, 'rgba(173,54,20,0)');
        glow.addColorStop(0.49, 'rgba(237,' + hue + ',44,0.32)');
        glow.addColorStop(1, 'rgba(255,221,151,0.91)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.moveTo(trailing - streak, edge);
        ctx.quadraticCurveTo(trailing - streak * 0.30, crosswind - chip * 0.38,
          trailing + chip * 0.32, crosswind);
        ctx.quadraticCurveTo(trailing - streak * 0.26, crosswind + chip * 0.44, trailing - streak, edge);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,229,170,' + (1 - age * 0.60) + ')';
        ctx.beginPath();
        ctx.ellipse(trailing, crosswind, chip * 0.52, chip * 0.33, offset * 0.21, 0, Math.PI * 2);
        ctx.fill();
        if (chip > 2.1) bloom(ctx, trailing, crosswind, chip * 4.8, chip * 2.5, '255,100,26', 0.57);
      } else {
        ctx.save();
        ctx.translate(trailing, crosswind);
        ctx.rotate(spin * age + phase);
        ctx.fillStyle = '#342622';
        ctx.beginPath();
        ctx.moveTo(-chip * 0.95, -chip * 0.14);
        ctx.lineTo(chip * 0.21, -chip * 0.62);
        ctx.lineTo(chip * 0.83, chip * 0.07);
        ctx.lineTo(chip * 0.12, chip * 0.40);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawCommanderBurning(ctx, x, y, size, h, heading, t, alpha, foreground) {
    if (alpha <= 0.001) return;
    for (const [u, v, span, energy, phase, deflection] of commanderBurnSites) {
      const radius = size * span;
      const heat = alpha * energy;
      ctx.save();
      ctx.translate(x + size * u, y + h * v);
      ctx.rotate(heading + deflection + 0.089 * Math.sin(phase * 4 + t * 2.9));
      if (foreground) {
        ctx.globalAlpha = heat * 0.19;
        commanderCombustion.smoke(ctx, radius * 0.68, t * 0.91 + phase);
        ctx.globalAlpha = 1;
        drawCommanderFlames(ctx, radius, t, phase, heat);
        drawCommanderDebris(ctx, radius, t, phase, heat);
      } else {
        ctx.globalAlpha = heat * 0.87;
        commanderCombustion.smoke(ctx, radius * 1.10, t * 0.93 + phase);
        ctx.globalAlpha = heat * 0.25;
        ctx.rotate(-0.14);
        commanderCombustion.smoke(ctx, radius * 1.43, t * 0.89 + phase + 0.24);
      }
      ctx.restore();
    }
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
      const brace = braceAt(t);
      const windBend = smooth(timing.wingPeak + 0.11, timing.wingBreak + 0.94, t);
      const rebound = Math.sin((t - timing.wingBreak) * 12 + side * 0.32) * recoilAt(t);
      const span = size * 0.83 * (1 + 0.075 * brace);
      const tall = span * 0.54;
      const sx = span / commanderWing.width;
      const sy = tall / commanderWing.height;
      const displacement = sourceX => {
        const u = (rootX - sourceX) / rootX;
        return u * Math.sin(t * 3.6 - u * 3.35 + side) * span * 0.065 +
          u * u * span * (0.20 * windBend + 0.095 * rebound);
      };
      ctx.translate(size * (near ? -0.009 : 0.046), size * (near ? 0.035 : -0.022));
      ctx.rotate((near ? -0.49 : -0.54) + flutter * 0.042 - 0.12 * brace + 0.14 * windBend);
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

  function drawCommander(ctx, t, pull, fallOpacity) {
    const fall = projectFall(commanderFlight, t, pull);
    const alpha = fall.visible * fallOpacity;
    if (alpha <= 0) return;
    const tracking = smooth(3.95, 9.25, t);
    // The wing folds first; the weight of the armour takes longer to roll.
    const bodyTilt = smooth(2.98, 5.22, t) * (1 - smooth(5.58, 8.26, t));
    const braceTilt = smooth(0.90, 2.52, t) * (1 - smooth(2.96, 4.87, t));
    const size = lerp(1630, 1470, braceTilt) / (1 + 7.17 * pull ** 1.36) * fall.approach * (1 - 0.024 * bodyTilt);
    const h = size * commander.height / commander.width;
    const cx = lerp(width * 0.478 - t * 4, fall.px, tracking) + (1 - tracking) *
      (8 * Math.sin(t * 2.1) - 18 * braceTilt + 19 * bodyTilt);
    const cy = lerp(height * 0.491 + t * 7, fall.py, tracking) + (1 - tracking) *
      (7 * Math.sin(t * 2.5) + 56 * braceTilt + 38 * bodyTilt);
    const { centerX, centerY, backX, backY } = commanderPose;
    const x = -size * centerX;
    const y = -h * centerY;
    const rootX = x + size * backX;
    const rootY = y + h * backY;
    const heading = lerp(0.84, fall.heading, tracking);
    const close = 1 - smooth(3.9, 8.7, t);
    const fireAlpha = alpha * (1 - smooth(7.60, 11.60, t));

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(0.012 * Math.sin(t * 1.68) + pull * 0.068 - 0.075 * braceTilt + 0.195 * bodyTilt);
    drawCommanderSmoke(ctx, rootX + size * 0.035, rootY - h * 0.04,
      size * 0.25, heading, t, alpha * close);
    drawBattleWake(ctx, rootX, rootY, size * lerp(0.22, 0.64, pull), heading,
      t, 0.45, alpha * (0.58 + 0.23 * (1 - close)));
    drawCommanderBurning(ctx, x, y, size, h, heading, t, fireAlpha, false);
    drawCommanderWings(ctx, rootX, rootY, size, t, alpha);
    ctx.globalAlpha = alpha;
    ctx.drawImage(commanderFirelight(t, fireAlpha), x, y, size, h);
    ctx.globalAlpha = 1;
    commanderAsh.drawClouds(ctx, x, y, size, h, heading, t, fireAlpha);
    drawCommanderBurning(ctx, x, y, size, h, heading, t, fireAlpha, true);
    commanderAsh.drawFragments(ctx, x, y, size, h, heading, t, fireAlpha);
    ctx.restore();
  }

  // Screen position, projected size and yaw share the same wind-driven path.
  // Log size lets perspective build continuously across the whole return arc.
  const featherPath = [
    [timing.featherEnter, 1.13, 0.280, 124, 0.68],
    [10.57, 0.82, 0.326, 194, 0.84],
    [11.46, 0.33, 0.418, 320, 1.04],
    [timing.featherTurn, 0.13, 0.502, 534, 1.24],
    [12.97, 0.20, 0.538, 885, 1.16],
    [13.53, 0.37, 0.512, 1455, 0.93],
    [14.03, 0.59, 0.468, 2400, 0.68],
    [timing.featherNear, 0.85, 0.453, 3730, 0.48],
    [14.72, 1.17, 0.441, 5140, 0.29],
    [15.11, 1.93, 0.427, 6260, 0.20],
    [timing.featherExit, 3.48, 0.384, 6800, 0.16]
  ].map(([time, x, y, span, yaw]) => ({ time, pose: [x, y, Math.log(span), yaw] }));

  function featherPose(t) {
    const index = featherPath.findIndex(point => t < point.time);
    const before = featherPath[index - 2];
    const from = featherPath[index - 1];
    const to = featherPath[index];
    const after = featherPath[index + 1];
    const duration = to.time - from.time;
    const p = (t - from.time) / duration;
    const u = 1 - p;
    // Match velocity on either side of every knot, including at the wind turn.
    function tangent(a, b) {
      return a * b > 0 ? 2 * a * b / (a + b) : 0;
    }
    return from.pose.map((start, axis) => {
      const end = to.pose[axis];
      const slope = (end - start) / duration;
      const incoming = before ? tangent((start - before.pose[axis]) / (from.time - before.time), slope) : slope;
      const outgoing = after ? tangent(slope, (after.pose[axis] - end) / (after.time - to.time)) : slope;
      return lerp(start, end, p * p * (3 - 2 * p)) +
        duration * p * u * (u * incoming - p * outgoing);
    });
  }

  function drawCharredFeather(ctx, t) {
    const { featherEnter, featherNear, featherExit } = timing;
    if (t <= featherEnter || t >= featherExit) return;
    const [x, y, logSpan, yaw] = featherPose(t);
    const travel = t - featherEnter;
    const lensCrossing = smooth(featherNear - 0.53, featherNear + 0.13, t);
    const span = Math.exp(logSpan) * (1 + 0.08 * lensCrossing);
    const lens = smooth(750, 5200, span);
    const flutter = Math.sin(travel * 5.1 + 0.45) * 0.105 + Math.sin(travel * 9.4 - 0.13) * 0.034;
    const flutterPitch = 0.59 + Math.sin(travel * 3.2 + 0.18) * 0.40 + Math.sin(travel * 6.9) * 0.12;
    const flip = smooth(timing.featherTurn + 0.53, timing.featherNear - 0.56, t);
    const roll = Math.PI * flip + flutterPitch * (1 - 0.80 * lens) * (1 - 0.82 * Math.sin(Math.PI * flip));
    const face = Math.cos(roll);
    const bank = Math.sin(Math.PI * flip);
    const crosswind = 15 * Math.sin(travel * 3.35 - 0.7) + 6 * Math.sin(travel * 6.1);
    const focus = 2.1 * (1 - smooth(170, 440, span)) + 12.8 * lens +
      12.0 * smooth(featherNear + 0.10, featherExit, t);
    const feather = assets.feather;
    const tall = span * feather.height / feather.width;

    ctx.save();
    const lift = height * 0.37 * lensCrossing;
    ctx.translate(width * x, height * y - lift + crosswind * (1 - 0.45 * lens));
    ctx.rotate(yaw + flutter * (1 - 0.76 * lens) - 0.18 * bank);
    // The painted shaft runs diagonally through the cel. Roll around that axis.
    const shaftAngle = Math.atan2(tall, span);
    ctx.rotate(-shaftAngle);
    const edge = 1 - smooth(0.04, 0.20, Math.abs(face));
    if (edge > 0) {
      const rim = ctx.createLinearGradient(-span * 0.59, 0, span * 0.58, 0);
      rim.addColorStop(0, 'rgba(68,43,29,0)');
      rim.addColorStop(0.26, 'rgba(159,114,73,0.74)');
      rim.addColorStop(0.61, 'rgba(237,197,143,0.78)');
      rim.addColorStop(1, 'rgba(108,69,43,0)');
      ctx.globalAlpha = edge;
      ctx.fillStyle = rim;
      ctx.fillRect(-span * 0.59, -span * 0.0019, span * 1.17, span * 0.0038);
      ctx.globalAlpha = 1;
    }
    ctx.transform(1, 0, 0.13 * bank, face, 0, 0);
    ctx.rotate(shaftAngle);
    const light = lerp(0.83, 0.96, smooth(140, 540, span)) - 0.14 * bank;
    ctx.filter = 'blur(' + focus.toFixed(2) + 'px) brightness(' + light.toFixed(2) + ')';
    ctx.drawImage(feather, -span / 2, -tall / 2, span, tall);
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'screen';
    const ember = (0.42 + 0.22 * Math.sin(travel * 4.4) + 0.09 * Math.sin(travel * 13)) *
      smooth(130, 240, span) * (1 - 0.94 * lens);
    bloom(ctx, span * 0.272, -tall * 0.19, span * 0.069, tall * 0.057, '255,147,51', ember * 0.72);
    ctx.restore();
  }

  function subtitle(ctx, line, opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.font = '700 49px OpeningSerif, "Microsoft JhengHei", MingLiU, serif';
    ctx.letterSpacing = '0.14em';
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

  function drawAbyssTransition(ctx, t) {
    if (t < timing.whiteLightAt) return;
    const elapsed = t - timing.whiteLightAt;
    const spread = Math.max(0, (t - timing.lightSpreadAt) / timing.lightSpreadDuration);
    const bloomRadius = 1180 * (0.68 * spread + 0.32 * spread ** 1.24);
    const radius = 11 + 25 * smooth(0, 0.35, elapsed) + bloomRadius;
    const { x, y } = flashOrigin;
    const light = ctx.createRadialGradient(x, y, 0, x, y, radius);
    light.addColorStop(0, '#fff');
    light.addColorStop(0.19, '#fffff5');
    light.addColorStop(0.44, 'rgba(255,247,220,0.74)');
    light.addColorStop(0.73, 'rgba(255,227,180,0.24)');
    light.addColorStop(1, 'rgba(255,232,191,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = smooth(0, 0.10, elapsed);
    ctx.fillStyle = light;
    ctx.fillRect(0, matte, width, height);
    ctx.globalCompositeOperation = 'source-over';
    const fade = Math.max(0, Math.min(1, (t - timing.lightSpreadAt) / (timing.cutToBlackAt - timing.lightSpreadAt)));
    ctx.globalAlpha = 0.42 * fade + 0.58 * smooth(0, 1, fade);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height + 2 * matte);
    ctx.restore();
  }

  function renderSecond(ctx, t) {
    const pull = smooth(3.72, timing.pullEnd, t);
    const close = 1 - smooth(4.6, 8.8, t);
    ctx.fillStyle = '#0b0807';
    ctx.fillRect(0, 0, width, height + matte * 2);
    ctx.save();
    ctx.translate(0, matte);
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();
    ctx.imageSmoothingQuality = 'high';

    drawAtmosphere(ctx, t, pull);
    const still = 1 - smooth(13.9, timing.lastTrail, t);
    const fallOpacity = 1 - smooth(timing.lastTrail - 0.13, timing.lastTrail, t);
    drawAir(ctx, t, lerp(0.38, 1.26, close) * (0.13 + 0.87 * still), lerp(0.75, 1.81, close));
    if (fallOpacity > 0) {
      for (const figure of meteorFlight) {
        if (figure.band > 0) drawFallingFigure(ctx, figure, t, fallOpacity, pull);
      }
    }
    drawCameraCloud(ctx, t, false);
    if (fallOpacity > 0) {
      for (const figure of meteorFlight) {
        if (figure.band === 0) drawFallingFigure(ctx, figure, t, fallOpacity, pull);
      }
      drawCommander(ctx, t, pull, fallOpacity);
    }
    drawCameraCloud(ctx, t, true);
    drawAir(ctx, t, 0.89 * close, 1.54, true);
    drawCharredFeather(ctx, t);
    pageFinish(ctx);

    subtitle(ctx, '天門失守。', smooth(1.18, 1.74, t) * (1 - smooth(3.98, 4.47, t)));
    subtitle(ctx, '連大天使長，也墜入了深淵。', smooth(6.12, 6.71, t) * (1 - smooth(10.17, 10.77, t)));
    ctx.restore();
    drawAbyssTransition(ctx, t);
  }

  return function render(seconds) {
    const t = Math.max(0, Math.min(timing.duration, seconds));
    if (t >= timing.dissolveEnd) {
      renderSecond(context, t);
      return;
    }
    const dissolve = smooth(0, timing.dissolveEnd, t);
    const drift = t / timing.dissolveEnd;
    context.drawImage(assets.tail, 0, 0);
    context.save();
    context.beginPath();
    context.rect(0, matte, width, height);
    context.clip();
    context.drawImage(assets.tail, -14 * drift, -8 * drift, width + 28 * drift, height + 2 * matte + 16 * drift);
    context.restore();
    renderSecond(incoming, t);
    context.save();
    context.globalAlpha = dissolve;
    context.filter = 'blur(' + (9.5 * (1 - dissolve)).toFixed(2) + 'px)';
    context.drawImage(incoming.canvas, 0, 0);
    context.restore();

    const ash = Math.sin(Math.PI * dissolve);
    context.save();
    context.beginPath();
    context.rect(0, matte, width, height);
    context.clip();
    context.globalAlpha = ash * 0.24;
    context.filter = 'blur(12px)';
    context.drawImage(closeVapour, -68 * dissolve, matte - 29 * dissolve,
      width + 136 * dissolve, height + 58 * dissolve);
    context.restore();
  };
}
