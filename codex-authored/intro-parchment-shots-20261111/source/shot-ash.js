'use strict';

function makeCommanderAsh(combustion, random, lerp, smooth, bloom) {
  const rng = random(411283);
  const tau = Math.PI * 2;
  const clouds = [
    // Origin on the body, spread, flow angle, density and phase.
    [0.476, 0.580, 0.167, -0.24, 0.91, 0.13],
    [0.487, 0.451, 0.150,  0.12, 0.91, 0.79],
    [0.367, 0.409, 0.142, -0.22, 0.83, 1.36],
    [0.352, 0.272, 0.119,  0.07, 0.75, 1.92],
    [0.234, 0.253, 0.106, -0.21, 0.69, 0.54]
  ];
  const emitters = [
    [0.448, 0.523], [0.382, 0.443], [0.303, 0.343], [0.286, 0.240], [0.493, 0.579]
  ];
  const fragments = Array.from({ length: 66 }, (_, i) => {
    const angles = [-2.91, -2.32, -1.52, -0.68, 0.09, 0.86, 1.71, 2.49];
    return {
      anchor: emitters[i % emitters.length],
      phase: rng(),
      period: lerp(0.88, 1.95, rng()),
      distance: lerp(0.14, 0.49, rng()),
      spread: lerp(-0.22, 0.27, rng()),
      width: lerp(0.0034, 0.0165, rng() ** 1.7) * (i % 8 === 0 ? 1.42 : 1),
      spin: (rng() - 0.5) * 18,
      flutter: lerp(4.1, 10.1, rng()),
      tilt: rng() * tau,
      aspect: lerp(0.46, 0.96, rng()),
      shape: angles.map((angle, j) => {
        const edge = lerp(0.71, 1.21, rng()) * (j % 3 === 1 ? 0.86 : 1);
        return [Math.cos(angle) * edge, Math.sin(angle) * edge];
      }),
      hot: rng() > 0.21
    };
  });

  function drawClouds(ctx, x, y, width, height, heading, t, alpha) {
    if (alpha <= 0.001) return;
    for (const [u, v, span, angle, density, phase] of clouds) {
      const pulse = 0.89 + 0.11 * Math.sin(t * 3.4 + phase * 5.2);
      ctx.save();
      ctx.translate(x + width * u, y + height * v);
      ctx.rotate(heading + angle + 0.052 * Math.sin(t * 3.0 + phase));
      ctx.scale(1.03, 1.35);
      ctx.globalAlpha = alpha * density * pulse;
      combustion.smoke(ctx, width * span, t * 0.86 + phase);
      ctx.globalAlpha = alpha * density * 0.47;
      ctx.translate(-width * span * 0.13, width * span * 0.30);
      ctx.rotate(-0.19);
      combustion.smoke(ctx, width * span * 0.92, t * 0.93 + phase + 0.54);
      ctx.restore();
    }
  }

  function drawFragments(ctx, x, y, width, height, heading, t, alpha) {
    if (alpha <= 0.001) return;
    const flowX = Math.cos(heading);
    const flowY = Math.sin(heading);
    for (const f of fragments) {
      const cycle = t / f.period + f.phase;
      const age = cycle - Math.floor(cycle);
      const life = smooth(0, 0.12, age) * (1 - smooth(0.69, 1, age));
      if (life <= 0.002) continue;
      const travel = width * f.distance * (0.07 * age + 0.93 * age ** 1.35);
      const cross = width * age * (f.spread + 0.032 * Math.sin(f.tilt + age * 9.2));
      const px = x + width * f.anchor[0] - flowX * travel + flowY * cross;
      const py = y + height * f.anchor[1] - flowY * travel - flowX * cross;
      const pitch = Math.cos(t * f.flutter + f.tilt + age * 1.6);
      const radius = width * f.width * (1 - 0.63 * smooth(0.35, 1, age));
      if (radius < 0.42) continue;
      const heat = f.hot ? 1 - smooth(0.26, 0.87, age) : 0;
      const fold = 0.18 + 0.82 * Math.abs(pitch);
      const rotation = heading + f.tilt + f.spin * age * 0.70 + Math.sin(t * f.flutter * 0.81) * 0.41;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rotation);
      ctx.globalAlpha = alpha * life;
      const base = ctx.createLinearGradient(-radius, -radius * fold * 0.28, radius * 0.91, radius * fold * 0.46);
      const light = Math.round(lerp(49, 103, Math.abs(pitch)));
      base.addColorStop(0, 'rgb(' + light + ',' + Math.round(light * 0.75) + ',' + Math.round(light * 0.61) + ')');
      base.addColorStop(0.50, '#301f1b');
      base.addColorStop(0.72, '#211817');
      base.addColorStop(1, f.hot ? '#6a301b' : '#3c2b24');
      const contour = new Path2D();
      const points = f.shape.map(([a, b], i) => [
        a * radius * (1 - smooth(0.41, 0.96, age) * (i < 4 ? 0.27 : 0.09)),
        (b * f.aspect + Math.sin(a * 2.3 + age * 7.4) * 0.16) * radius * fold
      ]);
      contour.moveTo(...points[0]);
      for (let i = 1; i < points.length; i++) contour.lineTo(...points[i]);
      contour.closePath();
      ctx.fillStyle = base;
      ctx.fill(contour);
      if (heat > 0.005) {
        const a = points[2];
        const b = points[3];
        const c = points[4];
        ctx.globalCompositeOperation = 'screen';
        bloom(ctx, b[0], b[1], radius * 1.05, Math.max(1, radius * fold * 0.78),
          '216,65,21', heat * 0.34);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = alpha * life * heat;
        ctx.strokeStyle = '#ff7b32';
        ctx.lineWidth = Math.max(0.55, radius * 0.11);
        ctx.beginPath();
        ctx.moveTo(...a);
        ctx.lineTo(...b);
        ctx.lineTo(...c);
        ctx.stroke();
        ctx.strokeStyle = '#ffdca4';
        ctx.lineWidth = Math.max(0.35, radius * 0.047);
        ctx.beginPath();
        ctx.moveTo(lerp(a[0], b[0], 0.31), lerp(a[1], b[1], 0.31));
        ctx.lineTo(...b);
        ctx.lineTo(lerp(b[0], c[0], 0.62), lerp(b[1], c[1], 0.62));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  return { drawClouds, drawFragments };
}
