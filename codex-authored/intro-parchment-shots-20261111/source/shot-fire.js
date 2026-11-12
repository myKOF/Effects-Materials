'use strict';

function makeCommanderCombustion(layer, random, smooth) {
  const frameWidth = 224;
  const frameHeight = 128;
  const columns = 8;
  const frames = 64;
  const period = 2.28;
  const fire = layer(frameWidth * columns, frameHeight * frames / columns, { alpha: true });
  const smoke = layer(fire.canvas.width, fire.canvas.height, { alpha: true });
  const heatPixels = fire.createImageData(frameWidth, frameHeight);
  const smokePixels = smoke.createImageData(frameWidth, frameHeight);
  const randomField = random(711221);
  const values = Float32Array.from({ length: 32 * 32 }, randomField);
  const mix = (a, b, t) => a + (b - a) * t;
  const clamp = x => Math.max(0, Math.min(1, x));
  const hermite = x => x * x * (3 - 2 * x);

  function noise(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = hermite(x - ix);
    const fy = hermite(y - iy);
    const top = (iy & 31) * 32;
    const bottom = ((iy + 1) & 31) * 32;
    const a = ix & 31;
    const b = (ix + 1) & 31;
    return mix(mix(values[top + a], values[top + b], fx),
      mix(values[bottom + a], values[bottom + b], fx), fy);
  }

  function paintFrame(frame) {
    const phase = frame / frames;
    const angle = phase * Math.PI * 2;
    const flow = phase * 32;
    const sway = Math.sin(angle);
    for (let py = 0; py < frameHeight; py++) {
      const cross = (py / (frameHeight - 1) - 0.5) * 3;
      for (let px = 0; px < frameWidth; px++) {
        const distance = 4.5 - px / (frameWidth - 1) * 4.82;
        const tail = Math.max(0, distance);
        const wind = noise(distance * 4.4 - flow, cross * 4.6 + 12 + sway * 0.56);
        const curl = noise(distance * 7.8 - flow, cross * 8.1 + wind * 1.5 - 2.8);
        const folds = noise(distance * 15.4 - 2 * flow + curl * 1.7, cross * 14.9 + wind * 2.7);
        const grain = noise(distance * 29 - 3 * flow, cross * 28 + folds);
        const turbulence = wind * 0.41 + curl * 0.31 + folds * 0.20 + grain * 0.08;
        const bend = tail * 0.056 * Math.sin(tail * 2.8 - angle) + (wind - 0.5) * (0.19 + tail * 0.16);
        const reach = 1.69 + 0.30 * sway + 0.18 * Math.cos(angle * 3.0);
        const spread = 0.15 + tail * 0.24 * Math.exp(-tail * 0.48);
        const flameCenter = cross - bend - (curl - 0.5) * (0.14 + tail * 0.14);
        const fuel = Math.exp(-((flameCenter / spread) ** 2));
        const roots = smooth(-0.28, 0.09, distance);
        const taper = 1 - smooth(reach * 0.55, reach + 0.42, tail + (0.5 - folds) * 0.67);
        const edge = fuel * (0.48 + turbulence * 0.87) + turbulence * 0.34 - 0.27;
        const emission = smooth(0.09, 0.63, edge) * roots * taper;
        const thermal = clamp(fuel * 0.59 + turbulence * 0.63 - tail * 0.17 + 0.025);
        const k = (py * frameWidth + px) * 4;
        heatPixels.data[k] = 169 + 86 * smooth(0.03, 0.66, thermal);
        heatPixels.data[k + 1] = 38 + 214 * thermal ** 1.65;
        heatPixels.data[k + 2] = 13 + 228 * thermal ** 4.0;
        heatPixels.data[k + 3] = 254 * emission;

        const plumeWidth = 0.24 + tail * 0.164;
        const drift = cross - bend * 1.55 - (curl - 0.5) * (0.27 + tail * 0.20);
        const volume = Math.exp(-((drift / plumeWidth) ** 2)) * (0.36 + 0.95 * turbulence);
        const opacity = smooth(0.19, 0.78, volume) * smooth(0.07, 0.61, tail) *
          (1 - smooth(2.55, 4.4, tail + (0.5 - wind) * 0.87)) *
          (1 - smooth(1.04, 1.48, Math.abs(cross)));
        const backLight = smooth(0.26, 0.82, folds * 0.41 + curl * 0.43 + wind * 0.16);
        const warm = (1 - smooth(0.2, 1.62, tail)) * 0.68;
        smokePixels.data[k] = 33 + 48 * backLight + 58 * warm;
        smokePixels.data[k + 1] = 25 + 39 * backLight + 13 * warm;
        smokePixels.data[k + 2] = 23 + 34 * backLight;
        smokePixels.data[k + 3] = 185 * opacity;
      }
    }
    const x = (frame % columns) * frameWidth;
    const y = Math.floor(frame / columns) * frameHeight;
    fire.putImageData(heatPixels, x, y);
    smoke.putImageData(smokePixels, x, y);
  }

  for (let frame = 0; frame < frames; frame++) paintFrame(frame);

  function drawFrame(ctx, atlas, radius, time) {
    const frame = Math.floor(((time / period) % 1 + 1) % 1 * frames);
    const x = frame % columns * frameWidth;
    const y = Math.floor(frame / columns) * frameHeight;
    ctx.drawImage(atlas, x, y, frameWidth, frameHeight, -radius * 4.5, -radius * 1.5,
      radius * 4.82, radius * 3);
  }

  return {
    fire(ctx, radius, time) { drawFrame(ctx, fire.canvas, radius, time); },
    smoke(ctx, radius, time) { drawFrame(ctx, smoke.canvas, radius, time); }
  };
}
