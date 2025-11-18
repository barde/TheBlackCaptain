#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏴‍☠️ The Black Captain - Cloudflare Environment Initialization${NC}"
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

# Check if wrangler is installed
print_status "Checking wrangler installation..."
if ! command -v wrangler &> /dev/null; then
    print_error "wrangler not found. Installing via pnpm..."
    pnpm install -D wrangler
else
    print_success "wrangler is installed"
fi

# Check if pnpm is installed
print_status "Checking pnpm installation..."
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install it first:"
    echo "  npm install -g pnpm"
    echo "  or: curl -fsSL https://get.pnpm.io/install.sh | sh -"
    exit 1
fi
print_success "pnpm is installed"

# Check wrangler authentication
print_status "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    print_warning "Not authenticated with Cloudflare"
    print_status "Opening browser for authentication..."
    wrangler login

    if ! wrangler whoami &> /dev/null; then
        print_error "Authentication failed. Please try again."
        exit 1
    fi
fi

USER_INFO=$(wrangler whoami 2>/dev/null | grep -i "logged in" || echo "")
print_success "Authenticated with Cloudflare"
echo "  $USER_INFO"

# Install dependencies
print_status "Installing project dependencies with pnpm..."
pnpm install
print_success "Dependencies installed"

# Create KV namespace for translations
print_status "Creating KV namespace for translation cache..."

# Check if namespace already exists
EXISTING_KV=$(wrangler kv:namespace list 2>/dev/null | grep -i "TRANSLATIONS_KV" || echo "")

if [ -n "$EXISTING_KV" ]; then
    print_warning "TRANSLATIONS_KV namespace may already exist"
    echo "$EXISTING_KV"
    read -p "Create a new namespace anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Skipping KV namespace creation"
        KV_ID=$(echo "$EXISTING_KV" | grep -oP 'id = "\K[^"]+' || echo "")
        if [ -z "$KV_ID" ]; then
            print_error "Could not extract KV namespace ID. Please create manually:"
            echo "  wrangler kv:namespace create \"TRANSLATIONS_KV\""
            exit 1
        fi
    else
        KV_OUTPUT=$(wrangler kv:namespace create "TRANSLATIONS_KV" 2>&1)
        echo "$KV_OUTPUT"
        KV_ID=$(echo "$KV_OUTPUT" | grep -oP 'id = "\K[^"]+')
        print_success "KV namespace created"
    fi
else
    KV_OUTPUT=$(wrangler kv:namespace create "TRANSLATIONS_KV" 2>&1)
    echo "$KV_OUTPUT"
    KV_ID=$(echo "$KV_OUTPUT" | grep -oP 'id = "\K[^"]+')
    print_success "KV namespace created"
fi

if [ -z "$KV_ID" ]; then
    print_error "Could not extract KV namespace ID"
    print_warning "Please manually update wrangler.toml with the KV namespace ID"
    exit 1
fi

# Update wrangler.toml with KV namespace ID
print_status "Updating wrangler.toml with KV namespace ID..."
if grep -q "YOUR_KV_NAMESPACE_ID_HERE" wrangler.toml; then
    sed -i "s/YOUR_KV_NAMESPACE_ID_HERE/$KV_ID/" wrangler.toml
    print_success "wrangler.toml updated with KV namespace ID: $KV_ID"
else
    print_warning "KV namespace ID already set in wrangler.toml or placeholder not found"
fi

# Build the project
print_status "Building the blog..."
pnpm run build
print_success "Blog built successfully"

# Summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Cloudflare environment initialized successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "1. ${YELLOW}Deploy to Cloudflare Pages:${NC}"
echo "   pnpm run deploy"
echo ""
echo "2. ${YELLOW}Or deploy the worker separately:${NC}"
echo "   pnpm run deploy:worker"
echo ""
echo "3. ${YELLOW}Configure bindings in Cloudflare Dashboard:${NC}"
echo "   - Go to your Pages project → Settings → Functions"
echo "   - Add AI binding (name: AI, type: AI)"
echo "   - KV namespace is already configured in wrangler.toml"
echo ""
echo "4. ${YELLOW}Test locally:${NC}"
echo "   pnpm run dev"
echo ""
echo -e "${BLUE}Your KV Namespace ID:${NC} ${GREEN}$KV_ID${NC}"
echo ""
echo -e "${BLUE}Happy sailing! 🏴‍☠️${NC}"
