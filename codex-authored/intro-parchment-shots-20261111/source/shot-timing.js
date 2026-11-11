'use strict';

const OPENING_SHOT_TIMING = (() => {
  const firstDuration = 9;
  const transitionDuration = 0.9;
  const fallExtension = 2;
  const secondDuration = 9.9 + fallExtension;
  const secondStart = firstDuration + transitionDuration;
  const fallIntoAbyss = 7.56;
  const whiteLightAt = 8.02 + fallExtension;
  function fallTime(seconds) {
    const stretchStart = 3.18;
    const stretchEnd = fallIntoAbyss + fallExtension;
    const progress = Math.max(0, Math.min(1, (seconds - stretchStart) / (stretchEnd - stretchStart)));
    return seconds - fallExtension * progress ** 2 * (3 - 2 * progress);
  }
  return Object.freeze({
    pullStart: 3.3, pullEnd: 4.4,
    firstDuration, transitionDuration, secondStart, secondDuration, fallIntoAbyss, whiteLightAt, fallTime,
    duration: Math.round((secondStart + secondDuration) * 1000) / 1000
  });
})();

if (typeof module !== 'undefined') module.exports = OPENING_SHOT_TIMING;
