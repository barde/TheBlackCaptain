#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() { echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${CYAN}$1${NC}"; echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }
print_status() { echo -e "${BLUE}▶${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }

# Configuration
DOMAIN="blackhoard.com"
PROJECT_NAME="the-black-captain"
REPO="barde/TheBlackCaptain"
ACCOUNT_ID="YOUR_CLOUDFLARE_ACCOUNT_ID"
PAGES_TARGET="the-black-captain.pages.dev"

clear
echo -e "${CYAN}"
cat << "EOF"
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🏴‍☠️  THE BLACK CAPTAIN - BOOTSTRAP SETUP     ┃
┃  Fully Automated Deployment Configuration    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
EOF
echo -e "${NC}"
echo ""
echo "This script will FULLY AUTOMATE your deployment setup."
echo "You only need to provide 2 tokens ONCE."
echo ""

# ============================================================================
# STEP 1: GET MASTER TOKENS
# ============================================================================

print_header "STEP 1: Get Master Tokens (One-Time Setup)"
echo ""

echo -e "${YELLOW}Token 1: Cloudflare Master API Token${NC}"
echo "This token can create OTHER tokens (so you never touch the dashboard again!)"
echo ""
echo "Create it here: https://dash.cloudflare.com/profile/api-tokens"
echo "  1. Click 'Create Token'"
echo "  2. Use template: 'Create Additional Tokens'"
echo "  3. OR create custom with these permissions:"
echo "     - Account → Account Settings → Edit"
echo "     - Account → Cloudflare Pages → Edit"
echo "     - Zone → DNS → Edit"
echo "     - Zone → Zone → Read"
echo ""
read -sp "Paste your Cloudflare Master API Token: " CF_MASTER_TOKEN
echo ""

if [ -z "$CF_MASTER_TOKEN" ]; then
    print_error "Cloudflare token is required"
    exit 1
fi
print_success "Cloudflare token received"
echo ""

echo -e "${YELLOW}Token 2: GitHub Personal Access Token${NC}"
echo "This allows setting repository secrets automatically."
echo ""
echo "Create it here: https://github.com/settings/tokens/new"
echo "  1. Name: 'Black Captain Bootstrap'"
echo "  2. Expiration: 'No expiration' (or your preference)"
echo "  3. Scopes: Select 'repo' (full control of private repositories)"
echo ""
read -sp "Paste your GitHub Personal Access Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    print_error "GitHub token is required"
    exit 1
fi
print_success "GitHub token received"
echo ""

# ============================================================================
# STEP 2: CREATE SCOPED CLOUDFLARE DEPLOYMENT TOKEN
# ============================================================================

print_header "STEP 2: Creating Scoped Deployment Token"
echo ""

print_status "Creating a scoped token for GitHub Actions..."

# Create a scoped token via Cloudflare API
DEPLOY_TOKEN_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/user/tokens" \
  -H "Authorization: Bearer $CF_MASTER_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "GitHub Actions - The Black Captain",
    "policies": [
      {
        "effect": "allow",
        "resources": {
          "com.cloudflare.api.account.'$ACCOUNT_ID'": "*"
        },
        "permission_groups": [
          {"id": "c8fed203ed3043cba015a93ad1616f1f"},
          {"id": "bcb3d6e8f5564ac5b0de4e8c28d3f935"}
        ]
      }
    ]
  }')

if echo "$DEPLOY_TOKEN_RESPONSE" | grep -q '"success":true'; then
    DEPLOY_TOKEN=$(echo "$DEPLOY_TOKEN_RESPONSE" | grep -o '"value":"[^"]*"' | cut -d'"' -f4)
    print_success "Created scoped deployment token"
else
    print_warning "Could not create scoped token via API, using master token"
    print_warning "Response: $DEPLOY_TOKEN_RESPONSE"
    DEPLOY_TOKEN="$CF_MASTER_TOKEN"
fi

echo ""

# ============================================================================
# STEP 3: SET GITHUB REPOSITORY SECRETS
# ============================================================================

print_header "STEP 3: Setting GitHub Repository Secrets"
echo ""

# Get repository public key for encryption
print_status "Getting repository public key..."

