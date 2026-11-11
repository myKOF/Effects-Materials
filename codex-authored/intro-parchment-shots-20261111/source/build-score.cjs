'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { firstDuration, secondStart, fallIntoAbyss, whiteLightAt, fallTime, duration } = require('./shot-timing.js');
const rate = 48000;
const frames = Math.round(rate * duration);
const firstFrames = rate * firstDuration;
const source = fs.readFileSync(path.join(__dirname, 'assets', 'score-shot-one.wav'));
if (source.toString('ascii', 0, 4) !== 'RIFF' || source.toString('ascii', 36, 40) !== 'data' ||
    source.readUInt16LE(22) !== 2 || source.readUInt32LE(24) !== rate ||
    source.readUInt16LE(34) !== 16 || source.readUInt32LE(40) !== firstFrames * 4) {
  throw Error('Unexpected approved first-shot PCM format');
}
const wave = Buffer.alloc(44 + frames * 4);
source.copy(wave);
wave.writeUInt32LE(wave.length - 8, 4);
wave.writeUInt32LE(frames * 4, 40);

let seed = 27634;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
};
const tau = Math.PI * 2;
const tone = (hz, t, phase = 0) => Math.sin(tau * hz * t + phase);
function smooth(a, b, t) {
  const p = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return p * p * (3 - 2 * p);
}
function impact(t, at, hz, gain) {
  const age = t - at;
  if (age < 0) return 0;
  const bend = 3.9 * (1 - Math.exp(-16 * age));
  return gain * smooth(0, 0.018, age) * Math.exp(-3.7 * age) *
    (0.77 * tone(hz, age, bend) + 0.23 * tone(hz * 1.88, age, bend));
}
function metal(t, at, hz, gain) {
  const age = t - at;
  if (age < 0) return 0;
  const envelope = smooth(0, 0.06, age) * Math.exp(-1.85 * age);
  return gain * envelope * (tone(hz, age) * 0.62 + tone(hz * 1.505, age) * 0.26 +
    tone(hz * 2.03, age) * 0.12 * Math.exp(-2 * age));
}

let low = 0;
let grit = 0;
let side = 0;
const endingNotes = [[55, 0.048], [73.416, 0.043], [110, 0.03], [164.81, 0.022], [220, 0.014]];
for (let i = firstFrames; i < frames; i++) {
  const time = i / rate;
  const local = time - secondStart;
  const t = fallTime(local);
  const lightTime = local - whiteLightAt;
  const raw = random();
  low += (raw - low) * 0.009;
  grit += (raw - grit) * 0.108;
  side += (random() - side) * 0.061;
  const transitionWind = smooth(firstDuration, firstDuration + 0.49, time) *
    (1 - smooth(firstDuration + 0.46, secondStart + 0.52, time));
  const falling = smooth(1.80, 3.46, t) * (1 - smooth(6.81, fallIntoAbyss + 0.25, t));
  const rushing = smooth(-0.26, 0.33, t) * (1 - 0.67 * smooth(1.15, 4.70, t)) * (1 - smooth(7.15, fallIntoAbyss + 0.36, t));
  const stone = (grit - low) * falling * 0.26 + low * falling * 0.38;
  const air = (low * 0.28 + (grit - low) * 0.14) * (0.43 + 1.20 * transitionWind + 1.14 * rushing);
  const collapse = impact(t, 3.11, 46, 0.071) + impact(t, 5.24, 36, 0.05) + impact(t, 6.16, 40, 0.062) +
    impact(t, 6.95, 34, 0.08) + impact(t, fallIntoAbyss, 32, 0.22);
  const chime = metal(t, 1.15, 292.4, 0.018) + metal(t, 3.88, 218.3, 0.028) +
    metal(lightTime, 0.06, 523.25, 0.069) + metal(lightTime, 0.56, 783.99, 0.042);
  const grief = endingNotes.reduce((sum, [hz, gain], index) =>
    sum + gain * (tone(hz, t, index * 0.65) + 0.28 * tone(hz * 1.006, t)) *
      (0.74 + 0.26 * tone(0.42 + index * 0.11, t)), 0) * smooth(0.54, 3.12, t) * (1 - smooth(6.11, fallIntoAbyss + 0.36, t));
  const fade = smooth(firstDuration, firstDuration + 0.15, time) * (1 - smooth(duration - 0.32, duration, time));
  const white = smooth(0.12, 1.50, lightTime) * (tone(261.63, t) * 0.064 + tone(523.25, t) * 0.030 + tone(659.25, t) * 0.018);
  const mid = (air + stone + collapse + chime + grief + white) * fade;
  const stereo = side * (0.052 + 0.063 * transitionWind + 0.070 * falling) * fade;
  wave.writeInt16LE(Math.round(32700 * Math.tanh(mid + stereo)), 44 + i * 4);
  wave.writeInt16LE(Math.round(32700 * Math.tanh(mid - stereo)), 46 + i * 4);
}
if (!wave.subarray(44, 44 + firstFrames * 4).equals(source.subarray(44))) {
  throw Error('Approved first-shot audio changed');
}
fs.writeFileSync(path.join(__dirname, 'assets', 'score.wav'), wave);
