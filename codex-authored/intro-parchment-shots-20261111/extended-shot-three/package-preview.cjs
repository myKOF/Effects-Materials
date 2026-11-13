'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const timing = require('./shot-timing.js');

const archive = path.resolve(process.env.PARCHMENT_ARCHIVE || path.join(__dirname, '..'));
const review = path.resolve(process.env.PARCHMENT_REVIEW_DIR || path.join(os.tmpdir(), 'idle-rpg-extended-shot-three'));
const audioDir = path.resolve(process.env.PARCHMENT_AUDIO_DIR || path.join(__dirname, 'assets'));
const ffmpeg = process.env.PARCHMENT_FFMPEG || 'ffmpeg';
const total = timing.offset + timing.thirdDuration;
const visual = path.join(review, 'shot-03-visual.mp4');
const standalone = path.join(review, 'shot-03-extended-' + timing.thirdDuration + 's.mp4');
const combined = path.join(review, 'opening-shots-01-03-' + total + 's.mp4');

function ff(args, cwd = review) {
  const run = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    windowsHide: true, stdio: 'inherit', cwd
  });
  if (run.error) throw run.error;
  if (run.status !== 0) throw Error('FFmpeg exited ' + run.status);
}

const streams = ['-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
  '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart'];
const temp = fs.mkdtempSync(path.join(review, 'join-third-shot-'));
try {
  ff(['-i', path.join(archive, 'web/shots-01-02-34s.mp4'), '-map', '0:v:0', '-c:v', 'copy', 'first-two.mp4'], temp);
  ff(['-i', visual, '-map', '0:v:0', '-c:v', 'copy', 'third.mp4'], temp);
  const list = 'ffconcat version 1.0\nfile first-two.mp4\nduration ' + timing.offset + '\nfile third.mp4\n';
  fs.writeFileSync(path.join(temp, 'shots.ffconcat'), list);
  ff(['-f', 'concat', '-i', 'shots.ffconcat', '-i', path.join(audioDir, 'opening-' + total + 's-preview.wav'), ...streams, combined], temp);
  ff(['-i', visual, '-i', path.join(audioDir, 'shot-three-preview.wav'), ...streams, standalone]);
  console.log(combined);
  console.log(standalone);
} finally {
  for (const file of ['first-two.mp4', 'third.mp4', 'shots.ffconcat']) {
    fs.rmSync(path.join(temp, file), { force: true });
  }
  fs.rmdirSync(temp);
}
