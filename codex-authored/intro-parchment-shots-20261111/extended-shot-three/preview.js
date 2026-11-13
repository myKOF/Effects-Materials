'use strict';

(() => {
  if (new URLSearchParams(location.search).has('capture')) {
    document.documentElement.classList.add('capture');
    return;
  }
  const { ready, duration } = window.openingShot;
  const button = document.querySelector('button');
  const progress = document.querySelector('input');
  progress.max = String(duration);
  const clock = document.querySelector('output');
  const audio = document.querySelector('audio');
  let seconds = 0;
  let start = 0;
  let frame = 0;
  let active = false;

  function seek(time) {
    seconds = Math.min(time, duration);
    window.openingShot.render(seconds);
    progress.value = String(seconds);
    clock.value = seconds.toFixed(2) + ' 秒';
  }

  function pause() {
    active = false;
    cancelAnimationFrame(frame);
    audio.pause();
    button.textContent = '播放';
  }

  function tick(now) {
    seek((now - start) / 1000);
    if (seconds < duration) frame = requestAnimationFrame(tick);
    else pause();
  }

  button.addEventListener('click', () => {
    if (active) { pause(); return; }
    if (seconds >= duration) seek(0);
    start = performance.now() - seconds * 1000;
    audio.currentTime = seconds;
    audio.play().catch(() => {});
    active = true;
    button.textContent = '暫停';
    frame = requestAnimationFrame(tick);
  });

  progress.addEventListener('input', () => {
    pause();
    seek(Number(progress.value));
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && active) pause();
  });

  ready.then(() => {
    button.disabled = false;
    progress.disabled = false;
  }).catch(error => {
    clock.value = '素材載入失敗';
    console.error(error);
  });
})();
