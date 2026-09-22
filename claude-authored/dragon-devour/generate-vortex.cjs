'use strict';
/* 融火之心（field-dragon-devour）的兩張 1024² 貼圖，程序化生成。
   A = 火環（亮環＋火絲＋鋸齒火舌＋往內捲的螺旋火臂）
   B = 煙渦（外圍暗紅煙暈＋內部螺旋紅煙＋中心餘燼光）
   兩張都是黑底、顏色直接烘進去，給 add 混色用。
   用法：node generate-vortex.cjs <outDir> [seed]
   遊戲用的版本是 seed 7：`node generate-vortex.cjs . 7` 產出的檔案與素材庫裡的逐位元相同。
   設計與量測紀錄見同目錄的 SOURCE.md。 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const N = 1024, C = N / 2;
const TAU = Math.PI * 2;

/* ---------- 可週期的 Perlin 雜訊（x 方向可指定週期，給角度用） ---------- */
function makeRng(seed) {
  let s = seed >>> 0;
  return function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function makeNoise(seed) {
  const rng = makeRng(seed);
  const perm = new Uint16Array(512), p = [];
  for (let i = 0; i < 256; i++) p.push(i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const gx = new Float64Array(256), gy = new Float64Array(256);
  for (let i = 0; i < 256; i++) { const a = rng() * TAU; gx[i] = Math.cos(a); gy[i] = Math.sin(a); }
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  function g(ix, iy, x, y) { const h = perm[(ix & 255) + perm[iy & 255]]; return gx[h] * x + gy[h] * y; }
  function noise(x, y, px) {
    let x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    let x1 = x0 + 1;
    if (px) { x0 = ((x0 % px) + px) % px; x1 = ((x1 % px) + px) % px; }
    const u = fade(fx), v = fade(fy);
    const a = g(x0, y0, fx, fy), b = g(x1, y0, fx - 1, fy);
    const c = g(x0, y0 + 1, fx, fy - 1), d = g(x1, y0 + 1, fx - 1, fy - 1);
    return (a + (b - a) * u) + ((c + (d - c) * u) - (a + (b - a) * u)) * v;
  }
  /* 週期 px 必須是整數；每一個八度頻率翻倍，週期跟著翻倍，接縫仍然對得上。 */
  function fbm(x, y, px, oct, gain) {
    let s = 0, amp = 0.5, f = 1, norm = 0;
    gain = gain || 0.5;
    for (let i = 0; i < oct; i++) {
      s += amp * noise(x * f, y * f + i * 17.13, px ? px * f : 0);
      norm += amp; amp *= gain; f *= 2;
    }
    return s / norm * 1.6;          // 約 [-1, 1]
  }
  return { noise, fbm };
}

/* ---------- 顏色：強度 → 火焰色（取自參考圖的半徑剖面實測值） ---------- */
const RAMP = [
  [0.00, 0, 0, 0], [0.06, 27, 6, 5], [0.12, 45, 10, 4], [0.20, 78, 17, 4], [0.28, 110, 25, 4],
  [0.36, 146, 36, 6], [0.47, 187, 56, 12], [0.57, 221, 83, 21], [0.66, 235, 120, 36],
  [0.75, 242, 160, 65], [0.85, 248, 195, 90], [0.95, 255, 225, 140], [1.10, 255, 245, 200]
];
function ramp(I, out) {
  if (I <= 0) { out[0] = out[1] = out[2] = 0; return; }
  if (I >= RAMP[RAMP.length - 1][0]) { const r = RAMP[RAMP.length - 1]; out[0] = r[1]; out[1] = r[2]; out[2] = r[3]; return; }
  for (let i = 1; i < RAMP.length; i++) {
    if (I <= RAMP[i][0]) {
      const a = RAMP[i - 1], b = RAMP[i], t = (I - a[0]) / (b[0] - a[0]);
      out[0] = a[1] + (b[1] - a[1]) * t; out[1] = a[2] + (b[2] - a[2]) * t; out[2] = a[3] + (b[3] - a[3]) * t;
      return;
    }
  }
}

const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* ---------- 版面（u = r / 512） ----------
   參考圖（556px）量到：環峰 r≈124、外緣陡降到 136、煙暈到 190、內部暗區 30~50、中心餘燼 < 10。
   以煙暈外緣 185 → u 0.95 換算。 */
const K = 0.95 / 185;
const U_RING = 0.632;

/* 參考圖的平均強度剖面（由 R/G 通道反推回 ramp 的強度），bin 中心 r → u = r·K */
const TARGET = [[0, .38], [4, .36], [12, .22], [20, .16], [28, .09], [36, .06], [44, .058], [52, .07], [60, .10],
  [68, .15], [76, .21], [84, .30], [92, .39], [100, .50], [108, .60], [116, .68], [124, .82], [132, .52],
  [140, .33], [148, .26], [156, .21], [164, .17], [172, .125], [180, .06], [188, .025], [196, .008], [205, 0]]
  .map(p => [p[0] * K, p[1]]);
function table(T, u) {
  if (u <= T[0][0]) return T[0][1];
  for (let i = 1; i < T.length; i++) if (u <= T[i][0]) { const a = T[i - 1], b = T[i]; return a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]); }
  return T[T.length - 1][1];
}
/* 環帶底下由煙渦負責的底光：環內側 0.46 → 環外 0.33（環帶以外全由煙渦補足） */
function bFloor(u) { return (u < 0.50 || u > 0.72) ? Infinity : 0.46 - (u - 0.50) / 0.22 * 0.13; }

