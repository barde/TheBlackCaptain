# Setup Instructions

Complete setup guide for "The many travels of the Black Captain" blog.

## Prerequisites

### 1. Install Node.js

Node.js is required to build the blog from markdown to HTML.

**On Arch/CachyOS (your system):**
```bash
sudo pacman -S nodejs npm
```

**Verify installation:**
```bash
node --version  # Should show v18 or higher
npm --version   # Should show v9 or higher
```

**Alternative: Using nvm (Node Version Manager)**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### 2. Install Git (if not already installed)

```bash
sudo pacman -S git
```

### 3. Create Cloudflare Account

If you haven't already:
1. Go to https://cloudflare.com
2. Sign up for free
3. You mentioned having Enterprise - ensure you're logged into that account

## Initial Setup

### 1. Navigate to Project

```bash
cd /home/debar/TheBlackCaptain/the-black-captain
```

### 2. Install Dependencies

```bash
npm install
```

This installs Wrangler (Cloudflare CLI) and other tools.

### 3. Test Build

```bash
npm run build
```

Should output:
```
🏴‍☠️ Building The Black Captain blog...
✓ Copied assets
✓ Built: 2025-11-18-the-beginning.md
✓ Built: index.html
✓ Built: archive.html
🏴‍☠️ Build complete! 1 post(s) published.
```

### 4. Preview Locally

```bash
cd public
python -m http.server 8000
```

Open browser to: http://localhost:8000

Press Ctrl+C to stop the server.

## Cloudflare Setup

### 1. Login to Cloudflare

```bash
cd /home/debar/TheBlackCaptain/the-black-captain
npx wrangler login
```

This opens a browser for authentication.

### 2. Create KV Namespace (for translation cache)

```bash
npx wrangler kv:namespace create "TRANSLATIONS_KV"
```

Copy the output, which looks like:
```
id = "abc123def456..."
```

Edit `wrangler.toml` and replace:
```toml
[[kv_namespaces]]
binding = "TRANSLATIONS_KV"
id = "YOUR_KV_NAMESPACE_ID_HERE"  # Replace with actual ID
```

### 3. Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit: The Black Captain blog"
```

### 4. Create GitHub Repository (Optional but Recommended)

1. Go to https://github.com/new
2. Create repository named "the-black-captain"
3. Don't initialize with README (we have one)
4. Run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/the-black-captain.git
git branch -M main
git push -u origin main
```

### 5. Deploy to Cloudflare Pages

**Option A: Via Dashboard (Easiest)**

1. Go to https://dash.cloudflare.com
2. Navigate to: Workers & Pages → Create application → Pages
3. Connect to Git → Select your repository
4. Configure build:
   - Build command: `node build.js`
   - Build output directory: `public`
5. Environment variables (if needed - set these in Settings after creation):
   - None required initially
6. Click "Save and Deploy"

**Option B: Via CLI**

```bash
npm run deploy
```

Follow prompts to create project.

### 6. Enable Workers AI

In Cloudflare Dashboard:
1. Navigate to AI section
2. Ensure Workers AI is enabled for your account
3. Should be available with Enterprise plan

### 7. Bind AI and KV to Pages

After deploying:
1. Go to your Pages project settings
2. Navigate to "Settings" → "Functions"
3. Add bindings:
   - **AI**: Type "AI", name "AI"
   - **KV Namespace**: Select your TRANSLATIONS_KV namespace

4. Redeploy for changes to take effect

## Verify Everything Works

1. Visit your deployed site: `https://your-project.pages.dev`
2. Click the language toggle button (top right: "EN")
3. Should cycle through languages
4. Check browser console for errors (F12 → Console)

If translation fails, check:
- Workers AI is enabled
- KV namespace is bound correctly
- Functions have AI binding

## Daily Workflow

### Write a New Post

```bash
cd /home/debar/TheBlackCaptain/the-black-captain
nano posts/2025-11-19-my-second-journey.md
```

Write in markdown:
```markdown
---
title: My Second Journey
date: November 19, 2025
description: Continuing the voyage
---

# My Second Journey

Content here...
```

### Build and Deploy

```bash
npm run build
git add .
git commit -m "New post: My Second Journey"
git push
```

Cloudflare auto-deploys within 1-2 minutes.

### Preview Before Deploying

```bash
npm run build
cd public
python -m http.server 8000
```

Check http://localhost:8000

## Troubleshooting

### "node: command not found"

Node.js not installed. See Prerequisites above.

### "wrangler: command not found"

Run from project directory:
```bash
cd /home/debar/TheBlackCaptain/the-black-captain
npx wrangler login
```

`npx` automatically uses locally installed wrangler.

### Build succeeds but translation doesn't work

1. Check Cloudflare Dashboard → Pages → Functions
2. Ensure AI binding exists
3. Ensure KV namespace is bound
4. Check browser console for errors
5. Verify Workers AI is enabled in account

### "AI is not defined" error

AI binding not configured. See step 7 of Cloudflare Setup.

### Local preview shows blank page

Check console (F12). Likely:
- Build didn't complete
- Files in wrong directory
- Path issues

Rebuild:
```bash
npm run build
cd public
ls  # Should see index.html, assets/, etc.
```

## Tips

1. **Write daily**: Even short posts. Consistency heals.
2. **Commit often**: Git is your backup and history.
3. **Images**: Drop in `images/`, reference as `/images/filename.jpg`
4. **Preview first**: Build → preview → commit → deploy
5. **Stay simple**: Resist urge to complicate. Writing is the goal.

## Getting Help

- Cloudflare Docs: https://developers.cloudflare.com/pages
- Workers AI Docs: https://developers.cloudflare.com/workers-ai
- Wrangler Docs: https://developers.cloudflare.com/workers/wrangler

## System-Specific Notes (CachyOS)

Your system (CachyOS/Arch) has:
- Fast pacman package manager
- Rolling release (always up to date)
- Python pre-installed (for local preview)

Perfect for this workflow.

---

**You're ready to sail! 🏴‍☠️**

Start with: `npm install` (after installing Node.js)
