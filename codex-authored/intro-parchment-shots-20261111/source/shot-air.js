'use strict';

function makeAirArmy(groundCount, image, poses, { random, smooth, lerp, pullStart, pullEnd }) {
  const tau = Math.PI * 2;
  const rng = random(682167);
  const front = [
    // x, y, wingspan, species, depth, direction
    [640, 223, 101, 0, 0.91, -1],
    [841, 337,  75, 0, 0.73, -1],
    [1112,168,  66, 0, 0.68, -1],
    [1460,254, 105, 0, 0.92, -1],
    [1704,336,  76, 0, 0.83, -1],
    [523, 308,  58, 1, 0.83,  1],
    [773, 286,  53, 1, 0.76, -1],
    [1014,252,  59, 1, 0.84, -1],
    [1240,301,  60, 1, 0.83,  1],
    [1537,313,  64, 1, 0.87, -1],
    [1810,291,  55, 1, 0.79, -1],
    [594, 344,  32, 2, 0.88,  1],
    [934, 293,  35, 2, 0.83, -1],
    [1313,350,  34, 2, 0.89, -1],
    [1587,235,  33, 2, 0.82, -1]
  ];
  const formations = [
    // center, horizontal and vertical spread, depth, direction
    [464, 338, 128, 54, 0.24, -1],
    [575, 269, 127, 48, 0.37,  1],
    [684, 351, 148, 55, 0.51, -1],
    [812, 278, 132, 42, 0.32, -1],
    [940, 322, 118, 61, 0.48, -1],
    [1034,205, 105, 40, 0.29,  1],
    [1173,238, 114, 56, 0.39, -1],
    [1322,279, 132, 56, 0.32, -1],
    [1406,352, 138, 54, 0.57, -1],
    [1510,229, 112, 49, 0.42, -1],
    [1610,313, 126, 47, 0.45,  1],
    [1757,337, 138, 54, 0.52, -1]
  ];
  const count = Math.round(groundCount * 0.5);
  const units = front.slice(0, count).map(makeUnit);
  const following = count - units.length;
  for (const [flock, form] of formations.entries()) {
    const [cx, cy, rx, ry, baseDepth, direction] = form;
    const first = Math.round(following * flock / formations.length);
    const last = Math.round(following * (flock + 1) / formations.length);
    const total = last - first;
    const offset = rng() * tau;
    for (let i = 0; i < total; i++) {
      const angle = offset + i * 2.399963 + (rng() - 0.5) * 0.41;
      const radius = Math.sqrt((i + 0.3) / total) * lerp(0.81, 1.06, rng());
      const depth = baseDepth + (rng() - 0.5) * 0.19;
      const kind = Math.floor(rng() * 10);
      const species = kind < 2 ? 0 : kind < 5 ? 1 : 2;
      const size = lerp(5.5, 16.8, depth ** 0.82) * lerp(0.57, 1.44, rng()) *
        [1.70, 1.26, 1][species];
      const x = cx + Math.cos(angle) * rx * radius;
      const y = cy + Math.sin(angle) * ry * radius + (x - cx) * 0.10;
      units.push(makeUnit([x, y, size, species, depth, direction]));
    }
  }
  units.sort((a, b) => a.depth - b.depth);
  const distant = units.filter(unit => unit.depth < 0.47);
  const forward = units.filter(unit => unit.depth >= 0.47);

  function makeUnit([x, y, size, species, depth, direction]) {
    return {
      x, y, size, species, depth, direction,
      phase: rng() * tau,
      bank: lerp(-0.20, 0.20, rng()),
      drift: lerp(5, 25, depth) * lerp(0.77, 1.23, rng()),
      opacity: lerp(0.74, 1, rng()),
      delay: lerp(0.02, 0.58, rng()),
      wingRate: [4.3, 5.6, 7.8][species] * lerp(0.74, 1.25, rng())
    };
  }

  function drawLayer(ctx, time, nearer) {
    if (time <= pullStart) return;
    const flight = time - pullStart;
    for (const unit of nearer ? forward : distant) {
      const reveal = smooth(unit.delay, pullEnd - pullStart + 0.31 + unit.delay, flight);
      if (reveal <= 0.001) continue;
      const { x, y, size, species, depth, direction, phase, bank, drift, opacity, wingRate } = unit;
      const travel = flight + 0.31;
      const wingPhase = flight * wingRate + phase;
      const wingBeat = Math.sin(wingPhase);
      const glide = flight * lerp(0.31, 0.85, depth) + phase;
      const left = x + direction * (travel * drift + Math.sin(glide) * size * 0.19);
      const top = y + travel * lerp(0.61, 3.5, depth) +
        Math.sin(glide * 1.37) * size * 0.12 - wingBeat * size * 0.023;
      const span = size * (1 + travel * lerp(0.004, 0.023, depth));
      ctx.save();
      ctx.globalAlpha = reveal * opacity * lerp(0.18, 0.91, depth ** 0.83);
      ctx.translate(left, top);
      ctx.rotate(bank + Math.sin(glide * 0.84) * 0.079);
      ctx.scale(direction, 1);
      if (size >= 30) {
        drawLeader(ctx, poses[species][0], span, wingBeat);
      } else {
        const pose = poses[species][wingBeat < -0.15 ? 1 : 0];
        const { x, y, w, h, ax, ay } = pose;
        const scale = span / w;
        ctx.drawImage(image, x, y, w, h, -ax * scale, -ay * scale, span, h * scale);
      }
      ctx.restore();
    }
  }

  function drawLeader(ctx, pose, span, beat) {
    const { x, y, w, h, ax, ay } = pose;
    const scale = span / w;
    const strips = 12;
    const step = w / strips;
    const lift = u => {
      const wing = Math.max(0, Math.abs(u - ax) / w - 0.106);
      return -beat * h * 0.74 * wing ** 1.34;
    };
    ctx.scale(scale, scale);
    ctx.translate(-ax, -ay);
    for (let i = 0; i < strips; i++) {
      const u = i * step;
      const offset = lift(u);
      const shear = (lift(u + step) - offset) / step;
      const segment = Math.min(step + 0.35, w - u);
      ctx.save();
      ctx.transform(1, shear, 0, 1, 0, offset - u * shear);
      ctx.drawImage(image, x + u, y, segment, h, u, 0, segment, h);
      ctx.restore();
    }
  }

  return { count, drawLayer };
}
