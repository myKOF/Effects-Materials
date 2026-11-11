'use strict';

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { mkdtemp, rm } = require('node:fs/promises');
const os = require('node:os');
const { duration, pullStart, pullEnd, firstDuration, secondStart, whiteLightAt } = require('./shot-timing.js');
const { pathToFileURL } = require('node:url');

const root = __dirname;
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png', '.wav': 'audio/wav'
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(root, '.' + url.pathname);
  if (!file.startsWith(root + path.sep) || !Object.hasOwn(mime, path.extname(file)) || !fs.existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': mime[path.extname(file)] });
  fs.createReadStream(file).pipe(res);
});

async function main() {
  const profile = await mkdtemp(path.join(os.tmpdir(), 'idle-rpg-shot-edge-'));
  let browser;
  let ws;
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const port = server.address().port;
    const edge = path.join(process.env['ProgramFiles(x86)'], 'Microsoft/Edge/Application/msedge.exe');
    browser = spawn(edge, [
      '--headless=new', '--no-first-run', '--no-default-browser-check',
      '--disable-extensions', '--disable-background-networking',
      '--remote-debugging-port=0',
      '--user-data-dir=' + profile, 'about:blank'
    ], { windowsHide: true, stdio: 'ignore' });

    const activePort = path.join(profile, 'DevToolsActivePort');
    for (let attempt = 0; attempt < 100 && !fs.existsSync(activePort); attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const debugPort = Number(fs.readFileSync(activePort, 'utf8').split(/\r?\n/)[0]);
    const targets = await fetch('http://127.0.0.1:' + debugPort + '/json/list').then(r => r.json());
    ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await once(ws, 'open');
    let nextId = 0;
    const pending = new Map();
    const errors = [];
    ws.addEventListener('message', ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails);
      const command = pending.get(msg.id);
      if (!command) return;
      pending.delete(msg.id);
      if (msg.error) command.reject(Error(JSON.stringify(msg.error)));
      else command.resolve(msg.result);
    });
    function send(method, params = {}) {
      const id = ++nextId;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }
    async function evalPage(expression) {
      const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    }

    await send('Runtime.enable');
    await send('Page.enable');
    const interactiveUrl = 'http://127.0.0.1:' + port + '/index.html';
    const fileTest = process.argv.includes('--local-check');
    await send('Page.navigate', { url: fileTest ? pathToFileURL(path.join(root, 'index.html')).href : interactiveUrl });
    let ready = false;
    for (let i = 0; i < 45 && !ready; i++) {
      ready = await evalPage('Boolean(window.openingShot?.render && !document.querySelector("button").disabled)');
      if (!ready) await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!ready) throw Error('Interactive preview did not load: ' + JSON.stringify(errors));
    const infantry = await evalPage('openingShot.infantry');
    if (infantry.current !== infantry.previous + Math.round(infantry.previous * 0.5)) throw Error('Unexpected infantry count');
    console.log('Infantry increased from ' + infantry.previous + ' to ' + infantry.current);
    await evalPage('document.querySelector("button").click()');
    let state;
    for (let attempt = 0; attempt < 30; attempt++) {
      state = await evalPage('({text: document.querySelector("button").textContent, value: Number(document.querySelector("input").value), hidden: document.hidden})');
      if (state.text === '暫停' && state.value >= 0.15) break;
      await new Promise(resolve => setTimeout(resolve, 140));
    }
    if (state.text !== '暫停' || state.value < 0.15) throw Error('Preview clock did not advance: ' + JSON.stringify(state));
    const seekTo = (pullStart + pullEnd) / 2;
    await evalPage('const slider = document.querySelector("input"); slider.value = ' + seekTo + '; slider.dispatchEvent(new Event("input"));');
    const scrubbed = await evalPage('({text: document.querySelector("button").textContent, time: document.querySelector("output").value})');
    if (scrubbed.text !== '播放' || scrubbed.time !== seekTo.toFixed(2) + ' 秒') throw Error('Seek did not stop at the requested position');
    if (fileTest) {
      const audioReady = await evalPage('document.querySelector("audio").duration === ' + duration);
      if (!audioReady) throw Error('Local WAV did not load');
      await evalPage('slider.value = ' + (firstDuration - 0.16) + '; slider.dispatchEvent(new Event("input")); document.querySelector("button").click();');
      let crossed = false;
      for (let i = 0; i < 28 && !crossed; i++) {
        crossed = await evalPage('Number(slider.value) >= ' + (secondStart + 0.14));
        if (!crossed) await new Promise(resolve => setTimeout(resolve, 120));
      }
      if (!crossed) throw Error('Playback did not cross into the second shot');
      await evalPage('slider.value = ' + (duration - 0.3) + '; slider.dispatchEvent(new Event("input")); document.querySelector("button").click();');
      let end;
      for (let attempt = 0; attempt < 30; attempt++) {
        end = await evalPage('({button: document.querySelector("button").textContent, clock: document.querySelector("output").value, hidden: document.hidden})');
        if (end.button === '播放' && end.clock === duration.toFixed(2) + ' 秒') break;
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      if (end.button !== '播放' || end.clock !== duration.toFixed(2) + ' 秒') throw Error('Local preview did not finish: ' + JSON.stringify(end));
      console.log("Local playback, seek, transition and sound metadata verified");
      if (errors.length) throw Error(JSON.stringify(errors));
      return;
    }
    await evalPage('document.fonts.ready.then(() => true)');
    const whiteEnd = await evalPage('openingShot.render(openingShot.duration); document.querySelector("canvas").getContext("2d").getImageData(0,0,1920,1080).data.every(value => value === 255)');
    if (!whiteEnd) throw Error("Expected full-screen white ending");

    const capture = async (time, type, quality) => {
      const data = await evalPage('openingShot.render(' + time + '); document.querySelector("canvas").toDataURL(' +
        JSON.stringify(type) + ',' + quality + ').split(",")[1]');
      return Buffer.from(data, 'base64');
    };
    const stillDir = process.env.SHOT_STILLS || root;
    for (const [label, t] of [['close', pullStart - 0.1], ['wide', firstDuration - 0.97], ['transition', firstDuration + 0.45], ['portrait', secondStart + 0.47], ['pullback', secondStart + 2.63], ['skyfall', secondStart + 4.38], ['abyss', secondStart + 7.80], ['white-point', secondStart + whiteLightAt + 0.31], ['white-out', duration - 1 / 30]]) {
      fs.writeFileSync(path.join(stillDir, label + '.jpg'), await capture(t, 'image/jpeg', 0.95));
    }
    if (process.argv.includes('--stills')) return;

    const fps = 30;
    const encoder = spawn('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'mjpeg',
      '-i', 'pipe:0', '-i', path.join(root, 'assets', 'score.wav'), '-c:v', 'libx264', '-preset', 'medium',
      '-crf', '17', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
      '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', String(duration), path.join(root, 'opening-shots-01-02-ribbon-fall.mp4')
    ], { windowsHide: true, stdio: ['pipe', 'inherit', 'inherit'] });
    const done = once(encoder, 'exit');
    for (let i = 0; i < Math.round(duration * fps); i++) {
      const frame = await capture(i / fps, 'image/jpeg', 0.96);
      if (!encoder.stdin.write(frame)) await once(encoder.stdin, 'drain');
    }
    encoder.stdin.end();
    const [code] = await done;
    if (code !== 0) throw Error('FFmpeg failed with exit ' + code);
    if (errors.length) throw Error(JSON.stringify(errors));
  } finally {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ id: 999999, method: 'Browser.close' }));
      ws.close();
    }
    server.closeAllConnections();
    server.close();
    if (browser && browser.exitCode === null && browser.signalCode === null) {
      await Promise.race([once(browser, 'exit'), new Promise(resolve => setTimeout(resolve, 1200))]);
      if (browser.exitCode === null && browser.signalCode === null) browser.kill();
    }
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
  }
}
main().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
