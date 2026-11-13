'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const timing = require('./shot-timing.js');

const archive = path.resolve(process.env.PARCHMENT_ARCHIVE || path.join(__dirname, '..'));
const audioDir = path.resolve(process.env.PARCHMENT_AUDIO_DIR || path.join(__dirname, 'assets'));
const ffmpeg = process.env.PARCHMENT_FFMPEG || 'ffmpeg';
const music = process.env.PARCHMENT_BGM ||
  path.resolve(archive, '../../third-party/user-supplied/desert-ascendant/desert-ascendant.mp3');
const rate = 48000;
const tau = 2 * Math.PI;
const tone = (frequency, time, phase = 0) => Math.sin(tau * frequency * time + phase);
const total = timing.offset + timing.thirdDuration;
const effects = path.join(audioDir, 'shot-three-effects.wav');
const mix = path.join(audioDir, 'opening-' + total + 's-preview.wav');

function ff(args) {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: 'inherit', windowsHide: true
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error('FFmpeg exited ' + result.status);
}

function smooth(from, to, t) {
  const x = Math.max(0, Math.min(1, (t - from) / (to - from)));
  return x * x * (3 - 2 * x);
}

function transient(t, at, pitch, volume, decay) {
  const age = t - at;
  if (age <= 0) return 0;
  return volume * smooth(0, 0.026, age) * Math.exp(-decay * age) *
    (0.74 * tone(pitch, age) + 0.26 * tone(pitch * 1.51, age));
}

function writeEffects() {
  const { thirdDuration, starsAt, thirdFogAt, thirdBeamAt, thirdHopeAt, thirdDiveAt,
    thirdGroundAt, groundLightOut, featherLandAt, revealBodyAt, revealBodyEnd, thirdFadeAt } = timing;
  const frames = rate * thirdDuration;
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
  wave.writeUInt32LE(frames * 4, 40);
  const cracks = [[6.52, 43], [7.23, 42], [8.15, 37], [9.57, 39], [10.17, 35]];
  let seed = 410771, low = 0, band = 0, stereo = 0;
  for (let i = 0; i < frames; i++) {
    const t = i / rate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    low += (noise - low) * 0.012;
    band += (noise - band) * 0.054;
    stereo += ((i % 2 ? noise : -noise) - stereo) * 0.046;
    const ink = smooth(thirdFogAt, thirdBeamAt - 0.6, t) * (1 - smooth(thirdHopeAt, thirdDiveAt, t));
    const air = (low * 0.23 + (band - low) * 0.09) * (0.80 + 0.20 * tone(0.41, t));
    const fog = ink * (low * 0.51 + 0.032 * tone(39, t, 0.65 * tone(0.49, t)));
    const chimes = transient(t, starsAt + 0.23, 698.46, 0.038, 2.2) +
      transient(t, starsAt + 0.93, 1046.5, 0.022, 2.0) + transient(t, starsAt + 1.24, 587.33, 0.017, 2.4);
    let shadow = 0;
    for (const [at, pitch] of cracks) shadow += transient(t, at, pitch, 0.045, 3.6);
    const beam = smooth(thirdBeamAt, thirdHopeAt, t) *
      (1 - smooth(thirdHopeAt, thirdHopeAt + 0.24, t)) * (band * 0.22 + 0.056 * tone(183, t));
    const impact = transient(t, thirdHopeAt, 58, 0.118, 3.7) +
      transient(t, thirdHopeAt, 783.99, 0.081, 1.65) + transient(t, thirdHopeAt + 0.15, 1046.5, 0.029, 2.3);
    const dive = smooth(thirdDiveAt, thirdDiveAt + 0.92, t) *
      (1 - smooth(thirdDiveAt + 0.99, thirdGroundAt + 0.44, t));
    const diveWind = dive * (low * 0.88 + (band - low) * 0.49 + 0.072 * tone(44, t, 1.4 * tone(1.3, t)));
    const sand = smooth(thirdGroundAt - 0.14, thirdGroundAt + 0.63, t) * (low * 0.27 + (band - low) * 0.20);
    const touch = smooth(featherLandAt - 0.02, featherLandAt + 0.045, t) *
      (1 - smooth(featherLandAt + 0.055, featherLandAt + 0.18, t)) * (band - low) * 0.13;
    const hope = transient(t, featherLandAt + 0.09, 659.25, 0.047, 2.15) +
      transient(t, featherLandAt + 0.27, 987.77, 0.031, 2.05) +
      transient(t, featherLandAt + 0.51, 1318.51, 0.012, 2.38);
    const lightRelease = 0.023 * smooth(thirdGroundAt, thirdGroundAt + 0.11, t) *
      (1 - smooth(thirdGroundAt + 0.14, groundLightOut, t)) * tone(329.63, t);
    const dustGust = smooth(revealBodyAt - 0.21, revealBodyAt + 0.42, t) *
      (1 - smooth(revealBodyAt + 0.84, revealBodyEnd, t)) * (low * 0.14 + (band - low) * 0.13);
    const edge = smooth(0, 0.54, t) * (1 - smooth(thirdFadeAt, thirdDuration - 0.09, t));
    const mid = (air + fog + chimes + shadow + beam + impact + diveWind + sand + dustGust + touch + lightRelease + hope) * edge;
    const side = stereo * (0.052 + 0.13 * dive + 0.08 * ink) * edge;
    wave.writeInt16LE(Math.round(32700 * Math.tanh(mid + side)), 44 + i * 4);
    wave.writeInt16LE(Math.round(32700 * Math.tanh(mid - side)), 46 + i * 4);
  }
  fs.writeFileSync(effects, wave);
}

fs.mkdirSync(audioDir, { recursive: true });
writeEffects();
const first = path.join(archive, 'extended-shot-one/assets/shot-one-effects.wav');
const second = path.join(archive, 'extended-shot-two/assets/shot-two-effects.wav');
const musicFade = timing.offset + timing.thirdFadeAt;
const filter = '[0:a][1:a][2:a]concat=n=3:v=0:a=1[effects];' +
  "[3:a]atrim=duration=" + total + ",asetpts=PTS-STARTPTS,aresample=48000," +
  "volume='0.62-0.16*exp(-pow((t-11.78)/0.32,2))-0.19*exp(-pow((t-19.55)/0.55,2))" +
  "-0.42*exp(-pow((t-31.80)/0.54,4))-0.12*exp(-pow((t-46.55)/0.67,2))" +
  "-0.23*exp(-pow((t-50.96)/0.71,2))':eval=frame[music];" +
  '[effects][music]amix=inputs=2:duration=first:dropout_transition=0,volume=2,' +
  'alimiter=limit=0.93:level=false,afade=t=in:d=0.18,afade=t=out:st=' +
  musicFade + ':d=' + (total - musicFade) + '[mix]';
ff(['-i', first, '-i', second, '-i', effects, '-i', music, '-filter_complex', filter,
  '-map', '[mix]', '-c:a', 'pcm_s16le', mix]);
ff(['-i', mix, '-ss', String(timing.offset), '-af', 'afade=t=in:d=0.14',
  '-c:a', 'pcm_s16le', path.join(audioDir, 'shot-three-preview.wav')]);
console.log('Mixed ' + total + ' seconds with one continuous Desert Ascendant track.');
