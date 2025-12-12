# Captain's Bridge - Setup Instructions

## Overview

The Captain's Bridge is a web-based CMS for writing and editing stories at `bridge.blackhoard.com`, secured with passkey authentication and featuring AI-assisted story enhancement via Claude API.

---

## Current Status

- **Worker deployed**: https://captain-bridge.meise.workers.dev
- **PR created**: https://github.com/barde/TheBlackCaptain/pull/14
- **Branch**: `feature/captains-bridge-editor`
- **D1 Database**: `captain-bridge-db` (ID: `e8577e15-31cf-4580-8f9e-f7a1387b12d2`)
- **KV Namespace**: `BRIDGE_SESSIONS` (ID: `0b1b1cc70e344686a17d224121052b43`)

---

## Setup Steps Required

### 1. Configure Custom Domain

Go to Cloudflare dashboard:
1. Navigate to: Workers & Pages → captain-bridge → Settings → Triggers
2. Click "Add Custom Domain"
3. Enter: `bridge.blackhoard.com`
4. Cloudflare will automatically configure DNS

Or via API/CLI (if you have zone access):
```bash
cd workers/bridge
pnpm exec wrangler routes add bridge.blackhoard.com/* captain-bridge
```

### 2. Set API Secrets

```bash
cd /home/debar/TheBlackCaptain/workers/bridge

# Set Claude API key
pnpm exec wrangler secret put ANTHROPIC_API_KEY
# Paste your Anthropic API key when prompted

# Set GitHub token (for deploy functionality)
pnpm exec wrangler secret put GITHUB_TOKEN
# Paste a GitHub PAT with repo access when prompted
```

### 3. First Login - Register Your Passkey

1. Visit: https://captain-bridge.meise.workers.dev/setup
   (or https://bridge.blackhoard.com/setup after domain is configured)

2. Enter setup code: `16b1b3c6ebd828a5d53916e8c88da5d6`

3. Enter display name: "The Captain" (or your preference)

4. Click "Register Passkey" and use your device's biometrics (TouchID, FaceID, Windows Hello, or a security key)

5. You'll be automatically logged in and redirected to the editor

---

## File Locations

```
workers/bridge/
├── wrangler.toml           # Worker configuration
├── schema.sql              # D1 database schema
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── scripts/
│   └── generate-setup-code.js  # Generate new setup codes
└── src/
    ├── index.ts            # Main worker entry
    ├── auth/
    │   ├── webauthn.ts     # Passkey authentication
    │   └── session.ts      # Session management
    ├── api/
    │   ├── articles.ts     # Article CRUD
    │   ├── ai.ts           # Claude API integration
    │   └── deploy.ts       # GitHub deploy trigger
    └── ui/
        ├── pages.ts        # HTML templates
        └── static/
            ├── app.ts      # Client-side JavaScript
            └── style.ts    # CSS styles
```

---

## Useful Commands

```bash
cd /home/debar/TheBlackCaptain/workers/bridge

# Deploy updates
pnpm exec wrangler deploy

# View logs
pnpm exec wrangler tail

# Local development
pnpm exec wrangler dev

# Initialize local D1 for testing
pnpm exec wrangler d1 execute captain-bridge-db --local --file=schema.sql

# Generate a new setup code
node scripts/generate-setup-code.js

# Add setup code to remote database
pnpm exec wrangler d1 execute captain-bridge-db --remote --command "INSERT INTO setup_codes (code) VALUES ('YOUR_CODE_HERE');"

# Check database contents
pnpm exec wrangler d1 execute captain-bridge-db --remote --command "SELECT * FROM users;"
pnpm exec wrangler d1 execute captain-bridge-db --remote --command "SELECT * FROM articles;"
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/status` | GET | Check if setup is needed |
| `/api/auth/register/options` | POST | Get passkey registration challenge |
| `/api/auth/register/verify` | POST | Verify passkey registration |
| `/api/auth/login/options` | POST | Get passkey login challenge |
| `/api/auth/login/verify` | POST | Verify passkey login |
| `/api/auth/logout` | POST | Logout and clear session |
| `/api/articles` | GET | List all articles |
| `/api/articles` | POST | Create new article |
| `/api/articles/:slug` | GET | Get single article |
| `/api/articles/:slug` | PUT | Update article |
| `/api/articles/:slug` | DELETE | Delete article |
| `/api/ai/enhance` | POST | Enhance content with Claude (SSE) |
| `/api/ai/research` | POST | Research topic with web search (SSE) |
| `/api/deploy` | POST | Trigger site deployment |

---

## Troubleshooting

### "Challenge expired or invalid" during login
- WebAuthn challenges expire after 5 minutes
- Try logging in again

### "Setup code required" error
- Generate a new setup code: `node scripts/generate-setup-code.js`
- Add it to the database (see commands above)

### Worker not responding
- Check logs: `pnpm exec wrangler tail`
- Redeploy: `pnpm exec wrangler deploy`

### AI features not working
- Ensure ANTHROPIC_API_KEY secret is set
- Check the key is valid and has credits

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser       │────▶│ Cloudflare Worker │────▶│  Claude API     │
│ (Passkey Auth)  │     │ (captain-bridge)  │     │  (Anthropic)    │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │   D1     │ │    KV    │ │  GitHub  │
              │(Articles)│ │(Sessions)│ │  (Deploy)│
              └──────────┘ └──────────┘ └──────────┘
```

---

## Security Notes

- Passkeys are phishing-resistant (public key cryptography)
- Sessions expire after 24 hours
- WebAuthn challenges expire after 5 minutes
- API keys stored as Cloudflare secrets (never in code)
- HTTPS enforced by Cloudflare

---

*Generated by Claude Code on 2025-12-12*
