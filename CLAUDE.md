- Always use command line tools for accessing Github and Cloudflare, i.e. 'gh' and 'wrangler'.
- Use pnpm as the package manager for this project (not npm or yarn).
- The project has a single production instance on Cloudflare Pages named "the-black-captain".
- Production domain: **blackhoard.com** (The Black Hoard - treasure of wisdom and knowledge)
- To deploy: Run `pnpm run deploy` - this is self-contained and only requires a logged-in wrangler CLI.
- The deploy script automatically builds, deploys to production, and opens the URL in the browser.
- There are no test, staging, or preview instances - only the production deployment on the master branch.

## Custom Domain Setup
- To add custom domains via CLI: `pnpm run domain:add` (uses Cloudflare API)
- The script requires a Cloudflare API token with Zone:DNS:Edit and Account:Pages:Edit permissions.
- Get API token at: https://dash.cloudflare.com/profile/api-tokens
- The script automatically creates CNAME records and adds the domain to the Pages project.
- No manual dashboard steps required!

## Browser Automation and Testing
- **Always test deployments** using browser automation after deploying.
- The project uses **Playwright** for browser automation (recommended as the best tool for 2025).
- Automated deployment testing is integrated into `deploy.sh` and runs automatically after deployment.
- The test script (`test-deployment.js`) performs the following checks:
  - HTTP status code verification (200 OK)
  - Page title and content validation
  - Screenshot capture for visual verification
  - JavaScript error detection
  - Presence of expected content ("Black Captain")
- To run tests manually: `pnpm run test:deployment`
- Screenshots are saved as `deployment-test-screenshot.png` in the project root.
- Playwright runs in headless mode on Linux (using Chromium browser).
- Browser binaries are cached in `~/.cache/ms-playwright/` and don't need to be in the repo.