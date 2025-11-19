- Always use command line tools for accessing Github and Cloudflare, i.e. 'gh' and 'wrangler'.
- Use pnpm as the package manager for this project (not npm or yarn).
- The project has a single production instance on Cloudflare Pages named "the-black-captain".
- Production domain: **blackhoard.com** (The Black Hoard - treasure of wisdom and knowledge)
- To deploy: Run `pnpm run deploy` - this is self-contained and only requires a logged-in wrangler CLI.
- The deploy script automatically builds, deploys to production, and opens the URL in the browser.
- There are no test, staging, or preview instances - only the production deployment on the master branch.

## Automated Bootstrap Setup
- **ZERO manual steps after initial token creation!**
- Run `./bootstrap.sh` for fully automated setup
- Only requires 2 tokens ONCE:
  1. Cloudflare Master API Token (creates other tokens automatically)
  2. GitHub Personal Access Token (sets secrets automatically)
- The bootstrap script automatically:
  - Creates scoped deployment tokens
  - Sets GitHub repository secrets
  - Configures custom domain (blackhoard.com)
  - Creates DNS records
  - Triggers first deployment
- After bootstrap: just `git push` to deploy!

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
- Try to get all "manual actions", e.g. things I as a human have to do, by APIs or other automated ways
- push and commit after every change to github