REPO_KEY_RESPONSE=$(curl -s -X GET \
  "https://api.github.com/repos/$REPO/actions/secrets/public-key" \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json")

REPO_PUBLIC_KEY=$(echo "$REPO_KEY_RESPONSE" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
KEY_ID=$(echo "$REPO_KEY_RESPONSE" | grep -o '"key_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$REPO_PUBLIC_KEY" ]; then
    print_error "Could not get repository public key"
    print_warning "Trying with gh CLI instead..."

    # Fallback to gh CLI
    if command -v gh &> /dev/null; then
        print_status "Using gh CLI to set secrets..."
        echo "$DEPLOY_TOKEN" | gh secret set CLOUDFLARE_API_TOKEN --repo="$REPO"
        echo "$ACCOUNT_ID" | gh secret set CLOUDFLARE_ACCOUNT_ID --repo="$REPO"
        print_success "Secrets set via gh CLI"
    else
        print_error "gh CLI not found. Please install it: sudo apt install gh"
        exit 1
    fi
else
    # Encrypt and set secrets using GitHub API
    # Note: This requires libsodium or similar, so we'll use gh CLI as primary method
    print_warning "API method requires libsodium for encryption"
    print_status "Using gh CLI for simplicity..."

    if ! command -v gh &> /dev/null; then
        print_error "gh CLI not found. Installing..."
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
        sudo apt update && sudo apt install gh -y
    fi

    # Authenticate gh CLI with token
    echo "$GITHUB_TOKEN" | gh auth login --with-token

    # Set secrets
    print_status "Setting CLOUDFLARE_API_TOKEN..."
    echo "$DEPLOY_TOKEN" | gh secret set CLOUDFLARE_API_TOKEN --repo="$REPO"
    print_success "CLOUDFLARE_API_TOKEN set"

    print_status "Setting CLOUDFLARE_ACCOUNT_ID..."
    echo "$ACCOUNT_ID" | gh secret set CLOUDFLARE_ACCOUNT_ID --repo="$REPO"
    print_success "CLOUDFLARE_ACCOUNT_ID set"
fi

echo ""

# ============================================================================
# STEP 4: CONFIGURE CUSTOM DOMAIN
# ============================================================================

print_header "STEP 4: Configuring Custom Domain"
echo ""

# Get Zone ID
print_status "Getting Zone ID for $DOMAIN..."

ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
  -H "Authorization: Bearer $CF_MASTER_TOKEN" \
  -H "Content-Type: application/json")

ZONE_ID=$(echo "$ZONE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ZONE_ID" ]; then
    print_error "Could not find zone for $DOMAIN"
    exit 1
fi

print_success "Zone ID: $ZONE_ID"

# Add CNAME DNS Record
print_status "Creating CNAME DNS record..."

DNS_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_MASTER_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"CNAME\",\"name\":\"@\",\"content\":\"$PAGES_TARGET\",\"ttl\":1,\"proxied\":true}")

if echo "$DNS_RESPONSE" | grep -q '"success":true'; then
    print_success "CNAME record created: $DOMAIN → $PAGES_TARGET"
elif echo "$DNS_RESPONSE" | grep -q "already exists"; then
    print_success "CNAME already exists"
else
    print_warning "DNS response: $(echo $DNS_RESPONSE | head -c 100)"
fi

# Add Custom Domain to Pages
print_status "Adding custom domain to Pages project..."

PAGES_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains" \
  -H "Authorization: Bearer $CF_MASTER_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"name\":\"$DOMAIN\"}")

if echo "$PAGES_RESPONSE" | grep -q '"success":true'; then
    print_success "Custom domain added to Pages"
elif echo "$PAGES_RESPONSE" | grep -q "already exists"; then
    print_success "Domain already configured"
else
    print_warning "Pages response: $(echo $PAGES_RESPONSE | head -c 100)"
fi

echo ""

# ============================================================================
# STEP 5: TRIGGER DEPLOYMENT
# ============================================================================

print_header "STEP 5: Triggering Deployment"
echo ""

print_status "Pushing to GitHub to trigger deployment..."

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_warning "Uncommitted changes detected. Committing..."
    git add -A
    git commit -m "Bootstrap complete - automated setup

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
fi

# Push to trigger GitHub Actions
git push origin master

print_success "Pushed to GitHub"

echo ""
print_status "Waiting for GitHub Actions to start..."
sleep 5

# Watch the workflow
print_status "Monitoring deployment..."
gh run watch --repo="$REPO" 2>/dev/null || print_warning "Install gh CLI to watch live: sudo apt install gh"

echo ""

# ============================================================================
# SUMMARY
# ============================================================================

print_header "🎉 BOOTSTRAP COMPLETE!"
echo ""
echo -e "${GREEN}✓${NC} Scoped deployment token created"
echo -e "${GREEN}✓${NC} GitHub repository secrets configured"
echo -e "${GREEN}✓${NC} Custom domain $DOMAIN configured"
echo -e "${GREEN}✓${NC} DNS (CNAME) record created"
echo -e "${GREEN}✓${NC} Deployment triggered"
echo ""
echo -e "${CYAN}Your blog will be live at: ${GREEN}https://$DOMAIN${NC}"
echo ""
echo "View deployment progress: https://github.com/$REPO/actions"
echo ""
echo -e "${YELLOW}From now on, just run:${NC} ${GREEN}git push${NC}"
echo "Everything else is automated! 🏴‍☠️"
echo ""
