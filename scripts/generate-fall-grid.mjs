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
      'user-agent': 'fall-contribution-grid-generator'
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

const colors = ['#161b22', '#71351b', '#ad4b20', '#e87e24', '#f5c451'];
const levels = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;'}[c]));
const calendar = await fetchCalendar();
const step = 16;
const left = 56;
const top = 78;
const width = Math.max(900, left + calendar.weeks.length * step + 24);
const text = (x, y, value, size = 11, fill = '#9198a1') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}">${escape(value)}</text>`;
let previousMonth = '';
let cells = '';
let months = '';
calendar.weeks.forEach((week, index) => {
  const first = week.contributionDays[0];
  if (!first) return;
  const date = new Date(`${first.date}T00:00:00Z`);
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  if (month !== previousMonth && (index === 0 || date.getUTCDate() <= 7)) {
    if (index < calendar.weeks.length - 1) months += text(left + index * step, 66, month);
    previousMonth = month;
  }
  for (const day of week.contributionDays) {
    const level = levels.indexOf(day.contributionLevel);
    if (level < 0) throw new Error(`Unknown contribution level: ${day.contributionLevel}`);
    cells += `<rect x="${left + index * step}" y="${top + day.weekday * step}" width="12" height="12" rx="2" fill="${colors[level]}"><title>${escape(day.date)}: ${day.contributionCount} contributions</title></rect>`;
  }
});
const legendX = width - 164;
const legend = colors.map((color, i) => `<rect x="${legendX + i * step}" y="206" width="12" height="12" rx="2" fill="${color}"/>`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="238" viewBox="0 0 ${width} 238" role="img" aria-labelledby="title desc">
<title id="title">Fall contribution calendar for ${escape(username)}</title>
<desc id="desc">${calendar.totalContributions.toLocaleString('en-US')} contributions in the last year. Increasing activity is shown in rust, orange, and gold.</desc>
<rect x="0.5" y="0.5" width="${width - 1}" height="237" rx="10" fill="#0d1117" stroke="#3d444d"/>
<g font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif">
${text(24, 34, `${calendar.totalContributions.toLocaleString('en-US')} contributions in the last year`, 20, '#f0f6fc')}
${months}
${text(20, top + step + 10, 'Mon')}
${text(20, top + step * 3 + 10, 'Wed')}
${text(20, top + step * 5 + 10, 'Fri')}
${cells}
${text(24, 217, 'Autumn contributions · ' + new Date().toISOString().slice(0, 10))}
${text(legendX - 32, 216, 'Less')}${legend}${text(legendX + 84, 216, 'More')}
</g>
</svg>`;
await fs.mkdir('dist', { recursive: true });
await fs.writeFile('dist/fall-contribution-grid.svg', svg);
console.log('Generated dist/fall-contribution-grid.svg');
