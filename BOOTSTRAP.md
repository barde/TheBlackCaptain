# 🏴‍☠️ The Black Captain - Zero-Touch Bootstrap

## 🎯 **ONE COMMAND SETUP**

```bash
./bootstrap.sh
```

That's it! Everything else is automated.

---

## 📋 **What You Need (One-Time)**

### **Token 1: Cloudflare Master API Token**

This "master" token can create OTHER tokens automatically, so you never touch the dashboard again!

**Create it:** https://dash.cloudflare.com/profile/api-tokens

1. Click **"Create Token"**
2. Use template: **"Create Additional Tokens"**
3. OR create custom token with these permissions:
   - **Account → Account Settings → Edit**
   - **Account → Cloudflare Pages → Edit**
   - **Zone → DNS → Edit**
   - **Zone → Zone → Read**
4. Click **"Continue to summary"** → **"Create Token"**
5. **Copy the token** (you'll paste it into the bootstrap script)

---

### **Token 2: GitHub Personal Access Token**

This allows the script to set repository secrets automatically.

**Create it:** https://github.com/settings/tokens/new

1. **Note:** "Black Captain Bootstrap"
2. **Expiration:** "No expiration" (or your preference)
3. **Select scopes:**
   - ✓ **repo** (Full control of private repositories)
4. Click **"Generate token"**
5. **Copy the token** (you'll paste it into the bootstrap script)

---

## 🚀 **How It Works**

When you run `./bootstrap.sh`, it automatically:

1. ✅ **Creates a scoped deployment token** via Cloudflare API
   - Limited permissions (only what GitHub Actions needs)
   - Your master token stays safe

2. ✅ **Sets GitHub repository secrets** via GitHub API
   - `CLOUDFLARE_API_TOKEN` (the scoped token)
   - `CLOUDFLARE_ACCOUNT_ID`

3. ✅ **Configures blackhoard.com** via Cloudflare API
   - Creates CNAME DNS record
   - Adds custom domain to Pages project
   - Enables Cloudflare proxy

4. ✅ **Triggers first deployment**
   - Commits any pending changes
   - Pushes to GitHub
   - GitHub Actions starts automatically

5. ✅ **Monitors deployment** (optional)
   - Watches GitHub Actions workflow live

---

## 💡 **What Happens After Bootstrap?**

**From now on, deployment is just:**

```bash
git push
```

That's it! GitHub Actions automatically:
- Builds your blog
- Deploys to Cloudflare Pages
- Configures blackhoard.com
- Tests with Playwright
- Saves screenshots

---

## 🔒 **Security Benefits**

### **Scoped Tokens**
- Bootstrap creates a **limited-permission token** for deployments
- Your master token is NOT stored in GitHub
- Each token has minimum required permissions

### **No Manual Steps**
- No copy-pasting into dashboards
- No forgetting to update secrets
- No configuration drift

### **Audit Trail**
- All changes via API are logged
- GitHub secrets are encrypted
- Token rotation is easy (just run bootstrap again)

---

## 🛠️ **Troubleshooting**

### **"Could not create scoped token"**
Your master token might not have `Account.Settings:Edit` permission. Use the "Create Additional Tokens" template.

### **"Could not set GitHub secrets"**
Your GitHub token needs the `repo` scope. Recreate it with full repo access.

### **"Zone not found"**
Make sure blackhoard.com is already registered in your Cloudflare account.

### **"gh CLI not found"**
The script will try to install it automatically on Debian/Ubuntu. For other systems:
```bash
# macOS
brew install gh

# Other Linux
https://github.com/cli/cli/blob/trunk/docs/install_linux.md
```

---

## 📊 **What Gets Created**

| Resource | Location | Purpose |
|----------|----------|---------|
| Deployment Token | Cloudflare (via API) | GitHub Actions auth |
| GitHub Secrets | Repository Settings | Store credentials |
| CNAME Record | Cloudflare DNS | Point domain to Pages |
| Custom Domain | Pages Project | Serve site on blackhoard.com |
| SSL Certificate | Cloudflare (automatic) | HTTPS support |

---

## 🎉 **After Bootstrap**

Your complete CI/CD pipeline is live:

```
git push → GitHub Actions → Build → Deploy → Test → Live on blackhoard.com
```

**Visit your blog:** https://blackhoard.com

**View deployments:** https://github.com/barde/TheBlackCaptain/actions

---

## 🔄 **Re-running Bootstrap**

Safe to run multiple times! It will:
- Skip existing resources
- Update configurations if needed
- Rotate tokens (if you want)

---

## 📝 **Manual Alternative**

If you prefer manual setup, see: [DEPLOYMENT.md](DEPLOYMENT.md)

But why would you? This is way easier! 🏴‍☠️
