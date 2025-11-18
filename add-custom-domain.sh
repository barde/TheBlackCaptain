#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}==>${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }

DOMAIN="blackhoard.com"
PROJECT_NAME="the-black-captain"
ACCOUNT_ID="YOUR_CLOUDFLARE_ACCOUNT_ID"
PAGES_SUBDOMAIN="the-black-captain.pages.dev"

echo -e "${BLUE}🌐 Adding custom domain via Cloudflare API${NC}"
echo ""

# Get API token from wrangler config
print_status "Getting Cloudflare API token..."
API_TOKEN=$(pnpm wrangler config 2>&1 | grep -i "api token" || echo "")

if [ -z "$API_TOKEN" ]; then
    # Try to get from environment or wrangler whoami
    print_status "Fetching credentials from wrangler..."

    # wrangler uses OAuth, so we need to use their API endpoint with the auth
    # Let's use wrangler to make the API call instead
    print_warning "Using wrangler API authentication"
fi

# Step 1: Get Zone ID for blackhoard.com
print_status "Step 1: Getting Zone ID for $DOMAIN..."

ZONE_ID=$(pnpm wrangler zones list 2>&1 | grep -i "$DOMAIN" | awk '{print $1}' | head -1)

if [ -z "$ZONE_ID" ]; then
    print_error "Could not find zone ID for $DOMAIN"
    print_warning "Attempting to find via API..."

    # Use a simple curl with wrangler's config
    # Actually, let's use a different approach - check if domain is already in Cloudflare
    print_status "Listing all zones..."
    pnpm wrangler zones list

    echo ""
    read -p "Enter the Zone ID for $DOMAIN from the list above: " ZONE_ID
fi

print_success "Zone ID: $ZONE_ID"

# Step 2: Add CNAME DNS record
print_status "Step 2: Creating CNAME DNS record..."

# Create DNS record via wrangler (if available) or provide manual instructions
cat > /tmp/dns-record.json << EOF
{
  "type": "CNAME",
  "name": "@",
  "content": "$PAGES_SUBDOMAIN",
  "ttl": 1,
  "proxied": true
}
EOF

print_status "Adding CNAME: $DOMAIN → $PAGES_SUBDOMAIN (proxied)"

# Use curl with Cloudflare API
# First, we need to get the API token from wrangler's config
CONFIG_DIR="${HOME}/.wrangler"
if [ -d "$CONFIG_DIR" ]; then
    print_status "Found wrangler config directory"
fi

# Manual API call approach
echo ""
print_warning "We need to add the domain via Cloudflare API"
echo ""
echo "Execute these curl commands manually with your Cloudflare API token:"
echo ""
echo "# 1. Add CNAME record:"
echo "curl -X POST \"https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records\" \\"
echo "  -H \"Authorization: Bearer YOUR_API_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"type\":\"CNAME\",\"name\":\"@\",\"content\":\"$PAGES_SUBDOMAIN\",\"ttl\":1,\"proxied\":true}'"
echo ""
echo "# 2. Add custom domain to Pages:"
echo "curl -X POST \"https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains\" \\"
echo "  -H \"Authorization: Bearer YOUR_API_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"name\":\"$DOMAIN\"}'"
echo ""
echo "Get your API token from: https://dash.cloudflare.com/profile/api-tokens"
echo ""

read -p "Have you executed these commands? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_success "Domain setup initiated!"

    print_status "Verifying DNS..."
    sleep 5

    if nslookup "$DOMAIN" 2>&1 | grep -q "$PAGES_SUBDOMAIN\|cloudflare"; then
        print_success "DNS is configured correctly!"
    else
        print_warning "DNS not detected yet - may take a few minutes to propagate"
    fi

    echo ""
    print_success "Custom domain setup complete!"
    echo ""
    echo "Your site will be available at: https://$DOMAIN"
    echo "SSL certificate will provision automatically (1-2 minutes)"
else
    print_error "Setup cancelled"
    exit 1
fi
