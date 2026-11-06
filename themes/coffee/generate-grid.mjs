import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const username = process.env.GITHUB_USERNAME || 'dschinkel';
const token = process.env.GITHUB_TOKEN;

const query = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            contributionLevel
            weekday
          }
        }
      }
    }
  }
}`;

async function fetchCalendar() {
  if (!token) throw new Error('Missing GITHUB_TOKEN. GitHub Actions provides this automatically.');
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'coffee-contribution-grid-generator'
    },
    body: JSON.stringify({ query, variables: { login: username } })
  });

  const json = await response.json();

  if (!response.ok || json.errors) {
    console.error(JSON.stringify(json, null, 2));
    process.exit(1);
  }

  return json.data.user.contributionsCollection.contributionCalendar;
}

const levels = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];

// Use GitHub's contribution levels; darker reds mean more activity.
const palette = [
  { fill: '#2A070C', stroke: '#5A0C14', line: '#8A0E16', label: 'No roast' },
  { fill: '#FFB09A', stroke: '#F2E6DC', line: '#7A0712', label: 'Light roast' },
  { fill: '#FF5A3A', stroke: '#FFB09A', line: '#7A0712', label: 'Medium roast' },
  { fill: '#C42A2A', stroke: '#E0473A', line: '#F2E6DC', label: 'Dark roast' },
  { fill: '#8A0E16', stroke: '#E0473A', line: '#FFB09A', label: 'Espresso' }
];

function bean(x, y, level, title = '', day) {
  const p = palette[level];
  const tooltip = title ? `<title>${title}</title>` : '';
  const attributes = day ? `class="day" tabindex="0" role="img" aria-label="${title}" data-date="${day.date}" data-count="${day.contributionCount}" data-level="${level}"` : '';
  const hitArea = day ? `<rect x="${x - 1}" y="${y - 1}" width="16" height="16" fill="transparent"/>` : '';

  if (level === 0) {
    return `<g ${attributes}>${tooltip}${hitArea}<circle cx="${x + 7}" cy="${y + 7}" r="2.1" fill="#5A0C14" opacity="0.55"/></g>`;
  }

  return `
    <g ${attributes}>
      ${tooltip}${hitArea}
      <ellipse cx="${x + 7}" cy="${y + 7}" rx="5.7" ry="7.1" transform="rotate(-24 ${x + 7} ${y + 7})" fill="${p.fill}" stroke="${p.stroke}" stroke-width="1.1"/>
      <path d="M${x + 4.8} ${y + 2.6} C${x + 9.1} ${y + 5.2}, ${x + 4.7} ${y + 8.4}, ${x + 9.5} ${y + 12.1}" stroke="${p.line}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    </g>`;
}

function weekMonthLabels(weeks) {
  let labels = '';
  let lastMonth = '';
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
  weeks.forEach((week, i) => {
    const first = week.contributionDays[0];
    if (!first) return;
    const d = new Date(`${first.date}T00:00:00Z`);
    const month = formatter.format(d);
    if (month !== lastMonth && d.getUTCDate() <= 7) {
      labels += `<text x="${64 + i * 16}" y="96" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" fill="#C9A0A1">${month}</text>`;
      lastMonth = month;
    }
  });
  return labels;
}

export function svg(calendar, callout = 'Click to explore daily counts ↗') {
  const weeks = calendar.weeks;
  const width = 990;
  const height = 300;
  const gridX = 64;
  const gridY = 112;
  const cell = 14;
  const gap = 2;
  const now = new Date().toISOString().slice(0, 10);

  let beans = '';
  weeks.forEach((week, weekIndex) => {
    week.contributionDays.forEach((day) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isSafeInteger(day.contributionCount) || day.contributionCount < 0) throw new Error('Invalid contribution day');
      const x = gridX + weekIndex * (cell + gap);
      const y = gridY + day.weekday * (cell + gap);
      const level = levels.indexOf(day.contributionLevel);
      if (level < 0) throw new Error(`Unknown contribution level: ${day.contributionLevel}`);
      beans += bean(x, y, level, `${day.date}: ${day.contributionCount} contribution${day.contributionCount === 1 ? '' : 's'}`, day);
    });
  });

  const legend = palette.map((p, i) => {
    const x = 648 + i * 66;
    const sample = bean(x, 245, i);
    return `<g>${sample}<text x="${x - 8}" y="276" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9" fill="#C9A0A1">${p.label.split(' ')[0]}</text></g>`;
  }).join('');

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">Coffee-themed GitHub contribution grid for ${username}</title>
  <desc id="desc">A coffee bean roast map generated from GitHub contribution activity. Bean colors progress from pale coral to deep red as activity increases.</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="990" y2="300" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#050103"/>
      <stop offset="0.55" stop-color="#17050B"/>
      <stop offset="1" stop-color="#070205"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect x="0" y="0" width="990" height="300" rx="24" fill="url(#bg)"/>
  <rect x="18" y="18" width="954" height="264" rx="18" fill="#0B0205" stroke="#8A0E16" stroke-opacity="0.55"/>

  <g filter="url(#shadow)">
    <text x="42" y="47" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="16" fill="#E0473A">CONTRIBUTION ROAST</text>
    <text x="42" y="67" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" fill="#C9A0A1">${username} • ${calendar.totalContributions} contributions • generated ${now}</text>
  </g>

  <g>
    <text x="34" y="124" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" fill="#A8797D">Mon</text>
    <text x="34" y="156" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" fill="#A8797D">Wed</text>
    <text x="34" y="188" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" fill="#A8797D">Fri</text>
    ${weekMonthLabels(weeks)}
    ${beans}
  </g>

  <g>
    ${legend}
    <rect x="42" y="244" width="${Math.ceil(callout.length * 7.2 + 24)}" height="24" rx="12" fill="#2A070C" stroke="#E0473A" stroke-opacity="0.7"/>
    <text x="54" y="260" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" fill="#FFB09A">${callout}</text>
  </g>
