import OpenAI from 'openai';

// OpenRouter client - access to many models, good for complex reasoning
export const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    'X-Title': 'Adaptive Developer Portfolio',
  },
});

// Available OpenRouter models (free and paid)
export const OPENROUTER_MODELS = {
  // Free models - good for classification and reasoning
  FREE_REASONING: 'deepseek/deepseek-r1:free',
  FREE_CHAT: 'meta-llama/llama-3.2-3b-instruct:free',
  FREE_QUALITY: 'qwen/qwen3-235b-a22b:free',
  
  // Paid but cheap - better quality
  CHEAP_QUALITY: 'anthropic/claude-3-haiku',
  BEST_REASONING: 'anthropic/claude-3.5-sonnet',
} as const;

// Default model for classification/intake (free, good reasoning)
export const DEFAULT_OPENROUTER_MODEL = OPENROUTER_MODELS.FREE_REASONING;

// Check if OpenRouter is configured
export function isOpenRouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

// Generate completion with OpenRouter
export async function generateOpenRouterCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const response = await openrouter.chat.completions.create({
    model: options?.model ?? DEFAULT_OPENROUTER_MODEL,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
  });
  
  return response.choices[0]?.message?.content ?? '';
}

// Stream completion with OpenRouter
export async function streamOpenRouterCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  return openrouter.chat.completions.create({
    model: options?.model ?? DEFAULT_OPENROUTER_MODEL,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
    stream: true,
  });
}
