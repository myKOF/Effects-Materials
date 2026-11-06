'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const rate = 44100;
const tau = 2 * Math.PI;
const frames = seconds => Math.round(seconds * rate);
const smooth = value => {
    const x = Math.max(0, Math.min(1, value));
    return x * x * (3 - 2 * x);
};

function noiseSource(seed) {
    return () => {
        seed ^= seed << 13;
        seed ^= seed >>> 17;
        seed ^= seed << 5;
        return (seed >>> 0) / 2147483648 - 1;
    };
}

function mix(buffer, offset, length, sample) {
    const first = frames(offset);
    const count = Math.min(frames(length), buffer.length - first);
    for (let i = 0; i < count; i++) {
        const t = i / rate;
        buffer[first + i] += sample(t) * smooth((count - 1 - i) / frames(0.006));
    }
}

function burst(attack, decay) {
    return t => smooth(t / attack) * Math.exp(-t / decay);
}

function noiseBand(buffer, random, offset, length, from, to, q, gain, envelope) {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    mix(buffer, offset, length, t => {
        const angular = tau * from * (to / from) ** (t / length) / rate;
        const alpha = Math.sin(angular) / (2 * q);
        const x = random();
        const y = (alpha * (x - x2) + 2 * Math.cos(angular) * y1 - (1 - alpha) * y2) / (1 + alpha);
        x2 = x1;
        x1 = x;
        y2 = y1;
        y1 = y;
        return y * gain * envelope(t);
    });
}


function softTone(buffer, length, firstFrequency, lastFrequency, gain, attack, decay) {
    const envelope = burst(attack, decay);
    let phase = 0;
    mix(buffer, 0, length, t => {
        const frequency = lastFrequency + (firstFrequency - lastFrequency) * Math.exp(-t / 0.013);
        phase += tau * frequency / rate;
        return gain * Math.sin(phase) * envelope(t);
    });
}


function moonGlow() {
    const sound = new Float64Array(frames(0.106));
    const random = noiseSource(0x6981bad4);
    softTone(sound, 0.101, 524, 522, 0.69, 0.013, 0.027);
    softTone(sound, 0.086, 793, 785, 0.27, 0.019, 0.018);
    softTone(sound, 0.075, 1058, 1042, 0.15, 0.016, 0.013);
    noiseBand(sound, random, 0.003, 0.069, 1220, 690, 1.08, 0.38, burst(0.015, 0.016));
    return sound;
}

function wav(samples, peakTarget) {
    assert(samples.every(Number.isFinite), 'Invalid sample');
    const peak = samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
    assert(peak > 0);
    const pcm = Buffer.alloc(44 + samples.length * 2);
    pcm.write('RIFF', 0);
    pcm.writeUInt32LE(pcm.length - 8, 4);
    pcm.write('WAVEfmt ', 8);
    pcm.writeUInt32LE(16, 16);
    pcm.writeUInt16LE(1, 20);
    pcm.writeUInt16LE(1, 22);
    pcm.writeUInt32LE(rate, 24);
    pcm.writeUInt32LE(rate * 2, 28);
    pcm.writeUInt16LE(2, 32);
    pcm.writeUInt16LE(16, 34);
    pcm.write('data', 36);
    pcm.writeUInt32LE(samples.length * 2, 40);
    const masterGain = 32767 * peakTarget / Math.tanh(0.48);
    for (let i = 0; i < samples.length; i++) {
        const fade = smooth(i / frames(0.002)) * smooth((samples.length - 1 - i) / frames(0.009));
        const value = Math.round(masterGain * Math.tanh(samples[i] * 0.48 / peak) * fade);
        pcm.writeInt16LE(value, 44 + i * 2);
    }
    return pcm;
}

const output = path.join(__dirname, 'hover-10-moon-glow.wav');
const audio = wav(moonGlow(), 0.092);
const mode = process.argv[2] ?? '--check';
if (mode === '--apply') {
    fs.writeFileSync(output, audio);
} else {
    assert.equal(mode, '--check', 'Usage: node render.cjs [--check|--apply]');
    assert(fs.readFileSync(output).equals(audio), 'WAV differs from the synthesis source');
}