const NB = 512;                    // 半徑分箱（u 0..1）
function radialMean(I) {
  const s = new Float64Array(NB), n = new Float64Array(NB);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = Math.hypot(x + 0.5 - C, y + 0.5 - C) / C; if (u >= 1) continue;
    const b = Math.floor(u * NB); s[b] += I[y * N + x]; n[b]++;
  }
  const m = new Float64Array(NB);
  for (let b = 0; b < NB; b++) m[b] = n[b] ? s[b] / n[b] : 0;
  /* 稍微平滑，避免逐箱正規化把噪點放大 */
  const out = new Float64Array(NB);
  for (let b = 0; b < NB; b++) { let a = 0, c = 0; for (let k = -3; k <= 3; k++) { const j = b + k; if (j >= 0 && j < NB && n[j]) { a += m[j]; c++; } } out[b] = c ? a / c : 0; }
  return out;
}
function binLerp(arr, u) {
  const fb = u * NB - 0.5, b0 = Math.max(0, Math.min(NB - 1, Math.floor(fb))), b1 = Math.min(NB - 1, b0 + 1), t = Math.max(0, Math.min(1, fb - b0));
  return arr[b0] + (arr[b1] - arr[b0]) * t;
}

/* 火環原始強度：亮環＋火絲＋鋸齒火舌＋往內捲的螺旋火臂。
   螺旋方向：火臂由環往中心時角度遞減（畫面上逆時針往內捲），貼圖因此要逆時針旋轉。 */
function ringRaw(nz, P) {
  const I = new Float32Array(N * N);
  const arms = P.arms || [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = x + 0.5 - C, dy = y + 0.5 - C;
      const u = Math.hypot(dx, dy) / C;
      if (u > 0.99 || u < 0.12) continue;
      const th = Math.atan2(dy, dx);
      const tn = (th < 0 ? th + TAU : th) / TAU;
      const lu = Math.log(u);
      const ts = tn - 0.22 * lu;
      const ts2 = tn - 0.5 * lu;
      const wob = 0.007 * nz.fbm(tn * 3, 1.3, 3, 2);
      const warp = 0.018 * nz.fbm(ts * 12, u * 10, 12, 2);
      const d = u + wob + warp - U_RING;
      /* 環的粗細沿圓周變化：參考圖右上厚、左下薄 */
      const thick = 1 + 0.35 * nz.fbm(tn * 2, 5.3, 2, 2);
      const core = Math.exp(-Math.pow(d / (d < 0 ? 0.031 * thick : 0.028), 2));
      /* 熱芯：貼著環外緣的一條連續亮線 */
      const hot = Math.exp(-Math.pow((d - 0.004) / 0.014, 2));
      const r1 = 1 - Math.abs(nz.fbm(ts * 15, u * 16, 15, 3));
      const r1b = 1 - Math.abs(nz.fbm(ts * 7, u * 9, 7, 3));
      const r2 = 1 - Math.abs(nz.fbm(ts2 * 10, u * 14, 10, 3));
      const s2 = nz.fbm(ts * 6, u * 10, 6, 2);
      const fiber = 0.55 + 0.45 * Math.pow(r1, 4) + 0.4 * Math.pow(r1b, 3) + 0.2 * s2;
      const g = Math.max(0.35, 0.95 + 0.55 * nz.fbm(tn * 3, 3.7, 3, 2) + 0.16 * nz.fbm(tn * 8, 9.1, 8, 2));
      let v = core * fiber * g + hot * (0.55 + 0.2 * s2 + 0.25 * Math.pow(r1b, 2)) * g * 1.1;
      if (d < 0) v += Math.exp(d / 0.07) * 0.45 * (0.1 + 1.2 * Math.pow(r2, 4) + 0.3 * s2) * g;
      /* 螺旋火臂：從環上某點出發，逆時針往內捲，半徑依指數縮小 */
      for (let k = 0; k < arms.length; k++) {
        const A = arms[k];
        let phi = (A.t0 - tn) % 1; if (phi < 0) phi += 1;          // 0..1，順著火臂前進
        if (phi > A.len) continue;
        const ua = U_RING * Math.exp(-phi * A.pitch);
        const du = (u - ua + 0.010 * nz.fbm(ts * 14, u * 10, 14, 2)) / (A.w * (1 - 0.5 * phi / A.len));
        const along = Math.pow(1 - phi / A.len, 1.4) * smooth(0, 0.07, phi);
        v += A.gain * along * Math.exp(-du * du) * (0.3 + 1.0 * Math.pow(r1b, 2) + 0.2 * s2);
      }
      I[y * N + x] = Math.max(0, v);
    }
  }
  return I;
}

