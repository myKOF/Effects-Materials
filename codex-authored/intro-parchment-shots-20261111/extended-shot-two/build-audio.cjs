'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const timing = require('./shot-timing.js');
const archive = path.resolve(process.env.PARCHMENT_ARCHIVE || path.join(__dirname, '..'));
const ffmpeg = process.env.PARCHMENT_FFMPEG || 'ffmpeg';
const assets = path.join(__dirname, 'assets');
const rate = 48000;
const frames = rate * timing.duration;

function ff(args) {
  const run = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    windowsHide: true, stdio: 'inherit'
  });
  if (run.error) throw run.error;
  if (run.status !== 0) throw Error('FFmpeg exited ' + run.status);
}

function smooth(a, b, t) {
  const p = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return p * p * (3 - 2 * p);
}

function sweep(t, at, attack, release) {
  return smooth(at - attack, at, t) * (1 - smooth(at, at + release, t));
}

const tau = 2 * Math.PI;
let seed = 4694381;
function noise() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
}

function loadFireTake() {
  // The audition generator writes a canonical stereo PCM WAV with a 44-byte header.
  const file = fs.readFileSync(path.join(assets, '04-heavy-fire-roar.wav'));
  if (file.length < 44 || file.toString('ascii', 0, 4) !== 'RIFF' ||
      file.toString('ascii', 8, 16) !== 'WAVEfmt ' || file.readUInt32LE(16) !== 16 ||
      file.readUInt16LE(20) !== 1 || file.readUInt16LE(22) !== 2 ||
      file.readUInt32LE(24) !== rate || file.readUInt16LE(34) !== 16 ||
      file.toString('ascii', 36, 40) !== 'data' ||
      file.readUInt32LE(40) !== rate * 6 * 4 || file.length !== 44 + rate * 6 * 4) {
    throw Error('Expected the original six-second, 48 kHz stereo fire audition WAV');
  }
  return file.subarray(44);
}

function makeCommanderFire() {
  const take = loadFireTake();
  const arrival = 0.13;
  const distanceStart = 3.9;
  const distanceEnd = 8.7;
  const crossfadeStart = 4.76;
  const crossfadeEnd = 5.68;
  const tailSourceStart = 1.38;
  const filtered = [0, 0];
  const frame = [0, 0];

  function sample(index, channel) {
    const offset = index * 4 + channel * 2;
    return index < 0 || offset >= take.length ? 0 : take.readInt16LE(offset) / 32768;
  }

  return function renderFire(index, t) {
    const firstIndex = index - Math.round(arrival * rate);
    const tailIndex = index - Math.round((crossfadeStart - tailSourceStart) * rate);
    const blend = smooth(crossfadeStart, crossfadeEnd, t);
    const distance = smooth(distanceStart, distanceEnd, t);
    const envelope = 1.26 * (1 - distance);
    const cutoff = 5700 * (310 / 5700) ** distance;
    const coefficient = 1 - Math.exp(-tau * cutoff / rate);
    for (let channel = 0; channel < 2; channel++) {
      const dry = Math.cos(blend * Math.PI * 0.5) * sample(firstIndex, channel) +
        Math.sin(blend * Math.PI * 0.5) * sample(tailIndex, channel);
      filtered[channel] += (dry - filtered[channel]) * coefficient;
      frame[channel] = envelope * filtered[channel];
    }
    return frame;
  };
}

