'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const review = path.resolve(process.env.PARCHMENT_REVIEW_DIR || path.join(os.tmpdir(), 'idle-rpg-extended-shot-one'));
const ffmpeg = process.env.PARCHMENT_FFMPEG || 'ffmpeg';
const firstShot = path.join(review, 'shot-01-extended.mp4');
const visual = path.join(review, 'shot-02-visual.mp4');
const assets = path.join(__dirname, 'assets');
const standalone = path.join(review, 'shot-02-archangel-fall-18s.mp4');
const joined = path.join(review, 'shots-01-02-34s.mp4');

function ff(args, directory = review) {
  const run = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    windowsHide: true, stdio: 'inherit', cwd: directory
  });
  if (run.error) throw run.error;
  if (run.status !== 0) throw Error('FFmpeg exited ' + run.status);
}

if (process.argv.includes('--tail')) {
  ff(['-ss', '15.966667', '-i', firstShot, '-frames:v', '1', path.join(assets, 'shot-one-tail.png')]);
} else {
  const temp = fs.mkdtempSync(path.join(review, 'join-shots-'));
  try {
    ff(['-i', firstShot, '-map', '0:v:0', '-c:v', 'copy', 'first.mp4'], temp);
    ff(['-i', visual, '-map', '0:v:0', '-c:v', 'copy', 'second.mp4'], temp);
    fs.writeFileSync(path.join(temp, 'shots.ffconcat'), 'ffconcat version 1.0\nfile first.mp4\nduration 16.000\nfile second.mp4\nduration 18.000\n');
    ff(['-f', 'concat', '-i', 'shots.ffconcat', '-i', path.join(assets, 'shots-one-two-preview.wav'),
      '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k',
      '-movflags', '+faststart', joined], temp);
    ff(['-i', visual, '-i', path.join(assets, 'shot-two-preview.wav'), '-map', '0:v:0', '-map', '1:a:0',
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', standalone]);
    console.log(joined);
    console.log(standalone);
  } finally {
    for (const file of ['first.mp4', 'second.mp4', 'shots.ffconcat']) {
      fs.rmSync(path.join(temp, file), { force: true });
    }
    fs.rmdirSync(temp);
  }
}
