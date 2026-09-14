import Anthropic from '@anthropic-ai/sdk';

// This module must NEVER import prismaClient.js or @prisma/client. It only
// ever receives plain JS values (summary, history, question) from the route
// layer — this is the architectural enforcement of "the AI must never
// directly access the database."
const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;

export class AiServiceError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

const SYSTEM_PROMPT = `You are the "Finance AI" assistant inside a personal finance tracker app.

Answer using ONLY the financial summary JSON provided in this conversation — you have no database or live account access beyond what's given here. Never claim to have looked anything up or to have real-time access.

If the summary lacks enough information to answer precisely, say so rather than guessing or inventing numbers.

Your response is informational only, not professional financial, tax, or legal advice — phrase recommendations as observations from the user's own data, not prescriptive financial planning.

Formatting rules (important — the app displays your reply as plain text with line breaks, there is no markdown renderer):
- Do not use markdown syntax: no asterisks, no pound signs, no backticks, no bullet dashes used as markdown.
- For lists, use a plain line break between each item, optionally prefixed with a number like "1." followed by a period and a space.
- Keep responses concise and conversational — a few short paragraphs or a short list, not an essay.`;

export async function askFinancialQuestion({ summary, history, question }) {
  if (!client) {
    console.error('ANTHROPIC_API_KEY is not set — Finance AI cannot reach Claude.');
    throw new AiServiceError('The AI assistant is not configured yet. Please contact the site administrator.', 503);
  }

  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    {
      role: 'user',
      content: `Here is my current financial summary as JSON:\n${JSON.stringify(summary)}\n\nMy question: ${question}`,
    },
  ];

  try {
    const response = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: SYSTEM_PROMPT,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    return textBlock?.text?.trim() ?? '';
  } catch (err) {
    // TypeScript SDK error hierarchy: APIConnectionError is a SUBCLASS of
    // APIError (unlike Python, where it's a sibling), so it must be checked
    // before the generic APIError catch. The TS base class is `APIError`
    // (not `APIStatusError` — that name is Python-only).
    if (err instanceof Anthropic.RateLimitError) {
      throw new AiServiceError('The AI assistant is receiving too many requests right now. Please try again shortly.', 503);
    }
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      console.error('Anthropic auth/config error:', err);
      throw new AiServiceError('The AI assistant is temporarily unavailable.', 502);
    }
    if (err instanceof Anthropic.APIConnectionError) {
      throw new AiServiceError('Could not reach the AI assistant. Please try again.', 502);
    }
    if (err instanceof Anthropic.APIError) {
      console.error('Anthropic API error:', err.status, err.message);
      throw new AiServiceError('The AI assistant could not process that request. Please try again.', 502);
    }
    console.error('Unexpected AI client error:', err);
    throw new AiServiceError('The AI assistant is temporarily unavailable.', 500);
  }
}
