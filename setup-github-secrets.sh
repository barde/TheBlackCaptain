#!/bin/bash
set -e

REPO="barde/TheBlackCaptain"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:?Error: CLOUDFLARE_ACCOUNT_ID not set}"

echo "🔐 GitHub Secrets Setup for Cloudflare Pages Deployment"
echo "========================================================"
echo ""
echo "Repository: $REPO"
echo "Account ID: $ACCOUNT_ID"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo ""
    echo "Install it with:"
    echo "  Linux: sudo apt install gh"
    echo "  Or: https://cli.github.com/"
    echo ""
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "🔑 Not authenticated with GitHub. Logging in..."
    gh auth login
fi

echo "✓ Authenticated with GitHub"
echo ""

# Step 1: Create Cloudflare API Token
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Create Cloudflare API Token"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open: https://dash.cloudflare.com/profile/api-tokens"
echo "2. Click 'Create Token'"
echo "3. Use template: 'Edit Cloudflare Workers' OR create custom with:"
echo "   - Account → Cloudflare Pages → Edit"
echo "   - Zone → DNS → Edit"
echo "   - Zone → Zone → Read"
echo "4. Copy the token"
echo ""
read -p "Enter your Cloudflare API Token: " API_TOKEN

if [ -z "$API_TOKEN" ]; then
    echo "❌ API Token is required"
    exit 1
fi

echo "✓ API Token received"
echo ""

# Step 2: Set GitHub Secrets
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Setting GitHub Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Set CLOUDFLARE_API_TOKEN
echo "Setting CLOUDFLARE_API_TOKEN..."
echo "$API_TOKEN" | gh secret set CLOUDFLARE_API_TOKEN --repo="$REPO"
echo "✓ CLOUDFLARE_API_TOKEN set"

# Set CLOUDFLARE_ACCOUNT_ID
echo "Setting CLOUDFLARE_ACCOUNT_ID..."
echo "$ACCOUNT_ID" | gh secret set CLOUDFLARE_ACCOUNT_ID --repo="$REPO"
echo "✓ CLOUDFLARE_ACCOUNT_ID set"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ GitHub Secrets configured successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Secrets set:"
echo "  ✓ CLOUDFLARE_API_TOKEN"
echo "  ✓ CLOUDFLARE_ACCOUNT_ID"
echo ""
echo "Next steps:"
echo "  1. Commit and push the GitHub Actions workflow"
echo "  2. The workflow will run automatically on push to master"
echo "  3. Or trigger manually: gh workflow run deploy.yml"
echo ""
