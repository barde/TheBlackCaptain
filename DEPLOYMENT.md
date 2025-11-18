# 🚀 Automated Deployment Setup

## ✅ What's Done

1. ✓ Created GitHub Actions workflow (`.github/workflows/deploy.yml`)
2. ✓ Created domain setup scripts
3. ✓ Committed all files locally
4. ⏳ Git push is in progress (might need manual completion)

---

## 🎯 Quick Setup (3 Steps)

### Step 1: Push to GitHub (if not already done)

```bash
git push origin master
```

### Step 2: Setup GitHub Secrets

Run the automated script:

```bash
./setup-github-secrets.sh
```

Or manually:

1. Get Cloudflare API Token: https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use template: "Edit Cloudflare Workers"
   - Or custom with: Account→Pages→Edit + Zone→DNS→Edit + Zone→Zone→Read

2. Add secrets to GitHub:

```bash
# Login to gh CLI
gh auth login

# Set secrets
echo "YOUR_API_TOKEN" | gh secret set CLOUDFLARE_API_TOKEN --repo="barde/TheBlackCaptain"
echo "YOUR_CLOUDFLARE_ACCOUNT_ID" | gh secret set CLOUDFLARE_ACCOUNT_ID --repo="barde/TheBlackCaptain"
```

### Step 3: Trigger Deployment

The workflow runs automatically on push to `master`, or trigger manually:

```bash
gh workflow run deploy.yml
```

Monitor the workflow:

```bash
gh run watch
```

Or visit: https://github.com/barde/TheBlackCaptain/actions

---

## 🌐 What the Workflow Does

1. **Builds** your blog
2. **Deploys** to Cloudflare Pages
3. **Adds custom domain** (blackhoard.com) automatically via API
4. **Configures DNS** (CNAME record)
5. **Tests deployment** with Playwright
6. **Uploads screenshot** as artifact

---

## 📋 Manual Domain Setup (Alternative)

If you prefer to add the domain manually:

1. Go to: https://dash.cloudflare.com/YOUR_CLOUDFLARE_ACCOUNT_ID/pages/view/the-black-captain
2. Click "Custom domains" tab
3. Click "Set up a custom domain"
4. Enter: `blackhoard.com`
5. Click "Continue" and "Activate"

---

## 🧪 Test Locally

```bash
# Test the deployment
pnpm run test:deployment

# Deploy manually (local)
pnpm run deploy
```

---

## 📁 Files Created

- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `setup-github-secrets.sh` - Automated secrets setup
- `deploy.sh` - Local deployment script
- `test-deployment.js` - Playwright test script
- `add-domain-api.sh` - Domain setup via API
- `DEPLOYMENT.md` - This file

---

## 🎉 After Setup

Your blog will:
- ✓ Auto-deploy on every push to master
- ✓ Be available at https://blackhoard.com
- ✓ Have automatic SSL certificates
- ✓ Include automated testing
- ✓ Store deployment screenshots

**Single command deployment:**
```bash
git push
```

That's it! 🏴‍☠️
