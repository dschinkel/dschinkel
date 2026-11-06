import test from 'node:test';
import assert from 'node:assert/strict';
import { svg, interactivePage } from '../themes/christmas-hockey/generate-grid.mjs';

const calendar = {
  totalContributions: 16,
  weeks: [{ contributionDays: [0, 1, 3, 7, 12].map((count, weekday) => ({
    date: `2026-11-${String(1 + weekday).padStart(2, '0')}`,
    weekday,
    contributionCount: count
  })) }]
};

test('daily contribution counts map to none, small, medium, large, and extra large trees', () => {
  const image = svg(calendar);
  for (const [count, level] of [[0, 0], [1, 1], [3, 2], [7, 3], [12, 4]]) {
    assert.match(image, new RegExp(`data-count="${count}" data-level="${level}"`));
  }
  assert.match(image, /2026-11-05: 12 contributions; Extra large tree/);
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
