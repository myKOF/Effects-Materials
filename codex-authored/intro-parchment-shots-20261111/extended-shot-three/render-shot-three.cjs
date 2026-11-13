'use strict';

const fs = require('node:fs');
const { mkdtemp, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { setTimeout: delay } = require('node:timers/promises');

const root = __dirname;
const archive = path.dirname(root);
const review = path.resolve(process.env.PARCHMENT_REVIEW_DIR || path.join(os.tmpdir(), 'idle-rpg-extended-shot-three'));
fs.mkdirSync(review, { recursive: true });
const { thirdDuration: duration } = require('./shot-timing.js');
const fps = 30;
const ffmpeg = process.env.PARCHMENT_FFMPEG || 'ffmpeg';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png', '.wav': 'audio/wav', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(archive, '.' + url.pathname);
  const type = mime[path.extname(file)];
  if (!file.startsWith(archive + path.sep) || !type || !fs.existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': type });
  const stream = fs.createReadStream(file);
  res.on('close', () => stream.destroy());
  stream.on('error', () => res.destroy());
  stream.pipe(res);
});

async function main() {
  const temp = path.resolve(os.tmpdir());
  const profile = await mkdtemp(path.join(temp, 'idle-rpg-shot-three-edge-'));
  let browser, ws, encoder;
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const edge = path.join(process.env['ProgramFiles(x86)'], 'Microsoft/Edge/Application/msedge.exe');
    browser = spawn(edge, ['--headless=new','--no-first-run','--disable-extensions',
      '--disable-background-networking','--mute-audio','--remote-debugging-port=0',
      '--user-data-dir=' + profile, 'about:blank'], { windowsHide:true, stdio:'ignore' });
    const activePort = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 120 && !fs.existsSync(activePort); i++) await delay(100);
    const port = Number(fs.readFileSync(activePort, 'utf8').split(/\r?\n/)[0]);
    const pages = await fetch('http://127.0.0.1:' + port + '/json/list').then(r => r.json());
    ws = new WebSocket(pages.find(t => t.type === 'page').webSocketDebuggerUrl);
    await once(ws, 'open');
    const pending = new Map(), errors = [];
    let id = 0;
    ws.addEventListener('message', ({data}) => {
      const message = JSON.parse(data);
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
      const command = pending.get(message.id);
      if (!command) return;
      pending.delete(message.id);
      if (message.error) command.reject(Error(JSON.stringify(message.error)));
      else command.resolve(message.result);
    });
    function send(method, params = {}) {
      const key = ++id;
      return new Promise((resolve, reject) => {
        pending.set(key, { resolve, reject });
        ws.send(JSON.stringify({ id:key, method, params }));
      });
    }
    async function evaluate(expression) {
      const r = await send('Runtime.evaluate', { expression, awaitPromise:true, returnByValue:true });
      if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    }
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port + '/extended-shot-three/index.html?capture=1' });
    let loaded = false;
    for (let i = 0; i < 120 && !loaded; i++) {
      loaded = await evaluate('typeof window.openingShot?.render === "function"');
      if (!loaded) await delay(100);
    }
    if (!loaded) throw Error('Preview did not load: ' + JSON.stringify(errors));
    async function frame(time) {
      const src = await evaluate('openingShot.render(' + time + '); document.querySelector("canvas").toDataURL("image/jpeg",0.98).split(",")[1]');
      return Buffer.from(src, 'base64');
    }
    if (process.argv.includes('--stills')) {
      fs.mkdirSync(path.join(review, 'stills'), { recursive: true });
      for (const t of [0, 1.60, 2.45, 4.25, 8.2, 12.36, 16.97, 17.48, 18.14, 19.20, 20.45, 22.47, 23.20, 23.43, 23.72, 24.43, 25.48, 26.57, 27.30, 27.40, 28.55, 29.45, 29.70, 30.55, 31.20, 31.97]) {
        fs.writeFileSync(path.join(review, 'stills', 'frame-' + t.toFixed(2) + '.jpg'), await frame(t));
      }
    } else {
      const out = path.join(review, 'shot-03-visual.mp4');
      encoder = spawn(ffmpeg, ['-hide_banner','-loglevel','error','-y',
        '-f','image2pipe','-framerate',String(fps),'-vcodec','mjpeg','-i','pipe:0',
        '-map','0:v:0','-an','-vf','scale=in_range=full:out_range=limited,format=yuv420p',
        '-c:v','libx264','-preset','medium','-crf','16','-g','60','-color_range','tv',
        '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',
        '-movflags','+faststart','-t',String(duration),out
      ], { windowsHide:true, stdio:['pipe','inherit','inherit'] });
      const done = once(encoder, 'exit');
      for (let i = 0; i < duration * fps; i++) {
        const bytes = await frame(i / fps);
        if (!encoder.stdin.write(bytes)) await once(encoder.stdin, 'drain');
        if ((i + 1) % 120 === 0) console.log('Rendered ' + (i + 1) + '/' + duration * fps + ' frames');
      }
      encoder.stdin.end();
      const [code] = await done;
      if (code !== 0) throw Error('FFmpeg exited ' + code);
      console.log(out);
    }
    if (errors.length) throw Error(JSON.stringify(errors));
  } finally {
    if (encoder && encoder.exitCode === null && encoder.signalCode === null) encoder.kill();
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ id:999999, method:'Browser.close' }));
      ws.close();
    }
    server.closeAllConnections();
    server.close();
    if (browser && browser.exitCode === null && browser.signalCode === null) {
      await Promise.race([once(browser, 'exit'), delay(1800)]);
      if (browser.exitCode === null && browser.signalCode === null) browser.kill();
    }
    if (path.dirname(profile) === temp && path.basename(profile).startsWith('idle-rpg-shot-three-edge-')) {
      await rm(profile, { recursive:true, force:true, maxRetries:10, retryDelay:200 });
    }
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
