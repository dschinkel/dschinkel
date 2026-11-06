import test from 'node:test';
import assert from 'node:assert/strict';
import { svg, interactivePage } from '../themes/christmas-hockey/generate-grid.mjs';

const calendar = {
  totalContributions: 63,
  weeks: [{ contributionDays: [0, 1, 3, 7, 12, 40].map((count, weekday) => ({
    date: `2026-11-${String(1 + weekday).padStart(2, '0')}`,
    weekday,
    contributionCount: count
  })) }]
};

test('daily counts map to five distinct tree colors and sizes', () => {
  const image = svg(calendar);
  for (const [count, level] of [[0, 0], [1, 1], [3, 2], [7, 3], [12, 4], [40, 5]]) {
    assert.match(image, new RegExp(`data-count="${count}" data-level="${level}"`));
  }
  assert.match(image, /2026-11-06: 40 contributions; Extra large tree/);
  for (const color of ['#F4F5EA', '#F4CA66', '#54C878', '#126A46', '#E3454F']) assert.ok(image.includes(`fill="${color}"`));
  assert.doesNotMatch(image, />CONTRIBUTIONS<\/text>/);
});

test('interactive page exposes exact daily counts to pointer and keyboard users', () => {
  const page = interactivePage(calendar);
  assert.match(page, /data-date="2026-11-04" data-count="7"/);
  assert.match(page, /role="tooltip"/);
  assert.match(page, /focusin/);
  assert.match(page, /pointerover/);
});

test('invalid GitHub day data is rejected before it reaches SVG attributes', () => {
  const bad = structuredClone(calendar);
  bad.weeks[0].contributionDays[0].date = '\"><script>';
  assert.throws(() => svg(bad), /Invalid contribution day/);
});
