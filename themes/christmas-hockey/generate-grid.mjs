import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const username = process.env.GITHUB_USERNAME || 'dschinkel';

const query = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount weekday } }
      }
    }
  }
}`;

async function fetchCalendar() {
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('GITHUB_TOKEN is required');
const response = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    'user-agent': 'christmas-contribution-grid-generator'
  },
  body: JSON.stringify({ query, variables: { login: username } })
});
const result = await response.json();
if (!response.ok || result.errors || !result.data?.user) {
  throw new Error(`Could not load contribution calendar: ${JSON.stringify(result.errors || response.status)}`);
}

return result.data.user.contributionsCollection.contributionCalendar;
}
const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
})[char]);
const sizeFor = count => count === 0 ? 0 : count === 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;
const validDay = day => /^\d{4}-\d{2}-\d{2}$/.test(day.date) && Number.isSafeInteger(day.contributionCount) && day.contributionCount >= 0 && Number.isInteger(day.weekday) && day.weekday >= 0 && day.weekday <= 6;
const names = ['No contributions', 'Small tree', 'Medium tree', 'Large tree', 'Extra large tree'];
const step = 16;
const left = 70;
const top = 92;
const height = 260;
const text = (x, y, value, size = 11, color = '#CEDFD5') =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${color}">${escape(value)}</text>`;

function tree(x, y, level, title = '', day) {
  const attributes = day ? `class="day" tabindex="0" role="img" aria-label="${escape(title)}" data-date="${escape(day.date)}" data-count="${day.contributionCount}" data-level="${level}"` : '';
  const hitArea = day ? `<rect x="${x - 1}" y="${y - 1}" width="16" height="16" fill="transparent"/>` : '';
  if (!level) return `<g ${attributes}><title>${escape(title)}</title>${hitArea}<circle cx="${x + 7}" cy="${y + 7}" r="2" fill="#486052"/></g>`;
  const scale = [0, 0.55, 0.7, 0.85, 1][level];
  const lights = level >= 2
    ? `<circle cx="-2.5" cy="-2.2" r="0.9" fill="#F7DF85"/><circle cx="2.7" cy="2" r="0.9" fill="#F4F0DF"/>`
    : '';
  const moreLights = level >= 3
    ? `<circle cx="0.3" cy="-5.1" r="0.8" fill="#D83E45"/><circle cx="-3.6" cy="4" r="0.8" fill="#D83E45"/>`
    : '';
  return `<g ${attributes}><title>${escape(title)}</title>${hitArea}<g transform="translate(${x + 7} ${y + 7}) scale(${scale})">
    <path d="M-1.1 3.7V7H1.1V3.7" fill="#B99165"/>
    <path d="M0 -7.8L-4.1 -1.7H-2.6L-5.4 2.5H-3.5L-6.2 5.8H6.2L3.5 2.5H5.4L2.6 -1.7H4.1Z" fill="#17804D" stroke="#A9DAB7" stroke-width="0.65" stroke-linejoin="round"/>
    <path d="M-2.6 -1.7H2.6M-3.5 2.5H3.5" stroke="#70BA83" stroke-width="0.45" opacity="0.8"/>
    ${lights}${moreLights}<path d="M0 -9.4L0.55 -8.25L1.8 -8.1L0.9 -7.25L1.1 -6.05L0 -6.65L-1.1 -6.05L-0.9 -7.25L-1.8 -8.1L-0.55 -8.25Z" fill="#FFE3A0"/>
  </g></g>`;
}

