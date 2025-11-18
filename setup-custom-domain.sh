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

echo -e "${BLUE}🌐 Setting up custom domain: $DOMAIN${NC}"
echo ""

print_status "Step 1: Add custom domain to Pages project via Cloudflare Dashboard"
echo ""
echo "Since wrangler CLI doesn't support adding custom domains directly,"
echo "you need to complete this in the Cloudflare Dashboard:"
echo ""
echo "1. Go to: https://dash.cloudflare.com/$ACCOUNT_ID/pages/view/$PROJECT_NAME"
echo "2. Click 'Custom domains' tab"
echo "3. Click 'Set up a custom domain'"
echo "4. Enter: $DOMAIN"
echo "5. Click 'Continue'"
echo "6. Follow the DNS setup instructions (usually automatic if domain is on Cloudflare)"
echo ""
read -p "Press ENTER when you've completed this in the dashboard..."

print_status "Step 2: Verifying DNS propagation..."
echo ""

# Wait for DNS to propagate
MAX_ATTEMPTS=10
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    print_status "Checking DNS for $DOMAIN (attempt $((ATTEMPT+1))/$MAX_ATTEMPTS)..."

    if nslookup "$DOMAIN" 2>&1 | grep -q "the-black-captain.pages.dev\|cloudflare"; then
        print_success "DNS appears to be configured!"
        break
    fi

    ATTEMPT=$((ATTEMPT+1))
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        echo "Waiting 10 seconds before next check..."
        sleep 10
    fi
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    print_warning "DNS not detected yet - it may take a few minutes to propagate"
fi

echo ""
print_status "Step 3: Testing HTTPS connection..."
echo ""

# Try to curl the domain
if curl -I "https://$DOMAIN" 2>&1 | grep -q "200 OK\|301\|302"; then
    print_success "HTTPS is working!"
else
    print_warning "HTTPS not ready yet - SSL certificate may still be provisioning"
    echo "This can take up to 24 hours but usually completes in minutes"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Custom domain setup initiated!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Your domain:${NC} ${GREEN}https://$DOMAIN${NC}"
echo -e "${BLUE}Pages project:${NC} ${GREEN}$PROJECT_NAME${NC}"
echo ""
echo "Next steps:"
echo "1. Wait for SSL certificate to provision (if not done already)"
echo "2. Update deployment scripts to use new domain"
echo "3. Test the deployment"
echo ""
