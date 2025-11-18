# The many travels of the Black Captain

A simple, elegant blog built for healing through writing. Pure HTML/CSS/JS with automatic translation powered by Cloudflare Workers AI.

## Philosophy

- **Write-focused**: Markdown files, no admin panel, no distractions
- **Fast & Simple**: No frameworks, no build complexity, just static HTML
- **Readable**: Typography and layout optimized for long-form reading
- **Multilingual**: Automatic translation to any language via Cloudflare Workers AI
- **Resilient**: Static files that can't break, can't be hacked

## Project Structure

```
the-black-captain/
├── posts/               # Your markdown blog posts
│   └── YYYY-MM-DD-title.md
├── images/              # Original images
├── assets/
│   ├── style.css        # Readable, minimal styling
│   └── main.js          # Language toggle & translation
├── workers/
│   └── translator.js    # Cloudflare Worker for AI translation
├── public/              # Generated static files (created by build)
├── build.js             # Markdown → HTML converter
├── package.json         # Node.js config
└── wrangler.toml        # Cloudflare config
```

## Quick Start

### 1. Install Dependencies

```bash
cd the-black-captain
npm install
```

### 2. Write Your First Post

Create a file in `posts/` with format: `YYYY-MM-DD-title.md`

```markdown
---
title: Your Post Title
date: November 18, 2025
description: A brief description
---

# Your Post Title

Your content here...
```

### 3. Build the Site

```bash
npm run build
```

This generates static HTML files in the `public/` directory.

### 4. Test Locally

```bash
npm run dev
```

Opens a local server at `http://localhost:8788`

## Cloudflare Deployment

### Prerequisites

- Cloudflare account with Enterprise plan (for Workers AI)
- Domain connected to Cloudflare
- `wrangler` CLI installed (included in dependencies)

### Setup Steps

#### 1. Login to Cloudflare

```bash
npx wrangler login
```

#### 2. Create KV Namespace (for caching translations)

```bash
npx wrangler kv:namespace create "TRANSLATIONS_KV"
```

Copy the generated ID and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "TRANSLATIONS_KV"
id = "your-generated-id-here"  # Replace this
```

#### 3. Deploy the Translation Worker

```bash
npm run deploy:worker
```

This deploys the Worker that handles `/api/translate` requests.

#### 4. Create Cloudflare Pages Project

Two options:

**Option A: Via Dashboard (Recommended)**
1. Go to Cloudflare Dashboard → Pages
2. Create a new project
3. Connect your Git repository
4. Build settings:
   - Build command: `node build.js`
   - Build output directory: `public`
5. Deploy!

**Option B: Via CLI**
```bash
npm run deploy
```

#### 5. Configure Worker Route

In Cloudflare Dashboard:
1. Go to Workers & Pages
2. Find your deployed worker
3. Add route: `your-domain.com/api/translate`
4. This ensures translation requests go to the Worker

### Environment Setup

The Worker needs access to:
- **Workers AI**: Enabled by default on Enterprise plans
- **KV Namespace**: For caching (created in step 2)

Both are configured in `wrangler.toml`.

## Writing Workflow

### Daily Writing

1. Create new post: `posts/2025-11-18-my-journey.md`
2. Write in markdown
3. Build: `npm run build`
4. Commit and push (auto-deploys if connected to Git)

### Post Format

```markdown
---
title: Post Title
date: November 18, 2025
description: Brief description for preview
---

# Your Content

Write naturally in markdown:
- **Bold text**
- *Italic text*
- [Links](https://example.com)
- ![Images](/images/photo.jpg)

## Subheadings

Paragraphs flow naturally...
```

### Adding Images

1. Drop images in `images/` folder
2. Reference in markdown: `![Alt text](/images/your-image.jpg)`
3. Images auto-optimize via Cloudflare (WebP/AVIF)

## Translation System

### How It Works

1. Visitor opens your blog
2. Browser language detected automatically
3. If not English, content translates on-the-fly
4. Click language button to cycle through languages
5. Translations cached for 24 hours (fast subsequent loads)

### Supported Languages

- English (EN) - Original
- German (DE)
- Spanish (ES)
- French (FR)
- Italian (IT)
- Portuguese (PT)
- Dutch (NL)
- Polish (PL)
- Russian (RU)
- Japanese (JA)
- Chinese (ZH)
- Korean (KO)
- Arabic (AR)

Add more in `assets/main.js` (LANG_NAMES object).

### Disable Translation

Comment out auto-translate in `assets/main.js`:

```javascript
// if (initialLang !== DEFAULT_LANG) {
//   setTimeout(() => translatePage(initialLang), 100);
// }
```

## Customization

### Styling

Edit `assets/style.css`. Key variables:

```css
:root {
  --bg: #ffffff;           /* Background */
  --text: #1a1a1a;         /* Text color */
  --accent: #2c5f7c;       /* Links & highlights */
  --max-width: 720px;      /* Content width */
  --font-serif: Georgia;   /* Body font */
}
```

### Typography

Current setup:
- Body: Georgia (serif), 19px, 1.7 line-height
- Headings: System sans-serif, bold
- Optimized for long-form reading

### Dark Mode

Automatic based on system preference. Override in `style.css`:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a1a;
    --text: #e8e8e8;
  }
}
```

## Maintenance

### Update Content

1. Edit markdown files in `posts/`
2. Run `npm run build`
3. Commit and push

### Monitor Performance

Cloudflare Dashboard → Analytics:
- Page views (privacy-first, no cookies)
- Translation API usage
- Cache hit rates

### Backup

All content is in Git. Your markdown files are the source of truth.

## Costs

With Cloudflare Enterprise:
- **Hosting**: Free (Cloudflare Pages)
- **Workers AI**: Included in Enterprise plan
- **KV Storage**: First 1GB free, then minimal
- **Bandwidth**: Unlimited on Cloudflare

## Troubleshooting

### Build Fails

```bash
# Check Node.js version (requires 16+)
node --version

# Clean and rebuild
rm -rf public
npm run build
```

### Translation Not Working

1. Check Worker is deployed: `npx wrangler deployments list`
2. Verify route in Cloudflare Dashboard
3. Check browser console for errors
4. Ensure Workers AI is enabled (Enterprise plan)

### Local Development

```bash
# Test without Cloudflare services
npm run build
cd public
python -m http.server 8000
```

Translation won't work locally (needs Cloudflare Workers AI).

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Build**: Node.js script (no webpack/vite)
- **Hosting**: Cloudflare Pages
- **Translation**: Cloudflare Workers AI (m2m100-1.2b model)
- **Caching**: Cloudflare Workers KV
- **CDN**: Cloudflare global network

## Philosophy Notes

This blog is intentionally simple:
- No React/Vue/Angular - just what browsers understand
- No npm build complexity - one script does everything
- No database - markdown files in Git
- No admin panel - just your text editor
- No analytics tracking - Cloudflare privacy-first stats
- No comments - focus on writing, not engagement metrics

The goal: Write. Heal. Share. Everything else is secondary.

## Support

This is a personal project. No formal support, but issues and questions welcome.

## License

MIT - Use this for your own healing journey if it helps.

---

**The Black Captain**
*A journey of healing through words*
