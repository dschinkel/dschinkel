// GitHub profile banner #084 — CRT Monitor · mono palette
// Phosphor glow, scanlines and an ASCII coffee cup on a curved screen.
//
// Usage:   node scripts/banners/084-crt-mono.mjs
// Output:  dist/banners/profile-banner-084-crt-mono.svg  (override with OUT=path/to/file.svg)
// Then reference it from README.md:  <img src="./dist/banners/profile-banner-084-crt-mono.svg" alt="DAVE SCHINKEL" width="100%">
//
// Customize: edit CONFIG (text, seed for the random bits, corner radius) and
// PALETTE (all colors). Everything else is plain SVG string building.
// No dependencies — Node 18+.

import fs from 'node:fs/promises';
import path from 'node:path';

const CONFIG = {
  "name": "DAVE SCHINKEL",
  "handle": "dave",
  "kicker": "AGENTIC ENGINEERING LAB",
  "sub": "TDD • Agentic Workflows • React • Node • Cloud Automation",
  "subLines": [
    "TDD • Agentic Workflows",
    "React • Node • Cloud Automation"
  ],
  "tags": [
    "TDD",
    "Agentic Workflows",
    "React",
    "Node",
    "Cloud"
  ],
  "role": "agentic engineer",
  "radius": 28,
  "seed": 666196,
  "description": "CRT Monitor banner (mono palette) — Phosphor glow, scanlines and an ASCII coffee cup on a curved screen."
};

const PALETTE = {
  "dark": true,
  "bg": "#0A0A0A",
  "bg2": "#1A1A1A",
  "panel": "#111111",
  "line": "#2E2E2E",
  "text": "#FAFAFA",
  "muted": "#A3A3A3",
  "accent": "#FFFFFF",
  "accent2": "#D4D4D4",
  "accent3": "#737373"
};

const OUT = process.env.OUT || 'dist/banners/profile-banner-084-crt-mono.svg';

const W = 1200;
const H = 300;
const SANS = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const f1 = (n) => Math.round(n * 10) / 10;

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt))));
  return '#' + ch.map((c) => c.toString(16).padStart(2, '0')).join('');
}

// Rounded 1200x300 canvas; everything is clipped to the rounded corners.
function frame(C, defs, body) {
  return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">\n' +
    '  <title id="title">' + esc(C.name) + ' GitHub Profile Banner</title>\n' +
    '  <desc id="desc">' + esc(C.description) + '</desc>\n' +
    '  <defs>\n    <clipPath id="frame"><rect width="' + W + '" height="' + H + '" rx="' + C.radius + '"/></clipPath>\n' + defs + '\n  </defs>\n' +
    '  <g clip-path="url(#frame)">\n' + body + '\n  </g>\n</svg>\n';
}

// Kicker / name / subtitle stack used by most layouts.
function textBlock(C, P, o = {}) {
  const x = o.x ?? 74;
  const y = o.y ?? 104;
  const anchor = o.anchor ?? 'start';
  const ns = o.nameSize ?? 60;
  const ny = y + Math.round(ns * 0.93);
  const lines = o.wrap ? C.subLines : [C.sub];
  const subSize = o.subSize ?? 22;
  let s = '';
  s += '<text x="' + x + '" y="' + y + '" text-anchor="' + anchor + '" font-family="' + (o.kickFont ?? MONO) + '" font-size="' + (o.kickSize ?? 22) + '" letter-spacing="' + (o.kickSpacing ?? 1) + '" fill="' + (o.kickColor ?? P.accent) + '">' + esc(C.kicker) + '</text>\n';
  s += '<text x="' + (x - 2) + '" y="' + ny + '" text-anchor="' + anchor + '" font-family="' + (o.nameFont ?? SANS) + '" font-size="' + ns + '" font-weight="' + (o.nameWeight ?? 800) + '" letter-spacing="' + (o.nameSpacing ?? 0) + '" fill="' + (o.nameColor ?? P.text) + '"' + (o.nameAttrs ?? '') + '>' + esc(C.name) + '</text>\n';
  lines.forEach((line, i) => {
    s += '<text x="' + x + '" y="' + (ny + 44 + i * 30) + '" text-anchor="' + anchor + '" font-family="' + (o.subFont ?? SANS) + '" font-size="' + subSize + '" fill="' + (o.subColor ?? P.muted) + '">' + esc(line) + '</text>\n';
  });
  return s;
}

