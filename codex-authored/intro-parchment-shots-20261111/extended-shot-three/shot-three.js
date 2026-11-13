'use strict';

function makeMortalMap(image, groundImage, wideGround, smoke, feather, fallen, { context, width, height, matte, layer, random, lerp, smooth, bloom, pageFinish }) {
  const { thirdDuration, revealAt, revealEnd, starsAt, thirdFogAt, thirdBeamAt, thirdHopeAt,
    thirdDiveAt, thirdGroundAt, thirdFadeAt } = OPENING_SHOT_TIMING;
  const rand = random(103671);
  const descent = makeDesertDescent(groundImage, wideGround, smoke, fallen, { width, height, layer, random, lerp, smooth, bloom });
  const finale = makeFeatherFinale(feather, { width, height, random, lerp, smooth, bloom });
  const { wideAt, chestAt } = OPENING_SHOT_TIMING;
  // Map-space location of the marked desert, west of the buried skeleton.
  const desert = { u: 0.554, v: 0.780 };
  const fog = layer(width / 2, height / 2, { alpha: true });
  const fullMapScale = Math.max(width / image.width, height / image.height) * 1.006;
  const fullMapW = image.width * fullMapScale;
  const fullMapH = image.height * fullMapScale;
  const fullMapX = (width - fullMapW) / 2;
  const fullMapY = (height - fullMapH) / 2 - 3;
  const originalFocus = { x: fullMapX + fullMapW * desert.u, y: fullMapY + fullMapH * desert.v };
  const wardRadius = age => lerp(35, 155, smooth(0.02, 0.78, age));
  const inkW = 384;
  const inkH = 180;
  const ink = layer(inkW, inkH, { alpha: true });
  const pigment = ink.createImageData(inkW, inkH);
  const coast = new Float32Array(inkW * inkH);
  const grain = new Float32Array(coast.length);
  const motion = new Float32Array(coast.length);

  function makeNoise(columns, rows) {
    const values = Array.from({ length: columns * rows }, () => rand());
    return (u, v) => {
      const x = u * (columns - 2);
      const y = v * (rows - 2);
      const i = Math.floor(x);
      const j = Math.floor(y);
      const sx = smooth(0, 1, x - i);
      const sy = smooth(0, 1, y - j);
      const offset = j * columns + i;
      return lerp(lerp(values[offset], values[offset + 1], sx),
        lerp(values[offset + columns], values[offset + columns + 1], sx), sy);
    };
  }

  const broad = makeNoise(12, 8);
  const wisps = makeNoise(38, 20);
  const fibers = makeNoise(95, 48);
  for (let row = 0; row < inkH; row++) {
    for (let col = 0; col < inkW; col++) {
      const u = col / (inkW - 1);
      const v = row / (inkH - 1);
      const i = row * inkW + col;
      const coarse = broad(u, v);
      const fine = wisps(u, v);
      const paper = fibers(u, v);
      // The left bank enters low and the right bank enters high.
      const entry = Math.min(u * 1.06 + 0.08 * (1 - v),
        (1 - u) * 0.98 + 0.09 * v, v * 1.65 + 0.055, (1 - v) * 1.60 + 0.035);
      coast[i] = entry + (coarse - 0.5) * 0.14 + (fine - 0.5) * 0.048 + (paper - 0.5) * 0.016;
      grain[i] = coarse * 0.50 + fine * 0.38 + paper * 0.12;
      motion[i] = u * 20.3 - v * 17.7 + coarse * 6.4 + fine * 1.3;
    }
  }

  const haze = layer(860, 420, { alpha: true });
  haze.filter = 'grayscale(1) brightness(0.84) blur(1.8px)';
  haze.drawImage(smoke, 8, 8, 844, 404);
  haze.filter = 'none';
  haze.globalCompositeOperation = 'source-atop';
  haze.fillStyle = 'rgba(69,37,92,0.59)';
  haze.fillRect(0, 0, 860, 420);

  const banks = [
    // Start and end coordinates of separate drifting cloud cels.
    [-392, 865, 110, 666, 1040, 439, -0.11, 0.96, 0.48, 1],
    [2267, -111, 1810, 139, 1135, 444, -0.14, 1.04, 0.43, -1],
    [2134, 680, 1871, 564, 965, 405, 0.23, 1.48, 0.38, -1],
    [-264, 119, 69, 256, 850, 398, 0.26, 1.65, 0.35, 1],
    [1520, 1093, 1435, 915, 970, 382, -0.18, 1.81, 0.38, -1],
    [332, -257, 435, -4, 1010, 376, -0.02, 1.87, 0.32, 1]
  ];

  const sanctuaries = [
    { x: 0.249, y: 0.240, power: 0.45, extinguish: 6.52, delay: 0.09 },
    { x: 0.313, y: 0.370, power: 0.59, extinguish: 8.15, delay: 0.29 },
    { x: 0.515, y: 0.429, power: 0.50, extinguish: 10.17, delay: 0.78 },
    { x: 0.660, y: 0.391, power: 0.86, extinguish: 9.57, delay: 0.59 },
    { x: 0.775, y: 0.274, power: 0.54, extinguish: 7.23, delay: 0.32 },
    { x: desert.u, y: desert.v, power: 0.32, extinguish: thirdHopeAt, delay: 1.02 }
  ];
  const stars = Array.from({ length: 58 }, (_, index) => {
    const source = sanctuaries[index % sanctuaries.length];
    const angle = rand() * Math.PI * 2;
    const distance = (0.18 + 0.82 * rand() ** 1.7);
    return {
      x: source.x + Math.cos(angle) * distance * 0.064,
      y: source.y + Math.sin(angle) * distance * 0.078,
      delay: source.delay + 0.28 + rand() * 0.73,
      phase: rand() * Math.PI * 2,
      size: 0.65 + rand() ** 2 * 2.15,
      life: 0.58 + rand() * 0.42,
      extinguish: source.extinguish - 0.33 + rand() * 0.54
    };
  });
  const fissures = [
    [0.231, 0.677, 6.30], [0.306, 0.581, 7.84], [0.818, 0.680, 6.91],
    [0.827, 0.418, 7.28], [0.728, 0.244, 8.63], [0.396, 0.781, 9.44]
  ];
  const flecks = Array.from({ length: 44 }, () => ({
    x: rand(), y: rand(), speed: 0.014 + rand() * 0.038,
    size: 0.5 + rand() ** 2 * 1.7, phase: rand() * Math.PI * 2
  }));

  const hopeDust = Array.from({ length: 41 }, () => ({
    angle: rand() * Math.PI * 2, band: rand(), delay: rand() * 0.35,
    swirl: lerp(-0.28, 0.28, rand()), speed: lerp(4, 35, rand()),
    size: lerp(0.8, 2.45, rand()), cool: lerp(0.40, 1.95, rand())
  }));

  function strokeRay(ctx, x, y, length, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.27);
    const ray = ctx.createLinearGradient(0, -length, 0, 0);
    ray.addColorStop(0, 'rgba(255,236,194,0)');
    ray.addColorStop(0.70, 'rgba(255,236,194,' + (opacity * 0.32) + ')');
    ray.addColorStop(1, 'rgba(255,247,224,' + opacity + ')');
    ctx.fillStyle = ray;
    ctx.beginPath();
    ctx.moveTo(-4, 1);
    ctx.lineTo(-14, -length);
    ctx.lineTo(13, -length);
    ctx.lineTo(4, 1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawStarlight(ctx, t, map) {
    const rise = t - starsAt;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const { x, y, power, extinguish, delay } of sanctuaries) {
      const px = map.x + map.w * x;
      const py = map.y + map.h * y;
      const alive = smooth(delay, delay + 0.86, rise) * (1 - smooth(extinguish - 0.26, extinguish + 0.30, t));
      const shiver = smooth(extinguish - 0.62, extinguish, t);
      const opacity = power * alive * (0.86 + 0.14 * Math.sin(t * 2.6 + delay * 15) -
        0.33 * shiver * Math.sin(t * 19 + delay * 20) ** 2);
      if (opacity <= 0) continue;
      bloom(ctx, px, py, 94 * power + 26, 43 * power + 12, '241,177,98', opacity * 0.41);
      bloom(ctx, px, py, 26, 14, '255,224,165', opacity * 0.85);
      strokeRay(ctx, px, py, 52 + power * 79, opacity * 0.77);
      bloom(ctx, px, py, 5.2, 6.5, '255,250,222', opacity);
    }
    for (const star of stars) {
      const lit = smooth(star.delay, star.delay + 0.46, rise) *
        (1 - smooth(star.extinguish - 0.27, star.extinguish + 0.24, t));
      const flicker = 0.51 + 0.49 * Math.sin(star.phase + t * (3 + star.life * 2)) ** 2;
      const x = map.x + map.w * star.x + Math.sin(star.phase + t) * 3;
      const y = map.y + map.h * star.y - (1 - Math.exp(-Math.max(0, rise - star.delay))) * 15;
      const alpha = lit * flicker;
      bloom(ctx, x, y, 7.5, 7.5, '246,187,106', alpha * 0.56);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fff3c5';
      ctx.fillRect(x - star.size * 0.5, y - star.size * 0.5, star.size, star.size);
    }
    ctx.restore();
  }

  function drawInk(ctx, t, view) {
    if (t <= thirdFogAt) return;
    const firstWisps = lerp(-0.034, 0.068, smooth(thirdFogAt, 5.15, t));
    const reach = lerp(firstWisps, 0.465, smooth(4.45, thirdBeamAt - 0.45, t)) +
      0.23 * smooth(thirdBeamAt - 2.15, thirdHopeAt + 1.22, t);
    const data = pigment.data;
    for (let i = 0, p = 0; i < coast.length; i++, p += 4) {
      const density = grain[i];
      const dx = (i % inkW) * (width / (inkW - 1)) - originalFocus.x;
      const dy = Math.floor(i / inkW) * (height / (inkH - 1)) - originalFocus.y;
      const distance = Math.sqrt(dx * dx + dy * dy * 1.55);
      const desertDelay = 0.252 * (1 - smooth(46, 365, distance));
      const edge = reach - coast[i] - desertDelay + 0.019 * Math.sin(motion[i] + t * 2.15);
      const spread = smooth(-0.051, 0.102, edge);
      const rim = smooth(-0.048, 0.008, edge) * (1 - smooth(0.009, 0.090, edge));
      data[p] = 24 + density * 29 + rim * 46;
      data[p + 1] = 13 + density * 15 + rim * 20;
      data[p + 2] = 36 + density * 37 + rim * 56;
      data[p + 3] = (spread * (0.70 + 0.22 * density) + rim * 0.14) * 255;
    }
    ink.putImageData(pigment, 0, 0);
    const w = width * view.scale;
    const h = height * view.scale;
    ctx.drawImage(ink.canvas, view.x, view.y, w, h);
    // Continue the bottom fog bank when the camera frames the southern desert.
    const bottom = view.y + h;
    if (bottom < height) {
      ctx.drawImage(ink.canvas, 0, inkH - 2, inkW, 2, view.x, bottom - 1, w, height - bottom + 1);
    }

    ctx.save();
    ctx.translate(view.x, view.y);
    ctx.scale(view.scale, view.scale);
    for (const [sx, sy, ex, ey, w, h, angle, delay, opacity, direction] of banks) {
      const start = thirdFogAt - 0.78 + delay;
      const travel = smooth(start, thirdHopeAt + 1.0, t);
      const rise = smooth(start, start + 1.55, t);
      if (rise <= 0) continue;
      ctx.save();
      ctx.translate(lerp(sx, ex, travel), lerp(sy, ey, travel) + 7 * Math.sin(t * 2 + start));
      ctx.rotate(angle + 0.035 * Math.sin(t * 1.5 + start));
      ctx.scale(direction, 1);
      ctx.globalAlpha = opacity * rise;
      ctx.drawImage(haze.canvas, -w * 0.5, -h * 0.5, w, h);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawShadowPulses(ctx, t, map) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const [u, v, start] of fissures) {
      const age = t - start;
      const pulse = smooth(0, 0.27, age) * (1 - smooth(1.12, 3.90, age)) *
        (0.45 + 0.55 * Math.sin(age * 3.2) ** 2);
      if (pulse <= 0) continue;
      const x = map.x + map.w * u;
      const y = map.y + map.h * v;
      bloom(ctx, x, y, 31, 21, '156,75,157', 0.49 * pulse);
      bloom(ctx, x, y, 8, 3.8, '232,140,188', 0.72 * pulse);
    }
    const rise = smooth(2.1, 6.85, t);
    ctx.fillStyle = '#c998bf';
    for (const f of flecks) {
      const x = f.x * width + Math.sin(t * 1.4 + f.phase) * 20;
      const drift = (f.y + 1 - ((t - thirdFogAt) * f.speed % 1)) % 1;
      const y = drift * height;
      const edge = 1 - smooth(0.19, 0.42, Math.min(f.x, 1 - f.x, f.y, 1 - f.y));
      ctx.globalAlpha = rise * edge * smooth(0, 0.10, drift) * (1 - smooth(0.84, 1, drift)) *
        (0.20 + 0.38 * Math.sin(f.phase + t * 2.4) ** 2);
      ctx.fillRect(x, y, f.size, f.size);
    }
    ctx.restore();
  }


  function drawFallingBeam(ctx, t, focus) {
    if (t < thirdBeamAt || t > thirdHopeAt + 0.75) return;
    const travel = smooth(thirdBeamAt, thirdHopeAt, t);
    const age = Math.max(0, t - thirdHopeAt);
    const strength = smooth(thirdBeamAt, thirdBeamAt + 0.09, t) * Math.exp(-age * 3.8);
    const skyX = focus.x + 154;
    const skyY = -110;
    const headX = lerp(skyX, focus.x, travel);
    const headY = lerp(skyY, focus.y, travel);
    const trail = lerp(85, focus.y + 125, travel) * lerp(1, 0.25, smooth(0, 0.72, age));

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.translate(headX, headY);
    ctx.rotate(Math.atan2(focus.y - skyY, focus.x - skyX) - Math.PI * 0.5);
    const light = ctx.createLinearGradient(0, -trail, 0, 16);
    light.addColorStop(0, 'rgba(255,219,153,0)');
    light.addColorStop(0.37, 'rgba(255,219,153,0.25)');
    light.addColorStop(0.84, 'rgba(255,239,198,0.91)');
    light.addColorStop(0.96, 'rgba(255,254,230,1)');
    light.addColorStop(1, 'rgba(255,250,223,0)');
    ctx.fillStyle = light;
    ctx.globalAlpha = 0.73 * strength;
    ctx.filter = 'blur(20px)';
    ctx.beginPath();
    ctx.moveTo(-65, -trail);
    ctx.lineTo(83, -trail);
    ctx.quadraticCurveTo(51, -trail * 0.32, 9, 5);
    ctx.lineTo(-10, 5);
    ctx.quadraticCurveTo(-37, -trail * 0.32, -65, -trail);
    ctx.fill();
    ctx.filter = 'blur(2px)';
    ctx.globalAlpha = strength;
    for (const [offset, breadth] of [[0, 14], [-17, 4], [24, 5], [38, 2]]) {
      ctx.beginPath();
      ctx.moveTo(offset * 1.58 - breadth, -trail);
      ctx.lineTo(offset * 1.58 + breadth, -trail);
      ctx.lineTo(offset * 0.12 + 2, 8);
      ctx.lineTo(offset * 0.12 - 2, 8);
      ctx.fill();
    }
    ctx.filter = 'none';
    bloom(ctx, 0, 0, 19, 27, '255,250,220', strength);
    ctx.restore();
  }

  function drawHope(ctx, t, focus) {
    const age = t - thirdHopeAt;
    if (age < 0) return;
    const strength = smooth(0, 0.12, age);
    const flash = strength * Math.exp(-age * 4.6);
    const guard = smooth(0.03, 0.46, age);
    const radius = wardRadius(age) * (focus.zoom || 1);
    const { x, y } = focus;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    bloom(ctx, x, y, radius * 1.38, radius * 0.94, '251,172,73', strength * 0.42 + flash * 0.32);
    bloom(ctx, x, y, 62 + flash * 41, 53 + flash * 33, '255,224,145', strength * 0.69);
    bloom(ctx, x, y, 27 + flash * 17, 27 + flash * 17, '255,250,217', strength);
    bloom(ctx, x, y, 12, 12, '255,255,244', strength);

    ctx.translate(x, y);
    ctx.scale(1, 0.69);
    const rim = smooth(0.30, 1.10, age);
    const collision = smooth(0.32, 0.78, age) * (1 - smooth(1.26, 2.85, age));
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.97, 0, 2 * Math.PI);
    ctx.lineWidth = Math.max(1.4, (focus.zoom || 1) * 1.5);
    ctx.strokeStyle = 'rgba(255,202,118,' + 0.30 * rim + ')';
    ctx.stroke();
    // The light holds while two illuminated fronts bend around its edge.
    for (const direction of [-1, 1]) {
      const angle = Math.PI * 0.53 + direction * lerp(0.22, 2.87, smooth(0.34, 2.20, age));
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.95, angle - 0.38, angle + 0.38);
      ctx.lineWidth = Math.max(2, (focus.zoom || 1) * 2.8);
      ctx.strokeStyle = 'rgba(255,208,127,' + (rim * 0.28 + collision * 0.40) + ')';
      ctx.stroke();
      bloom(ctx, Math.cos(angle) * radius, Math.sin(angle) * radius,
        27 * (focus.zoom || 1), 19 * (focus.zoom || 1), '255,183,92', 0.67 * collision);
    }
    for (const ember of hopeDust) {
      const turn = ember.angle + age * ember.swirl;
      const release = smooth(ember.delay, ember.delay + 0.19, age);
      const distance = radius * (0.52 + ember.band * 0.49) * guard + age * ember.speed;
      const shine = release * Math.exp(-age * ember.cool) * (0.55 + 0.45 * Math.sin(turn * 5 + age * 5) ** 2);
      const px = Math.cos(turn) * distance;
      const py = Math.sin(turn) * distance;
      bloom(ctx, px, py, 6.5, 6.5, '255,206,115', shine * 0.72);
      ctx.globalAlpha = shine;
      ctx.fillStyle = '#fff2bf';
      ctx.fillRect(px, py, ember.size, ember.size);
    }
    ctx.restore();
  }

  function drawFog(ctx, t, focus, view) {
    fog.clearRect(0, 0, fog.canvas.width, fog.canvas.height);
    fog.save();
    fog.scale(0.5, 0.5);
    drawInk(fog, t, view);
    const age = t - thirdHopeAt;
    const ward = smooth(0, 0.31, age);
    if (ward > 0) {
      const radius = wardRadius(age) * (focus.zoom || 1);
      fog.translate(focus.x, focus.y);
      fog.scale(1, 0.69);
      const opening = fog.createRadialGradient(0, 0, radius * 0.82, 0, 0, radius * 1.10);
      opening.addColorStop(0, 'rgba(0,0,0,1)');
      opening.addColorStop(0.56, 'rgba(0,0,0,0.94)');
      opening.addColorStop(1, 'rgba(0,0,0,0)');
      fog.globalCompositeOperation = 'destination-out';
      fog.globalAlpha = ward;
      fog.fillStyle = opening;
      fog.fillRect(-radius * 1.1, -radius * 1.1, radius * 2.2, radius * 2.2);
    }
    fog.restore();
    ctx.drawImage(fog.canvas, 0, 0, width, height);
  }


  function subtitles(ctx, t) {
    const first = smooth(6.68, 7.08, t) * (1 - smooth(10.72, 11.24, t));
    const second = smooth(thirdHopeAt + 0.34, thirdHopeAt + 0.79, t) *
      (1 - smooth(thirdDiveAt - 0.72, thirdDiveAt - 0.17, t));
    const opacity = Math.max(first, second);
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = opacity * 0.54;
    const shade = ctx.createLinearGradient(0, 731, 0, height);
    shade.addColorStop(0, 'rgba(18,9,16,0)');
    shade.addColorStop(1, 'rgba(18,9,16,0.85)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 731, width, height - 731);
    ctx.font = '700 47px "Noto Serif TC", "Microsoft JhengHei", MingLiU, serif';
    ctx.letterSpacing = '0.18em';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(22,11,8,0.90)';
    ctx.fillStyle = '#f7e5be';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.8;
    ctx.shadowColor = 'rgba(16,9,7,0.87)';
    ctx.shadowBlur = 18;
    const line = first > second ? '黑暗蔓延至薩爾維恩。' : '荒漠深處，仍有一點光。';
    ctx.globalAlpha = opacity;
    ctx.strokeText(line, width * 0.5, 810);
    ctx.fillText(line, width * 0.5, 810);
    ctx.restore();
  }

  return function renderMortalMap(seconds) {
    const t = Math.max(0, seconds);
    const ctx = context;
    const push = smooth(1.2, thirdDiveAt, t);
    const groundOpacity = smooth(thirdDiveAt + 0.88, thirdGroundAt, t);
    const dive = smooth(thirdDiveAt, thirdGroundAt, t);
    const diveZoom = 1 + 5.7 * dive ** 2.65;
    const preDive = lerp(1, 1.26, push);
    const preW = fullMapW * preDive;
    const preH = fullMapH * preDive;
    const preX = (width - preW) / 2 - 47 * push;
    const preY = (height - preH) / 2 - 3 - 118 * push;
    const surface = descent.projectSurface(t);
    const alignment = smooth(thirdDiveAt, thirdDiveAt + 0.86, t);
    const focus = {
      x: lerp(preX + preW * desert.u, surface.glowX, alignment),
      y: lerp(preY + preH * desert.v, surface.glowY, alignment),
      zoom: diveZoom
    };
    const magnification = preDive * diveZoom;
    const w = fullMapW * magnification;
    const h = fullMapH * magnification;
    const map = { x: focus.x - w * desert.u, y: focus.y - h * desert.v, w, h };
    const view = { x: map.x - fullMapX * magnification, y: map.y - fullMapY * magnification, scale: magnification };
    ctx.fillStyle = '#0b0807';
    ctx.fillRect(0, 0, width, height + matte * 2);
    ctx.save();
    ctx.translate(0, matte);
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();
    ctx.imageSmoothingQuality = 'high';
    if (groundOpacity < 1) {
      const blur = smooth(1.33, 4.3, diveZoom) * 7;
      ctx.filter = 'saturate(0.81) sepia(0.10) blur(' + blur.toFixed(2) + 'px)';
      ctx.drawImage(image, map.x, map.y, map.w, map.h);
      ctx.filter = 'none';
      drawStarlight(ctx, t, map);
      drawFog(ctx, t, focus, view);
      drawShadowPulses(ctx, t, map);
      drawFallingBeam(ctx, t, focus);
      drawHope(ctx, t, focus);
    }
    if (t >= chestAt) {
      const body = descent.bodyBounds(surface);
      finale.drawChest(ctx, t, { ...body, draw: target => descent.drawSurface(target, t, 1, surface) });
    } else if (t >= wideAt) {
      const wide = descent.projectWide(smooth(wideAt, chestAt, t));
      descent.drawSurface(ctx, t, 1, wide);
      finale.drawWide(ctx, t, descent.bodyBounds(wide));
    } else {
      descent.drawSurface(ctx, t, groundOpacity, surface);
      descent.drawPassage(ctx, t, focus);
    }
    pageFinish(ctx);
    subtitles(ctx, t);
    ctx.restore();

    const darkness = Math.max(1 - smooth(revealAt, revealEnd, t), smooth(thirdFadeAt, thirdDuration - 0.10, t));
    if (darkness > 0) {
      ctx.save();
      ctx.globalAlpha = darkness;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height + 2 * matte);
      ctx.restore();
    }
  };
}
