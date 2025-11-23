# AI Image Generation for The Black Captain

This blog uses Cloudflare Workers AI to automatically generate hero images for articles using the Flux Schnell text-to-image model.

## How It Works

1. **Automatic Prompts**: The system creates maritime-themed image prompts based on article titles and descriptions
2. **AI Generation**: Images are generated using Cloudflare's `@cf/black-forest-labs/flux-1-schnell` model
3. **Caching**: Generated images are saved to disk and reused on subsequent builds
4. **Display**: Images appear as hero images at the top of each article

## Setup Instructions

### Step 1: Get Cloudflare Credentials

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Note your **Account ID**:
   - Found in the URL: `https://dash.cloudflare.com/{ACCOUNT_ID}/workers`
   - Or in the Workers & Pages overview sidebar

3. Create an **API Token**:
   - Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Click "Create Token"
   - Use the "Edit Cloudflare Workers" template
   - Add **Workers AI:Read** permission
   - Create token and copy it immediately (shown only once!)

### Step 2: Set Environment Variables

Add these to your environment (`.bashrc`, `.zshrc`, or CI/CD secrets):

```bash
export CLOUDFLARE_ACCOUNT_ID="your_account_id_here"
export CLOUDFLARE_API_TOKEN="your_api_token_here"
```

Or for one-time use:

```bash
CLOUDFLARE_ACCOUNT_ID=xxx CLOUDFLARE_API_TOKEN=yyy pnpm run generate:images
```

### Step 3: Generate Images

Run the image generation script:

```bash
pnpm run generate:images
```

This will:
- Read all markdown posts from `/posts`
- Generate prompts based on titles/descriptions
- Call Cloudflare Workers AI API
- Save images to `/public/images/generated/`
- Skip images that already exist

## Usage

### Generate All Images

```bash
pnpm run generate:images
```

### Generate During Build

Images are NOT automatically generated during `pnpm run build` to avoid unnecessary API calls and costs. You must run `pnpm run generate:images` separately when:
- Adding new articles
- Wanting to regenerate images with new prompts

### Delete and Regenerate

To regenerate all images:

```bash
rm -rf public/images/generated/*
pnpm run generate:images
```

## Prompt Customization

The system auto-generates prompts based on article content. Edit `/generate-images.js` in the `createPromptFromArticle()` function to customize:

```javascript
function createPromptFromArticle(title, description) {
  // Customize prompt generation logic here
  return 'Your custom prompt';
}
```

## Image Naming

Generated images are named after the article slug:
- Article: `2025-11-23-the-double-ship.md`
- Image: `/public/images/generated/2025-11-23-the-double-ship.jpg`

## Cost Considerations

Cloudflare Workers AI pricing (as of 2025):
- **Flux Schnell**: ~0.03 credits per image
- **Free tier**: 10,000 neurons/day
- **Paid tier**: $0.011 per 1,000 neurons

Image generation is **cached** - images are only generated once and reused on subsequent builds.

## Troubleshooting

### "Cloudflare credentials not found"

Set the `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` environment variables.

### "API error: 401"

Your API token doesn't have Workers AI:Read permission. Create a new token with the correct permissions.

### "API error: 403"

Workers AI may not be enabled on your account. Check your Cloudflare dashboard.

### Images not appearing

1. Check that images exist in `/public/images/generated/`
2. Verify the build copies images correctly
3. Check browser console for 404 errors

## Technical Details

- **Model**: `@cf/black-forest-labs/flux-1-schnell`
- **Output format**: JPEG (base64 encoded from API)
- **Image dimensions**: Determined by the AI model (typically 1024x1024)
- **Generation speed**: ~2-4 seconds per image
- **API endpoint**: `https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/{MODEL}`

## References

- [Cloudflare Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [Flux Schnell Model](https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/)
- [Workers AI REST API](https://developers.cloudflare.com/workers-ai/get-started/rest-api/)
