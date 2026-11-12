'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const rate = 48000, duration = 16, frames = rate * duration;
const wave = Buffer.alloc(44 + frames * 4);
wave.write('RIFF',0); wave.writeUInt32LE(wave.length-8,4);
wave.write('WAVEfmt ',8); wave.writeUInt32LE(16,16); wave.writeUInt16LE(1,20);
wave.writeUInt16LE(2,22); wave.writeUInt32LE(rate,24); wave.writeUInt32LE(rate*4,28);
wave.writeUInt16LE(4,32); wave.writeUInt16LE(16,34);
wave.write('data',36); wave.writeUInt32LE(frames*4,40);

const tau = Math.PI * 2;
const clamp = x => Math.max(0, Math.min(1, x));
const smooth = (a,b,t) => { const x=clamp((t-a)/(b-a)); return x*x*(3-2*x); };
const tone = (hz,t,phase=0) => Math.sin(tau*hz*t+phase);
let seed = 981407;
function noise() {
  seed = (Math.imul(seed,1664525)+1013904223) >>> 0;
  return seed/2147483648-1;
}
function bell(t) {
  if (t < 0) return 0;
  const parts = [[91,.20,.42],[182,.17,.55],[229,.15,.69],[309,.19,.83],[437,.13,1.09],[612,.10,1.28],[975,.06,1.87]];
  return smooth(0,.021,t) * (1-smooth(4.3,5.7,t)) * parts.reduce((sum,[hz,gain,decay],i) =>
    sum + gain * Math.exp(-decay*t) * tone(hz,t,.26*i),0);
}
function rumble(t, at, hz, amount) {
  const age = t-at;
  if (age<0) return 0;
  const bend = 4.2*(1-Math.exp(-age*11));
  return amount * smooth(0,.012,age)*Math.exp(-age*3.8)*
    (.68*tone(hz,age,bend)+.25*tone(hz*1.63,age,bend*.72)+.07*tone(hz*2.41,age));
}

let lows = 0, band = 0, airL = 0, airR = 0, grit = 0;
for (let i=0;i<frames;i++) {
  const t=i/rate;
  const r=noise(), l=noise(), side=noise();
  lows+=(r-lows)*.008;
  band+=(r-band)*.054;
  grit+=(r-grit)*.21;
  airL+=(l-airL)*.035;
  airR+=(side-airR)*.028;
  const close = .43 + .57*smooth(4.1,8.6,t);
  const incoming = smooth(8.05,10.2,t)*(1-smooth(11.7,12.06,t));
  const wingBeat = (.5+.5*Math.sin(t*15.8))**5 * incoming;
  const passing = smooth(10.92,11.42,t)*(1-smooth(11.47,11.71,t));
  const shock = smooth(12.75,13.57,t)*(1-.51*smooth(14.93,16,t));
  const castle = smooth(11.72,11.77,t)*(1-smooth(12.03,12.88,t));
  const air = lows*(.37+.29*close+.19*incoming+.47*shock) +
    (band-lows)*(.14+.17*close+.27*passing+.31*shock) + (r-grit)*(.015+.035*castle);
  const impact = rumble(t,11.72,41,.57)+rumble(t,11.89,29,.30)+rumble(t,12.44,49,.24)+
    rumble(t,12.79,53,.15)+rumble(t,13.60,27,.16);
  const brittle = (grit-band)*(.43*castle+.19*passing) +
    (r-grit)*.27*smooth(11.72,11.738,t)*(1-smooth(11.77,11.98,t));
  const flutter = (band-lows)*.28*wingBeat + lows*.22*wingBeat;
  const signal = .24*bell(t-1.67)+.064*bell(t-1.94)+.048*bell(t-2.21);
  const edge = smooth(0,.28,t)*(1-smooth(15.91,16,t));
  const middle = (air+impact+brittle+flutter+signal)*edge;
  const perspective = (.16*bell(t-1.78)-.13*bell(t-1.83)+(.30+shock*.58)*(airL-airR)*.19+
    (brittle+flutter)*(.22-.47*smooth(10.85,12.25,t)))*edge;
  wave.writeInt16LE(Math.round(32700*Math.tanh(middle+perspective)),44+i*4);
  wave.writeInt16LE(Math.round(32700*Math.tanh(middle-perspective)),46+i*4);
}
const assets = path.join(__dirname, 'assets');
const effects = path.join(assets,'shot-one-effects.wav');
fs.writeFileSync(effects,wave);
const music = process.argv[2] || path.resolve(__dirname, '../../../third-party/user-supplied/desert-ascendant/desert-ascendant.mp3');
const mix = path.join(assets,'shot-one-preview.wav');
const filter = "[0:a]atrim=duration=16,asetpts=PTS-STARTPTS,aresample=48000,volume='0.62-0.16*exp(-pow((t-11.78)/0.32,2))':eval=frame[m];" +
  "[m][1:a]amix=inputs=2:duration=shortest:dropout_transition=0,volume=2,alimiter=limit=0.94:level=false,afade=t=in:st=0:d=0.18,afade=t=out:st=15.74:d=0.26[out]";
const ffmpeg = spawnSync(process.env.PARCHMENT_FFMPEG || 'ffmpeg', ['-hide_banner','-loglevel','error','-y',
  '-i',music,'-i',effects,'-filter_complex',filter,'-map','[out]','-c:a','pcm_s16le',mix
],{windowsHide:true,stdio:'inherit'});
if (ffmpeg.error) throw ffmpeg.error;
if (ffmpeg.status !== 0) throw Error('Mix failed: '+ffmpeg.status);
console.log(mix);
