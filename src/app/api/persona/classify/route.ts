import { NextRequest, NextResponse } from 'next/server';
import { db, sessions, aggregatedBehaviors } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { hashString } from '@/lib/utils';
import { classifyByVector } from '@/lib/clustering/centroids';
import { behaviorToVector } from '@/lib/clustering/vectors';
import { generateCompletion } from '@/lib/ai';
import { getClassificationPrompt } from '@/lib/ai/prompts';
import { PersonaClassification, DEFAULT_PERSONA } from '@/types/persona';

interface ClassifyRequest {
  sessionId: string;
  useAI?: boolean; // Whether to use LLM for edge cases
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body as text then JSON.parse to avoid request.json() throwing unexpectedly.
    const raw = await request.text();
    if (!raw) {
      console.error('Classification error: empty request body');
      return NextResponse.json(
        { success: false, error: 'Empty request body' },
        { status: 400 }
      );
    }

    let body: ClassifyRequest;
    try {
      body = JSON.parse(raw);
    } catch (err) {
      console.error('Classification error: invalid JSON body', err);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { sessionId, useAI = true } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'No session ID provided' },
        { status: 400 }
      );
    }

    // If no database, return default persona
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        classification: {
          persona: DEFAULT_PERSONA,
          confidence: 0.5,
          mood: 'exploratory',
        } as PersonaClassification,
        source: 'default',
      });
    }

    const fingerprintHash = hashString(sessionId);

    // Get session
    const existingSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.fingerprintHash, fingerprintHash))
      .limit(1);

    if (existingSessions.length === 0) {
      return NextResponse.json({
        success: true,
        classification: {
          persona: DEFAULT_PERSONA,
          confidence: 0.3,
          mood: 'exploratory',
        } as PersonaClassification,
        source: 'new-visitor',
      });
    }

    const session = existingSessions[0];

    // If we already have a high-confidence classification, return it
    if (session.persona && session.confidence && session.confidence > 0.7) {
      return NextResponse.json({
        success: true,
        classification: {
          persona: session.persona,
          confidence: session.confidence,
          mood: session.mood || 'focused',
        } as PersonaClassification,
        source: 'cached',
      });
    }

    // Get aggregated behaviors
    const behaviors = await db
      .select()
      .from(aggregatedBehaviors)
      .where(eq(aggregatedBehaviors.sessionId, session.id))
      .limit(1);

    if (behaviors.length === 0) {
      return NextResponse.json({
        success: true,
        classification: {
          persona: DEFAULT_PERSONA,
          confidence: 0.3,
          mood: 'exploratory',
        } as PersonaClassification,
        source: 'insufficient-data',
      });
    }

    const behavior = behaviors[0];

    // Convert to behavior vector
    const vector = behaviorToVector(behavior);
    const vectorResult = classifyByVector(vector);

    // Use AI for edge cases (low confidence or close scores)
    let finalClassification: PersonaClassification;
    let source = 'vector';

    if (useAI && vectorResult.confidence < 0.6) {
      try {
        const aiClassification = await classifyWithAI(behavior);
        if (aiClassification) {
          // Combine vector and AI results
          finalClassification = {
            persona: aiClassification.persona,
            confidence: (vectorResult.confidence + aiClassification.confidence) / 2,
            mood: aiClassification.mood,
          };
          source = 'hybrid';
        } else {
          finalClassification = {
            persona: vectorResult.persona,
            confidence: vectorResult.confidence,
            mood: inferMood(behavior),
          };
        }
      } catch {
        // Fallback to vector classification
        finalClassification = {
          persona: vectorResult.persona,
          confidence: vectorResult.confidence,
          mood: inferMood(behavior),
        };
      }
    } else {
      finalClassification = {
        persona: vectorResult.persona,
        confidence: vectorResult.confidence,
        mood: inferMood(behavior),
      };
    }

    // Update session with classification
    await db
      .update(sessions)
      .set({
        persona: finalClassification.persona,
        confidence: finalClassification.confidence,
        mood: finalClassification.mood,
      })
      .where(eq(sessions.id, session.id));

    // Update aggregated behaviors with vector
    await db
      .update(aggregatedBehaviors)
      .set({ behaviorVector: vector })
      .where(eq(aggregatedBehaviors.sessionId, session.id));

    return NextResponse.json({
      success: true,
      classification: finalClassification,
      source,
      vector,
      allScores: vectorResult.allScores,
    });
  } catch (error) {
    console.error('Classification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal error',
        classification: {
          persona: DEFAULT_PERSONA,
          confidence: 0.3,
          mood: 'exploratory',
        } as PersonaClassification,
      },
      { status: 500 }
    );
  }
}

// Use AI for classification in edge cases
async function classifyWithAI(
  behavior: typeof aggregatedBehaviors.$inferSelect
): Promise<PersonaClassification | null> {
  const navPath = (behavior.navigationPath as string[]) || [];
  const hoveredKw = (behavior.hoveredKeywords as string[]) || [];

  const prompt = getClassificationPrompt({
    pages: navPath,
    timeData: { homepage: behavior.timeOnHomepage || 0 },
    scrollData: { homepage: (behavior.scrollDepth || 0) * 100 },
    clickData: [
      behavior.clickedResume && 'resume',
      behavior.openedDesignShowcase && 'design',
      behavior.openedAiIntakeForm && 'intake',
      ...hoveredKw,
    ].filter(Boolean) as string[],
    sequence: navPath,
  });

  const { content } = await generateCompletion(
    [{ role: 'user', content: prompt }],
    'classification',
    { temperature: 0.3, maxTokens: 256 }
  );

  try {
    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        persona: parsed.persona,
        confidence: parsed.confidence,
        mood: parsed.mood,
      };
    }
  } catch {
    console.error('Failed to parse AI classification:', content);
  }

  return null;
}

// Infer mood from behavior
function inferMood(
  behavior: typeof aggregatedBehaviors.$inferSelect
): PersonaClassification['mood'] {
  const navSpeed = behavior.navigationSpeed || 0.5;
  const idleTime = behavior.idleTime || 0;
  const scrollDepth = behavior.scrollDepth || 0;

  if (navSpeed > 0.7 && scrollDepth < 0.3) {
    return 'professional'; // Quick scanning
  }
  if (idleTime > 60) {
    return 'casual'; // Taking their time
  }
  if (scrollDepth > 0.8 && navSpeed < 0.4) {
    return 'focused'; // Deep reading
  }
  if (behavior.playedDemosCount && behavior.playedDemosCount > 0) {
    return 'playful';
  }
  return 'exploratory';
}
