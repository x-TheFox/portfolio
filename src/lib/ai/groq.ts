import OpenAI from 'openai';

// Groq client - optimized for speed (chatbot, quick responses)
export const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// Available Groq models
export const GROQ_MODELS = {
  // Fast - best for chatbot
  FAST: 'llama-3.1-8b-instant',
  // Balanced - good for most tasks
  BALANCED: 'llama-3.3-70b-versatile',
  // Quality - best reasoning
  QUALITY: 'meta-llama/llama-4-maverick-17b-128e-instruct',
} as const;

// Default model for chatbot (fastest)
export const DEFAULT_GROQ_MODEL = GROQ_MODELS.FAST;

// Check if Groq is configured
export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}

// Generate completion with Groq
export async function generateGroqCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const response = await groq.chat.completions.create({
    model: options?.model ?? DEFAULT_GROQ_MODEL,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 1024,
  });
  
  return response.choices[0]?.message?.content ?? '';
}

// Stream completion with Groq
export async function streamGroqCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  return groq.chat.completions.create({
    model: options?.model ?? DEFAULT_GROQ_MODEL,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 1024,
    stream: true,
  });
}
