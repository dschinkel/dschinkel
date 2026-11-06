# Profile seasons

The GitHub Actions workflow generates only the season shown in the profile README. To reuse a season, change the workflow's generator path and the README image URL together.

| Season | Generator | Output image |
| --- | --- | --- |
| Coffee | `themes/coffee/generate-grid.mjs` | `coffee-contribution-grid.svg` |
| Halloween | `themes/halloween/generate-grid.mjs` | `fall-contribution-grid.svg` |
| Christmas/hockey | `themes/christmas-hockey/generate-grid.mjs` | `christmas-contribution-grid.svg` |

Each generator needs `GITHUB_TOKEN` and optionally `GITHUB_USERNAME`, and writes its SVG to `dist/`. The Halloween #355 header source is `themes/halloween/355-belfry-bats.mjs`; the published header remains `assets/github-profile-banner.svg`.
