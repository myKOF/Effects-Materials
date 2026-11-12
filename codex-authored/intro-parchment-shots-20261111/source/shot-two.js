'use strict';

function makeOpeningSequence(first, assets, helpers) {
  const {
    context, width, height, matte, layer, random, lerp, smooth, bloom, pageFinish,
    dawnFog, templePlacement, templeSpirePlacement, templeFires, drawTempleSmoke, drawTempleFire
  } = helpers;
  const { thirdStart, firstDuration, secondStart, secondDuration, transitionDuration, fallTime, fallClearAt, whiteLightAt } = OPENING_SHOT_TIMING;
  const incoming = layer(width, height + matte * 2, { alpha: false });
  const sky = assets['heaven-sky'];
  const abyss = assets['cloud-abyss'];
  const commander = composeCommander(assets['archangel-fall-regalia'], assets['archangel-hood-edit'], assets['archangel-right-hand']);
  const commanderWing = assets.wing;
  const troops = softenDistantFigures(assets['angels-fall-faces']);
  const smoke = assets['collapse-smoke'];
  const lightCloud = makeLightCloud(smoke);
  const ashPuff = makeAshPuff(smoke, false);
  const ashPuffFlipped = makeAshPuff(smoke, true);

  const landing = { x: width * 0.59, y: height * 0.57 };
  const flashOrigin = { x: width * 0.572, y: matte + height * 0.784 };
  const commanderPose = { centerX: 0.582, centerY: 0.599, backX: 0.567, backY: 0.630 };
  // Anchors follow the painted armor and tabard in the commander cel.
  const commanderBurnSites = [
    // u, v, flame scale, intensity, phase offset, flow deflection
    [0.704, 0.503, 0.103, 1.00, 0.13,  0.03],
    [0.486, 0.568, 0.111, 1.00, 0.62, -0.11],
    [0.661, 0.770, 0.085, 0.93, 1.34,  0.13],
    [0.384, 0.462, 0.093, 0.96, 0.93, -0.19],
    [0.280, 0.292, 0.075, 0.89, 1.75, -0.09],
    [0.371, 0.338, 0.067, 0.78, 1.10, 0.08],
    [0.454, 0.791, 0.052, 0.67, 2.09,  0.14]
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
  const crown = splitSpire(0.38, true);
  const pedestal = splitSpire(0.38, false);
  const distantFires = [templeFires[1], templeFires[3], templeFires[5]];

  function composeCommander(original, editedHood, editedHand) {
    const { width, height } = original;
    if (editedHood.width !== width || editedHood.height !== height) {
      throw new Error('The hood artwork must align with the original commander cel');
    }
    const hood = new Path2D(
      'M1197 509 L1419 510 L1423 800 L1290 800 L1284 745 ' +
      'C1264 724 1240 711 1217 700 C1194 689 1171 684 1148 678 ' +
      'C1129 674 1117 661 1118 647 C1119 628 1128 614 1143 605 ' +
      'C1156 598 1171 589 1179 576 C1187 563 1194 550 1193 536 Z'
    );
    // The lower edge of this mask follows the curved gold cuff on the raised arm.
    const hand = new Path2D(
      'M1050 120 H1280 V320 H1180 ' +
      'C1169 321 1162 306 1144 303 C1127 298 1114 304 1104 313 L1050 318 Z'
    );
    const result = layer(width, height, { alpha: true });
    result.drawImage(original, 0, 0);
    applyCommanderPatch(result, editedHood, hood, [22, 5], 1.8);
    applyCommanderPatch(result, editedHand, hand, [950, 76, 376.2, 376.2], 2.0);
    return result.canvas;
  }

  function applyCommanderPatch(result, image, shape, placement, feather) {
    const { width, height } = result.canvas;
    const mask = layer(width, height, { alpha: true });
    mask.filter = 'blur(' + feather + 'px)';
    mask.fill(shape);

    const patch = layer(width, height, { alpha: true });
    patch.imageSmoothingQuality = 'high';
    patch.drawImage(image, ...placement);
    patch.globalCompositeOperation = 'destination-in';
    patch.drawImage(mask.canvas, 0, 0);

    result.globalCompositeOperation = 'destination-out';
    result.drawImage(mask.canvas, 0, 0);
    result.globalCompositeOperation = 'lighter';
    result.drawImage(patch.canvas, 0, 0);
    result.globalCompositeOperation = 'source-over';
  }

  function softenDistantFigures(image) {
    const ctx = layer(image.width, image.height, { alpha: true });
    ctx.filter = 'blur(5.5px) contrast(0.91) saturate(0.79)';
    ctx.drawImage(image, 0, 0);
    return ctx.canvas;
  }

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
  ].map(([x, y, start, travel, size, pose, depth, endX, endY], i) => ({
    x, y, start, travel, size, pose, depth, endX, endY, phase: i * 0.329
  })).sort((a, b) => a.depth - b.depth);
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

    drawBattleWake(ctx, px, py, scale * 1.16, heading, t, phase, alpha);
    drawLightWings(ctx, px, py, scale * 0.95, heading, t * 0.7, phase, alpha * 0.70);
    ctx.save();
    ctx.globalAlpha = alpha * 0.83;
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

  function drawCommander(ctx, t, pull, seconds, fallOpacity) {
    const fall = projectFall(commanderFlight, t, pull);
    const alpha = fall.visible * fallOpacity;
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
    const fireAlpha = alpha * (1 - smooth(4.0, 6.2, t));

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(0.015 * Math.sin(seconds * 2.3) + pull * 0.068);
    drawCommanderSmoke(ctx, rootX + size * 0.035, rootY - h * 0.04,
      size * 0.24, heading, seconds, alpha * close);
    drawBattleWake(ctx, rootX, rootY, size * lerp(0.21, 0.62, pull), heading,
      seconds, 0.45, alpha * (0.59 + 0.23 * (1 - close)));
    drawCommanderBurning(ctx, x, y, size, h, heading, seconds, fireAlpha, false);
    drawCommanderWings(ctx, rootX, rootY, size, seconds, alpha);
    ctx.globalAlpha = alpha;
    ctx.drawImage(commanderFirelight(seconds, fireAlpha), x, y, size, h);
    ctx.globalAlpha = 1;
    commanderAsh.drawClouds(ctx, x, y, size, h, heading, seconds, fireAlpha);
    drawCommanderBurning(ctx, x, y, size, h, heading, seconds, fireAlpha, true);
    commanderAsh.drawFragments(ctx, x, y, size, h, heading, seconds, fireAlpha);
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
    if (t < whiteLightAt - 1e-9) return;
    const elapsed = Math.max(0, t - whiteLightAt);
    const progress = Math.min(1, elapsed / (secondDuration - whiteLightAt));
    const { x, y } = flashOrigin;
    const radius = 10 + 32 * smooth(0, 0.28, elapsed) + 2180 * progress ** 2.75;
    const light = ctx.createRadialGradient(x, y, 0, x, y, radius);
    light.addColorStop(0, '#fff');
    light.addColorStop(0.22, '#fffff5');
    light.addColorStop(0.49, 'rgba(255,247,219,0.78)');
    light.addColorStop(0.78, 'rgba(255,230,183,0.23)');
    light.addColorStop(1, 'rgba(255,232,190,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = lerp(0.84, 1, smooth(whiteLightAt, whiteLightAt + 0.12, t));
    ctx.fillStyle = light;
    ctx.fillRect(0, matte, width, height);
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
    const fallOpacity = 1 - smooth(fallClearAt - 0.24, fallClearAt, seconds);
    if (fallOpacity > 0) {
      if (group > 0) for (const figure of meteorFlight) drawFallingFigure(ctx, figure, t, group * fallOpacity, pull);
      drawCommander(ctx, t, pull, seconds, fallOpacity);
    }
    drawAir(ctx, seconds, 0.97 * close, 1.67, true);
    pageFinish(ctx);

    subtitle(ctx, '天堂隕落…', smooth(1.19, 1.79, t) * (1 - smooth(3.08, 3.54, t)));
    subtitle(ctx, '聖光將不復存在', smooth(4.0, 4.46, t) * (1 - smooth(6.72, 7.28, t)));
    ctx.restore();
    drawWhiteOpening(ctx, seconds);
  }

  return function render(seconds) {
    const t = Math.max(0, Math.min(thirdStart, seconds));
    if (t <= firstDuration) {
      first(t);
      return;
    }
    const secondTime = t - secondStart;
    if (secondTime >= 0) {
      renderSecond(context, secondTime);
      return;
    }

    const progress = (t - firstDuration) / transitionDuration;
    first(firstDuration, smooth(0, 1, progress));
    renderSecond(incoming, secondTime);
    context.save();
    context.globalAlpha = smooth(0.19, 1, progress);
    context.filter = 'blur(' + (13 * (1 - progress)).toFixed(2) + 'px)';
    context.drawImage(incoming.canvas, 0, 0);
    context.restore();
  };
}