export function svg(calendar) {
const width = Math.max(990, left + calendar.weeks.length * step + 28);
let cells = '';
let months = '';
let previousMonth = '';
const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
calendar.weeks.forEach((week, index) => {
  const first = week.contributionDays[0];
  if (!first) return;
  if (!validDay(first)) throw new Error('Invalid contribution day');
  const date = new Date(`${first.date}T00:00:00Z`);
  const month = monthFormat.format(date);
  if (month !== previousMonth && (index === 0 || date.getUTCDate() <= 7)) {
    if (index < calendar.weeks.length - 1) months += text(left + index * step, 80, month, 11, '#DDEBDD');
    previousMonth = month;
  }
  for (const day of week.contributionDays) {
    if (!validDay(day)) throw new Error('Invalid contribution day');
    const count = day.contributionCount;
    const level = sizeFor(count);
    cells += tree(left + index * step, top + day.weekday * step, level,
      `${day.date}: ${count} contribution${count === 1 ? '' : 's'}; ${names[level]}`, day);
  }
});

const legendX = width - 320;
const legend = names.map((name, level) => {
  const x = legendX + level * 65;
  return `<g>${tree(x, 207, level, name)}${text(x - 9, 231, ['None', 'Small', 'Medium', 'Large', 'XL'][level], 10, '#DDEBDD')}</g>`;
}).join('');
const generated = new Date().toISOString().slice(0, 10);
return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">Christmas contributions for ${escape(username)}</title>
<desc id="desc">${calendar.totalContributions.toLocaleString('en-US')} GitHub contributions in the last year. Trees grow from small to extra large as daily contributions increase.</desc>
<defs><linearGradient id="winter" x2="1" y2="1"><stop stop-color="#071D18"/><stop offset="1" stop-color="#0D3025"/></linearGradient></defs>
<rect width="${width}" height="${height}" rx="24" fill="#07110F"/>
<rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="18" fill="url(#winter)" stroke="#9F3237" stroke-width="1.5"/>
<g font-family="ui-monospace, SFMono-Regular, Menlo, monospace">
${text(42, 48, 'CONTRIBUTIONS', 17, '#F4F0E7')}
${text(42, 68, `${username} • ${calendar.totalContributions.toLocaleString('en-US')} contributions • generated ${generated}`, 11, '#DCE8DB')}
${months}
${text(34, top + step + 10, 'Mon', 10)}${text(34, top + step * 3 + 10, 'Wed', 10)}${text(34, top + step * 5 + 10, 'Fri', 10)}
${cells}
${text(42, 226, 'More contributions, bigger trees', 11, '#F3D8B9')}
${legend}
</g>
</svg>`;
}

export function interactivePage(calendar) {
  const chart = svg(calendar).replace('role="img" aria-labelledby="title desc"', 'role="group" aria-labelledby="title desc"');
  const icons = names.map((name, level) => `<svg viewBox="0 0 14 14" aria-hidden="true">${tree(0, 0, level, name)}</svg>`);
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Christmas Contributions — ${escape(username)}</title>
<style>
* { box-sizing: border-box; }
body { margin: 0; padding: 28px; background: #07110f; color: #f4f0e7; font: 16px system-ui, sans-serif; }
main { max-width: 1400px; margin: auto; }
a { color: #b9dfc0; }
.chart { overflow-x: auto; padding: 4px; }
.chart > svg { width: 100%; min-width: 760px; height: auto; display: block; }
.day { cursor: pointer; outline: none; }
.day:focus > rect { stroke: #fff; stroke-width: 1; rx: 3; }
#tree-tooltip { position: fixed; z-index: 10; width: 166px; padding: 10px; border: 1px solid #e6b0a9; border-radius: 14px; background: #10291f; color: #fff; text-align: center; box-shadow: 0 8px 25px #0009; pointer-events: none; }
#tree-tooltip[hidden] { display: none; }
#tooltip-tree svg { width: 80px; height: 80px; }
#tooltip-count { font-size: 24px; font-weight: 800; }
#tooltip-date { font-size: 12px; color: #dce8db; }
@media (max-width: 600px) { body { padding: 16px; } }
</style></head><body><main>
<h1>Contributions</h1>
<p>Hover, tap, or use Tab to select a tree and see the exact daily GitHub contribution count.</p>
<div class="chart">${chart}</div>
<p>Tree size follows daily activity. Counts refresh automatically every hour.</p>
<p><a href="https://github.com/${escape(username)}">Back to GitHub profile</a></p>
<div id="tree-tooltip" role="tooltip" hidden><div id="tooltip-tree"></div><div id="tooltip-count"></div><div id="tooltip-date"></div></div>
</main><script>
const icons = ${JSON.stringify(icons)};
const chart = document.querySelector('.chart');
const tip = document.getElementById('tree-tooltip');
let active;
function hide() { active?.removeAttribute('aria-describedby'); active = null; tip.hidden = true; }
function show(day) {
  if (!day) return;
  hide(); active = day;
  document.getElementById('tooltip-tree').innerHTML = icons[Number(day.dataset.level)];
  document.getElementById('tooltip-count').textContent = day.dataset.count + ' contributions';
  document.getElementById('tooltip-date').textContent = day.dataset.date;
  day.setAttribute('aria-describedby', 'tree-tooltip'); tip.hidden = false;
  const box = day.getBoundingClientRect();
  tip.style.left = Math.max(4, Math.min(window.innerWidth - 170, box.x + box.width / 2 - 83)) + 'px';
  tip.style.top = Math.max(4, box.top >= 180 ? box.top - 175 : Math.min(window.innerHeight - 175, box.bottom + 8)) + 'px';
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
</script></body></html>`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const calendar = await fetchCalendar();
  await fs.mkdir('dist', { recursive: true });
  await fs.writeFile('dist/christmas-contribution-grid.svg', svg(calendar));
  await fs.writeFile('dist/index.html', interactivePage(calendar));
  await fs.writeFile('dist/.nojekyll', '');
  console.log('Generated Christmas contribution SVG and interactive daily counts page');
}
