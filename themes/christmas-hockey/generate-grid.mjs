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
const treeColors = ['', '#F4F5EA', '#F4CA66', '#54C878', '#126A46', '#E3454F'];
const validDay = day => /^\d{4}-\d{2}-\d{2}$/.test(day.date) && Number.isSafeInteger(day.contributionCount) && day.contributionCount >= 0 && Number.isInteger(day.weekday) && day.weekday >= 0 && day.weekday <= 6;
const names = ['No contributions', 'Tiny tree', 'Small tree', 'Medium tree', 'Large tree', 'Extra large tree'];
const labels = ['None', 'Tiny', 'Small', 'Medium', 'Large', 'XL'];
const step = 16;
const left = 70;
const top = 92;
const height = 260;
const text = (x, y, value, size = 11, color = '#CEDFD5') =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${color}">${escape(value)}</text>`;
const ornament = (x, y, color) => `<g>
  <path d="M${x - 18} ${y - 15}Q${x} ${y - 11} ${x + 18} ${y - 15}" stroke="#4BA86F" stroke-width="1.2" fill="none"/>
  ${[-14, -7, 7, 14].map(offset => `<path d="M${x + offset} ${y - 13}l-4 -5m4 5l4 -5" stroke="#4BA86F" stroke-width="1" stroke-linecap="round"/>`).join('')}
  <path d="M${x} ${y - 17}v9" stroke="#D9E5DA" stroke-width="0.9"/>
  <path d="M${x - 2.4} ${y - 6.7}h4.8v2.2h-4.8z" fill="#D9B874"/>
  <circle cx="${x}" cy="${y}" r="5.7" fill="url(#${color}Bauble)" stroke="#F8EBD0" stroke-width="0.7"/>
  <ellipse cx="${x - 1.8}" cy="${y - 2}" rx="1.2" ry="2" fill="#FFFBEF" opacity="0.8"/>
  <path d="M${x - 3.2} ${y + 2.5}q3.2 2.6 6.4 0" stroke="#FFFBEF" stroke-width="0.55" opacity="0.45"/>
</g>`;
const sparkle = (x, y) => `<path d="M${x} ${y - 5}v10M${x - 5} ${y}h10M${x - 3.5} ${y - 3.5}l7 7M${x + 3.5} ${y - 3.5}l-7 7" stroke="#F8EBD0" stroke-width="0.8" stroke-linecap="round" opacity="0.8"/>`;
const santa = x => `<g transform="translate(${x} 5)">
  <path d="M19 67Q20 49 32 46H49Q61 49 63 67Z" fill="#B92E3D" stroke="#F4D9C9" stroke-width="0.8"/>
  <path d="M25 53Q13 48 9 39" stroke="#B92E3D" stroke-width="9" stroke-linecap="round"/>
  <path d="M10 40L15 44" stroke="#F5F4E9" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="7" cy="34" rx="5.5" ry="7" transform="rotate(-25 7 34)" fill="#B92E3D" stroke="#F3D7C6" stroke-width="0.8"/>
  <path d="M20 63H62" stroke="#17231E" stroke-width="6"/><rect x="38" y="59" width="9" height="8" rx="1" fill="#F4CA66"/><rect x="40" y="61" width="5" height="4" fill="#17231E"/>
  <ellipse cx="40" cy="35" rx="14.5" ry="16" fill="#F2C4A6"/>
  <path d="M25 37Q25 52 31 56Q40 64 49 56Q55 51 55 37Q50 42 46 40Q40 44 34 40Q29 42 25 37Z" fill="#F7F5ED" stroke="#D7E2D9" stroke-width="0.8"/>
  <path d="M25 26Q29 8 45 8Q57 9 59 25Q49 19 42 25Z" fill="#C53643" stroke="#F4CA66" stroke-width="0.8"/>
  <path d="M24 25Q40 19 57 25" stroke="#F7F5ED" stroke-width="8" stroke-linecap="round"/>
  <circle cx="24" cy="17" r="5.5" fill="#F7F5ED"/>
  <circle cx="34" cy="33" r="1.2" fill="#16201E"/><circle cx="46" cy="33" r="1.2" fill="#16201E"/>
  <circle cx="40" cy="39" r="2.8" fill="#EBAE97"/>
  <path d="M29 42Q34 46 40 42Q46 46 51 42Q48 49 40 47Q32 49 29 42Z" fill="#FFFDF6"/>
  <path d="M35 51Q40 55 45 51" stroke="#D7E2D9" stroke-width="0.8" fill="none"/>
</g>`;

