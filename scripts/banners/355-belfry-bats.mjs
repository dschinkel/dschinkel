// GitHub profile banner #355 — Belfry Bats · blood moon
// Usage: node scripts/banners/355-belfry-bats.mjs
// Output: dist/banners/profile-banner-355-belfry-bats.svg (override with OUT)
// Publish header: OUT=assets/github-profile-banner.svg node scripts/banners/355-belfry-bats.mjs
// Customize CONFIG and PALETTE. No dependencies — Node 18+.
import fs from 'node:fs/promises';
import path from 'node:path';

const CONFIG = {
  name: 'Dave Schinkel',
  sub: 'STAFF ENGINEER  ·  TDD  ·  AGENTIC WORKFLOWS',
  radius: 28,
  seed: 66613,
  description: 'Belfry bats banner — a torrent of bats pours from a gothic bell tower silhouetted against a blood-red moon, with red eyes glaring from the belfry.'
};
const PALETTE = {
  sky0: '#030103', sky1: '#12040A', sky2: '#3A0710', haze: '#8A0E16',
  moonCore: '#FF5A3A', moonMid: '#D11A1E', moonEdge: '#7A0712', moonCrater: '#5C040C', moonGlow: '#E0141C',
  cloud: '#0B0205', cloudRim: '#B3242A', stone: '#070205', stoneLit: '#2A070C', rim: '#C42A2A',
  belfry: '#010001', bell: '#0F0407', bellRim: '#9E2026', eyes: '#FF2E12', eyesHot: '#FFD08A',
  bat: '#050103', batFar: '#1A0508', roofs: '#040103', fog: '#5A0C14', text: '#F2E6DC', textGlow: '#FF2A1A', sub: '#E0473A'
};
const OUT = process.env.OUT || 'dist/banners/profile-banner-355-belfry-bats.svg';
const W = 1200;
const H = 300;
const SERIF = "Didot, 'Bodoni 72', 'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "'Avenir Next', Futura, 'Century Gothic', Inter, ui-sans-serif, system-ui, sans-serif";
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f1 = (n) => Math.round(n * 10) / 10;
const f2 = (n) => Math.round(n * 100) / 100;
function frame(C, defs, body) {
  return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" aria-labelledby="title desc">\n' +
    '  <title id="title">' + esc(C.name) + ' GitHub Profile Banner</title>\n' +
    '  <desc id="desc">' + esc(C.description) + '</desc>\n' +
    '  <defs>\n    <clipPath id="frame"><rect width="' + W + '" height="' + H + '" rx="' + C.radius + '"/></clipPath>\n' + defs + '\n  </defs>\n' +
    '  <g clip-path="url(#frame)">\n' + body + '\n  </g>\n</svg>\n';
}
// Catmull-Rom -> cubic Bezier for smooth organic outlines.
function smooth(pts, closed = false) {
  const n = pts.length;
  const get = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = 'M' + f1(pts[0][0]) + ' ' + f1(pts[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    d += 'C' + f1(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
      f1(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f1(p2[0]) + ' ' + f1(p2[1]);
  }
  return d + (closed ? 'Z' : '');
}
// Bat (span ~100 units, centred on the body).
// t: -1 wings fully raised, 0 spread, 1 fully down-stroke.
function batWings(t) {
  const a = Math.abs(t);
  let d = '';
  for (const s of [1, -1]) {
    const X = (x) => f1(x * s);
    const sh = [5, -4];
    const wrist = [25 - 4 * a, -13 + 17 * t];
    const tip = [50 - 9 * a, -7 + 27 * t];
    const fin2 = [41 - 6 * a, 6 + 19 * t];
    const fin3 = [29 - 3 * a, 11 + 11 * t];
    const fin4 = [16, 12 + 4 * t];
    const hip = [4, 10];
    const scal = (p, q) => {
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      return 'Q' + X(mx + (wrist[0] - mx) * 0.32) + ' ' + f1(my + (wrist[1] - my) * 0.32) + ' ' + X(q[0]) + ' ' + f1(q[1]);
    };
    d += 'M' + X(sh[0]) + ' ' + sh[1] +
      'C' + X(12) + ' ' + f1(-12 + 6 * t) + ' ' + X(18) + ' ' + f1(wrist[1] - 4) + ' ' + X(wrist[0]) + ' ' + f1(wrist[1]) +
      'C' + X(33) + ' ' + f1(wrist[1] - 3 + 2 * t) + ' ' + X(42) + ' ' + f1(tip[1] - 3) + ' ' + X(tip[0]) + ' ' + f1(tip[1]) +
      scal(tip, fin2) + scal(fin2, fin3) + scal(fin3, fin4) + scal(fin4, hip) + 'Z';
  }
  return d;
}
const BAT_BODY = 'M0 -15 L-3.2 -9.5 C-4.6 -6 -5.6 -2 -5.4 3 C-5 9 -2.6 14 0 17 C2.6 14 5 9 5.4 3 C5.6 -2 4.6 -6 3.2 -9.5Z' +
  'M-3.4 -9.6 L-5.6 -17.5 L-1 -12 Z M3.4 -9.6 L5.6 -17.5 L1 -12 Z';
function batSymbols(P, R) {
  const durs = [0.46, 0.53, 0.61, 0.68, 0.77];
  const base = [-0.7, 0.35, -0.2, 0.85, 0.1];
  let s = '';
  durs.forEach((dur, i) => {
    const vals = [base[i], 1, -1, base[i]];
    s += '<symbol id="bat' + i + '" viewBox="-55 -40 110 80" overflow="visible">' +
      '<path d="' + batWings(base[i]) + '">' +
      '<animate attributeName="d" values="' + vals.map(batWings).join(';') + '" keyTimes="0;' + f2((1 - base[i]) / 4 * 0.5 + 0.1) + ';0.62;1" dur="' + dur + 's" begin="-' + f2(R() * dur) + 's" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"/></path>' +
      '<path d="' + BAT_BODY + '"/></symbol>';
  });
  return s;
}
const useBat = (x, y, sc, rot, v, fill) =>
  '<use xlink:href="#bat' + v + '" href="#bat' + v + '" x="-55" y="-40" width="110" height="80" fill="' + fill + '" transform="translate(' + f1(x) + ' ' + f1(y) + ') rotate(' + f1(rot) + ') scale(' + f2(sc) + ')"/>';
function lancet(cx, top, w, bottom) {
  const r = w * 0.9;
  return 'M' + f1(cx - w / 2) + ' ' + f1(bottom) + 'V' + f1(top + w * 0.75) +
    'A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(cx) + ' ' + f1(top) +
    'A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(cx + w / 2) + ' ' + f1(top + w * 0.75) + 'V' + f1(bottom) + 'Z';
}
function tower(P, R, cx) {
  let s = '';
  const bw = 132, bx = cx - bw / 2;
  const belW = 118, belTop = 70, belBot = 150;
  s += '<path d="M' + bx + ' 300V' + belBot + 'H' + (bx + bw) + 'V300Z" fill="url(#stoneG)"/>';
  for (const k of [-1, 1]) {
    const x = cx + k * (bw / 2 + 2);
    s += '<path d="M' + f1(x - 9) + ' 300V196L' + f1(x - 9) + ' 186L' + f1(x) + ' 170L' + f1(x + 9) + ' 186V300Z" fill="' + P.stone + '"/>';
    s += '<path d="M' + f1(x - 13) + ' 300V242L' + f1(x - 4) + ' 230H' + f1(x + 4) + 'L' + f1(x + 13) + ' 242V300Z" fill="' + P.stone + '"/>';
  }
  s += '<rect x="' + (cx - belW / 2 - 8) + '" y="' + (belBot - 4) + '" width="' + (belW + 16) + '" height="8" fill="' + P.stone + '"/>';
  s += '<rect x="' + (cx - belW / 2 - 8) + '" y="' + (belBot - 4) + '" width="' + (belW + 16) + '" height="1.5" fill="' + P.rim + '" opacity="0.35"/>';
  s += '<rect x="' + (cx - belW / 2) + '" y="' + belTop + '" width="' + belW + '" height="' + (belBot - belTop) + '" fill="url(#stoneG)"/>';
  s += '<path d="' + lancet(cx, 200, 12, 246) + '" fill="' + P.belfry + '"/>';
  const ops = [cx - 27, cx + 27];
  ops.forEach((ox, i) => {
    const d = lancet(ox, belTop + 12, 38, belBot - 8);
    s += '<path d="' + lancet(ox, belTop + 9, 44, belBot - 6) + '" fill="' + P.stone + '" stroke="' + P.rim + '" stroke-opacity="0.18" stroke-width="1"/>';
    s += '<path d="' + d + '" fill="url(#belfryG)"/>';
    for (let y = belBot - 32; y < belBot - 9; y += 6) s += '<path d="M' + f1(ox - 19) + ' ' + y + 'L' + f1(ox + 19) + ' ' + (y + 4) + '" stroke="' + P.stone + '" stroke-width="3"/>';
    if (i === 0) {
      s += '<g><animateTransform attributeName="transform" type="rotate" values="-5 ' + ox + ' ' + (belTop + 24) + ';6 ' + ox + ' ' + (belTop + 24) + ';-5 ' + ox + ' ' + (belTop + 24) + '" keyTimes="0;0.5;1" dur="7.3s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>' +
        '<path d="M' + ox + ' ' + (belTop + 24) + 'C' + (ox - 6) + ' ' + (belTop + 24) + ' ' + (ox - 8) + ' ' + (belTop + 30) + ' ' + (ox - 9) + ' ' + (belTop + 38) + 'C' + (ox - 10) + ' ' + (belTop + 46) + ' ' + (ox - 13) + ' ' + (belTop + 50) + ' ' + (ox - 15) + ' ' + (belTop + 53) + 'H' + (ox + 15) + 'C' + (ox + 13) + ' ' + (belTop + 50) + ' ' + (ox + 10) + ' ' + (belTop + 46) + ' ' + (ox + 9) + ' ' + (belTop + 38) + 'C' + (ox + 8) + ' ' + (belTop + 30) + ' ' + (ox + 6) + ' ' + (belTop + 24) + ' ' + ox + ' ' + (belTop + 24) + 'Z" fill="' + P.bell + '" stroke="' + P.bellRim + '" stroke-opacity="0.55" stroke-width="1"/>' +
        '<rect x="' + (ox - 1.2) + '" y="' + (belTop + 17) + '" width="2.4" height="8" fill="' + P.bell + '"/></g>';
    }
    const pairs = i === 0 ? [[ox - 10, belTop + 64, 1], [ox + 11, belTop + 58, 0.75]] : [[ox - 6, belTop + 34, 1.15], [ox + 8, belTop + 56, 0.8], [ox - 9, belTop + 60, 0.7]];
    pairs.forEach(([ex, ey, sc], j) => {
      const dur = f1(5 + R() * 7);
      const k = f2(0.3 + R() * 0.55);
      s += '<g filter="url(#eyeGlow)"><g transform="translate(' + f1(ex) + ' ' + f1(ey) + ') scale(' + sc + ')">' +
        '<animateTransform attributeName="transform" type="scale" additive="sum" values="1 1;1 1;1 0.08;1 1;1 1" keyTimes="0;' + k + ';' + f2(k + 0.015) + ';' + f2(k + 0.03) + ';1" dur="' + dur + 's" repeatCount="indefinite"/>' +
        '<path d="M-6 -1.2C-4.5 -3 -2 -2.6 -1.2 0.6C-3 1.6 -5 1 -6 -1.2Z" fill="' + P.eyes + '"/>' +
        '<path d="M6 -1.2C4.5 -3 2 -2.6 1.2 0.6C3 1.6 5 1 6 -1.2Z" fill="' + P.eyes + '"/>' +
        '<circle cx="-3" cy="-0.4" r="0.7" fill="' + P.eyesHot + '"/><circle cx="3" cy="-0.4" r="0.7" fill="' + P.eyesHot + '"/></g></g>';
    });
  });
  s += '<rect x="' + (cx - 3) + '" y="' + (belTop + 10) + '" width="6" height="' + (belBot - belTop - 14) + '" fill="' + P.stone + '"/>';
  s += '<rect x="' + (cx - belW / 2 - 6) + '" y="' + (belTop - 8) + '" width="' + (belW + 12) + '" height="10" fill="' + P.stone + '"/>';
  for (let x = cx - belW / 2 - 6; x < cx + belW / 2 + 4; x += 13) s += '<rect x="' + f1(x) + '" y="' + (belTop - 14) + '" width="7" height="7" fill="' + P.stone + '"/>';
  for (const k of [-1, 1]) {
    const x = cx + k * (belW / 2 + 1);
    s += '<path d="M' + f1(x - 6) + ' ' + (belTop - 6) + 'V' + (belTop - 22) + 'L' + f1(x) + ' ' + (belTop - 58) + 'L' + f1(x + 6) + ' ' + (belTop - 22) + 'V' + (belTop - 6) + 'Z" fill="' + P.stone + '"/>';
    for (let j = 0; j < 4; j++) { const yy = belTop - 26 - j * 8; const hw = 6 * (1 - (j + 1) / 5.2); s += '<path d="M' + f1(x - hw) + ' ' + yy + 'l' + f1(-3) + ' -3" stroke="' + P.stone + '" stroke-width="1.6" stroke-linecap="round"/><path d="M' + f1(x + hw) + ' ' + yy + 'l3 -3" stroke="' + P.stone + '" stroke-width="1.6" stroke-linecap="round"/>'; }
  }
  const sb = belTop - 8, sw = 44;
  s += '<path d="M' + (cx - sw) + ' ' + sb + 'C' + (cx - 30) + ' ' + (sb - 40) + ' ' + (cx - 8) + ' ' + (sb - 90) + ' ' + cx + ' ' + (sb - 118) + 'C' + (cx + 8) + ' ' + (sb - 90) + ' ' + (cx + 30) + ' ' + (sb - 40) + ' ' + (cx + sw) + ' ' + sb + 'Z" fill="url(#stoneG)"/>';
  s += '<path d="' + lancet(cx, sb - 34, 12, sb - 10) + '" fill="' + P.belfry + '"/>';
  s += '<path d="M' + cx + ' ' + (sb - 118) + 'V' + (sb - 134) + 'M' + (cx - 5) + ' ' + (sb - 126) + 'H' + (cx + 5) + '" stroke="' + P.stone + '" stroke-width="2.2"/>';
  s += '<path d="M' + (cx - sw) + ' ' + sb + 'C' + (cx - 30) + ' ' + (sb - 40) + ' ' + (cx - 8) + ' ' + (sb - 90) + ' ' + cx + ' ' + (sb - 118) + '" stroke="' + P.rim + '" stroke-width="1.2" opacity="0.5"/>';
  s += '<path d="M' + (cx - belW / 2) + ' ' + belTop + 'V' + (belBot - 4) + 'M' + bx + ' ' + (belBot + 4) + 'V300" stroke="' + P.rim + '" stroke-width="1.2" opacity="0.45"/>';
  return s;
}
function design(P, C, R) {
  const cx = 1018;
  const moon = { x: 880, y: 132, r: 116 };
  const beX = cx, beY = 116;
  let defs = '';
  defs += '<radialGradient id="skyG" cx="880" cy="132" r="760" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="' + P.sky2 + '"/><stop offset="0.35" stop-color="' + P.sky1 + '"/><stop offset="1" stop-color="' + P.sky0 + '"/></radialGradient>';
  defs += '<radialGradient id="hazeG" cx="880" cy="132" r="320" gradientUnits="userSpaceOnUse"><stop offset="0.3" stop-color="' + P.haze + '" stop-opacity="0.55"/><stop offset="1" stop-color="' + P.haze + '" stop-opacity="0"/></radialGradient>';
  defs += '<radialGradient id="moonG" cx="0.42" cy="0.38" r="0.7"><stop offset="0" stop-color="' + P.moonCore + '"/><stop offset="0.55" stop-color="' + P.moonMid + '"/><stop offset="1" stop-color="' + P.moonEdge + '"/></radialGradient>';
  defs += '<linearGradient id="stoneG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + P.stoneLit + '"/><stop offset="0.35" stop-color="' + P.stone + '"/><stop offset="1" stop-color="' + P.stone + '"/></linearGradient>';
  defs += '<radialGradient id="belfryG" cx="0.5" cy="0.6" r="0.7"><stop offset="0" stop-color="' + P.sky2 + '" stop-opacity="0.9"/><stop offset="1" stop-color="' + P.belfry + '"/></radialGradient>';
  defs += '<linearGradient id="fogG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.fog + '" stop-opacity="0"/><stop offset="1" stop-color="' + P.fog + '" stop-opacity="0.55"/></linearGradient>';
  defs += '<linearGradient id="textShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + P.sky0 + '" stop-opacity="0.85"/><stop offset="0.42" stop-color="' + P.sky0 + '" stop-opacity="0.55"/><stop offset="0.6" stop-color="' + P.sky0 + '" stop-opacity="0"/></linearGradient>';
  defs += '<filter id="blur30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>';
  defs += '<filter id="blur8" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="8"/></filter>';
  defs += '<filter id="blur2"><feGaussianBlur stdDeviation="1.4"/></filter>';
  defs += '<filter id="eyeGlow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  defs += '<filter id="textGlow" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur in="SourceAlpha" stdDeviation="9" result="a"/><feFlood flood-color="' + P.textGlow + '" flood-opacity="0.45"/><feComposite in2="a" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  defs += '<clipPath id="moonClip"><circle cx="' + moon.x + '" cy="' + moon.y + '" r="' + moon.r + '"/></clipPath>';
  defs += batSymbols(P, mulberry32(C.seed + 7));
  let b = '';
  b += '<rect width="1200" height="300" fill="url(#skyG)"/>\n';
  b += '<rect width="1200" height="300" fill="url(#hazeG)"><animate attributeName="opacity" values="0.8;1;0.85;0.95;0.8" keyTimes="0;0.3;0.55;0.8;1" dur="11s" repeatCount="indefinite"/></rect>\n';
  for (let i = 0; i < 70; i++) {
    const x = R() * 1200, y = R() * 170;
    if (Math.hypot(x - moon.x, y - moon.y) < 260) continue;
    b += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f2(0.4 + R() * 0.7) + '" fill="' + P.text + '" opacity="' + f2(0.12 + R() * 0.3) + '"/>';
  }
  b += '<circle cx="' + moon.x + '" cy="' + moon.y + '" r="' + (moon.r + 34) + '" fill="' + P.moonGlow + '" opacity="0.5" filter="url(#blur30)"><animate attributeName="opacity" values="0.42;0.6;0.46;0.55;0.42" keyTimes="0;0.27;0.5;0.78;1" dur="9.7s" repeatCount="indefinite"/></circle>\n';
  b += '<circle cx="' + moon.x + '" cy="' + moon.y + '" r="' + moon.r + '" fill="url(#moonG)"/>\n';
  b += '<g clip-path="url(#moonClip)" fill="' + P.moonCrater + '">';
  const craters = [[-34, -30, 22, 0.35], [24, 10, 30, 0.3], [-10, 44, 16, 0.32], [40, -44, 12, 0.3], [-58, 18, 14, 0.28], [6, -10, 9, 0.25], [60, 48, 20, 0.22], [-40, 70, 26, 0.18]];
  for (const [dx, dy, r, o] of craters) b += '<ellipse cx="' + (moon.x + dx) + '" cy="' + (moon.y + dy) + '" rx="' + r + '" ry="' + f1(r * 0.86) + '" opacity="' + o + '" filter="url(#blur2)"/>';
  b += '<circle cx="' + moon.x + '" cy="' + moon.y + '" r="' + moon.r + '" fill="none" stroke="' + P.moonEdge + '" stroke-width="16" opacity="0.6" filter="url(#blur8)"/></g>\n';
  const streak = (y, x0, len, th, op, dur, dx) => {
    const pts = [[x0, y], [x0 + len * 0.25, y - th * 0.8], [x0 + len * 0.55, y - th * 0.3], [x0 + len * 0.8, y - th], [x0 + len, y], [x0 + len * 0.6, y + th * 0.4], [x0 + len * 0.3, y + th * 0.5]];
    return '<g opacity="' + op + '"><animateTransform attributeName="transform" type="translate" values="0 0;' + dx + ' 0;0 0" dur="' + dur + 's" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>' +
      '<path d="' + smooth(pts, true) + '" fill="' + P.cloud + '"/><path d="' + smooth(pts.slice(0, 5)) + '" stroke="' + P.cloudRim + '" stroke-width="1" opacity="0.35"/></g>';
  };
  b += streak(96, 760, 230, 9, 0.85, 41, 46) + streak(176, 840, 260, 7, 0.75, 53, -38) + streak(58, 640, 180, 6, 0.6, 47, 30) + '\n';
  const roofs = [[560, 268, 40, 22], [600, 262, 30, 30], [640, 272, 54, 16], [700, 258, 26, 40], [735, 266, 46, 24], [790, 270, 40, 20], [835, 262, 30, 34], [870, 270, 60, 18], [1110, 262, 40, 30], [1150, 268, 60, 22]];
  let rf = 'M540 300';
  for (const [x, y, w, h] of roofs) rf += 'L' + x + ' ' + y + 'L' + (x + w / 2) + ' ' + (y - h) + 'L' + (x + w) + ' ' + y;
  rf += 'L1200 268V300Z';
  b += '<path d="' + rf + '" fill="' + P.roofs + '"/>\n';
  b += '<rect x="707" y="236" width="4" height="6" fill="' + P.eyes + '" opacity="0.6"><animate attributeName="opacity" values="0.6;0.6;0.15;0.55;0.6" keyTimes="0;0.6;0.64;0.7;1" dur="13s" repeatCount="indefinite"/></rect>\n';
  b += tower(P, R, cx) + '\n';
  const stream = (u) => {
    const p0 = [beX - 34, beY + 4], p1 = [820, 200], p2 = [585, 22];
    const a = (1 - u) * (1 - u), m = 2 * u * (1 - u), c = u * u;
    return [a * p0[0] + m * p1[0] + c * p2[0], a * p0[1] + m * p1[1] + c * p2[1]];
  };
  let swarm = '';
  for (let i = 0; i < 190; i++) {
    const u = Math.pow(R(), 1.15);
    const [sx, sy] = stream(u);
    const spread = 8 + u * 70;
    const x = sx + (R() - 0.5) * spread * 1.3, y = sy + (R() - 0.5) * spread;
    if (y < 6 || x < 565 || y > 236) continue;
    const sc = 0.05 + u * 0.17 + R() * 0.06;
    swarm += useBat(x, y, sc, (R() - 0.5) * 60, Math.floor(R() * 5), P.bat);
  }
  const big = [[668, 64, 0.36, -14], [760, 22, 0.28, 10], [1120, 34, 0.3, 16], [1158, 170, 0.22, -6], [612, 120, 0.2, 8]];
  big.forEach(([x, y, sc, rot], i) => { swarm += useBat(x, y, sc, rot, i % 5, P.bat); });
  b += '<g>' + swarm + '</g>\n';
  let fly = '';
  const FR = mulberry32(C.seed + 99);
  for (let i = 0; i < 16; i++) {
    const ex = beX + (FR() - 0.5) * 50, ey = beY + 6 + FR() * 18;
    const left = FR() < 0.78;
    const tx = left ? 560 + FR() * 300 : 1080 + FR() * 160;
    const ty = -30 - FR() * 20;
    const c1x = ex + (left ? -120 - FR() * 140 : 40 + FR() * 60), c1y = ey + 30 + FR() * 50;
    const c2x = tx + (FR() - 0.5) * 160, c2y = 60 + FR() * 80;
    const dur = f1(6 + FR() * 7);
    const begin = f1(FR() * 12);
    const pth = 'M' + f1(ex) + ' ' + f1(ey) + 'C' + f1(c1x) + ' ' + f1(c1y) + ' ' + f1(c2x) + ' ' + f1(c2y) + ' ' + f1(tx) + ' ' + f1(ty);
    const sMax = f2(0.28 + FR() * 0.22);
    fly += '<g opacity="0">' +
      '<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.9;1" dur="' + dur + 's" begin="' + begin + 's" repeatCount="indefinite"/>' +
      '<animateMotion path="' + pth + '" dur="' + dur + 's" begin="' + begin + 's" repeatCount="indefinite" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.3 0.1 0.6 1"/>' +
      '<g><animateTransform attributeName="transform" type="scale" values="0.06;' + sMax + '" dur="' + dur + 's" begin="' + begin + 's" repeatCount="indefinite"/>' +
      '<use xlink:href="#bat' + (i % 5) + '" href="#bat' + (i % 5) + '" x="-55" y="-40" width="110" height="80" fill="' + P.bat + '"/></g></g>';
  }
  b += fly + '\n';
  b += '<g><animateTransform attributeName="transform" type="translate" values="0 0;-40 2;0 0" dur="37s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>' +
    '<path d="' + smooth([[480, 300], [520, 262], [640, 270], [760, 252], [900, 266], [1040, 250], [1180, 262], [1260, 254], [1260, 300]]) + 'Z" fill="url(#fogG)" filter="url(#blur8)"/></g>\n';
  b += '<rect width="760" height="300" fill="url(#textShade)"/>\n';
  b += '<ellipse cx="300" cy="272" rx="360" ry="34" fill="' + P.haze + '" opacity="0.32" filter="url(#blur30)"/>';
  b += '<path d="' + smooth([[-10, 262], [120, 252], [260, 258], [400, 266], [540, 272], [600, 300]]) + 'L-10 300Z" fill="' + P.roofs + '"/>';
  for (const [x, w, h, r, kind] of [[118, 16, 30, -9, 0], [196, 13, 24, 7, 1], [300, 18, 27, 4, 0], [500, 12, 20, -13, 1]]) {
    const gy = 257 + (x / 540) * 10;
    b += '<g transform="translate(' + x + ' ' + f1(gy + 2) + ') rotate(' + r + ')" fill="' + P.roofs + '">' +
      (kind ? '<path d="M-1.6 0V-' + h + 'M-' + f1(w / 2) + ' -' + f1(h * 0.68) + 'H' + f1(w / 2) + '" stroke="' + P.roofs + '" stroke-width="2.6"/>'
            : '<path d="M-' + f1(w / 2) + ' 0V-' + f1(h - w / 2) + 'A' + f1(w / 2) + ' ' + f1(w / 2) + ' 0 0 1 ' + f1(w / 2) + ' -' + f1(h - w / 2) + 'V0Z"/>') + '</g>';
  }
  let fence = '';
  for (let x = 30; x < 470; x += 9) { const gy = 241 + (x / 540) * 16; fence += 'M' + x + ' ' + f1(gy + 30) + 'V' + f1(gy) + 'l-1.6 -2.4 1.6 -3 1.6 3 -1.6 2.4'; }
  b += '<path d="' + fence + '" stroke="' + P.roofs + '" stroke-width="1.6" fill="' + P.roofs + '"/>';
  b += '<path d="M27 245.5L470 259.5M27 252L470 266" stroke="' + P.roofs + '" stroke-width="2"/>\n';
  const nameSize = 66, subSize = 15;
  const capH = nameSize * 0.71, gap = 46;
  const top = 150 - (capH + gap) / 2;
  const ny = f1(top + capH), sy = f1(top + capH + gap);
  b += '<text x="78" y="' + ny + '" font-family="' + SERIF + '" font-size="' + nameSize + '" font-weight="400" letter-spacing="1" fill="' + P.text + '" filter="url(#textGlow)">' + esc(C.name) + '</text>\n';
  b += '<rect x="80" y="' + f1(+ny + 18) + '" width="56" height="1.5" fill="' + P.sub + '" opacity="0.8"/>\n';
  b += '<text x="80" y="' + sy + '" font-family="' + SANS + '" font-size="' + subSize + '" font-weight="600" letter-spacing="3.2" fill="' + P.sub + '">' + esc(C.sub) + '</text>\n';
  b += '<rect width="1200" height="300" fill="none" stroke="' + P.sky0 + '" stroke-width="60" opacity="0.5" filter="url(#blur30)"/>';
  return frame(C, defs, b);
}
const svg = design(PALETTE, CONFIG, mulberry32(CONFIG.seed));
await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, svg);
console.log('Wrote ' + OUT + ' (' + Math.round(svg.length / 1024) + ' KB)');