function smokeMod(nz, u, tn) {
  const lu = Math.log(Math.max(u, 0.2));
  const ts = tn - 0.38 * lu;
  const n1 = nz.fbm(ts * 4, u * 6, 4, 4, 0.55);
  const n2 = nz.fbm(ts * 11, u * 16, 11, 3);
  const arm = Math.sin(TAU * (3 * ts) + 2.2 * n1);
  /* 內部與煙暈的對比不同：煙暈斑駁、內部較柔 */
  const c = u > 0.66 ? 0.95 : (u > 0.3 ? 0.6 : 0.3 * smooth(0.08, 0.2, u));
  return Math.max(0.05, 1 + c * (0.9 * n1 + 0.45 * n2 + 0.3 * arm));
}

function build(seed, P) {
  P = P || {};
  const nzA = makeNoise(seed), nzB = makeNoise(seed * 31 + 5);
  /* 1) 火環：原始強度，再於環帶內逐半徑校準到「目標 − 煙渦底光」 */
  const A = ringRaw(nzA, P);
  const mA = radialMean(A);
  const gainA = new Float64Array(NB);
  for (let b = 0; b < NB; b++) {
    const u = (b + 0.5) / NB;
    const f = bFloor(u);
    if (f === Infinity) { gainA[b] = u < 0.5 ? (P.innerArmGain || 1) : 0; continue; }
    const want = Math.max(0, table(TARGET, u) - f);
    gainA[b] = mA[b] > 1e-4 ? want / mA[b] : 0;
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = Math.hypot(x + 0.5 - C, y + 0.5 - C) / C; if (u >= 1) { A[y * N + x] = 0; continue; }
    A[y * N + x] *= binLerp(gainA, u);
  }
  const mA2 = radialMean(A);
  /* 2) 煙渦：補足剩下的平均強度 */
  const envB = new Float64Array(NB);
  /* 內吸層（煙渦縮小）會把環帶的亮度帶進內圈：整段動畫平均下來內圈多出約 12%，這裡先扣掉 */
  const inflowComp = (u) => 1 - 0.12 * smooth(0.22, 0.3, u) * (1 - smooth(0.48, 0.56, u));
  for (let b = 0; b < NB; b++) { const u = (b + 0.5) / NB; envB[b] = Math.max(0.012 * (1 - smooth(0.93, 1, u)), table(TARGET, u) * inflowComp(u) - mA2[b]); }
  const B = new Float32Array(N * N);
  const Benv = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = x + 0.5 - C, dy = y + 0.5 - C, u = Math.hypot(dx, dy) / C; if (u >= 1) continue;
    const th = Math.atan2(dy, dx), tn = (th < 0 ? th + TAU : th) / TAU;
    const e = binLerp(envB, u) * (1 - smooth(0.95, 1.0, u));
    Benv[y * N + x] = e;
    B[y * N + x] = e * smokeMod(nzB, u, tn);
  }
  /* 煙渦的調變平均不一定剛好是 1：再逐半徑校一次 */
  const mB = radialMean(B), mE = radialMean(Benv);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = Math.hypot(x + 0.5 - C, y + 0.5 - C) / C; if (u >= 1) continue;
    const b = Math.min(NB - 1, Math.floor(u * NB)); if (mB[b] > 1e-5) B[y * N + x] *= mE[b] / mB[b];
  }
  blur(A, P.blurA || 1.6); blur(B, P.blurB || 1.2);
  return { A, B, Benv };
}