</svg>`;
}

export function interactivePage(calendar) {
  // Inline SVG exposes each day to pointer and keyboard events; README images cannot.
  const chart = svg(calendar, 'Hover, tap, or focus a bean to see its daily count').replace('role="img" aria-labelledby="title desc"', 'role="group" aria-labelledby="title desc"');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Contribution Roast — ${username}</title>
<style>
* { box-sizing: border-box; }
body { margin: 0; padding: 28px; background: #0d1117; color: #f0f3f6; font: 16px system-ui, sans-serif; }
main { max-width: 1400px; margin: auto; }
a { color: #ffb09a; }
h1 { font-size: 28px; }
.chart { overflow-x: auto; padding: 4px; }
.chart > svg { width: 100%; min-width: 760px; height: auto; display: block; }
.day { cursor: pointer; outline: none; }
.day:focus > rect { stroke: #fff; stroke-width: 1; rx: 3; }
#bean-tooltip { position: fixed; width: 120px; height: 144px; pointer-events: none; z-index: 10; filter: drop-shadow(0 5px 8px #000a); }
#bean-tooltip[hidden] { display: none; }
#bean-tooltip svg { width: 100%; height: 100%; overflow: visible; }
@media (max-width: 600px) { body { padding: 16px; } }
</style>
</head>
<body><main>
<h1>Contribution Roast</h1>
<p>Hover, tap, or use Tab to select a bean. The larger bean shows that day's actual GitHub contribution count.</p>
<div class="chart">${chart}</div>
<p>Counts come from GitHub's contribution calendar and refresh automatically every hour.</p>
<p><a href="https://github.com/${username}">Back to GitHub profile</a></p>
<div id="bean-tooltip" role="tooltip" hidden>
<svg viewBox="0 0 120 144" aria-hidden="true">
<g transform="translate(4 16) scale(8)">
<ellipse id="tooltip-bean" cx="7" cy="7" rx="5.7" ry="7.1" transform="rotate(-24 7 7)" stroke-width=".35"/>
<path id="tooltip-seam" d="M4.8 2.6 C9.1 5.2, 4.7 8.4, 9.5 12.1" stroke-width=".4" fill="none" stroke-linecap="round"/>
</g>
<text id="tooltip-count" x="60" y="74" text-anchor="middle" dominant-baseline="middle" font-family="ui-monospace, monospace" font-weight="800" stroke-width="5" stroke-linejoin="round" paint-order="stroke"></text>
</svg></div>
</main>
<script>
const palette = ${JSON.stringify(palette)};
const chart = document.querySelector('.chart');
const tip = document.getElementById('bean-tooltip');
const count = document.getElementById('tooltip-count');
let active;
function hide() {
  active?.removeAttribute('aria-describedby'); active = null; tip.hidden = true;
}
function show(day) {
  if (!day) return;
  hide(); active = day;
  const p = palette[Number(day.dataset.level)];
  const value = day.dataset.count;
  const ink = Number(day.dataset.level) === 1 ? '#4b0710' : '#fff5ee';
  document.getElementById('tooltip-bean').setAttribute('fill', p.fill);
  document.getElementById('tooltip-bean').setAttribute('stroke', p.stroke);
  document.getElementById('tooltip-seam').setAttribute('stroke', p.line);
  count.textContent = value;
  count.setAttribute('font-size', Math.min(32, 84 / Math.max(1, value.length) * 1.35));
  count.setAttribute('fill', ink); count.setAttribute('stroke', p.fill);
  tip.setAttribute('aria-label', day.getAttribute('aria-label'));
  day.setAttribute('aria-describedby', 'bean-tooltip'); tip.hidden = false;
  const box = day.getBoundingClientRect();
  const left = Math.max(4, Math.min(window.innerWidth - 124, box.x + box.width / 2 - 60));
  const top = box.top >= 156 ? box.top - 152 : Math.min(window.innerHeight - 148, box.bottom + 8);
  tip.style.left = left + 'px'; tip.style.top = Math.max(4, top) + 'px';
}
chart.querySelectorAll('.day title').forEach(title => title.remove());
chart.addEventListener('pointerover', event => show(event.target.closest('.day')));
chart.addEventListener('pointerleave', hide);
chart.addEventListener('pointerout', event => { if (!event.relatedTarget?.closest?.('.day')) hide(); });
chart.addEventListener('focusin', event => show(event.target.closest('.day')));
chart.addEventListener('focusout', hide);
chart.addEventListener('click', event => show(event.target.closest('.day')));
document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
window.addEventListener('scroll', hide, true);
window.addEventListener('resize', hide);
</script>
</body></html>`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const calendar = await fetchCalendar();
  await fs.mkdir('dist', { recursive: true });
  await fs.writeFile('dist/coffee-contribution-grid.svg', svg(calendar));
  await fs.writeFile('dist/index.html', interactivePage(calendar));
  await fs.writeFile('dist/.nojekyll', '');
  console.log('Generated contribution SVG and interactive daily counts page');
}
