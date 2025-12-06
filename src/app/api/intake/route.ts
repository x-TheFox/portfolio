import { NextRequest, NextResponse } from 'next/server';
import { generateCompletion } from '@/lib/ai';
import { getIntakePrompt } from '@/lib/ai/prompts';
import { createDatabasePage, isNotionConfigured } from '@/lib/notion/client';

interface IntakeRequest {
  role: string;
  techStack: string;
  context: string;
  timeline: string;
  team: string;
  notes: string;
  email: string;
  phone: string;
  sessionId?: string;
  // Multi-turn conversation support
  iteration?: number;
  previousQuestions?: string[];
  previousAnswers?: string[];
}

interface AIResponse {
  type: 'questions' | 'response';
  questions?: string[];
  message?: string;
}

function parseAIResponse(content: string): AIResponse {
  try {
    // Clean up the content - remove markdown code blocks if present
    let cleanContent = content.trim();
    
    // Remove ```json and ``` markers if present
    cleanContent = cleanContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    
    // Try to extract JSON from the response
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonStr = jsonMatch[0];
      
      // Fix invalid JSON: replace actual newlines inside strings with \n
      // This handles the case where AI outputs real newlines instead of \n escape sequences
      // Process each string value to escape newlines properly
      jsonStr = jsonStr.replace(/"((?:[^"\\]|\\.)*)"/g, (match) => {
        // Replace actual newlines with escaped newlines inside string values
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
      });
      
      const parsed = JSON.parse(jsonStr);
      if (parsed.type === 'questions' && Array.isArray(parsed.questions)) {
        return { type: 'questions', questions: parsed.questions };
      }
      if (parsed.type === 'response' && typeof parsed.message === 'string') {
        return { type: 'response', message: parsed.message };
      }
    }
  } catch (e) {
    console.error('Failed to parse AI response as JSON:', e);
    console.error('Raw content:', content.substring(0, 200));
  }
  
  // Fallback: try to extract just the message content if JSON parsing failed
  const messageMatch = content.match(/"message"\s*:\s*"([\s\S]*?)"\s*\}/);
  if (messageMatch) {
    return { type: 'response', message: messageMatch[1].replace(/\\n/g, '\n') };
  }
  
  // Last resort fallback: strip the JSON wrapper if visible
  const stripped = content.replace(/^\s*\{\s*"type"\s*:\s*"response"\s*,\s*"message"\s*:\s*"/i, '')
                          .replace(/"\s*\}\s*$/i, '');
  if (stripped !== content) {
    return { type: 'response', message: stripped };
  }
  
  return { type: 'response', message: content };
}

export async function POST(request: NextRequest) {
  try {
    const body: IntakeRequest = await request.json();
    const { 
      role, techStack, context, timeline, team, notes,
      email, phone,
      iteration = 1,
      previousQuestions,
      previousAnswers
    } = body;

    // Validate required fields
    if (!role && !context) {
      return NextResponse.json(
        { success: false, error: 'Please provide at least a role or project context' },
        { status: 400 }
      );
    }

    // Generate prompt with iteration context
    const prompt = getIntakePrompt(
      { role, techStack, context, timeline, team, notes },
      undefined,
      iteration,
      previousQuestions,
      previousAnswers
    );

    // Get AI response using OpenRouter (better for reasoning tasks)
    const { content, provider } = await generateCompletion(
      [{ role: 'user', content: prompt }],
      'intake',
      { temperature: 0.7, maxTokens: 1024 }
    );

    // Parse the AI response
    const aiResponse = parseAIResponse(content);

    // If this is a final response (not questions), save to Notion
    if (aiResponse.type === 'response' && isNotionConfigured() && process.env.NOTION_INTAKE_DATABASE_ID) {
      try {
        // Format Q&A for storage
        const qAndA = previousQuestions && previousAnswers && previousQuestions.length > 0
          ? previousQuestions.map((q, i) => `Q: ${q}\nA: ${previousAnswers[i] || 'N/A'}`).join('\n\n')
          : '';
          
        await createDatabasePage(process.env.NOTION_INTAKE_DATABASE_ID, {
          Title: { title: [{ text: { content: role || 'Intake Submission' } }] },
          Role: { rich_text: [{ text: { content: role || '' } }] },
          'Tech Stack': { rich_text: [{ text: { content: techStack || '' } }] },
          Context: { rich_text: [{ text: { content: (context || '').substring(0, 2000) } }] },
          Timeline: { select: { name: formatTimeline(timeline) } },
          Team: { rich_text: [{ text: { content: team || '' } }] },
          Notes: { rich_text: [{ text: { content: notes || '' } }] },
          'Contact Email': { email: email || null },
          'Phone': { rich_text: [{ text: { content: phone || '' } }] },
          'AI Response': { rich_text: [{ text: { content: (aiResponse.message || '').substring(0, 2000) } }] },
          'Additional Questions Asked and their answers': { rich_text: [{ text: { content: qAndA.substring(0, 2000) } }] },
        });
      } catch (notionError) {
        // Don't fail the request if Notion save fails
        console.error('Failed to save to Notion:', notionError);
      }
    }

    return NextResponse.json({
      success: true,
      type: aiResponse.type,
      questions: aiResponse.questions,
      response: aiResponse.message,
      provider,
    });
  } catch (error) {
    console.error('Intake error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process your request. Please try again.',
        type: 'response',
        response: getDefaultResponse(),
      },
      { status: 500 }
    );
  }
}

function formatTimeline(timeline: string): string {
  const mapping: Record<string, string> = {
    'urgent': 'Urgent',
    '1-2-weeks': '1-2 Weeks',
    '1-month': 'Within a Month',
    'flexible': 'Flexible',
    'exploring': 'Exploring',
  };
  return mapping[timeline] || timeline || 'Not Specified';
}

function getDefaultResponse(): string {
  return `Thank you for your interest! I appreciate you taking the time to share details about your opportunity.

Based on what you've shared, I'd love to learn more about your project. Here are a few follow-up questions:

1. What specific challenges are you hoping to solve with this role?
2. What does success look like for this position in the first 3-6 months?
3. What's the team's current tech stack and development workflow?

Feel free to reach out directly via email to continue the conversation. I typically respond within 24 hours and am happy to schedule a call to discuss further.`;
}