/* 可分離高斯模糊：遊戲的貼圖沒有 mipmap，縮到 0.4 倍又被地面投影壓扁一半，
   比 8px 還細的紋理旋轉時會閃爍，所以在源頭就先把最高頻的那一段濾掉。 */
function blur(I, sigma) {
  const r = Math.ceil(sigma * 3), w = [];
  let ws = 0; for (let k = -r; k <= r; k++) { const v = Math.exp(-k * k / (2 * sigma * sigma)); w.push(v); ws += v; }
  for (let k = 0; k < w.length; k++) w[k] /= ws;
  const T = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let a = 0; for (let k = -r; k <= r; k++) { const xx = Math.min(N - 1, Math.max(0, x + k)); a += I[y * N + xx] * w[k + r]; } T[y * N + x] = a; }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let a = 0; for (let k = -r; k <= r; k++) { const yy = Math.min(N - 1, Math.max(0, y + k)); a += T[yy * N + x] * w[k + r]; } I[y * N + x] = a; }
}

/* ---------- 輸出（8-bit RGB PNG，黑底） ---------- */
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodeRgb(rgb) {
  const raw = Buffer.alloc((N * 3 + 1) * N);
  for (let y = 0; y < N; y++) { raw[y * (N * 3 + 1)] = 0; rgb.copy(raw, y * (N * 3 + 1) + 1, y * N * 3, (y + 1) * N * 3); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
function toRgb(I) {
  const out = Buffer.alloc(N * N * 3), c = [0, 0, 0];
  const rng = makeRng(99);
  for (let i = 0; i < N * N; i++) {
    ramp(I[i], c);
    const j = rng() - 0.5;          // 1/255 的抖動，暗部漸層才不會一圈一圈
    for (let k = 0; k < 3; k++) out[i * 3 + k] = Math.max(0, Math.min(255, Math.round(c[k] + j)));
  }
  return out;
}
/* 火環的顏色以「煙渦底光＋火環」的總強度取色再減去底光：兩張 add 疊回去時，
   高光才會是參考圖的黃白色，而不是兩份紅色相加的橘紅。 */
function toRgbDiff(A, Benv) {
  const out = Buffer.alloc(N * N * 3), c1 = [0, 0, 0], c0 = [0, 0, 0];
  const rng = makeRng(77);
  for (let i = 0; i < N * N; i++) {
    ramp(Benv[i] + A[i], c1); ramp(Benv[i], c0);
    const j = rng() - 0.5;
    let r = c1[0] - c0[0], g = c1[1] - c0[1], b = c1[2] - c0[2];
    /* 差值在紅色飽和處會變成青綠色；錯位旋轉時會露出來，所以強制保持暖色（R ≥ 1.1G、B ≤ 0.55G） */
    r = Math.max(r, g * 1.1); b = Math.min(b, g * 0.55);
    out[i * 3] = Math.max(0, Math.min(255, Math.round(r + j)));
    out[i * 3 + 1] = Math.max(0, Math.min(255, Math.round(g + j)));
    out[i * 3 + 2] = Math.max(0, Math.min(255, Math.round(b + j)));
  }
  return out;
}

const DEFAULT_P = {
  arms: [
    { t0: 0.92, len: 0.45, pitch: 1.3, w: 0.040, gain: 0.55 },
    { t0: 0.42, len: 0.32, pitch: 1.2, w: 0.032, gain: 0.30 }
  ],
  innerArmGain: 1
};

if (require.main === module) {
  const outDir = process.argv[2] || '.';
  const seed = +(process.argv[3] || 7);
  fs.mkdirSync(outDir, { recursive: true });
  const t0 = Date.now();
  const r = build(seed, DEFAULT_P);
  fs.writeFileSync(path.join(outDir, 'vortex-ring.png'), encodeRgb(toRgbDiff(r.A, r.Benv)));
  fs.writeFileSync(path.join(outDir, 'vortex-smoke.png'), encodeRgb(toRgb(r.B)));
  console.log('done', Date.now() - t0, 'ms');
}
module.exports = { build, makeNoise, ramp, U_RING, K, DEFAULT_P };
