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
   - **ONLY add characters that the user explicitly names and requests to be added to the crew roster**
   - Do NOT automatically add unnamed characters or characters referred to only by description (e.g., "the tall one", "two young men")
   - Add new named characters to the appropriate section:
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

## Hero Images for Posts

**Every blog post gets a beautiful hero image automatically!** The system uses curated, high-quality maritime-themed photos from Unsplash.

### How It Works

The hero image system automatically selects appropriate images based on the post's title and slug:

- **Automatic theme detection**: Keywords like "voyage", "ship", "remedy", "northern", etc. trigger specific maritime images
- **Smart defaults**: Posts without matching keywords get a default beautiful sailing ship image
- **Category-specific behavior**:
  - **Posts** (`posts/*.md`): Always get hero images
  - **Treasure Trove**: Get themed images
  - **Avian Studies**: NO hero images (they use Wikimedia images in their content instead)

### Available Themes

The system recognizes these keywords in titles/slugs:

**Sailing & Ships**: ship, voyage, sailor, sea, ocean, port, captain, storm, dock, harbor

**Mood & Season**: northern, winter, cold, illness, remedy

**People & Stories**: scholar, crew, beginning

### Customizing Images

To override the automatic selection, add to the post's frontmatter:

```markdown
---
title: My Story
date: November 25, 2025
image: https://images.unsplash.com/photo-XXXXX?w=1600&h=900&fit=crop
---
```

### Adding New Themes

To add more themed images, edit `build.js` in the `getHeroImage()` function's `themeImages` object:

```javascript
const themeImages = {
  'newtheme': 'https://images.unsplash.com/photo-XXXXX?w=1600&h=900&fit=crop',
  // ... existing themes
};
```

**Image Requirements**:
- Source: Unsplash (free, high-quality, legally usable)
- Size: `w=1600&h=900&fit=crop` (optimal for all devices)
- Theme: Maritime, nautical, or thematically relevant to the story
- Quality: Professional photography that enhances reader engagement

### Why Hero Images Matter

Based on 2024 research and best practices:
- High-quality visuals create strong first impressions
- Images enhance reader retention and engagement
- Authentic, themed photos build emotional connection
- Proper sizing ensures fast loading and good SEO
- Lazy loading optimizes performance

**Hero images make the blog more approachable and visually engaging for readers!**

## Content Standards

- If making citations verify the source and make direct links. Never invent anything as we want to keep the truth!
- If referring to any literature search in the Internet for a publicly available version. Do a href link to it.
- When adding articles to the Avian Studies always show pictures from Wikimedia and sounds from XenoCanto. Choose the most popular ones.
- Always commit, push and deploy after changing content on the site

## The "Others" Section - Recommended Sites

The "Others" section (`pages/others.md`) contains the Black Captain's recommendations for other websites worth visiting.

### Adding Recommendations

When adding a new site recommendation to the Others section:

1. **Thoroughly explore the site**: Read the main content, subpages, and follow external links to understand the site's full scope, themes, and value
2. **Write in the Captain's voice**: Every recommendation MUST include "**The Captain's words**:" followed by ONE SENTENCE (can be long with semicolons and em-dashes) written in the Captain's distinctive style:
   - Third person perspective
   - Maritime metaphors and nautical language
   - Philosophical and contemplative tone
   - Rich, flowing prose with subordinate clauses
   - Describes both the content and its deeper significance
3. **Include site details**: After the Captain's sentence, add practical information:
   - Brief description of what awaits there
   - Language(s) of the site
   - How long it has been active
   - Any special context (e.g., "the Captain's beloved cousin")

### Example Format

```markdown
### [Site Name](https://example.com/)

**The Captain's words**: [One long, flowing sentence in third person describing the site in the Captain's philosophical, maritime style]

**What awaits there**: [Practical description of content]

**Language**: [Language name]

**Active since**: [Year]
```

**Note**: The Captain's sentence should capture the essence and soul of the recommended site, not just describe its features - it should convey why this harbor is worth visiting in the vast digital sea.