function audioWave() {
  const commanderFire = makeCommanderFire();
  const wave = Buffer.alloc(44 + frames * 4);
  wave.write('RIFF', 0);
  wave.writeUInt32LE(wave.length - 8, 4);
  wave.write('WAVEfmt ', 8);
  wave.writeUInt32LE(16, 16);
  wave.writeUInt16LE(1, 20);
  wave.writeUInt16LE(2, 22);
  wave.writeUInt32LE(rate, 24);
  wave.writeUInt32LE(rate * 4, 28);
  wave.writeUInt16LE(4, 32);
  wave.writeUInt16LE(16, 34);
  wave.write('data', 36);
  wave.writeUInt32LE(wave.length - 44, 40);

  let lows = 0, band = 0, grit = 0, sideNoise = 0;
  const passes = [
    { at: 5.94, strength: 0.86, pan: -0.63 },
    { at: 6.62, strength: 0.75, pan: 0.52 },
    { at: 8.22, strength: 0.73, pan: 0.67 },
    { at: 8.94, strength: 0.61, pan: -0.39 },
    { at: 10.81, strength: 0.54, pan: -0.24 },
    { at: 12.64, strength: 0.31, pan: 0.27 },
    { at: 14.23, strength: 0.14, pan: 0.19 }
  ];
  for (let i = 0; i < frames; i++) {
    const t = i / rate;
    const source = noise(), stereo = noise();
    lows += (source - lows) * 0.003;
    band += (source - band) * 0.033;
    grit += (source - grit) * 0.22;
    sideNoise += (stereo - sideNoise) * 0.026;
    const nearing = 1 - smooth(5.2, 10.4, t);
    const disperse = 1 - smooth(12.55, timing.lastTrail, t);
    const brace = sweep(t, timing.wingPeak - 0.18, 1.05, 0.45);
    const collapse = sweep(t, timing.wingBreak, 0.15, 0.71);
    const gust = (0.54 + 0.11 * Math.sin(t * 2.08)) * disperse + 0.14;
    const wind = lows * (0.60 + 0.55 * nearing + 1.4 * collapse) * gust +
      (band - lows) * (0.59 + 0.63 * nearing + 0.26 * brace + 0.73 * collapse) * gust;
    const strikeAge = Math.max(0, t - timing.wingBreak);
    const strike = 0.35 * collapse * Math.exp(-strikeAge * 5.3) *
      Math.sin(tau * (58 * strikeAge - 1.86 * (1 - Math.exp(-strikeAge * 7))));
    const metal = brace * 0.048 * Math.sin(tau * (183 * t + 3.4 * Math.sin(t * 2.0))) *
      (0.36 + 0.64 * Math.sin(t * 15.4) ** 4);
    const brittle = (grit - band) * (0.066 * brace + 0.24 * collapse) +
      (source - grit) * 0.12 * sweep(t, timing.wingBreak, 0.021, 0.08);
    let level = wind + strike + metal + brittle;
    let pan = sideNoise * gust * 0.25 + brittle * 0.31;
    for (const pass of passes) {
      const shape = sweep(t, pass.at, 0.54, 1.23) * pass.strength;
      const push = shape * ((band - lows) * 0.93 + lows * 0.77);
      level += push;
      pan += push * pass.pan;
    }
    const leftPass = sweep(t, timing.featherEnter + 1.68, 1.02, 0.74);
    const returnPass = sweep(t, timing.featherNear + 0.12, 1.22, 0.59);
    const brush = (band - lows) * 0.48 + (grit - band) * 0.20;
    const feather = brush * (0.36 * leftPass + 0.72 * returnPass);
    level += feather;
    pan += brush * (leftPass * (0.42 - 0.90 * smooth(timing.featherEnter + 0.32, timing.featherTurn, t)) +
      returnPass * (-0.39 + 0.82 * smooth(timing.featherTurn + 0.47, timing.featherExit - 0.18, t)));
    const lightAge = Math.max(0, t - timing.whiteLightAt);
    const fadeOut = 1 - smooth(timing.lightSpreadAt + 0.68, timing.cutToBlackAt, t);
    const light = smooth(0.03, 0.93, lightAge) * fadeOut;
    level += light * ((band - lows) * 0.52 + lows * 1.08) +
      0.071 * light * Math.sin(tau * (37 + 8 * lightAge) * lightAge);
    const edge = smooth(0, 0.085, t) * (1 - smooth(timing.duration - 0.105, timing.duration, t));
    const [fireLeft, fireRight] = commanderFire(i, t);
    wave.writeInt16LE(Math.round(32700 * Math.tanh((level + pan + fireLeft) * edge)), 44 + i * 4);
    wave.writeInt16LE(Math.round(32700 * Math.tanh((level - pan + fireRight) * edge)), 46 + i * 4);
  }
  return wave;
}

const effects = path.join(assets, 'shot-two-effects.wav');
fs.writeFileSync(effects, audioWave());
const firstEffects = path.join(archive, 'extended-shot-one/assets/shot-one-effects.wav');
const music = process.env.PARCHMENT_BGM || path.resolve(archive, '../../third-party/user-supplied/desert-ascendant/desert-ascendant.mp3');
const total = timing.offset + timing.duration;
const filter = '[0:a][1:a]concat=n=2:v=0:a=1[effects];' +
  "[2:a]atrim=duration=" + total + ",asetpts=PTS-STARTPTS,aresample=48000," +
  "volume='0.62-0.16*exp(-pow((t-11.78)/0.32,2))-0.19*exp(-pow((t-19.55)/0.55,2))-0.42*exp(-pow((t-31.80)/0.54,4))':eval=frame[music];" +
  '[effects][music]amix=inputs=2:duration=first:dropout_transition=0,volume=2,' +
  'alimiter=limit=0.93:level=false,afade=t=in:d=0.18,afade=t=out:st=33.32:d=0.68[mix]';
const combined = path.join(assets, 'shots-one-two-preview.wav');
ff(['-i', firstEffects, '-i', effects, '-i', music, '-filter_complex', filter, '-map', '[mix]',
  '-c:a', 'pcm_s16le', combined]);
ff(['-i', combined, '-ss', String(timing.offset), '-af', 'afade=t=in:d=0.09',
  '-c:a', 'pcm_s16le', path.join(assets, 'shot-two-preview.wav')]);
console.log('Mixed', total, 'seconds of continuous Desert Ascendant');
