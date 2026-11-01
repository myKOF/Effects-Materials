'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const game = process.argv[2], mode = process.argv[3];
if (!game || !['--apply', '--check'].includes(mode)) throw Error('Usage: node export.cjs <game-root> --apply|--check');
const target = path.join(path.resolve(game), 'images/sprites/npc/npc.json');
assert.ok(fs.existsSync(target), 'NPC manifest must already exist');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
for (const [name, hash] of Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname, 'png-sha256.json'), 'utf8')))) {
  assert.equal(sha(fs.readFileSync(path.join(path.dirname(target), name))), hash, name);
}
const manifest = fs.readFileSync(path.join(__dirname, 'npc.json'));
if (mode === '--apply') fs.writeFileSync(target, manifest);
assert.equal(sha(fs.readFileSync(target)), sha(manifest), 'NPC manifest differs from approved export');
console.log('NPC manifest SHA256 matches; all 66 PNG hashes unchanged.');
