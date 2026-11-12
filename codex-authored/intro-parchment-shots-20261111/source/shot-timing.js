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
  const thirdStart = Math.round((secondStart + secondDuration) * 1000) / 1000;
  const thirdDuration = 9.5;
  const thirdBeamAt = 4.42;
  const thirdHopeAt = 4.83;
  const thirdDiveAt = 5.18;
  const thirdGroundAt = 6.44;
  const thirdFadeAt = 8.56;
  function fallTime(seconds) {
    const stretchStart = 3.18;
    const stretchEnd = unretimedFallEnd + fallExtension;
    const progress = Math.max(0, Math.min(1, (seconds - stretchStart) / (stretchEnd - stretchStart)));
    return seconds - fallExtension * progress ** 2 * (3 - 2 * progress);
  }
  return Object.freeze({
    pullStart: 3.3, pullEnd: 4.4,
    firstDuration, transitionDuration, secondStart, secondDuration, fallClearAt, whiteLightAt, fallTime,
    thirdStart, thirdDuration, thirdBeamAt, thirdHopeAt, thirdDiveAt, thirdGroundAt, thirdFadeAt,
    duration: thirdStart + thirdDuration
  });
})();

if (typeof module !== 'undefined') module.exports = OPENING_SHOT_TIMING;
