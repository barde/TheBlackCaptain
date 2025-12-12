/**
 * AI API for Captain's Bridge
 * Claude integration for story enhancement and research
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Env } from '../index';
import type { Session } from '../auth/session';

const CAPTAIN_SYSTEM_PROMPT = `You are helping the Black Captain write stories for his blog.

Voice guidelines:
- Always write in third person about the Captain ("The Captain observed..." not "I saw...")
- Use maritime metaphors and nautical language where natural
- Philosophical and contemplative tone
- Rich, flowing prose with vivid sensory details

When enhancing content:
- Expand brief notes into polished narrative prose
- Add atmospheric descriptions befitting a sea voyage
- Include relevant historical or cultural references when appropriate
- Maintain the Captain's distinctive voice throughout

When researching:
- Find real, verifiable sources for citations
- Provide direct links to referenced material
- Never invent or fabricate sources
- Summarize key findings clearly

Format output as markdown. Use proper heading levels, links, and emphasis.`;

interface EnhanceRequest {
  content: string;
  instructions?: string;
  type?: 'post' | 'treasure-trove' | 'avian-studies' | 'page';
}

interface ResearchRequest {
  topic: string;
  context?: string;
}

/**
 * Handle all AI routes
 */
export async function handleAI(
  request: Request,
  env: Env,
  path: string,
  session: Session
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Enhance content with AI
  if (path === '/api/ai/enhance') {
    return handleEnhance(request, env);
  }

  // Research a topic
  if (path === '/api/ai/research') {
    return handleResearch(request, env);
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Enhance content using Claude
 * Returns a streaming response
 */
async function handleEnhance(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as EnhanceRequest;

  if (!body.content) {
    return new Response(JSON.stringify({ error: 'Content is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let userPrompt = `Please enhance the following rough notes into polished prose in the Captain's voice:\n\n${body.content}`;

  if (body.instructions) {
    userPrompt += `\n\nAdditional instructions: ${body.instructions}`;
  }

  if (body.type) {
    userPrompt += `\n\nThis is for a ${body.type} article.`;
  }

  // Create streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.create({
          model: 'claude-sonnet-4-5-20250514',
          max_tokens: 4096,
          system: CAPTAIN_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
          stream: true,
        });

        for await (const event of response) {
          if (event.type === 'content_block_delta') {
            const delta = event.delta;
            if ('text' in delta) {
              // Send SSE formatted data
              const data = JSON.stringify({ text: delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
        }

        // Send done event
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('AI enhance error:', error);
        const errorData = JSON.stringify({ error: 'AI processing failed' });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Research a topic using Claude with web search
 * Returns a streaming response
 */
async function handleResearch(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as ResearchRequest;

  if (!body.topic) {
    return new Response(JSON.stringify({ error: 'Topic is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let userPrompt = `Research the following topic and provide a comprehensive summary with citations and links to sources:\n\nTopic: ${body.topic}`;

  if (body.context) {
    userPrompt += `\n\nContext for the research: ${body.context}`;
  }

  userPrompt += `\n\nPlease provide:
1. A brief overview of the topic
2. Key facts and interesting details
3. Historical or cultural significance (if relevant)
4. Links to authoritative sources
5. How this might be incorporated into a story

Format the response as markdown with proper citations.`;

  // Create streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.create({
          model: 'claude-sonnet-4-5-20250514',
          max_tokens: 4096,
          system: CAPTAIN_SYSTEM_PROMPT,
          tools: [
            {
              type: 'web_search_20250305',
              name: 'web_search',
              max_uses: 5,
            } as const,
          ] as unknown as Parameters<typeof client.messages.create>[0]['tools'],
          messages: [{ role: 'user', content: userPrompt }],
          stream: true,
        });

        for await (const event of response) {
          if (event.type === 'content_block_delta') {
            const delta = event.delta;
            if ('text' in delta) {
              const data = JSON.stringify({ text: delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('AI research error:', error);
        const errorData = JSON.stringify({ error: 'AI research failed' });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
