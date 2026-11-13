'use strict';

(() => {
  const width = 1920;
  const height = 900;
  const matte = 90;
  const context = document.querySelector('canvas').getContext('2d', { alpha: false });
  const { thirdDuration: duration } = OPENING_SHOT_TIMING;
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, t) => {
    const p = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return p * p * (3 - 2 * p);
  };
  function random(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }
  function layer(w, h, options) {
    const element = document.createElement('canvas');
    element.width = w;
    element.height = h;
    return element.getContext('2d', options);
  }
  async function loadImage(name) {
    const image = new Image();
    image.src = name;
    await image.decode();
    return image;
  }
  function bloom(ctx, x, y, rx, ry, rgb, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    glow.addColorStop(0, 'rgba(' + rgb + ',' + alpha + ')');
    glow.addColorStop(0.4, 'rgba(' + rgb + ',' + (alpha * 0.35) + ')');
    glow.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
  function pageFinish(ctx) {
    ctx.save();
    ctx.translate(width * 0.52, height * 0.46);
    ctx.scale(1, 0.70);
    const shade = ctx.createRadialGradient(0, 0, 300, 0, 0, 1200);
    shade.addColorStop(0, 'rgba(26,15,12,0)');
    shade.addColorStop(0.58, 'rgba(26,15,12,0.10)');
    shade.addColorStop(1, 'rgba(13,8,14,0.74)');
    ctx.fillStyle = shade;
    ctx.fillRect(-width, -height, width * 2, height * 2);
    ctx.restore();
  }
  // Trace the correction at the scale of the 324 × 196 hand reference.
  const thumbOutline = new Path2D(`M113 64 C126 55 138 42 152 37 C173 30 195 34 211 43
    C230 48 244 55 248 65 C253 74 251 87 246 98
    C238 114 228 132 216 144 C208 152 197 153 191 149
    C187 144 190 133 196 124 C199 119 203 116 209 112
    C217 106 222 98 222 88 C222 82 218 80 213 81
    C207 81 203 77 197 77 C192 78 187 82 182 85
    C176 88 171 86 168 83 C165 83 160 85 156 87
    L151 89 Q149 85 154 82 L163 76
    C149 80 136 83 123 81 Q110 81 112 71 Z`);
  // Preserve the original fingers through the creases where they enter the palm.
  const fingerOutline = new Path2D(`M0 80 L116 80 L131 83 L143 91 Q151 88 157 83
    C162 81 165 81 168 81 Q175 90 182 86 Q190 82 195 78
    Q203 75 212 81 Q221 83 220 92 Q217 106 209 112
    C201 116 195 125 190 139 L181 160 L0 196 Z`);

  function thumbMask(mask) {
    mask.scale(mask.canvas.width / 324, mask.canvas.height / 196);
    mask.filter = "blur(1.15px)";
    mask.fill(thumbOutline);
    mask.filter = "none";
    mask.globalCompositeOperation = "destination-out";
    mask.fill(fingerOutline);
  }

  function compositeHand(base, thumb) {
    const cel = layer(base.width, base.height, { alpha: true });
    cel.drawImage(base, 0, 0);
    const patch = layer(388, 234, { alpha: true });
    patch.imageSmoothingQuality = "high";
    patch.drawImage(thumb, 0, 0, patch.canvas.width, patch.canvas.height);

    // Restore transparency where removing the old thumb exposed the guide’s grey background.
    const pixels = patch.getImageData(0, 0, patch.canvas.width, patch.canvas.height);
    const { data } = pixels;
    for (let i = 0; i < data.length; i += 4) {
      const chroma = Math.max(data[i], data[i + 1], data[i + 2]) -
        Math.min(data[i], data[i + 1], data[i + 2]);
      data[i + 3] *= smooth(8, 23, chroma);
    }
    patch.putImageData(pixels, 0, 0);

    // The source crop includes a grey backing. Clear its upper fringe along
    // the new silhouette so the desert plate shows through the old thumb gap.
    patch.save();
    patch.scale(patch.canvas.width / 324, patch.canvas.height / 196);
    patch.globalCompositeOperation = "destination-out";
    patch.filter = "blur(0.65px)";
    patch.fill(new Path2D(`M94 20 H222 L221 48
      Q215 51 206 51 Q194 51 185 57 C177 61 171 67 166 72
      Q159 77 151 83 L143 86 L94 86 Z`));
    patch.restore();

    const mask = layer(patch.canvas.width, patch.canvas.height, { alpha: true });
    thumbMask(mask);
    patch.globalCompositeOperation = "destination-in";
    patch.drawImage(mask.canvas, 0, 0);

    // Registration maps the supplied 324 × 196 crop back to the character sprite.
    cel.globalCompositeOperation = "destination-out";
    cel.drawImage(mask.canvas, 840, 567);
    cel.globalCompositeOperation = "lighter";
    cel.drawImage(patch.canvas, 840, 567);
    return cel.canvas;
  }

  const shot = { duration };
  window.openingShot = shot;
  shot.ready = Promise.all([
    loadImage('../source/assets/mortal-map.png'), loadImage('../source/assets/desert-surface.png'), loadImage('../source/assets/collapse-smoke.png'), loadImage('assets/desert-high-oblique.png'),
    loadImage('../extended-shot-two/assets/charred-feather.png'), loadImage('assets/archangel-fallen-ivory.png'), loadImage('assets/archangel-left-thumb-reference-edit.png'), document.fonts.load('700 48px "Noto Serif TC"')
  ]).then(([map, desert, smoke, wideDesert, feather, fallen, thumb]) => {
    const render = makeMortalMap(map, desert, wideDesert, smoke, feather, compositeHand(fallen, thumb), {
      context, width, height, matte, layer, random, lerp, smooth, bloom, pageFinish
    });
    shot.render = time => render(Math.max(0, Math.min(duration, time)));
    shot.render(0);
  });
})();
