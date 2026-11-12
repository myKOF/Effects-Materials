'use strict';

function makeTempleAssault({ random, smooth, lerp, bloom, haze, smoke }) {
  const impact = 11.72;
  const breach = { x: 1148, y: 326 };
  const rng = random(48102);
  const wingTeam = [
    { delay: 0.00, x: 0, y: 0, span: 118, pose: 0, phase: 0.3 },
    { delay: 0.22, x: 85, y: 24, span: 91, pose: 1, phase: 1.7 },
    { delay: 0.41, x: 155, y: -16, span: 74, pose: 2, phase: 2.9 },
    { delay: 0.66, x: 230, y: 22, span: 64, pose: 1, phase: 4.4 }
  ];
  const rubble = Array.from({ length: 39 }, () => ({
    delay: rng() * .27,
    dx: -135 + rng() * 189, dy: -40 - rng() * 106,
    size: lerp(2, 12, rng() ** 2), angle: rng() * Math.PI, spin: (rng() - .5) * 7,
    tint: rng() > .58
  }));
  const sparks = Array.from({ length: 66 }, () => ({
    delay: rng() * .27, a: -Math.PI * rng() + .24,
    speed: lerp(35, 242, rng() ** 1.3), life: .21 + rng() * 1.32, size: .56 + rng() * 1.55
  }));
  const dust = Array.from({ length: 53 }, () => ({
    delay: rng() * 1.26, x: 1170 + rng() * 1040, y: 275 + rng() * 558,
    speed: 200 + rng() * 310, phase: rng() * 6.28, size: .55 + rng() ** 3 * 5
  }));
  const clouds = [
    { birth: 0.0, x: -7, rise: 53, drift: -38, w: 135, h: 103 },
    { birth: .14, x: 37, rise: 47, drift: -50, w: 159, h: 119 },
    { birth: .26, x: -42, rise: 70, drift: -57, w: 142, h: 125 },
    { birth: .48, x: 23, rise: 65, drift: -51, w: 157, h: 106 },
    { birth: .80, x: 12, rise: 42, drift: -41, w: 139, h: 106 },
    { birth: 1.27, x: -17, rise: 45, drift: -41, w: 152, h: 103 }
  ];

  function cubic(p0, p1, p2, p3, u) {
    const a = 1 - u;
    return a * a * a * p0 + 3 * a * a * u * p1 + 3 * a * u * u * p2 + u * u * u * p3;
  }
  function wingPosition(t, unit) {
    const flight = t - unit.delay;
    const u = Math.max(0, Math.min(1, (flight - 7.65) / 3.93));
    const leave = Math.max(0, (flight - 11.58) / 2.45);
    const x = leave > 0 ? cubic(1213, 1093, 1037, 835, Math.min(1, leave)) :
      cubic(1785, 1627, 1490, 1213, u);
    const y = leave > 0 ? cubic(302, 339, 259, 202, Math.min(1, leave)) :
      cubic(134, 77, 207, 302, u);
    return {
      x: x + unit.x + 7 * Math.sin(t * 1.36 + unit.phase),
      y: y + unit.y + 3 * Math.sin(t * 3.2 + unit.phase),
      u, leave
    };
  }

  function drawDemon(ctx, image, pose, span, beat) {
    const { x, y, w, h, ax, ay } = pose;
    const step = w / 15;
    const scale = span / w;
    const lift = px => -beat * h * .71 * Math.max(0, Math.abs(px - ax) / w - .105) ** 1.34;
    ctx.scale(scale, scale);
    ctx.translate(-ax, -ay);
    for (let i = 0; i < 15; i++) {
      const px = i * step;
      const offset = lift(px);
      const shear = (lift(px + step) - offset) / step;
      const strip = Math.min(step + .48, w - px);
      ctx.save();
      ctx.transform(1, shear, 0, 1, 0, offset - px * shear);
      ctx.drawImage(image, x + px, y, strip, h, px, 0, strip, h);
      ctx.restore();
    }
  }

  function flight(ctx, image, poses, t) {
    if (t < 7.5 || t >= 15.2) return;
    for (const unit of wingTeam.slice().reverse()) {
      const { x, y, u, leave } = wingPosition(t, unit);
      const visible = smooth(7.76 + unit.delay, 8.8 + unit.delay, t) * (1 - smooth(.68, 1.13, leave));
      const beat = Math.sin(t * (5.1 + unit.pose) + unit.phase) * (.79 - .31 * smooth(.63, .92, u));
      ctx.save();
      ctx.globalAlpha = visible * .85;
      ctx.translate(x, y);
      ctx.rotate(-.11 - .24 * u + .58 * smooth(0, .72, leave) + beat * .033);
      ctx.scale(-1, 1);
      drawDemon(ctx, image, poses[unit.pose][0], unit.span * (1 - u * .29 - Math.min(leave, 1) * .07), beat);
      ctx.restore();
    }
    // A drifting bank occludes the formation at entry. Only the forward silhouettes emerge first.
    ctx.save();
    ctx.globalAlpha = .73 * (1 - smooth(8.3, 10.1, t));
    ctx.drawImage(haze, 1480 - (t - 7.5) * 27, 14 + (t - 7.5) * 14, 624, 252);
    ctx.restore();

    const shot = (t - 11.34) / (impact - 11.34);
    if (shot > 0 && shot < 1) {
      const p = shot ** 1.34;
      const x = lerp(1284, breach.x, p);
      const y = lerp(292, breach.y, p) - 12 * Math.sin(Math.PI * p);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      bloom(ctx, x, y, 21, 12, '248,118,49', .54);
      const tail = ctx.createLinearGradient(x, y, x + 26, y - 8);
      tail.addColorStop(0, 'rgba(255,218,158,.84)');
      tail.addColorStop(.27, 'rgba(249,136,49,.62)');
      tail.addColorStop(1, 'rgba(144,51,26,0)');
      ctx.strokeStyle = tail;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 10, y - 2, x + 26, y - 8);
      ctx.stroke();
      ctx.restore();
    }
  }

  function tower(ctx, image, rect, t) {
    const { x, y, width, height } = rect;
    const age = t - impact;
    if (age <= 0) {
      ctx.drawImage(image, x, y, width, height);
      return;
    }
    const cut = y + 78;
    const edge = [[x, cut + 5], [x + width * .32, cut + 2], [x + width * .44, cut - 6],
      [x + width * .58, cut + 9], [x + width * .68, cut + 2], [x + width, cut - 2]];
    const patch = upper => {
      ctx.beginPath();
      ctx.moveTo(x, upper ? y - 1 : y + height + 1);
      for (const point of edge) ctx.lineTo(...point);
      ctx.lineTo(x + width, upper ? y - 1 : y + height + 1);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(image, x, y, width, height);
    };
    ctx.save();
    patch(false);
    ctx.restore();
    if (age < 1.4) {
      ctx.save();
      const px = x + width * .52, py = cut;
      ctx.translate(px - 14 * age - 27 * age * age, py + 9 * age + 76 * age * age);
      ctx.rotate(-.11 * age - .65 * age * age);
      ctx.translate(-px, -py);
      ctx.globalAlpha *= 1 - smooth(.75, 1.4, age);
      patch(true);
      ctx.restore();
    }
  }

  function beacon(ctx, t) {
    const x = breach.x - 5, y = breach.y - 31;
    const glow = (.81 + .13 * Math.sin(t * 2.4) + .06 * Math.sin(t * 5.4)) *
      (1 - smooth(impact - .09, impact + .30, t));
    if (!glow) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    bloom(ctx, x, y, 23, 25, '167,197,232', glow * .65);
    bloom(ctx, x, y, 9, 12, '225,235,220', glow * .80);
    bloom(ctx, x, y, 4, 5, '255,240,210', glow * .82);
    const shaft = ctx.createLinearGradient(x, y, x, y - 84);
    shaft.addColorStop(0, 'rgba(230,233,217,' + glow * .30 + ')');
    shaft.addColorStop(1, 'rgba(195,214,227,0)');
    ctx.fillStyle = shaft;
    ctx.beginPath();
    ctx.moveTo(x - 2, y);
    ctx.lineTo(x - 15, y - 84);
    ctx.lineTo(x + 13, y - 84);
    ctx.lineTo(x + 2, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function strike(ctx, t) {
    const age = t - impact;
    if (age < 0) return;
    const { x, y } = breach;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const core = smooth(0, .028, age) * (1 - smooth(.13, .53, age));
    bloom(ctx, x, y, 75 + age * 17, 56 + age * 9, '238,111,43', .78 * core);
    bloom(ctx, x, y, 34, 23, '255,201,117', .87 * core);
    bloom(ctx, x, y, 13, 10, '255,239,203', .94 * core);
    ctx.restore();

    for (const cloud of clouds) {
      const dt = age - cloud.birth;
      if (dt <= 0) continue;
      const swell = 1 - Math.exp(-dt * 1.9);
      const w = cloud.w * (.22 + swell * 1.14);
      const h = cloud.h * (.21 + swell * 1.14);
      const cx = x + cloud.x + cloud.drift * dt;
      const cy = y - cloud.rise * dt ** .74;
      ctx.save();
      ctx.globalAlpha = smooth(.03, .29, dt) * (.83 - smooth(.64, 4.6, dt) * .53);
      ctx.drawImage(smoke, cx - w / 2, cy - h / 2, w, h);
      ctx.restore();
    }
    for (const fragment of rubble) {
      const dt = age - fragment.delay;
      if (dt <= 0 || dt > 1.75) continue;
      const size = fragment.size;
      ctx.save();
      ctx.globalAlpha = 1 - smooth(.95, 1.75, dt);
      ctx.translate(x + fragment.dx * dt, y + fragment.dy * dt + 122 * dt ** 2);
      ctx.rotate(fragment.angle + dt * fragment.spin);
      ctx.fillStyle = fragment.tint ? '#94694a' : '#4c3229';
      ctx.beginPath();
      ctx.moveTo(-size * .45, -size * .24);
      ctx.lineTo(size * .22, -size * .5);
      ctx.lineTo(size * .51, size * .08);
      ctx.lineTo(-size * .15, size * .37);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const spark of sparks) {
      const dt = age - spark.delay;
      if (dt <= 0 || dt >= spark.life) continue;
      const vx = Math.cos(spark.a) * spark.speed, vy = Math.sin(spark.a) * spark.speed;
      const sx = x + vx * dt * (1 - dt * .20), sy = y + vy * dt + 52 * dt * dt;
      ctx.strokeStyle = 'rgba(250,159,75,' + (1 - dt / spark.life) ** 1.6 + ')';
      ctx.lineWidth = spark.size;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - vx * .023, sy - (vy + 104 * dt) * .023);
      ctx.stroke();
    }
    ctx.restore();
  }

  function foreground(ctx, t) {
    const age = t - 12.73;
    if (age <= 0) return;
    const front = smooth(0, .46, age) * (1 - .36 * smooth(1.75, 3.27, age));
    ctx.save();
    ctx.globalAlpha = front * .62;
    ctx.drawImage(haze, 1240 - 530 * age, 342 + 32 * age, 1440, 390);
    ctx.globalAlpha = front * .32;
    ctx.drawImage(smoke, 1520 - 578 * age, 470 + 21 * age, 1200, 410);
    ctx.restore();
    for (const fleck of dust) {
      const dt = age - fleck.delay;
      if (dt <= 0) continue;
      const x = fleck.x - dt * fleck.speed, y = fleck.y + dt * 24 + 16 * Math.sin(fleck.phase + dt * 4);
      if (x < -20 || x > 1980) continue;
      const a = smooth(0, .18, dt) * (1 - .43 * smooth(1.15, 2.9, dt));
      ctx.fillStyle = fleck.size < 1.1 ? 'rgba(246,175,101,' + a * .41 + ')' : 'rgba(44,24,22,' + a * .68 + ')';
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(dt * 4 + fleck.phase);
      ctx.fillRect(-fleck.size * .6, 0, fleck.size * 1.8, Math.max(.62, fleck.size * .55));
      ctx.restore();
    }
  }

  return { impact, flight, tower, beacon, strike, foreground };
}
