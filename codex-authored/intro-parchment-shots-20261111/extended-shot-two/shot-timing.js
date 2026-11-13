'use strict';

const OPENING_SHOT_TIMING = Object.freeze({
  offset: 16,
  duration: 18,
  dissolveEnd: 0.95,
  reach: 2.40,
  wingPeak: 3.04,
  wingBreak: 3.55,
  pullEnd: 11.92,
  featherEnter: 9.85,
  featherTurn: 12.35,
  featherNear: 14.42,
  featherExit: 15.56,
  lastTrail: 15.56,
  whiteLightAt: 16.06,
  lightSpreadAt: 16.17,
  lightSpreadDuration: 3.58,
  cutToBlackAt: 17.94
});

if (typeof module !== 'undefined') module.exports = OPENING_SHOT_TIMING;
