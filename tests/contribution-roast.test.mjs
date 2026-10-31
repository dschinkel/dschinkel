import test from 'node:test';
import assert from 'node:assert/strict';
import { svg, interactivePage } from '../scripts/generate-coffee-grid.mjs';

const calendar = {
  totalContributions: 1245,
  weeks: [{ contributionDays: [
    { date: '2026-10-29', weekday: 4, contributionCount: 0, contributionLevel: 'NONE' },
    { date: '2026-10-30', weekday: 5, contributionCount: 1, contributionLevel: 'FIRST_QUARTILE' },
    { date: '2026-10-31', weekday: 6, contributionCount: 1244, contributionLevel: 'FOURTH_QUARTILE' },
  ] }],
};

test('beans carry exact GitHub daily counts, including zero, rather than roast-level estimates', () => {
  const image = svg(calendar);
  assert.match(image, /2026-10-30: 1 contribution<\/title>/);
  assert.match(image, /2026-10-31: 1244 contributions<\/title>/);
  assert.match(image, /data-date="2026-10-29" data-count="0" data-level="0"/);
  assert.match(image, /Click to explore daily counts/);
});

test('new days automatically get their own exact count in the interactive chart', () => {
  const updated = structuredClone(calendar);
  updated.weeks.push({ contributionDays: [{ date: '2026-11-01', weekday: 0, contributionCount: 73, contributionLevel: 'THIRD_QUARTILE' }] });
  const page = interactivePage(updated);
  assert.match(page, /data-date="2026-11-01" data-count="73"/);
  assert.match(page, /count.textContent = value/);
  assert.match(page, /role="tooltip"/);
  assert.match(page, /focusin/);
  assert.match(page, /pointerover/);
  assert.match(page, /Hover, tap, or focus a bean/);
});

test('rejects invalid dates and counts before writing them into markup', () => {
  const bad = structuredClone(calendar);
  bad.weeks[0].contributionDays[0].date = '\"><script>';
  assert.throws(() => svg(bad), /Invalid contribution day/);
  bad.weeks[0].contributionDays[0].date = '2026-10-29';
  bad.weeks[0].contributionDays[0].contributionCount = -1;
  assert.throws(() => svg(bad), /Invalid contribution day/);
});
