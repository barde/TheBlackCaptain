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
- **Story verification test** (`test-story.js`):
  - Checks if latest story appears on homepage
  - Verifies direct story URL is accessible
  - Confirms story appears in archive
  - Run with: `pnpm run test:story`
- Screenshots are saved as `deployment-test-screenshot.png` and `homepage-check.png` in the project root.
- Playwright runs in headless mode on Linux (using Chromium browser).
- Browser binaries are cached in `~/.cache/ms-playwright/` and don't need to be in the repo.
- Try to get all "manual actions", e.g. things I as a human have to do, by APIs or other automated ways
- push and commit after every change to github
- The "Black Captain" always writes in third person about himself as neither you nor I are real captains.
- If in doubt about a technical issue, try the best option after searching best practices and ULTRATHINK about the solution. Do it and if fails, try another one. Only ask me about manual intervention if nothing else works and revert to a state before all tries.

## Content Publishing Workflow

### After Publishing a New Story
When a new story/adventure is added to `posts/`, **ALWAYS** update the Ship's Crew page:

1. **Read the new story** to identify:
   - New characters introduced
   - Existing characters that appear
   - Character developments or new details about known characters

2. **Update `pages/ships-crew.md`**:
   - Add new characters to the appropriate section:
     - **The Captain and His Officers** - Leadership and command
     - **The Crew** - Regular sailors and crew members
     - **Companions of Wing and Wisdom** - Birds and animals
     - **Encounters Along the Way** - One-time or recurring encounters
   - For existing characters, add the new story to their "Appears in:" list
   - Update descriptions if the story reveals new aspects of their character

3. **Character Card Format**:
   ```markdown
   <div class="character-card">

   ### Character Name
   <p class="character-role">Their Role/Title</p>
   <p class="character-description">Rich description of the character, their traits, background, and significance to the tales.</p>
   <p class="character-appearances">Appears in: [Story 1](/link1.html), [Story 2](/link2.html)</p>
   <p class="character-link">Learn more: [Related Article](/link.html)</p> <!-- Optional -->

   </div>
   ```

4. **Build and Deploy**:
   - The crew page updates organically with each story
   - Readers can track recurring characters across adventures
   - Characters become familiar friends through repeated appearances

**Goal**: Let the crew roster grow naturally, so readers fall in love with recurring characters like The Russian, The Admiral's Wife, or the wise Herring Gulls. Each appearance deepens the reader's connection.
- If making citations verify the source and make direct links. Never invent anything as we want to keep the truth!
- If referring to any literature search in the Internet for a publicly available version. Do a href link to it.
- When adding articlese to the Avian Studies always show pictures from Wikimedia and sounds from XenoCanto. Choose the most popular ones.
- Always commit, push and deploy after changing content on the site