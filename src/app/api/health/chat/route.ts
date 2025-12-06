import { NextRequest, NextResponse } from 'next/server';
import { groq, isGroqConfigured, GROQ_MODELS } from '@/lib/ai/groq';
import { openrouter, isOpenRouterConfigured, OPENROUTER_MODELS } from '@/lib/ai/openrouter';
import { getSkills, getProfile } from '@/lib/cms';
import { getProjects } from '@/lib/notion/projects';
import { buildContextualPrompt } from '@/lib/ai/prompts';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  latency?: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface ChatHealthResponse {
  overall: 'pass' | 'fail' | 'partial';
  timestamp: string;
  tests: TestResult[];
  summary: {
    passed: number;
    failed: number;
    skipped: number;
  };
}

// Test message for AI systems
const TEST_MESSAGES = [
  { role: 'system' as const, content: 'You are a helpful assistant. Respond with exactly "HEALTH_CHECK_OK" and nothing else.' },
  { role: 'user' as const, content: 'Health check ping' },
];

// Test Groq completion
async function testGroqCompletion(): Promise<TestResult> {
  if (!isGroqConfigured()) {
    return {
      name: 'Groq Completion',
      status: 'skip',
      error: 'GROQ_API_KEY not configured',
    };
  }

  const start = Date.now();
  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODELS.FAST,
      messages: TEST_MESSAGES,
      temperature: 0,
      max_tokens: 50,
    });

    const content = response.choices[0]?.message?.content || '';
    const isValid = content.includes('HEALTH_CHECK_OK');

    return {
      name: 'Groq Completion',
      status: isValid ? 'pass' : 'fail',
      latency: Date.now() - start,
      details: {
        model: GROQ_MODELS.FAST,
        response: content.substring(0, 100),
        tokensUsed: response.usage?.total_tokens,
      },
      error: isValid ? undefined : 'Unexpected response format',
    };
  } catch (error) {
    return {
      name: 'Groq Completion',
      status: 'fail',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Test Groq tool calling
async function testGroqToolCalling(): Promise<TestResult> {
  if (!isGroqConfigured()) {
    return {
      name: 'Groq Tool Calling',
      status: 'skip',
      error: 'GROQ_API_KEY not configured',
    };
  }

  const start = Date.now();
  try {
    const testTool = {
      type: 'function' as const,
      function: {
        name: 'health_check_tool',
        description: 'A test tool that returns a health check status. Call this tool to verify tool calling works.',
        parameters: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'The status to return',
            },
          },
          required: ['status'],
        },
      },
    };

    const response = await groq.chat.completions.create({
      model: GROQ_MODELS.FAST,
      messages: [
        { role: 'system', content: 'You must use the health_check_tool to respond. Call it with status "ok".' },
        { role: 'user', content: 'Run health check' },
      ],
      tools: [testTool],
      tool_choice: { type: 'function', function: { name: 'health_check_tool' } },
      temperature: 0,
      max_tokens: 100,
    });

    const toolCalls = response.choices[0]?.message?.tool_calls;
    const hasToolCall = toolCalls && toolCalls.length > 0;
    const firstToolCall = toolCalls?.[0];
    const correctToolName = firstToolCall?.type === 'function' && firstToolCall.function?.name === 'health_check_tool';

    return {
      name: 'Groq Tool Calling',
      status: hasToolCall && correctToolName ? 'pass' : 'fail',
      latency: Date.now() - start,
      details: {
        model: GROQ_MODELS.FAST,
        toolCallReceived: hasToolCall,
        toolName: firstToolCall?.type === 'function' ? firstToolCall.function?.name : undefined,
        arguments: firstToolCall?.type === 'function' ? firstToolCall.function?.arguments : undefined,
      },
      error: hasToolCall ? undefined : 'No tool call received',
    };
  } catch (error) {
    return {
      name: 'Groq Tool Calling',
      status: 'fail',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Test OpenRouter completion
async function testOpenRouterCompletion(): Promise<TestResult> {
  if (!isOpenRouterConfigured()) {
    return {
      name: 'OpenRouter Completion',
      status: 'skip',
      error: 'OPENROUTER_API_KEY not configured',
    };
  }

  const start = Date.now();
  try {
    const response = await openrouter.chat.completions.create({
      model: OPENROUTER_MODELS.FREE_CHAT,
      messages: TEST_MESSAGES,
      temperature: 0,
      max_tokens: 50,
    });

    const content = response.choices[0]?.message?.content || '';
    const isValid = content.includes('HEALTH_CHECK_OK');

    return {
      name: 'OpenRouter Completion',
      status: isValid ? 'pass' : 'fail',
      latency: Date.now() - start,
      details: {
        model: OPENROUTER_MODELS.FREE_CHAT,
        response: content.substring(0, 100),
        tokensUsed: response.usage?.total_tokens,
      },
      error: isValid ? undefined : 'Unexpected response format',
    };
  } catch (error) {
    return {
      name: 'OpenRouter Completion',
      status: 'fail',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Test data fetching for context injection
async function testDataFetching(): Promise<TestResult> {
  const start = Date.now();
  try {
    const [skills, projects, profile] = await Promise.all([
      getSkills(),
      getProjects(),
      getProfile(),
    ]);

    const hasSkills = skills.length > 0;
    const hasProjects = projects.length > 0;
    const hasProfile = !!profile.name;

    return {
      name: 'Context Data Fetching',
      status: hasSkills || hasProjects || hasProfile ? 'pass' : 'fail',
      latency: Date.now() - start,
      details: {
        skillsCount: skills.length,
        projectsCount: projects.length,
        profileName: profile.name,
        githubUrl: (profile.socialLinks as { github?: string })?.github,
        projectsWithGithub: projects.filter(p => p.githubUrl).length,
      },
      error: !hasSkills && !hasProjects && !hasProfile ? 'No data available' : undefined,
    };
  } catch (error) {
    return {
      name: 'Context Data Fetching',
      status: 'fail',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Test context prompt building
async function testContextPromptBuilding(): Promise<TestResult> {
  const start = Date.now();
  try {
    const [skills, projects, profile] = await Promise.all([
      getSkills(),
      getProjects(),
      getProfile(),
    ]);

    const githubUrl = (profile.socialLinks as { github?: string })?.github;
    const githubUsername = githubUrl?.match(/github\.com\/([^\/\?#]+)/)?.[1] || 'test-user';

    const contextPrompt = buildContextualPrompt('curious', [], {
      skills,
      projects,
      githubUsername,
    });

    const hasSkillsSection = contextPrompt.includes('Skills & Proficiency');
    const hasProjectsSection = contextPrompt.includes('Projects Portfolio');
    const hasToolInstructions = contextPrompt.includes('fetch_project_code');
    const hasRules = contextPrompt.includes('CRITICAL RULES');

    const promptLength = contextPrompt.length;
    const estimatedTokens = Math.ceil(promptLength / 4);

    return {
      name: 'Context Prompt Building',
      status: hasSkillsSection && hasProjectsSection && hasToolInstructions && hasRules ? 'pass' : 'fail',
      latency: Date.now() - start,
      details: {
        promptLength,
        estimatedTokens,
        hasSkillsSection,
        hasProjectsSection,
        hasToolInstructions,
        hasRules,
      },
      error: undefined,
    };
  } catch (error) {
    return {
      name: 'Context Prompt Building',
      status: 'fail',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Test gitingest API connectivity
async function testGitingestAPI(): Promise<TestResult> {
  const start = Date.now();
  try {
    // Test with a known public repo
    const response = await fetch('https://gitingest.com/api/octocat/Hello-World', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return {
        name: 'Gitingest API',
        status: 'fail',
        latency: Date.now() - start,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const hasSummary = !!data.summary;
    const hasTree = !!data.tree;
    const hasContent = !!data.content;

    return {
      name: 'Gitingest API',
      status: hasSummary || hasTree || hasContent ? 'pass' : 'fail',
      latency: Date.now() - start,
      details: {
        hasSummary,
        hasTree,
        hasContent,
        summaryPreview: data.summary?.substring(0, 100),
      },
    };
  } catch (error) {
    return {
      name: 'Gitingest API',
      status: 'fail',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Test end-to-end chat flow (without tool calling)
async function testEndToEndChat(): Promise<TestResult> {
  if (!isGroqConfigured()) {
    return {
      name: 'End-to-End Chat',
      status: 'skip',
      error: 'GROQ_API_KEY not configured',
    };
  }

  const start = Date.now();
  try {
    const [skills, projects, profile] = await Promise.all([
      getSkills(),
      getProjects(),
      getProfile(),
    ]);

    const githubUrl = (profile.socialLinks as { github?: string })?.github;
    const githubUsername = githubUrl?.match(/github\.com\/([^\/\?#]+)/)?.[1] || 'x-TheFox';

    const contextPrompt = buildContextualPrompt('curious', [], {
      skills,
      projects,
      githubUsername,
    });

    const response = await groq.chat.completions.create({
      model: GROQ_MODELS.FAST,
      messages: [
        { role: 'system', content: `You are a portfolio assistant. ${contextPrompt}\n\nRespond with a brief greeting that mentions at least one skill from the list.` },
        { role: 'user', content: 'Hello!' },
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    const content = response.choices[0]?.message?.content || '';
    const hasResponse = content.length > 10;

    return {
      name: 'End-to-End Chat',
      status: hasResponse ? 'pass' : 'fail',
      latency: Date.now() - start,
      details: {
        responseLength: content.length,
        responsePreview: content.substring(0, 200),
        tokensUsed: response.usage?.total_tokens,
      },
    };
  } catch (error) {
    return {
      name: 'End-to-End Chat',
      status: 'fail',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const quick = searchParams.get('quick') === 'true';

  try {
    let tests: TestResult[];

    if (quick) {
      // Quick mode: just check configuration and basic connectivity
      tests = await Promise.all([
        testGroqCompletion(),
        testDataFetching(),
      ]);
    } else {
      // Full mode: comprehensive testing
      tests = await Promise.all([
        testGroqCompletion(),
        testGroqToolCalling(),
        testOpenRouterCompletion(),
        testDataFetching(),
        testContextPromptBuilding(),
        testGitingestAPI(),
        testEndToEndChat(),
      ]);
    }

    const passed = tests.filter(t => t.status === 'pass').length;
    const failed = tests.filter(t => t.status === 'fail').length;
    const skipped = tests.filter(t => t.status === 'skip').length;

    const overall = failed === 0 ? 'pass' : 
                    passed > 0 ? 'partial' : 'fail';

    const response: ChatHealthResponse = {
      overall,
      timestamp: new Date().toISOString(),
      tests,
      summary: { passed, failed, skipped },
    };

    return NextResponse.json(response, { 
      status: overall === 'fail' ? 503 : 200 
    });
  } catch (error) {
    console.error('Chat health check error:', error);
    return NextResponse.json(
      {
        overall: 'fail',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        tests: [],
        summary: { passed: 0, failed: 1, skipped: 0 },
      },
      { status: 503 }
    );
  }
}

// POST endpoint for custom test messages
export async function POST(request: NextRequest) {
  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: 'Groq not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { message, persona = 'curious' } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message required' },
        { status: 400 }
      );
    }

    const start = Date.now();

    // Fetch context data
    const [skills, projects, profile] = await Promise.all([
      getSkills(),
      getProjects(),
      getProfile(),
    ]);

    const githubUrl = (profile.socialLinks as { github?: string })?.github;
    const githubUsername = githubUrl?.match(/github\.com\/([^\/\?#]+)/)?.[1] || 'x-TheFox';

    const contextPrompt = buildContextualPrompt(persona, [], {
      skills,
      projects,
      githubUsername,
    });

    // Make test completion
    const response = await groq.chat.completions.create({
      model: GROQ_MODELS.FAST,
      messages: [
        { role: 'system', content: `You are a helpful portfolio assistant.\n\n${contextPrompt}` },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '';

    return NextResponse.json({
      status: 'success',
      latency: Date.now() - start,
      response: content,
      context: {
        skillsCount: skills.length,
        projectsCount: projects.length,
        persona,
      },
      usage: response.usage,
    });
  } catch (error) {
    console.error('Chat test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