// The coffee cup from the original banner, with animated steam.
function cup(x, y, s, o) {
  const st = o.stroke, fill = o.fill ?? 'none', steam = o.steam ?? o.stroke;
  const wisp = (d, dy, dur, lo, hi) =>
    '<path d="' + d + '" stroke="' + steam + '" stroke-width="5" stroke-linecap="round" opacity="' + hi + '">' +
    '<animateTransform attributeName="transform" type="translate" values="0 0; 0 -' + dy + '; 0 0" dur="' + dur + 's" repeatCount="indefinite"/>' +
    '<animate attributeName="opacity" values="' + lo + ';' + hi + ';' + lo + '" dur="' + dur + 's" repeatCount="indefinite"/></path>';
  return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
    '<path d="M60 68h130c0 52-28 96-73 96h-57c-45 0-73-44-73-96h73Z" fill="' + fill + '" stroke="' + st + '" stroke-width="' + (o.width ?? 5) + '"/>' +
    '<path d="M191 88h17c28 0 28 46 0 46h-23" stroke="' + st + '" stroke-width="11" stroke-linecap="round"/>' +
    '<path d="M13 177h151" stroke="' + st + '" stroke-width="8" stroke-linecap="round"/>' +
    (o.noSteam ? '' :
      wisp('M46 47 C26 27 70 22 50 2', 8, 4, 0.35, 0.9) +
      wisp('M92 45 C72 25 116 20 96 0', 10, 4.6, 0.25, 0.8) +
      wisp('M136 49 C116 29 160 24 140 4', 7, 5.2, 0.2, 0.7)) +
    '</g>';
}

function bean(x, y, rot, size, fill, crease, op = 1) {
  const rx = f1(size * 0.64), ry = size;
  return '<g transform="translate(' + f1(x) + ' ' + f1(y) + ') rotate(' + f1(rot) + ')" opacity="' + f1(op * 100) / 100 + '">' +
    '<ellipse rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"/>' +
    '<path d="M0 ' + -ry * 0.92 + ' C' + f1(-rx * 0.7) + ' ' + f1(-ry * 0.3) + ' ' + f1(rx * 0.7) + ' ' + f1(ry * 0.3) + ' 0 ' + ry * 0.92 + '" stroke="' + crease + '" stroke-width="' + f1(size * 0.14) + '" stroke-linecap="round"/></g>';
}

// ---------- design: CRT Monitor ----------
function design(P, C, R) {
    const ph = P.accent;
    const defs =
      '<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="#000" fill-opacity="0.28"/></pattern>\n' +
      '<radialGradient id="screen" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(600 150) scale(640 220)"><stop stop-color="' + P.bg2 + '"/><stop offset="1" stop-color="' + P.bg + '"/></radialGradient>\n' +
      '<radialGradient id="vig" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(600 150) scale(640 200)"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.65"/></radialGradient>\n' +
      '<filter id="phos" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
    const ascii = ['    ( (', '     ) )', '  ........', '  |      |]', '  \\      /', "   `----'"];
    // Steam: the two top lines (plus a faint wisp above) drift up, sway and fade, staggered.
    const steamAnim = (dur, delay, sway) =>
      '<animateTransform attributeName="transform" type="translate" values="0 6; ' + sway + ' -4; ' + -sway + ' -14" dur="' + dur + 's" begin="' + delay + 's" repeatCount="indefinite"/>' +
      '<animate attributeName="opacity" values="0;1;0" dur="' + dur + 's" begin="' + delay + 's" repeatCount="indefinite"/>';
    const art =
      '<text x="890" y="68" font-family="' + MONO + '" font-size="22" xml:space="preserve" fill="' + ph + '" opacity="0">' + esc('     ( ') + steamAnim(3.4, 1.1, 3) + '</text>' +
      ascii.map((l, i) => '<text x="890" y="' + (94 + i * 26) + '" font-family="' + MONO + '" font-size="22" xml:space="preserve" fill="' + ph + '"' + (i < 2 ? ' opacity="0"' : '') + '>' + esc(l) +
        (i === 0 ? steamAnim(2.6, 0, 4) : i === 1 ? steamAnim(3, 0.6, -3) : '') + '</text>').join('');
    const body =
      '<rect width="1200" height="300" fill="#050505"/>\n' +
      '<rect x="22" y="16" width="1156" height="268" rx="44" fill="url(#screen)" stroke="' + P.line + '" stroke-width="3"/>\n' +
      '<g filter="url(#phos)"><animate attributeName="opacity" values="1;.93;1;.97;1" dur="3.2s" repeatCount="indefinite"/>' +
      '<text x="80" y="96" font-family="' + MONO + '" font-size="20" fill="' + ph + '">&gt; ' + esc(C.kicker) + '</text>\n' +
      '<text x="78" y="160" font-family="' + MONO + '" font-size="60" font-weight="800" fill="' + ph + '">' + esc(C.name) + '</text>\n' +
      '<text x="80" y="202" font-family="' + MONO + '" font-size="17" fill="' + ph + '" fill-opacity="0.8">' + esc(C.sub) + '</text>\n' +
      '<text x="80" y="244" font-family="' + MONO + '" font-size="18" fill="' + ph + '">&gt; READY<tspan><animate attributeName="opacity" values="1;1;0;0" dur="1s" repeatCount="indefinite"/>_</tspan></text>\n' +
      art + '</g>\n' +
      '<rect x="22" y="16" width="1156" height="268" rx="44" fill="url(#scan)"/><rect x="22" y="16" width="1156" height="268" rx="44" fill="url(#vig)"/>';
    return frame(C, defs, body);
  }

const svg = design(PALETTE, CONFIG, mulberry32(CONFIG.seed));
await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, svg);
console.log('Wrote ' + OUT);
