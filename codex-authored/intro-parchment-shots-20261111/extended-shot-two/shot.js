'use strict';

(() => {
  const width = 1920, height = 900, matte = 90;
  const context = document.querySelector('canvas').getContext('2d', { alpha:false });
  const { duration } = OPENING_SHOT_TIMING;
  const clamp = x => Math.max(0, Math.min(1, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, t) => {
    const p = clamp((t - a) / (b - a));
    return p * p * (3 - 2 * p);
  };

  function random(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function layer(w, h, options = { willReadFrequently: true }) {
    const element = document.createElement('canvas');
    element.width = w;
    element.height = h;
    return element.getContext('2d', options);
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
    ctx.translate(width * 0.52, height * 0.48);
    ctx.scale(1, 0.63);
    const shade = ctx.createRadialGradient(0, 0, 271, 0, 0, 1120);
    shade.addColorStop(0, 'rgba(33,15,10,0)');
    shade.addColorStop(0.53, 'rgba(33,15,10,0.09)');
    shade.addColorStop(0.82, 'rgba(29,13,9,0.40)');
    shade.addColorStop(1, 'rgba(17,8,6,0.80)');
    ctx.fillStyle = shade;
    ctx.fillRect(-width, -height, width * 2, height * 2);
    ctx.restore();

    const edge = ctx.createLinearGradient(0, 0, 0, height);
    edge.addColorStop(0, 'rgba(30,14,9,0.60)');
    edge.addColorStop(0.075, 'rgba(44,22,11,0.06)');
    edge.addColorStop(0.5, 'rgba(50,26,15,0)');
    edge.addColorStop(0.88, 'rgba(33,15,11,0.16)');
    edge.addColorStop(1, 'rgba(20,10,8,0.64)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, width, height);
  }

  function softenWingBoundary(image) {
    const { width, height } = image;
    const wing = layer(width, height);
    wing.drawImage(image, 0, 0);
    wing.globalCompositeOperation = 'destination-in';
    const falloff = wing.createLinearGradient(0, 0, 0, height);
    falloff.addColorStop(0, '#000');
    falloff.addColorStop(0.89, '#000');
    falloff.addColorStop(1, 'transparent');
    wing.fillStyle = falloff;
    wing.fillRect(0, 0, width, height);
    return wing.canvas;
  }


  function loadImage(url) {
    const image = new Image();
    image.src = url;
    return image.decode().then(() => image, error => { throw new Error("Cannot decode " + url, { cause: error }); });
  }

  const names = ['heaven-sky', 'cloud-abyss', 'angels-fall-faces', 'collapse-smoke', 'wing'];
  const assets = Object.fromEntries(names.map(name => [name, '../source/assets/' + name + '.png']));
  assets.commanderReference = 'assets/archangel-user-reference.png';
  assets.commanderChin = 'assets/archangel-hood-chin-tucked.png';
  assets.commanderChinEdge = 'assets/archangel-hood-edge-left.png';
  assets.feather = 'assets/charred-feather.png';
  assets.tail = 'assets/shot-one-tail.png';
  const ready = Promise.all([
    ...Object.entries(assets).map(async ([name, url]) => [name, await loadImage(url)]),
    document.fonts.load('700 49px OpeningSerif', '天門失守連大天使長也墜入了深淵')
  ]).then(entries => {
    const images = Object.fromEntries(entries.slice(0, -1));
    images.wing = softenWingBoundary(images.wing);
    window.openingShot.render = makeExtendedFall(images, { context, width, height, matte, layer,
      random, lerp, smooth, bloom, pageFinish });
    window.openingShot.render(0);
  });
  window.openingShot = { duration, ready };
})();
