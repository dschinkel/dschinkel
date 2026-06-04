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

function roastLevel(count) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 4;
}

const palette = [
  { fill: '#2A1810', stroke: '#4A2C1E', line: '#51301F', label: 'No roast' },
  { fill: '#CDAA7D', stroke: '#E7C9A3', line: '#8C5E35', label: 'Light roast' },
  { fill: '#9B6A3D', stroke: '#C99663', line: '#53301E', label: 'Medium roast' },
  { fill: '#604029', stroke: '#A47248', line: '#D0A474', label: 'Dark roast' },
  { fill: '#2B1710', stroke: '#D4A373', line: '#E8D3B8', label: 'Espresso' }
];

function bean(x, y, count, date, delay) {
  const level = roastLevel(count);
  const p = palette[level];
  const title = `${date}: ${count} contribution${count === 1 ? '' : 's'}`;
  const pulse = level >= 4
    ? `<animate attributeName="opacity" values="1;.68;1" dur="2.8s" begin="${delay}s" repeatCount="indefinite"/>`
    : '';

  if (level === 0) {
    return `<g><title>${title}</title><circle cx="${x + 7}" cy="${y + 7}" r="2.1" fill="#5A3825" opacity="0.55"/></g>`;
  }

  return `
    <g opacity="0.98">
      <title>${title}</title>
      <ellipse cx="${x + 7}" cy="${y + 7}" rx="5.7" ry="7.1" transform="rotate(-24 ${x + 7} ${y + 7})" fill="${p.fill}" stroke="${p.stroke}" stroke-width="1.1">
        ${pulse}
      </ellipse>
      <path d="M${x + 4.8} ${y + 2.6} C${x + 9.1} ${y + 5.2}, ${x + 4.7} ${y + 8.4}, ${x + 9.5} ${y + 12.1}" stroke="${p.line}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity="0.9"/>
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
      labels += `<text x="${64 + i * 16}" y="75" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" fill="#B98E66">${month}</text>`;
      lastMonth = month;
    }
  });
  return labels;
}

function svg(calendar) {
  const weeks = calendar.weeks;
  const width = 990;
  const height = 255;
  const gridX = 64;
  const gridY = 88;
  const cell = 14;
  const gap = 2;
  const now = new Date().toISOString().slice(0, 10);

  let beans = '';
  weeks.forEach((week, weekIndex) => {
    week.contributionDays.forEach((day) => {
      const x = gridX + weekIndex * (cell + gap);
      const y = gridY + day.weekday * (cell + gap);
      beans += bean(x, y, day.contributionCount, day.date, ((weekIndex + day.weekday) % 9) / 10);
    });
  });

  const legend = palette.map((p, i) => {
    const x = 648 + i * 66;
    const sample = i === 0
      ? `<circle cx="${x + 7}" cy="208" r="2.1" fill="#5A3825" opacity="0.55"/>`
      : `<ellipse cx="${x + 7}" cy="208" rx="5.7" ry="7.1" transform="rotate(-24 ${x + 7} 208)" fill="${p.fill}" stroke="${p.stroke}" stroke-width="1.1"/>`;
    return `<g>${sample}<text x="${x - 8}" y="232" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9" fill="#B98E66">${p.label.split(' ')[0]}</text></g>`;
  }).join('');

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">Coffee-themed GitHub contribution grid for ${username}</title>
  <desc id="desc">A coffee bean roast map generated from GitHub contribution activity.</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="990" y2="255" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#110906"/>
      <stop offset="0.55" stop-color="#25140D"/>
      <stop offset="1" stop-color="#0C0604"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect x="0" y="0" width="990" height="255" rx="24" fill="url(#bg)"/>
  <rect x="18" y="18" width="954" height="219" rx="18" fill="#160C08" stroke="#6B442A" stroke-opacity="0.55"/>

  <g filter="url(#shadow)">
    <text x="42" y="47" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="16" fill="#D4A373">CONTRIBUTION ROAST</text>
    <text x="42" y="67" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" fill="#9F7A59">${username} • ${calendar.totalContributions} contributions • generated ${now}</text>
  </g>

  <g>
    <text x="34" y="100" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" fill="#806047">Mon</text>
    <text x="34" y="132" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" fill="#806047">Wed</text>
    <text x="34" y="164" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" fill="#806047">Fri</text>
    ${weekMonthLabels(weeks)}
    ${beans}
  </g>

  <g>
    <text x="42" y="218" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" fill="#D4A373">light roast → medium roast → dark roast → espresso</text>
    ${legend}
  </g>

  <g transform="translate(884 31)">
    <path d="M24 32h48c0 22-12 41-33 41h-15c-21 0-33-19-33-41h33Z" fill="#322016" stroke="#D4A373" stroke-width="3"/>
    <path d="M72 42h8c13 0 13 19 0 19h-9" stroke="#D4A373" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M18 80h60" stroke="#D4A373" stroke-width="4" stroke-linecap="round"/>
    <path d="M30 20 C20 9 42 7 32 -4" stroke="#E8D3B8" stroke-width="2.7" stroke-linecap="round" opacity="0.75">
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 -7; 0 0" dur="4s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values=".25;.9;.25" dur="4s" repeatCount="indefinite"/>
    </path>
    <path d="M51 20 C41 9 63 7 53 -4" stroke="#E8D3B8" stroke-width="2.7" stroke-linecap="round" opacity="0.65">
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 -8; 0 0" dur="4.8s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values=".2;.8;.2" dur="4.8s" repeatCount="indefinite"/>
    </path>
  </g>
</svg>`;
}

const calendar = await fetchCalendar();
await fs.mkdir('dist', { recursive: true });
await fs.writeFile('dist/coffee-contribution-grid.svg', svg(calendar));
console.log('Generated dist/coffee-contribution-grid.svg');
