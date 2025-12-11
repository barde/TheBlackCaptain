# Captain's Editor - Web-Based CMS for The Black Captain

## Overview

A Cloudflare Worker-powered web interface for writing and editing stories, secured with passkey authentication, featuring AI-assisted story enhancement via the Claude API.

## Architecture Decisions

### 1. Storage Backend: D1 + KV Hybrid

Based on [Cloudflare's guidance](https://developers.cloudflare.com/workers/platform/storage-options/):

- **D1 (SQLite)**: Primary storage for articles, users, and passkey credentials
  - Structured data with relationships
  - ACID transactions for auth flows
  - Time Travel for 30-day backup/recovery

- **KV**: Ephemeral data (challenges, sessions)
  - 5-minute TTL for WebAuthn challenges
  - 24-hour TTL for session tokens
  - Global edge distribution for fast session validation

### 2. Authentication: Passkeys via SimpleWebAuthn

Using [SimpleWebAuthn](https://github.com/MasterKale/SimpleWebAuthn) which is explicitly compatible with Cloudflare Workers:

**Why passkeys over traditional auth:**
- Phishing-resistant (as [Cloudflare implements internally](https://blog.cloudflare.com/how-cloudflare-implemented-fido2-and-zero-trust/))
- No passwords to leak or manage
- Works with device biometrics (TouchID, FaceID, Windows Hello)
- Syncs across devices via iCloud/Google/Microsoft

**Single-user design:**
- Only the Captain needs access
- Registration is a one-time setup (can be CLI-based)
- Multiple passkeys supported for backup devices

### 3. Claude API Integration: Server-Side Streaming

Using [Anthropic's streaming API](https://platform.claude.com/docs/en/build-with-claude/streaming):

- Server-side API calls (keeps API key secure)
- SSE streaming to browser for real-time feedback
- Model: `claude-sonnet-4-5` (best balance of speed/quality)
- Tools: Web search for research/citations

### 4. Editor: Minimal Client-Side

**Philosophy**: Ship fast, avoid framework complexity

- Vanilla JavaScript + HTML
- Textarea-based (no WYSIWYG complexity)
- Markdown preview with live rendering
- Mobile-responsive for editing from anywhere

## Database Schema

```sql
-- D1 Schema

-- Single admin user (the Captain)
CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- UUID
  display_name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Passkey credentials (multiple per user for backup)
CREATE TABLE credentials (
  id TEXT PRIMARY KEY,           -- Base64URL credential ID
  user_id TEXT NOT NULL REFERENCES users(id),
  public_key BLOB NOT NULL,      -- COSE public key
  counter INTEGER NOT NULL DEFAULT 0,
  device_type TEXT,              -- 'singleDevice' or 'multiDevice'
  backed_up INTEGER DEFAULT 0,   -- Boolean
  transports TEXT,               -- JSON array of transports
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_used_at INTEGER
);

-- Articles (posts, treasure-trove, avian-studies)
CREATE TABLE articles (
  id TEXT PRIMARY KEY,  -- UUID
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,   -- 'post', 'treasure-trove', 'avian-studies', 'page'
  title TEXT NOT NULL,
  content TEXT NOT NULL,  -- Markdown
  metadata TEXT,          -- JSON frontmatter (date, description, etc.)
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_articles_type ON articles(type);
CREATE INDEX idx_articles_slug ON articles(slug);
```

## API Routes

```
POST /api/auth/register/options     - Get registration challenge
POST /api/auth/register/verify      - Verify registration & store credential
POST /api/auth/login/options        - Get authentication challenge
POST /api/auth/login/verify         - Verify authentication & create session

GET  /api/articles                  - List all articles (requires auth)
GET  /api/articles/:slug            - Get single article
POST /api/articles                  - Create new article
PUT  /api/articles/:slug            - Update existing article
DELETE /api/articles/:slug          - Delete article

POST /api/ai/enhance                - Stream AI-enhanced content (SSE)
POST /api/ai/research               - Research a topic with web search
POST /api/deploy                    - Trigger site rebuild & deploy
```

## UI/UX Flow

### Login Screen
```
┌─────────────────────────────────────────┐
│     The Captain's Editor                │
│                                         │
│    [🔐 Sign in with Passkey]            │
│                                         │
│    Use your device's biometrics         │
│    to access the editor.                │
└─────────────────────────────────────────┘
```

### Editor Interface (Edit Mode)
```
┌─────────────────────────────────────────┐
│ ⚓ The Captain's Bridge    [Save] [Deploy]│
├─────────────────────────────────────────┤
│  [✏️ Edit]  [👁️ Preview]                 │
├─────────────────────────────────────────┤
│ Type: [Post ▼]  Slug: 2025-12-10-story  │
│ Title: _________________________________ │
│ Date: December 10, 2025                 │
│ Description: ___________________________ │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Write your story in markdown...     │ │
│ │                                     │ │
│ │ The Captain observed the morning   │ │
│ │ light filtering through the...     │ │
│ │                                     │ │
│ │                                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ [✨ Enhance with AI] [🔍 Research Topic] │
└─────────────────────────────────────────┘
```

### Editor Interface (Preview Mode)
```
┌─────────────────────────────────────────┐
│ ⚓ The Captain's Bridge    [Save] [Deploy]│
├─────────────────────────────────────────┤
│  [✏️ Edit]  [👁️ Preview]  ← active      │
├─────────────────────────────────────────┤
│                                         │
│  # The Morning Light                    │
│                                         │
│  The Captain observed the morning light │
│  filtering through the cabin's worn     │
│  porthole, casting amber diamonds       │
│  across the navigational charts...      │
│                                         │
│  ---                                    │
│                                         │
│  *Written from the waters of...*        │
│                                         │
└─────────────────────────────────────────┘
```

### AI Enhancement Flow
1. User writes rough draft points
2. Clicks "AI Enhance"
3. Claude streams enhanced version in real-time
4. User can accept, edit, or regenerate
5. Links and citations automatically added

## File Structure

```
workers/
├── editor/
│   ├── wrangler.toml           # Worker config
│   ├── src/
│   │   ├── index.ts            # Main worker entry
│   │   ├── router.ts           # Route handling
│   │   ├── auth/
│   │   │   ├── webauthn.ts     # Passkey logic
│   │   │   └── session.ts      # Session management
│   │   ├── api/
│   │   │   ├── articles.ts     # CRUD operations
│   │   │   ├── ai.ts           # Claude integration
│   │   │   └── deploy.ts       # GitHub Actions trigger
│   │   └── ui/
│   │       ├── login.html      # Login page
│   │       ├── editor.html     # Main editor
│   │       └── static/
│   │           ├── app.js      # Client-side JS
│   │           └── style.css   # Styles
│   ├── schema.sql              # D1 schema
│   └── package.json
```

## Security Considerations

1. **HTTPS Only**: WebAuthn requires HTTPS (Cloudflare provides this)
2. **Origin Validation**: Strict RP ID matching
3. **Challenge Expiry**: 5-minute TTL prevents replay
4. **Counter Verification**: Detects cloned authenticators
5. **Session Tokens**: Secure, HttpOnly cookies with 24h expiry
6. **API Key**: Stored as Worker secret (never exposed to client)
7. **CORS**: Strict origin policy (editor subdomain only)

## Deployment Strategy

1. **Subdomain**: `bridge.blackhoard.com` (the Captain's bridge - where commands are given)
2. **DNS**: CNAME to `captain-bridge.the-black-captain.workers.dev`
3. **Secrets**:
   - `ANTHROPIC_API_KEY` - Claude API access
   - `GITHUB_TOKEN` - For triggering deployments
4. **D1 Database**: Create `captain-editor-db`
5. **KV Namespace**: Create `EDITOR_SESSIONS`

## Implementation Phases

### Phase 1: Foundation (Core Infrastructure)
- [ ] Create D1 database and schema
- [ ] Create KV namespace for sessions
- [ ] Set up Worker with basic routing
- [ ] Implement passkey registration (CLI setup)
- [ ] Implement passkey authentication
- [ ] Create login UI

### Phase 2: Editor (CRUD Operations)
- [ ] List articles endpoint
- [ ] Create article endpoint
- [ ] Update article endpoint
- [ ] Delete article endpoint
- [ ] Editor HTML interface
- [ ] Markdown preview

### Phase 3: AI Enhancement
- [ ] Claude API integration
- [ ] Streaming response handler
- [ ] "Enhance" feature (expand short notes to story)
- [ ] "Research" feature (web search for citations)
- [ ] System prompt for Captain's voice

### Phase 4: Deployment Integration
- [ ] GitHub Actions trigger endpoint
- [ ] Deploy button in UI
- [ ] Sync articles to markdown files
- [ ] Status notifications

## System Prompt for AI Enhancement

```
You are helping the Black Captain write stories for his blog.

Voice guidelines:
- Always write in third person about the Captain ("The Captain observed..." not "I saw...")
- Use maritime metaphors and nautical language
- Philosophical and contemplative tone
- Rich, flowing prose

Task: Take the user's rough notes and expand them into a polished story in the Captain's distinctive voice. Add:
- Vivid sensory details
- Relevant historical or cultural references (verify with web search)
- Proper citations with links to real sources
- Atmospheric descriptions befitting a sea voyage

Never invent sources. All citations must be real and verifiable.
```

## Dependencies

```json
{
  "dependencies": {
    "@simplewebauthn/server": "^12.0.0",
    "@anthropic-ai/sdk": "^0.35.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241127.0",
    "wrangler": "^4.49.0",
    "typescript": "^5.7.0"
  }
}
```

## Decisions Made

1. **Editor URL**: `bridge.blackhoard.com` - the Captain's bridge where commands are given
2. **Article Sync**: D1 as source of truth - articles stored in database, markdown files generated on deploy
3. **Preview**: Toggle mode - switch between edit and preview tabs (simpler, mobile-friendly)
4. **Initial Setup**: Web-based first-time setup with one-time registration code

## Content Sync Strategy (D1 → Markdown)

When the Captain clicks "Deploy":
1. Fetch all articles from D1
2. Generate markdown files with frontmatter
3. Commit to GitHub (via API or workflow dispatch)
4. GitHub Action builds and deploys to Cloudflare Pages

This approach:
- Keeps the editor self-contained and fast
- Preserves the existing build pipeline
- Allows offline viewing of historical content via Git
- D1 Time Travel provides 30-day article recovery

---

## Sources

- [Cloudflare Workers KV](https://developers.cloudflare.com/kv/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [SimpleWebAuthn](https://simplewebauthn.dev/docs/)
- [Passkeys Demo on Cloudflare](https://github.com/nealfennimore/passkeys)
- [Claude Streaming API](https://platform.claude.com/docs/en/build-with-claude/streaming)
- [WebAuthn Best Practices 2025](https://heardintech.com/index.php/2025/09/18/passwordless-authentication-passkeys-webauthn-rollout-best-practices/)
- [Cloudflare FIDO2 Implementation](https://blog.cloudflare.com/how-cloudflare-implemented-fido2-and-zero-trust/)
