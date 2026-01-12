#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_NAME="the-black-captain"
PRODUCTION_BRANCH="master"

echo -e "${BLUE}🏴‍☠️ The Black Captain - Deployment Script${NC}"
echo ""

# Function to print status messages
print_status() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if wrangler is authenticated
print_status "Checking Cloudflare authentication..."
if ! pnpm wrangler whoami &> /dev/null; then
    print_error "Not authenticated with Cloudflare"
    echo "Please run: pnpm wrangler login"
    exit 1
fi
print_success "Authenticated with Cloudflare"

# Check if Pages project exists, create if it doesn't
print_status "Checking if Pages project exists..."
if ! pnpm wrangler pages project list 2>&1 | grep -q "$PROJECT_NAME"; then
    print_warning "Project '$PROJECT_NAME' not found, creating..."
    pnpm wrangler pages project create "$PROJECT_NAME" --production-branch="$PRODUCTION_BRANCH"
    print_success "Project created"
else
    print_success "Project exists"
fi

# Build the project
print_status "Building the blog..."
pnpm run build
print_success "Blog built successfully"

# Deploy to Cloudflare Pages
print_status "Deploying to Cloudflare Pages..."
echo ""

# Deploy with production branch flag to ensure it goes to production
# The --project-name ensures we always use the same project
# The --branch flag ensures it deploys to production, not a preview
# The --commit-dirty flag allows deployment with uncommitted changes
DEPLOY_OUTPUT=$(pnpm wrangler pages deploy public --project-name="$PROJECT_NAME" --branch="$PRODUCTION_BRANCH" --commit-dirty=true 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract the URL from deployment output (handles multiple URL formats)
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP 'https://[a-zA-Z0-9\-]+\.the-black-captain\.pages\.dev' | head -1)

# If the above doesn't work, try the generic pattern
if [ -z "$DEPLOY_URL" ]; then
    DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP 'https://[a-zA-Z0-9]+\.the-black-captain\.pages\.dev' | head -1)
fi

# Get the production URL as well
PRODUCTION_URL="https://blackhoard.com"

if [ -z "$DEPLOY_URL" ]; then
    print_warning "Could not extract deployment URL from output"
    print_status "Checking project deployments..."
    DEPLOYMENTS_OUTPUT=$(pnpm wrangler pages deployment list --project-name="$PROJECT_NAME" 2>&1 | head -10)
    echo "$DEPLOYMENTS_OUTPUT"
    DEPLOY_URL=$(echo "$DEPLOYMENTS_OUTPUT" | grep -oP 'https://[a-zA-Z0-9\-]+\.the-black-captain\.pages\.dev' | head -1)
fi

if [ -n "$DEPLOY_URL" ]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}Latest Deployment:${NC} ${GREEN}$DEPLOY_URL${NC}"
    echo -e "${BLUE}Production URL:${NC} ${GREEN}$PRODUCTION_URL${NC}"
    echo ""
    echo -e "${BLUE}Opening production URL in browser...${NC}"

    # Open in default browser (works on Linux with xdg-open)
    if command -v xdg-open &> /dev/null; then
        xdg-open "$PRODUCTION_URL" &
        print_success "Browser opened"
    elif command -v open &> /dev/null; then
        open "$PRODUCTION_URL" &
        print_success "Browser opened"
    else
        print_warning "Could not detect browser command. Please open manually:"
        echo "  $PRODUCTION_URL"
    fi

    # Run automated deployment test
    echo ""
    print_status "Running automated deployment test with Playwright..."
    echo ""

    if pnpm run test:deployment; then
        print_success "Automated tests passed!"
    else
        print_error "Automated tests failed - please check the output above"
        exit 1
    fi

    # Run translation test
    echo ""
    print_status "Running translation feature test..."
    if pnpm run test:translation; then
        print_success "Translation test passed!"
    else
        print_error "Translation test failed!"
        exit 1
    fi
else
    print_error "Could not determine deployment URL"
    exit 1
fi

echo ""
print_success "Deployment complete! 🏴‍☠️"
