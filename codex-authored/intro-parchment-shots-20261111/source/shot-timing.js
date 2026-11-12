'use strict';

const OPENING_SHOT_TIMING = (() => {
  const firstDuration = 9;
  const transitionDuration = 0.9;
  const fallExtension = 2;
  const secondStart = firstDuration + transitionDuration;
  const unretimedFallEnd = 7.56;
  // End the last visible trails at 18.90s on the full timeline.
  const fallClearAt = 9;
  const whiteLightAt = fallClearAt + 0.5;
  const secondDuration = whiteLightAt + 1.4;
  function fallTime(seconds) {
    const stretchStart = 3.18;
    const stretchEnd = unretimedFallEnd + fallExtension;
    const progress = Math.max(0, Math.min(1, (seconds - stretchStart) / (stretchEnd - stretchStart)));
    return seconds - fallExtension * progress ** 2 * (3 - 2 * progress);
  }
  return Object.freeze({
    pullStart: 3.3, pullEnd: 4.4,
    firstDuration, transitionDuration, secondStart, secondDuration, fallClearAt, whiteLightAt, fallTime,
    duration: Math.round((secondStart + secondDuration) * 1000) / 1000
  });
})();

if (typeof module !== 'undefined') module.exports = OPENING_SHOT_TIMING;
