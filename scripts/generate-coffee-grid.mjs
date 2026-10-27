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

// Match the fall calendar's activity levels; darker roasts mean more activity.
const palette = [
  { fill: '#2A1810', stroke: '#4A2C1E', line: '#51301F', label: 'No roast' },
  { fill: '#FFE1A3', stroke: '#FFF0CD', line: '#754126', label: 'Light roast' },
  { fill: '#E8AA53', stroke: '#F5C878', line: '#63371E', label: 'Medium roast' },
  { fill: '#B56A32', stroke: '#D88C46', line: '#4A2617', label: 'Dark roast' },
  { fill: '#754126', stroke: '#A7673F', line: '#E4A16A', label: 'Espresso' }
];

function bean(x, y, level, title = '') {
  const p = palette[level];
  const tooltip = title ? `<title>${title}</title>` : '';

  if (level === 0) {
    return `<g>${tooltip}<circle cx="${x + 7}" cy="${y + 7}" r="2.1" fill="#5A3825" opacity="0.55"/></g>`;
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
      labels += `<text x="${64 + i * 16}" y="96" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" fill="#B98E66">${month}</text>`;
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
    return `<g>${sample}<text x="${x - 8}" y="276" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9" fill="#B98E66">${p.label.split(' ')[0]}</text></g>`;
  }).join('');

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">Coffee-themed GitHub contribution grid for ${username}</title>
  <desc id="desc">A coffee bean roast map generated from GitHub contribution activity. Beans darken with higher activity, from light roast to espresso.</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="990" y2="300" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#110906"/>
      <stop offset="0.55" stop-color="#25140D"/>
      <stop offset="1" stop-color="#0C0604"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect x="0" y="0" width="990" height="300" rx="24" fill="url(#bg)"/>
  <rect x="18" y="18" width="954" height="264" rx="18" fill="#160C08" stroke="#6B442A" stroke-opacity="0.55"/>

  <g filter="url(#shadow)">
    <text x="42" y="47" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="16" fill="#D4A373">CONTRIBUTION ROAST</text>
    <text x="42" y="67" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" fill="#9F7A59">${username} • ${calendar.totalContributions} contributions • generated ${now}</text>
  </g>

  <g>
    <text x="34" y="124" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" fill="#806047">Mon</text>
    <text x="34" y="156" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" fill="#806047">Wed</text>
    <text x="34" y="188" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" fill="#806047">Fri</text>
    ${weekMonthLabels(weeks)}
    ${beans}
  </g>

  <g>
    <text x="42" y="260" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" fill="#D4A373">light roast → medium roast → dark roast → espresso</text>
    ${legend}
  </g>
</svg>`;
}

const calendar = await fetchCalendar();
await fs.mkdir('dist', { recursive: true });
await fs.writeFile('dist/coffee-contribution-grid.svg', svg(calendar));
console.log('Generated dist/coffee-contribution-grid.svg');
