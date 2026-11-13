'use strict';

function makeFeatherFinale(feather, { width, height, lerp, smooth, bloom, random }) {
  const { wideFeatherAt, chestAt, featherLandAt, thirdFadeAt } = OPENING_SHOT_TIMING;
  const tau = Math.PI * 2;
  const chest = { u: 0.689, v: 0.404 };
  const rand = random(837114);
  const motes = Array.from({ length: 30 }, () => ({
    angle: rand() * tau, speed: 7 + rand() * 31, delay: rand() * 0.55, size: 0.55 + rand() * 1.8
  }));
  function drawFeather(ctx, x, y, span, angle, pitch, opacity, blur = 0) {
    const tall = span * feather.height / feather.width;
    ctx.save();
    ctx.globalAlpha *= opacity;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(1, pitch);
    ctx.filter = 'brightness(0.93) saturate(0.79) blur(' + blur.toFixed(2) + 'px)';
    ctx.drawImage(feather, -span * 0.47, -tall * 0.51, span, tall);
    ctx.restore();
  }

  function drawWide(ctx, t, body) {
    if (t < wideFeatherAt) return;
    const s = Math.min(1, (t - wideFeatherAt) / (chestAt - wideFeatherAt));
    const targetX = body.x + body.span * chest.u;
    const targetY = body.y + body.tall * chest.v;
    const wind = Math.sin(Math.PI * s) ** 1.4;
    const drop = smooth(0, 1, s);
    const x = targetX - lerp(width * 0.055, body.span * 0.12, drop) - 270 * wind +
      Math.sin(s * tau * 1.45) * 82 * wind;
    const lensArc = smooth(0, 0.34, s);
    const y = targetY - lerp(height * 0.10, height * 0.38, lensArc) * (1 - drop) -
      body.span * 0.15 * drop +
      Math.sin(s * tau * 1.25) * 21 * wind;
    // Ease away from the lens before the feather falls into the wide composition.
    const depth = lerp(1, 86, s ** 2.10);
    const span = 2480 / depth;
    const lensBlur = 7.4 / (1 + 12 * s);
    const angle = lerp(0.04, 0.73, s) + Math.sin(s * tau * 1.35) * 0.40 * wind;
    const pitch = lerp(0.95, 0.71, s) - wind * 0.49 * Math.sin(s * tau * 1.45) ** 2;

    bloom(ctx, targetX - 28, targetY - 5, 25, 10, '62,37,21', smooth(0.72, 1, s) * 0.17);
    drawFeather(ctx, x, y, span, angle, pitch, smooth(0, 0.028, s), lensBlur);
  }

  function drawChest(ctx, t, body) {
    const zoom = lerp(1.94, 2.11, smooth(chestAt, thirdFadeAt, t));
    const target = {
      x: body.x + body.span * chest.u,
      y: body.y + body.tall * chest.v
    };
    const contact = { x: width * 0.49, y: height * 0.57 };
    ctx.save();
    ctx.translate(contact.x, contact.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-target.x, -target.y);
    body.draw(ctx);
    ctx.restore();

    const s = Math.max(0, Math.min(1, (t - chestAt) / (featherLandAt - chestAt)));
    const drift = (1 - s) ** 1.35;
    const rest = Math.max(0, t - featherLandAt);
    const rise = smooth(0, 0.46, rest);
    const pulse = 0.90 + 0.10 * Math.cos(rest * 3.9);
    const shine = rise * pulse;
    const px = contact.x - 244 * drift + Math.sin(s * tau * 1.35) * 58 * drift;
    const py = contact.y - 313 * drift + Math.sin(s * tau * 1.6) * 21 * drift;
    const span = lerp(169, 131, s);
    const tilt = lerp(0.73, 0.15, s) + Math.sin(s * tau * 1.24) * 0.42 * drift;
    const pitch = lerp(0.71, 0.78, s) + Math.sin(s * tau * 1.60) * 0.28 * drift;

    bloom(ctx, px + 7, contact.y + 7, span * 0.60, 13 + drift * 29, '39,24,17',
      smooth(0.27, 1, s) * 0.70);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    bloom(ctx, contact.x + 4, contact.y + 4, 195, 102, '224,143,60', shine * 0.65);
    bloom(ctx, contact.x + 4, contact.y + 4, 98, 52, '255,210,130', shine * 0.78);
    ctx.restore();
    drawFeather(ctx, px, py, span, tilt, pitch, 1, 0.80 * drift);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const tipX = contact.x + 50;
    const tipY = contact.y - 16;
    bloom(ctx, tipX, tipY, 70, 47, '255,213,123', shine * 0.81);
    bloom(ctx, tipX, tipY, 22, 20, '255,246,204', shine);
    bloom(ctx, tipX, tipY, 7, 6, '255,255,237', shine * 0.91);
    ctx.fillStyle = '#ffe7b1';
    for (const mote of motes) {
      const age = Math.max(0, rest - mote.delay);
      const travel = age * mote.speed;
      const opacity = smooth(0.04, 0.22, age) * (1 - smooth(0.37, 1.58, age));
      ctx.globalAlpha = opacity * 0.65;
      ctx.fillRect(tipX + Math.cos(mote.angle) * travel,
        tipY + Math.sin(mote.angle) * travel * 0.45 - age * 13, mote.size, mote.size);
    }
    ctx.restore();
  }

  return { drawWide, drawChest };
}
