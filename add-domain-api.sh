#!/bin/bash
set -e

DOMAIN="blackhoard.com"
PROJECT_NAME="the-black-captain"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:?Error: CLOUDFLARE_ACCOUNT_ID not set}"
PAGES_TARGET="the-black-captain.pages.dev"

echo "🌐 Adding custom domain to Cloudflare Pages via API"
echo ""
echo "Domain: $DOMAIN"
echo "Project: $PROJECT_NAME"
echo ""

# Get API Token
echo "You need a Cloudflare API Token with:"
echo "  - Zone:DNS:Edit permissions"
echo "  - Account:Cloudflare Pages:Edit permissions"
echo ""
echo "Create one at: https://dash.cloudflare.com/profile/api-tokens"
echo ""
read -p "Enter your Cloudflare API Token: " API_TOKEN

if [ -z "$API_TOKEN" ]; then
    echo "Error: API Token is required"
    exit 1
fi

# Get Zone ID
echo ""
echo "Getting Zone ID for $DOMAIN..."

ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json")

ZONE_ID=$(echo "$ZONE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ZONE_ID" ]; then
    echo "❌ Could not find zone for $DOMAIN"
    echo "Response: $ZONE_RESPONSE"
    exit 1
fi

echo "✓ Zone ID: $ZONE_ID"

# Step 1: Add CNAME DNS Record
echo ""
echo "Step 1: Adding CNAME DNS record..."

DNS_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"CNAME\",\"name\":\"@\",\"content\":\"$PAGES_TARGET\",\"ttl\":1,\"proxied\":true}")

if echo "$DNS_RESPONSE" | grep -q '"success":true'; then
    echo "✓ CNAME record created: $DOMAIN → $PAGES_TARGET"
elif echo "$DNS_RESPONSE" | grep -q "already exists"; then
    echo "⚠ CNAME record already exists (this is OK)"
else
    echo "❌ Failed to create DNS record"
    echo "Response: $DNS_RESPONSE"
fi

# Step 2: Add Custom Domain to Pages Project
echo ""
echo "Step 2: Adding custom domain to Pages project..."

PAGES_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"name\":\"$DOMAIN\"}")

if echo "$PAGES_RESPONSE" | grep -q '"success":true'; then
    echo "✓ Custom domain added to Pages project"
elif echo "$PAGES_RESPONSE" | grep -q "already exists"; then
    echo "⚠ Domain already exists in project (this is OK)"
else
    echo "❌ Failed to add domain to Pages"
    echo "Response: $PAGES_RESPONSE"
fi

# Verify
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Domain setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Your site: https://$DOMAIN"
echo ""
echo "Note: SSL certificate will auto-provision (usually 1-2 minutes)"
echo "      You can check status at:"
echo "      https://dash.cloudflare.com/$ACCOUNT_ID/pages/view/$PROJECT_NAME"
echo ""
