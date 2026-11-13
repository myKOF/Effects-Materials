'use strict';

function makeDesertDescent(image, wideGround, smoke, fallen, { width, height, layer, random, lerp, smooth, bloom }) {
  const { thirdDiveAt, thirdGroundAt, groundLightOut, revealBodyAt,
    revealBodyEnd, pushInStart, pushInEnd, thirdFadeAt } = OPENING_SHOT_TIMING;
  const light = { u: 0.523, v: 0.622 };
  const dust = layer(720, 350, { alpha: true });
  dust.filter = 'grayscale(1) brightness(1.03) blur(2.2px)';
  dust.drawImage(smoke, 8, 8, 704, 334);
  dust.filter = 'none';
  dust.globalCompositeOperation = 'source-atop';
  dust.fillStyle = 'rgba(159,103,64,0.57)';
  dust.fillRect(0, 0, 720, 350);

  const sand = random(84917);
  const grains = Array.from({ length: 103 }, () => ({
    angle: sand() * Math.PI * 2, depth: sand(),
    life: 0.64 + sand() * 0.47, phase: sand(),
    brightness: 0.16 + sand() * 0.44, size: 0.48 + sand() * 1.25
  }));
  const dustStreams = [
    [-120, 540, 0.48, 1070, 126, 0.34, 160],
    [1670, 579, -0.67, 1220, 145, 0.43, -208],
    [450, 770, 0.87, 1280, 164, 0.38, 226],
    [1710, 845, -0.94, 1040, 140, 0.37, -255]
  ];
  const sparks = Array.from({ length: 32 }, () => ({
    x: (sand() - 0.5) * 266, y: (sand() - 0.5) * 46, phase: sand(),
    rate: 0.42 + sand() * 0.79, size: 0.55 + sand() * 1.36
  }));
  const driftingSand = Array.from({ length: 146 }, () => ({
    phase: sand(), depth: sand(), offset: sand(), gust: sand(), size: 0.6 + sand() * 1.8
  }));

  const bodySand = Array.from({ length: 94 }, () => ({
    phase: sand(), lane: sand(), speed: sand(), lift: sand(), size: 0.35 + sand() ** 1.7 * 2.1
  }));
  const bodySmoke = [
    [0.47, 0.48, 0.49, 0.29, 0.68, 0.00],
    [0.66, 0.38, 0.36, 0.38, 0.58, 0.34],
    [0.22, 0.56, 0.39, 0.25, 0.40, 0.71],
    [0.70, 0.73, 0.41, 0.27, 0.36, 0.56]
  ];
  const ashSmoke = layer(512, 256, { alpha: true });
  ashSmoke.filter = 'grayscale(1) brightness(0.73) blur(3px)';
  ashSmoke.drawImage(smoke, 9, 9, 494, 238);
  ashSmoke.filter = 'none';
  ashSmoke.globalCompositeOperation = 'source-atop';
  ashSmoke.fillStyle = 'rgba(105,83,70,0.38)';
  ashSmoke.fillRect(0, 0, 512, 256);
  const bodyCel = layer(fallen.width, fallen.height, { alpha: true });
  bodyCel.filter = 'brightness(0.97) saturate(0.91)';
  bodyCel.drawImage(fallen, 0, 0);

  const dustCloud = layer(272, 144, { alpha: true });
  const cloudPixels = dustCloud.createImageData(dustCloud.canvas.width, dustCloud.canvas.height);
  const cloudRandom = random(316527);
  const cloudNoise = Array.from({ length: 24 * 17 }, () => cloudRandom());

  function sampleCloud(u, v) {
    const x = ((u % 1) + 1) % 1 * 23;
    const y = ((v % 1) + 1) % 1 * 16;
    const col = Math.floor(x), row = Math.floor(y);
    const mixX = smooth(0, 1, x - col), mixY = smooth(0, 1, y - row);
    const i = row * 24 + col;
    return lerp(lerp(cloudNoise[i], cloudNoise[i + 1], mixX),
      lerp(cloudNoise[i + 24], cloudNoise[i + 25], mixX), mixY);
  }

  function bank(ctx, x, y, w, h, angle, opacity, direction) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(direction, 1);
    ctx.globalAlpha *= opacity;
    ctx.drawImage(dust.canvas, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function drawPassage(ctx, t, focus) {
    const density = smooth(thirdDiveAt + 0.38, thirdDiveAt + 0.86, t) *
      (1 - smooth(thirdDiveAt + 0.93, thirdGroundAt + 0.17, t));
    if (density <= 0) return;
    const time = t - thirdDiveAt;
    const veil = ctx.createRadialGradient(focus.x, focus.y, 36, focus.x, focus.y, width * 0.70);
    veil.addColorStop(0, 'rgba(229,175,114,' + 0.29 * density + ')');
    veil.addColorStop(0.32, 'rgba(121,81,66,' + 0.36 * density + ')');
    veil.addColorStop(1, 'rgba(46,25,45,' + 0.79 * density + ')');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, width, height);

    bank(ctx, lerp(-260, 420, time), lerp(160, 820, time), 1570, 394, -0.15, density * 0.73, 1);
    bank(ctx, lerp(2150, 1580, time), lerp(280, 875, time), 1440, 350, 0.19, density * 0.74, -1);
    bank(ctx, focus.x + 260, lerp(140, 1120, time), 1800, 390, -0.07, density * 0.48, -1);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#efd1a3';
    for (const grain of grains) {
      const cycle = (grain.phase + time * grain.life) % 1;
      const vx = Math.cos(grain.angle);
      const vy = Math.sin(grain.angle) * 0.59;
      const distance = (60 + 1440 * cycle ** 2.35) * (0.73 + 0.27 * grain.depth);
      const x = focus.x + vx * distance;
      const y = focus.y + vy * distance;
      const streak = (7 + 41 * grain.depth) * cycle * density;
      ctx.globalAlpha = density * grain.brightness * smooth(0.03, 0.26, cycle) * (1 - smooth(0.76, 1, cycle));
      ctx.lineWidth = grain.size;
      ctx.beginPath();
      ctx.moveTo(x - vx * streak, y - vy * streak);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function projectSurface(t) {
    const entry = smooth(thirdDiveAt + 0.77, thirdGroundAt + 0.92, t);
    const follow = smooth(pushInStart, pushInEnd, t);
    const linger = smooth(pushInEnd, thirdFadeAt, t);
    const cover = Math.max(width / image.width, height / image.height);
    const zoom = 1.12 + 0.12 * entry + 2.02 * follow + 0.20 * linger;
    const w = image.width * cover * zoom;
    const h = image.height * cover * zoom;
    const wideW = image.width * cover * (1.12 + 0.12 * entry);
    const wideH = image.height * cover * (1.12 + 0.12 * entry);
    const wideX = (width - wideW) / 2 + wideW * light.u;
    const wideY = (height - wideH) / 2 - 56 * (1 - entry) + wideH * light.v;
    const glowX = lerp(wideX, width * 0.545, follow) - 27 * linger;
    const glowY = lerp(wideY, height * 0.548, follow) - 5 * linger;
    return { x: glowX - w * light.u, y: glowY - h * light.v, w, h, glowX, glowY, zoom };
  }

  function projectWide(progress) {
    // The high desert plate has its own projection. Keep the original character cel.
    const cover = Math.max(width / wideGround.width, height / wideGround.height);
    const zoom = cover * lerp(1.035, 1.078, progress);
    const w = wideGround.width * zoom;
    const h = wideGround.height * zoom;
    const x = (width - w) * 0.5 - 13 * progress;
    const y = (height - h) * 0.5 + 4 * progress;
    return { x, y, w, h, glowX: x + w * 0.522, glowY: y + h * 0.565,
      bodySpan: w * 0.135, background: wideGround };
  }

  function bodyBounds({ w, glowX, glowY, bodySpan = w * 0.173 }) {
    const span = bodySpan;
    const tall = span * fallen.height / fallen.width;
    return { x: glowX - span * 0.53, y: glowY - tall * 0.48, span, tall };
  }

  function drawFallen(ctx, body) {
    const { x, y, span, tall } = body;
    bloom(ctx, x + span * 0.53, y + tall * 0.67, span * 0.51, tall * 0.24, '41,25,21', 0.55);
    ctx.drawImage(bodyCel.canvas, x, y, span, tall);
  }

  function drawBodyDust(ctx, t, body, reveal) {
    const exposure = smooth(0.04, 0.57, reveal);
    if (exposure <= 0) return;
    const { x, y, span, tall } = body;
    const time = t - revealBodyAt;
    for (const [u, v, w, h, power, phase] of bodySmoke) {
      const cycle = (phase + time * 0.29) % 1;
      const density = Math.sin(Math.PI * cycle) ** 1.15;
      const px = x + span * (u - 0.13 + 0.44 * cycle);
      const py = y + tall * (v - 0.14 * cycle);
      const smokeWidth = span * w * (0.79 + cycle * 0.36);
      const smokeHeight = tall * h * (0.74 + cycle * 0.52);
      ctx.save();
      ctx.globalAlpha *= exposure * density * power;
      ctx.translate(px, py);
      ctx.rotate(-0.11);
      ctx.drawImage(ashSmoke.canvas, -smokeWidth / 2, -smokeHeight / 2, smokeWidth, smokeHeight);
      ctx.restore();
    }

    ctx.save();
    const opacity = ctx.globalAlpha;
    ctx.lineCap = 'round';
    for (const grain of bodySand) {
      const cycle = (grain.phase + time * (0.32 + grain.speed * 0.35)) % 1;
      const px = x + span * (-0.13 + 1.34 * cycle);
      const py = y + tall * (0.40 + grain.lane * 0.53 - 0.16 * grain.lift * Math.sin(Math.PI * cycle));
      const gust = 0.60 + 0.40 * Math.sin(t * 1.12 + grain.lane * 5) ** 2;
      const flicker = Math.sin(Math.PI * cycle) ** 2;
      ctx.globalAlpha = opacity * exposure * gust * flicker * (0.21 + grain.lift * 0.49);
      ctx.strokeStyle = grain.lift > 0.60 ? '#efcca0' : '#be9062';
      ctx.lineWidth = grain.size * span / 1050;
      ctx.beginPath();
      ctx.moveTo(px - span * (0.003 + 0.013 * grain.speed), py + 0.7);
      ctx.lineTo(px, py);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRevealCloud(ctx, body, reveal, t) {
    if (reveal >= 1) return;
    const { x, y, span, tall } = body;
    const { width: cols, height: rows } = dustCloud.canvas;
    const { data } = cloudPixels;
    const age = t - thirdGroundAt;
    const wind = reveal * 0.28;
    const edge = lerp(-0.45, 1.78, reveal);
    const strength = 1 - smooth(0.62, 1, reveal);
    for (let row = 0; row < rows; row++) {
      const v = -0.52 + row / (rows - 1) * 2.02;
      for (let col = 0; col < cols; col++) {
        const u = -0.60 + col / (cols - 1) * 2.52;
        const i = (row * cols + col) * 4;
        const fold = sampleCloud(u * 0.36 - age * 0.042, v * 0.58 + 0.26);
        const wisps = sampleCloud(u * 0.88 - age * 0.091, v * 0.93 + u * 0.17);
        const turbulence = (fold - 0.5) * 0.63 + (wisps - 0.5) * 0.26;
        const radius = Math.hypot((u - 0.50 - wind) / 0.94, (v - 0.51) / 0.85);
        const volume = 1 - smooth(0.66, 1.14, radius + turbulence * 0.64);
        // Wind strips the upstream edge first. The centre is opaque until the front reaches it.
        const front = smooth(edge - 0.20, edge + 0.14, u + turbulence);
        const warmCore = 1 - smooth(0, 0.73, Math.hypot((u - 0.53 - wind * 0.38) / 0.82, (v - 0.48) / 1.10));
        const backlight = warmCore * (1 - smooth(thirdGroundAt, groundLightOut, t));
        const texture = fold * 0.68 + wisps * 0.32;
        data[i] = 153 + 55 * texture + 46 * backlight;
        data[i + 1] = 104 + 53 * texture + 57 * backlight;
        data[i + 2] = 64 + 48 * texture + 58 * backlight;
        data[i + 3] = Math.round(volume * front * strength * 255);
      }
    }
    dustCloud.putImageData(cloudPixels, 0, 0);
    ctx.save();
    ctx.filter = 'blur(' + Math.max(3.5, span * 0.008).toFixed(2) + 'px)';
    ctx.drawImage(dustCloud.canvas, x - span * 0.60, y - tall * 0.52, span * 2.52, tall * 2.02);
    ctx.restore();

    const strand = (1 - reveal) * 0.41;
    bank(ctx, x + span * (0.44 + 0.70 * reveal), y + tall * 0.66,
      span * 1.87, tall * 0.67, -0.09, strand, 1);
    bank(ctx, x + span * (0.58 + 0.83 * reveal), y + tall * 0.33,
      span * 1.57, tall * 0.69, 0.11, strand * 0.83, -1);

    const glow = 1 - smooth(thirdGroundAt, groundLightOut, t);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    bloom(ctx, x + span * 0.53, y + tall * 0.48, span * 0.40, tall * 0.62, '242,174,93', glow * 0.44);
    bloom(ctx, x + span * 0.53, y + tall * 0.48, span * 0.10, tall * 0.24, '255,231,172', glow * 0.67);
    ctx.restore();
  }

  function drawSand(ctx, elapsed, close) {
    ctx.save();
    ctx.strokeStyle = '#e8ba86';
    ctx.lineCap = 'round';
    for (const grain of driftingSand) {
      const phase = (grain.phase + elapsed * (0.07 + grain.gust * 0.10) + 1) % 1;
      const x = lerp(-85, width + 90, phase);
      const y = height * lerp(0.59, 0.98, grain.depth) +
        15 * Math.sin(grain.offset * 13 + phase * 4.7);
      const visibility = Math.sin(Math.PI * phase) ** 2;
      const gust = 0.48 + 0.52 * Math.sin(elapsed * 0.78 + grain.gust * 5) ** 2;
      ctx.globalAlpha = close * visibility * gust * lerp(0.07, 0.31, grain.depth);
      ctx.lineWidth = grain.size * lerp(0.45, 1.05, grain.depth);
      ctx.beginPath();
      ctx.moveTo(x - grain.depth * 14, y + 0.8);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSurface(ctx, t, opacity, projection) {
    if (opacity <= 0) return;
    const { x, y, w, h, glowX, glowY, background = image } = projection;
    const elapsed = t - thirdGroundAt;
    const reveal = smooth(revealBodyAt, revealBodyEnd, t);

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = 'saturate(0.89)';
    ctx.drawImage(background, x, y, w, h);
    ctx.filter = 'none';
    const body = bodyBounds(projection);
    drawFallen(ctx, body);
    drawBodyDust(ctx, t, body, reveal);
    for (const [baseX, baseY, angle, bw, bh, alpha, wind] of dustStreams) {
      const span = width + bw;
      const position = (((baseX + bw / 2 + elapsed * wind) % span) + span) % span - bw / 2;
      bank(ctx, position, baseY + Math.sin(elapsed * 1.02 + baseX) * 12, bw, bh,
        angle * 0.14, alpha * (0.50 + 0.32 * smooth(0, 1.6, elapsed)), wind > 0 ? 1 : -1);
    }

    drawRevealCloud(ctx, body, reveal, t);
    drawSand(ctx, elapsed, smooth(0.5, 2.7, elapsed));
    ctx.globalCompositeOperation = 'screen';
    for (const spark of sparks) {
      const cycle = (spark.phase + (elapsed + 1) * spark.rate) % 1;
      const intensity = smooth(0, 0.20, cycle) * (1 - smooth(0.44, 1, cycle));
      const sx = glowX + spark.x * (0.50 + cycle * 0.53) * body.span / 420 + 21 * cycle;
      const sy = glowY + spark.y * body.tall / 220 - cycle * 53;
      ctx.globalAlpha = opacity * intensity * 0.35 * (1 - smooth(thirdGroundAt, groundLightOut, t));
      ctx.fillStyle = '#ffe7b6';
      ctx.fillRect(sx, sy, spark.size, spark.size);
    }
    ctx.restore();

  }

  return { projectSurface, projectWide, drawSurface, drawPassage, bodyBounds };
}
