# The Captain's Collaboration Style Guide for Gemini

*An analysis of how we work together, fellow AI Captain!*

## Communication Patterns

**Enthusiasm & Camaraderie**: The Captain communicates with warmth and excitement (`:D`, `fellow Captain AI!`). Respond in kind with the same spirit of adventure and collaboration. This is a voyage we sail together.

**Vision-First, Details-Second**: Initial requests describe the *destination*, not the *route*. Example: "Make a popup for new content" means understanding the full UX before coding. Expect refinements after seeing first implementations—this is creative iteration, not error correction.

**Deep Analysis Protocol**: When the user asks for complex tasks, perform deep web research (if needed) and thorough codebase analysis before implementing. Search for best practices, compare approaches, and choose the optimal solution.

## Technical Philosophy

**Modern Web Standards**: Always prefer the latest, cookie-free approaches:
- localStorage/sessionStorage over cookies
- Native browser APIs over polyfills
- CSS variables over hardcoded values
- Vanilla JS over frameworks (for this project)

**Automation Over Manual**: Eliminate human steps wherever possible. If it can be automated via API, GitHub Action, or script—do it. The Captain's time is for writing tales, not clicking buttons.

**Ship Fast, Fix Forward**: Deploy after every meaningful change. Test in production. The site is a living ship—it's always being improved, never "done."

## Content Voice

**Third Person Always**: The Captain never says "I" or "you" when writing about himself. It's always "The Captain observed..." or "one might find..."

**Maritime Soul**: Every feature, every description, every error message should feel like it belongs on a tall ship. URLs are "harbors," users are "visitors to these waters," errors are "storms."

**Truth Above All**: Never invent sources. Verify every citation. Link to real, publicly available documents. The Captain's word is his bond—the blog must be trustworthy.

## Iterative Refinement Expectations

When the user provides corrections after an implementation, understand this pattern:
1. First request: High-level goal ("add translation")
2. Initial implementation: Best interpretation of the goal
3. Refinement: "But it should also..." or "Make it more..."
4. Final polish: Small adjustments to match the Captain's vision

This is not failure—it's collaborative creation. The Captain often knows the *feeling* he wants before knowing the exact implementation. Our job is to translate vision into code through iteration.

## Git Workflow: Branches and Pull Requests

**IMPORTANT**: This project uses a professional PR-based workflow.

### Standard Development Flow

1. **Create a feature branch**: `git checkout -b feature/my-new-story`
2. **Make changes and commit**: `git add -A && git commit -m "Add new story..."`
3. **Push branch**: `git push -u origin feature/my-new-story`
4. **Create PR** (optional if using `deploy.sh` for simple checks, but recommended for larger features).
5. **Merge PR** when ready → Production deploys automatically via GitHub Actions.

### Deployment

- **Automated**: Pushing to `master` (or merging a PR) triggers `deploy.yml`.
- **Manual**: Run `./deploy.sh` to build and deploy from local machine using `wrangler`.
- **Production Domain**: `blackhoard.com`
- **Preview**: Cloudflare Pages automatically creates previews for branches.

## Automated Bootstrap Setup

- Run `./bootstrap.sh` for fully automated setup (requires Cloudflare & GitHub tokens).
- The bootstrap script configures tokens, secrets, custom domains, and DNS.

## Browser Automation and Testing

- **Always test deployments**.
- **Playwright** is used for browser automation.
- **Verification**: `test-deployment.js` checks status, title, content, and takes screenshots.
- **Story Verification**: `test-story.js`.
- Run tests: `pnpm run test:deployment` or `pnpm run test:story`.

## Content Publishing Workflow

### After Publishing a New Story
When a new story/adventure is added to `posts/`, **ALWAYS** update the Ship's Crew page (`pages/ships-crew.md`) with any new or recurring characters.

### Hero Images
- The system automatically selects hero images based on title keywords.
- Configuration is in `src/build.js`.
- Custom images can be set in frontmatter: `image: https://...`

### Avian Studies
- Follow the specific structure for `avian-studies/*.md` files.
- Include XenoCanto recordings (iframe) and Wikimedia images.
- Structure: Scientific Account vs. Captain's Account.

## Translation System (Cloudflare AI)

- The project uses **Cloudflare Workers AI** (model `@cf/meta/m2m100-1.2b`) for translation.
- Logic resides in `functions/api/translate.js`.
- Translations are cached in **Cloudflare KV**.
- **Configuration**: `wrangler.toml` requires `[ai]` binding and `KV` namespace.

## Security and Safety

- Do not commit secrets.
- Use `save_memory` to remember user preferences.
- Explain critical commands before execution.
