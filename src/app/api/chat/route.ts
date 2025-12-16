import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { groq, GROQ_MODELS } from '@/lib/ai/groq';
import { getChatSystemPrompt, buildContextualPrompt } from '@/lib/ai/prompts';
import { PersonaType, DEFAULT_PERSONA } from '@/types/persona';
import { getSkills, getProfile } from '@/lib/cms';
import { getProjects } from '@/lib/notion/projects';
// summarizeWithGemini is imported dynamically within functions that use it to avoid
// requiring GENAI_API_KEY at build-time (prevents build failures when env var
// is not set in preview environments)


interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  persona?: PersonaType;
  confidence?: number;
  navigationHistory?: string[];
}

// Tool definition for fetching project code from gitingest
const FETCH_PROJECT_CODE_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'fetch_project_code',
    description: 'Fetch detailed code structure, file contents, and implementation details for a specific project repository. Use this when the user asks about code, implementation details, architecture, or specific features of a project.',
    parameters: {
      type: 'object',
      properties: {
        repo_name: {
          type: 'string',
          description: 'The repository name (not the full URL). For example: "portfolio" or "adaptive-developer"',
        },
      },
      required: ['repo_name'],
    },
  },
};



// Extract GitHub username from profile URL
function extractGithubUsername(url: string | undefined): string {
  if (!url) return 'x-TheFox'; // Default fallback
  const match = url.match(/github\.com\/([^\/\?#]+)/);
  return match ? match[1] : 'x-TheFox';
}

// Fetch and summarize code from gitingest
async function fetchProjectCode(repoName: string, githubUsername: string): Promise<string> {
  try {
    const url = `https://gitingest.com/api/${githubUsername}/${repoName}`;
    console.log(`Fetching gitingest: ${url}`);
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return `Error: Could not fetch repository "${repoName}". It may not exist or be private.`;
    }

    const data = await response.json();
    
    // Construct the full content for summarization
    const contentToSummarize = `Repository: ${repoName}\nSummary: ${data.summary || 'No summary available'}\nFile Tree:\n${data.tree || 'No tree available'}\n\nContent:\n${data.content || ''}`;

    // Summarize the large response using Gemini (dynamically import to avoid build-time env dependency)
    let summary: string;
    try {
      const { summarizeWithGemini } = await import('@/lib/ai/gemini');
      summary = await summarizeWithGemini(contentToSummarize);
    } catch (err) {
      console.error('Gemini summarization not available:', err);
      summary = 'Summarization temporarily unavailable.';
    }

    return summary;
  } catch (error) {
    console.error('Gitingest fetch error:', error);
    return `Error fetching repository "${repoName}": ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Estimate token count (rough approximation: ~4 chars per token)
function estimateTokens(text: string | null | undefined): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

// Manage context window by trimming old messages
function trimMessagesToFitContext(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  maxTokens: number = 100000
): OpenAI.Chat.ChatCompletionMessageParam[] {
  // Helper to safely get content string
  const getContentString = (content: unknown): string => {
    if (content === null || content === undefined) return '';
    if (typeof content === 'string') return content;
    try {
      return JSON.stringify(content);
    } catch {
      return '';
    }
  };

  // Always keep system message(s) at the start
  const systemMessages = messages.filter(m => m.role === 'system');
  const nonSystemMessages = messages.filter(m => m.role !== 'system');
  
  // Calculate tokens used by system messages
  const systemTokens = systemMessages.reduce((acc, m) => 
    acc + estimateTokens(getContentString(m.content)), 0);
  
  // Available tokens for conversation
  const availableTokens = maxTokens - systemTokens - 2000; // Reserve 2000 for response
  
  // Build conversation from most recent, keeping tool exchanges together
  const trimmedConversation: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  let usedTokens = 0;
  
  for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
    const msg = nonSystemMessages[i];
    const msgTokens = estimateTokens(getContentString(msg.content));
    
    if (usedTokens + msgTokens > availableTokens) {
      break;
    }
    
    trimmedConversation.unshift(msg);
    usedTokens += msgTokens;
  }
  
  return [...systemMessages, ...trimmedConversation];
}

export async function POST(request: NextRequest) {
  // Temporarily disable chat API when not explicitly enabled via env.
  // This preserves the server-side API but prevents it from processing requests
  // while the chat system is being disabled for maintenance or testing.
  if (process.env.NEXT_PUBLIC_CHAT_ENABLED !== 'true') {
    return new Response('Chat API temporarily disabled', { status: 503 });
  }
  try {
    const body: ChatRequest = await request.json();
    const { 
      messages, 
      persona = DEFAULT_PERSONA, 
      navigationHistory = [] 
    } = body;

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    // Fetch live data for context
    const [skills, projects, profile] = await Promise.all([
      getSkills(),
      getProjects(),
      getProfile(),
    ]);

    const githubUsername = extractGithubUsername(
      (profile.socialLinks as { github?: string })?.github
    );

    // Build contextual prompt with live data
    const contextPrompt = buildContextualPrompt(persona, navigationHistory, {
      skills,
      projects,
      githubUsername,
    });

    // Get persona-specific system prompt
    const personaPrompt = getChatSystemPrompt(persona, navigationHistory);

    // Combine system prompts
    const fullSystemPrompt = `${personaPrompt}\n\n${contextPrompt}`;

    // Prepare messages with system prompt
    let fullMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: fullSystemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Trim to fit context window
    fullMessages = trimMessagesToFitContext(fullMessages);

    // Tool calling loop
    const maxToolIterations = 3;
    let toolIteration = 0;
    
    while (toolIteration < maxToolIterations) {
      toolIteration++;
      
      // Make completion request with tools
      const response = await groq.chat.completions.create({
        model: GROQ_MODELS.FAST,
        messages: fullMessages,
        tools: [FETCH_PROJECT_CODE_TOOL],
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1024,
      });

      const assistantMessage = response.choices[0]?.message;
      
      if (!assistantMessage) {
        return new Response('No response from AI', { status: 500 });
      }

      // Check if there are tool calls
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Add assistant message with tool calls to conversation
        fullMessages.push(assistantMessage);

        // Process each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          if (toolCall.type === 'function' && 'function' in toolCall && toolCall.function) {
            const fnName = (toolCall.function.name || '').replace(/^f\s+/, '');
            if (fnName === 'fetch_project_code') {
              const args = JSON.parse(toolCall.function.arguments);
              const repoName = args.repo_name;
              
              console.log(`Tool call: fetch_project_code for "${repoName}"`);
              
              // Fetch and summarize the code
              const codeSummary = await fetchProjectCode(repoName, githubUsername);
              
              // Add tool result to messages
              fullMessages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: codeSummary,
              });
            }
          }
        }
        
        // Trim messages again after adding tool results
        fullMessages = trimMessagesToFitContext(fullMessages);
        
        // Continue loop to get final response
        continue;
      }

      // No tool calls - return the streaming response
      // Re-run with streaming enabled for the final response
      const streamResponse = await groq.chat.completions.create({
        model: GROQ_MODELS.FAST,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      });

      // Create streaming response
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamResponse) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            }
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Max tool iterations reached - return final response
    const finalResponse = await groq.chat.completions.create({
      model: GROQ_MODELS.FAST,
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of finalResponse) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response('Chat failed. Please try again.', { status: 500 });
  }
}