function tree(x, y, level, title = '', day) {
  const attributes = day ? `class="day" tabindex="0" role="img" aria-label="${escape(title)}" data-date="${escape(day.date)}" data-count="${day.contributionCount}" data-level="${level}"` : '';
  const hitArea = day ? `<rect x="${x - 1}" y="${y - 1}" width="16" height="16" fill="transparent"/>` : '';
  if (!level) return `<g ${attributes}><title>${escape(title)}</title>${hitArea}<circle cx="${x + 7}" cy="${y + 7}" r="2" fill="#486052"/></g>`;
  const scale = [0, 0.48, 0.6, 0.72, 0.86, 1][level];
  const lights = level >= 2
    ? `<circle cx="-2.5" cy="-2.2" r="0.9" fill="#F7DF85"/><circle cx="2.7" cy="2" r="0.9" fill="#F4F0DF"/>`
    : '';
  const moreLights = level >= 3
    ? `<circle cx="0.3" cy="-5.1" r="0.8" fill="${level === 5 ? '#FFE59A' : '#D83E45'}"/><circle cx="-3.6" cy="4" r="0.8" fill="#F4F0DF"/>`
    : '';
  return `<g ${attributes}><title>${escape(title)}</title>${hitArea}<g transform="translate(${x + 7} ${y + 7}) scale(${scale})">
    <path d="M-1.1 3.7V7H1.1V3.7" fill="#B99165"/>
    <path d="M0 -7.8L-4.1 -1.7H-2.6L-5.4 2.5H-3.5L-6.2 5.8H6.2L3.5 2.5H5.4L2.6 -1.7H4.1Z" fill="${treeColors[level]}" stroke="#D7F2D5" stroke-width="0.65" stroke-linejoin="round"/>
    <path d="M-2.6 -1.7H2.6M-3.5 2.5H3.5" stroke="${level === 5 ? '#F9B6AB' : '#5A9B76'}" stroke-width="0.45" opacity="0.8"/>
    ${lights}${moreLights}<path d="M0 -9.4L0.55 -8.25L1.8 -8.1L0.9 -7.25L1.1 -6.05L0 -6.65L-1.1 -6.05L-0.9 -7.25L-1.8 -8.1L-0.55 -8.25Z" fill="#FFE3A0"/>
  </g></g>`;
}

export function svg(calendar) {
const width = Math.max(990, left + calendar.weeks.length * step + 28);
const activeCounts = calendar.weeks.flatMap(week => week.contributionDays)
  .map(day => day.contributionCount).filter(count => Number.isSafeInteger(count) && count > 0)
  .sort((a, b) => a - b);
const cutoffs = [0.2, 0.4, 0.6, 0.8].map(p => activeCounts[Math.ceil(p * activeCounts.length) - 1]);
const levelFor = count => {
  if (count === 0) return 0;
  const bucket = cutoffs.findIndex(cutoff => count <= cutoff);
  return bucket === -1 ? 5 : bucket + 1;
};
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
    const level = levelFor(count);
    cells += tree(left + index * step, top + day.weekday * step, level,
      `${day.date}: ${count} contribution${count === 1 ? '' : 's'}; ${names[level]}`, day);
  }
});

const legendX = width - 360;
const legend = names.map((name, level) => {
  const x = legendX + level * 60;
  return `<g>${tree(x, 207, level, name)}${text(x - 9, 231, labels[level], 10, '#DDEBDD')}</g>`;
}).join('');
const generated = new Date().toISOString().slice(0, 10);
const decorations = [
  ornament(126, 33, 'red'), sparkle(228, 27), ornament(344, 33, 'gold'),
  sparkle(width / 2, 27), ornament(width - 344, 33, 'pearl'), sparkle(width - 228, 27), ornament(width - 126, 33, 'red'),
  sparkle(28, 140), sparkle(width - 28, 140),
  sparkle(276, height - 20), ornament(502, height - 21, 'red'), sparkle(width - 285, height - 20),
  santa(width - 82)
].join('');
return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">Christmas contributions for ${escape(username)}</title>
<desc id="desc">${calendar.totalContributions.toLocaleString('en-US')} GitHub contributions in the last year. Five tree sizes and colors, from white through gold and green to red, show increasing daily contributions. Santa Claus waves from the top right corner.</desc>
<defs>
  <linearGradient id="winter" x2="1" y2="1"><stop stop-color="#071D18"/><stop offset="1" stop-color="#0D3025"/></linearGradient>
  <radialGradient id="redBauble" cx="0.3" cy="0.25" r="0.8"><stop stop-color="#FF9293"/><stop offset="0.38" stop-color="#D93E4E"/><stop offset="1" stop-color="#741523"/></radialGradient>
  <radialGradient id="goldBauble" cx="0.3" cy="0.25" r="0.8"><stop stop-color="#FFF2B8"/><stop offset="0.4" stop-color="#E9C469"/><stop offset="1" stop-color="#8B5A21"/></radialGradient>
  <radialGradient id="pearlBauble" cx="0.3" cy="0.25" r="0.8"><stop stop-color="#FFFFFF"/><stop offset="0.4" stop-color="#E8F1EC"/><stop offset="1" stop-color="#8AADA2"/></radialGradient>
</defs>
<rect width="${width}" height="${height}" rx="24" fill="#07110F"/>
<rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="18" fill="url(#winter)" stroke="#9F3237" stroke-width="1.5"/>
<g aria-hidden="true">${decorations}</g>
<g font-family="ui-monospace, SFMono-Regular, Menlo, monospace">
${text(42, 51, `${username} • ${calendar.totalContributions.toLocaleString('en-US')} contributions • generated ${generated}`, 11, '#DCE8DB')}
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
