# The many travels of the Black Captain

A simple, elegant blog built for healing through writing. Pure HTML/CSS/JS with automatic translation powered by Google Cloud Translation API.

## Philosophy

- **Write-focused**: Markdown files, no admin panel, no distractions
- **Fast & Simple**: No frameworks, no build complexity, just static HTML
- **Readable**: Typography and layout optimized for long-form reading
- **Multilingual**: Automatic translation to 40+ languages via Google Cloud Translation API
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
├── functions/
│   └── api/translate.js # Cloudflare Pages Function for translation
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

- Cloudflare account (free plan works!)
- Domain connected to Cloudflare
- `wrangler` CLI installed (included in dependencies)

### Required Tokens & Secrets

| Token | Purpose | Where to Create |
|-------|---------|-----------------|
| **CLOUDFLARE_ACCOUNT_ID** | Account identification | [Cloudflare Dashboard](https://dash.cloudflare.com) → Overview (right sidebar) |
| **CLOUDFLARE_API_TOKEN** | Deployment | [API Tokens page](https://dash.cloudflare.com/profile/api-tokens) |
| **GOOGLE_TRANSLATE_API_KEY** | Translation API | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials |

**Cloudflare API Token Required Permissions:**
- Cloudflare Pages - Edit
- Account Settings - Read

**Google Cloud Translation API Setup:**
1. Create project at [Google Cloud Console](https://console.cloud.google.com)
2. Enable "Cloud Translation API" in APIs & Services → Library
3. Create API Key in APIs & Services → Credentials
4. Set as Cloudflare Pages secret: `pnpm wrangler pages secret put GOOGLE_TRANSLATE_API_KEY --project-name the-black-captain`

**Free Tier:** 500,000 characters/month (never expires!) - [Pricing details](https://cloud.google.com/translate/pricing)

### GitHub Secrets (for automated workflows)

Add these to **Settings → Secrets and variables → Actions**:

| Secret Name | Description |
|-------------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

### System Health

Visit `/health.html` to check subsystem status (no technical details exposed)

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

All on free tiers:
- **Hosting**: Free (Cloudflare Pages)
- **Translation**: Free (Cloudflare Workers AI - Neuron limit applies)
- **KV Storage**: First 1GB free
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

1. Check `AI` binding is configured in `wrangler.toml`
2. Check `TRANSLATIONS_KV` binding is configured in `wrangler.toml`
3. Ensure Cloudflare Workers AI is enabled in your Cloudflare account
4. Check browser console for errors

### Local Development

```bash
# Test without Cloudflare services
npm run build
cd public
python -m http.server 8000
```

Translation won't work locally (needs Cloudflare Pages Functions with the AI binding).

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Build**: Node.js script (no webpack/vite)
- **Hosting**: Cloudflare Pages
- **Translation**: Cloudflare Workers AI (m2m100 model)
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
