import fs from 'node:fs/promises';

const username = process.env.GITHUB_USERNAME || 'dschinkel';
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error('Missing GITHUB_TOKEN. GitHub Actions provides this automatically.');
  process.exit(1);
}

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

function bean(x, y, level, title = '') {
  const p = palette[level];
  const tooltip = title ? `<title>${title}</title>` : '';

  if (level === 0) {
    return `<g>${tooltip}<circle cx="${x + 7}" cy="${y + 7}" r="2.1" fill="#5A0C14" opacity="0.55"/></g>`;
  }

  return `
    <g>
      ${tooltip}
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

function svg(calendar) {
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
      const x = gridX + weekIndex * (cell + gap);
      const y = gridY + day.weekday * (cell + gap);
      const level = levels.indexOf(day.contributionLevel);
      if (level < 0) throw new Error(`Unknown contribution level: ${day.contributionLevel}`);
      beans += bean(x, y, level, `${day.date}: ${day.contributionCount} contribution${day.contributionCount === 1 ? '' : 's'}`);
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
    <text x="42" y="260" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" fill="#E0473A">light roast → medium roast → dark roast → espresso</text>
    ${legend}
  </g>
</svg>`;
}

const calendar = await fetchCalendar();
await fs.mkdir('dist', { recursive: true });
await fs.writeFile('dist/coffee-contribution-grid.svg', svg(calendar));
console.log('Generated dist/coffee-contribution-grid.svg');
