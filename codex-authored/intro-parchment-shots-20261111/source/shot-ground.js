'use strict';

function makeDesertDescent(image, smoke, { width, height, layer, random, lerp, smooth, bloom }) {
  const { thirdDiveAt, thirdGroundAt, thirdFadeAt } = OPENING_SHOT_TIMING;
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
    const settle = 1 - Math.exp(-Math.max(0, t - thirdGroundAt) * 2.35);
    const zoom = Math.max(width / image.width, height / image.height) * (1.13 + 0.13 * entry + 0.02 * settle);
    const w = image.width * zoom;
    const h = image.height * zoom;
    const x = (width - w) / 2 - 22 * settle;
    const y = (height - h) / 2 - 56 * (1 - entry) - 8 * settle;
    const glowX = x + w * 0.523;
    const glowY = y + h * 0.622;
    return { x, y, w, h, glowX, glowY };
  }

  function drawSurface(ctx, t, opacity, projection) {
    if (opacity <= 0) return;
    const { x, y, w, h, glowX, glowY } = projection;
    const elapsed = t - thirdGroundAt;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = 'saturate(0.89)';
    ctx.drawImage(image, x, y, w, h);
    ctx.filter = 'none';
    for (const [baseX, baseY, angle, bw, bh, alpha, wind] of dustStreams) {
      const shift = Math.sin(elapsed * 0.63 + baseX * 0.012) * 33 + elapsed * wind;
      bank(ctx, baseX + shift, baseY + Math.sin(elapsed * 1.02 + baseX) * 12, bw, bh,
        angle * 0.14, alpha * (0.56 + 0.44 * smooth(0, 1.6, elapsed)), wind > 0 ? 1 : -1);
    }

    ctx.globalCompositeOperation = 'screen';
    const flicker = 0.92 + 0.08 * Math.sin(elapsed * 3.6);
    bloom(ctx, glowX, glowY + 19, 203, 51, '219,135,53', flicker * 0.42);
    bloom(ctx, glowX, glowY + 8, 115, 38, '255,196,100', flicker * 0.58);
    bloom(ctx, glowX, glowY, 66, 63, '250,207,131', flicker * 0.70);
    bloom(ctx, glowX, glowY, 24, 24, '255,250,224', flicker);
    bloom(ctx, glowX, glowY, 9, 9, '255,255,249', 1);
    for (const spark of sparks) {
      const cycle = (spark.phase + (elapsed + 1) * spark.rate) % 1;
      const intensity = smooth(0, 0.20, cycle) * (1 - smooth(0.44, 1, cycle));
      const sx = glowX + spark.x * (0.52 + cycle * 0.62) + 21 * cycle;
      const sy = glowY + spark.y - cycle * 53;
      ctx.globalAlpha = opacity * intensity * 0.72;
      ctx.fillStyle = '#ffe7b6';
      ctx.fillRect(sx, sy, spark.size, spark.size);
    }
    ctx.restore();

  }

  return { projectSurface, drawSurface, drawPassage };
}
