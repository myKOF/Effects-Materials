'use strict';
// Export approved 1024px assets, verifying both original and delivered bytes.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(process.argv[2] || '');
const mode = process.argv[3] || '--check';
if (!['--apply', '--check'].includes(mode) || !fs.existsSync(path.join(root, 'AI_RULES.md'))) throw Error('Usage: node export.cjs <game-root> [--apply|--check]');
const record = JSON.parse(fs.readFileSync(path.join(__dirname, 'source.json'), 'utf8'));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
for (const a of record.assets) {
  const source = fs.readFileSync(path.join(__dirname, a.source));
  const png = fs.readFileSync(path.join(__dirname, a.export));
  if (hash(source) !== a.sourceSha256 || hash(png) !== a.sha256) throw Error('Hash mismatch: ' + a.target);
  if (png.subarray(0,8).toString('hex') !== '89504e470d0a1a0a' || png.readUInt32BE(16) !== 1024 || png.readUInt32BE(20) !== 1024 || png[25] !== 6 || png.length > 2097152) throw Error('Invalid RGBA PNG: ' + a.target);
  if (a.originalSource && hash(fs.readFileSync(path.join(__dirname, a.originalSource))) !== a.originalSourceSha256) throw Error('Original source mismatch: ' + a.target);
  if (!/^images\/(?:equip\/icon_[a-z_]+|icon_(?:helmet|shoulder|chest|belt|gloves|wrist|legs_armor|legs))\.png$/.test(a.target)) throw Error('Unexpected target');
  const target = path.join(root, a.target);
  if (mode === '--apply') { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(path.join(__dirname, a.export), target); }
  if (hash(fs.readFileSync(target)) !== a.sha256) throw Error('Game export mismatch: ' + a.target);
}
console.log(record.assets.length + ' RGBA PNGs: original/source/export/game SHA256 match, 1024 square, under 2 MiB.');
