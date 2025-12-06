import OpenAI from 'openai';
import { groq, isGroqConfigured, GROQ_MODELS } from './groq';
import { openrouter, isOpenRouterConfigured, OPENROUTER_MODELS } from './openrouter';

export type AIProvider = 'groq' | 'openrouter';
export type AIUseCase = 'chat' | 'classification' | 'intake' | 'general';

// Provider selection based on use case
export function selectProvider(useCase: AIUseCase): AIProvider {
  // Groq for speed-critical paths
  if (useCase === 'chat' && isGroqConfigured()) {
    return 'groq';
  }
  
  // OpenRouter for reasoning tasks
  if ((useCase === 'classification' || useCase === 'intake') && isOpenRouterConfigured()) {
    return 'openrouter';
  }
  
  // Fallback logic
  if (isGroqConfigured()) return 'groq';
  if (isOpenRouterConfigured()) return 'openrouter';
  
  throw new Error('No AI provider configured. Set GROQ_API_KEY or OPENROUTER_API_KEY.');
}

// Get client and model for use case
export function getAIConfig(useCase: AIUseCase): {
  client: OpenAI;
  model: string;
  provider: AIProvider;
} {
  const provider = selectProvider(useCase);
  
  if (provider === 'groq') {
    return {
      client: groq,
      model: useCase === 'chat' ? GROQ_MODELS.FAST : GROQ_MODELS.BALANCED,
      provider: 'groq',
    };
  }
  
  return {
    client: openrouter,
    model: useCase === 'chat' 
      ? OPENROUTER_MODELS.FREE_CHAT 
      : OPENROUTER_MODELS.FREE_REASONING,
    provider: 'openrouter',
  };
}

// Unified completion with automatic fallback
export async function generateCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  useCase: AIUseCase = 'general',
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<{ content: string; provider: AIProvider }> {
  const config = getAIConfig(useCase);
  
  try {
    const response = await config.client.chat.completions.create({
      model: config.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    });
    
    return {
      content: response.choices[0]?.message?.content ?? '',
      provider: config.provider,
    };
  } catch (error) {
    // Fallback to other provider on error
    const fallbackProvider = config.provider === 'groq' ? 'openrouter' : 'groq';
    
    if (fallbackProvider === 'openrouter' && isOpenRouterConfigured()) {
      console.log(`Groq failed, falling back to OpenRouter`);
      const response = await openrouter.chat.completions.create({
        model: OPENROUTER_MODELS.FREE_CHAT,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1024,
      });
      return {
        content: response.choices[0]?.message?.content ?? '',
        provider: 'openrouter',
      };
    }
    
    if (fallbackProvider === 'groq' && isGroqConfigured()) {
      console.log(`OpenRouter failed, falling back to Groq`);
      const response = await groq.chat.completions.create({
        model: GROQ_MODELS.FAST,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1024,
      });
      return {
        content: response.choices[0]?.message?.content ?? '',
        provider: 'groq',
      };
    }
    
    throw error;
  }
}

// Streaming completion with automatic fallback
export async function streamCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  useCase: AIUseCase = 'chat',
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<{ stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>; provider: AIProvider }> {
  const config = getAIConfig(useCase);
  
  try {
    const stream = await config.client.chat.completions.create({
      model: config.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
      stream: true,
    });
    
    return { stream, provider: config.provider };
  } catch (error) {
    // Fallback to other provider
    const fallbackProvider = config.provider === 'groq' ? 'openrouter' : 'groq';
    const fallbackClient = fallbackProvider === 'groq' ? groq : openrouter;
    const fallbackModel = fallbackProvider === 'groq' 
      ? GROQ_MODELS.FAST 
      : OPENROUTER_MODELS.FREE_CHAT;
    
    console.log(`Primary provider failed, falling back to ${fallbackProvider}`);
    
    const stream = await fallbackClient.chat.completions.create({
      model: fallbackModel,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
      stream: true,
    });
    
    return { stream, provider: fallbackProvider };
  }
}

// Re-export everything
export * from './groq';
export * from './openrouter';
