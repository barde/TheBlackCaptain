# Quick Start Guide

Get your blog running in 5 minutes.

## 1. Install

```bash
cd the-black-captain
npm install
```

## 2. Test Build

```bash
npm run build
```

You should see:
```
🏴‍☠️ Building The Black Captain blog...
✓ Copied assets
✓ Built: 2025-11-18-the-beginning.md → 2025-11-18-the-beginning.html
✓ Built: index.html
✓ Built: archive.html
🏴‍☠️ Build complete! 1 post(s) published.
```

## 3. Preview Locally

```bash
cd public
python -m http.server 8000
```

Open http://localhost:8000

## 4. Write Your First Real Post

Create `posts/2025-11-18-my-first-post.md`:

```markdown
---
title: My First Post
date: November 18, 2025
description: Where my journey begins
---

# My First Post

Today I start writing...
```

## 5. Rebuild

```bash
npm run build
```

## Next Steps

- Read `README.md` for full documentation
- Deploy to Cloudflare (instructions in README)
- Start writing daily

---

**Remember**:
- Posts must be named `YYYY-MM-DD-title.md`
- Build after each change
- All files in `public/` are auto-generated (don't edit directly)
- Edit markdown in `posts/`, CSS in `assets/`, never in `public/`

Happy writing! 🏴‍☠️
