import { NextRequest, NextResponse } from 'next/server';
import { db, behaviorLogs, sessions, aggregatedBehaviors } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { BehaviorEvent } from '@/types/behavior';
import { hashString } from '@/lib/utils';

// Edge runtime for low latency
export const runtime = 'edge';

interface TrackRequest {
  events: BehaviorEvent[];
  deviceType?: 'desktop' | 'mobile' | 'tablet';
}

export async function POST(request: NextRequest) {
  try {
    const body: TrackRequest = await request.json();
    const { events, deviceType } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ success: false, error: 'No events provided' }, { status: 400 });
    }

    // Get session ID from first event
    const sessionId = events[0].sessionId;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'No session ID' }, { status: 400 });
    }

    // Create fingerprint hash from session ID
    const fingerprintHash = hashString(sessionId);

    // Upsert session (if database is configured)
    if (process.env.DATABASE_URL) {
      try {
        // Check if session exists
        const existingSession = await db
          .select()
          .from(sessions)
          .where(eq(sessions.fingerprintHash, fingerprintHash))
          .limit(1);

        let dbSessionId: string;

        if (existingSession.length === 0) {
          // Create new session
          const [newSession] = await db
            .insert(sessions)
            .values({
              fingerprintHash,
              deviceType: deviceType || 'desktop',
              consentGiven: true, // If we're receiving events, consent was given
            })
            .returning({ id: sessions.id });
          dbSessionId = newSession.id;

          // Initialize aggregated behaviors
          await db.insert(aggregatedBehaviors).values({
            sessionId: dbSessionId,
          });
        } else {
          dbSessionId = existingSession[0].id;
          // Update last seen
          await db
            .update(sessions)
            .set({ lastSeen: new Date() })
            .where(eq(sessions.id, dbSessionId));
        }

        // Insert behavior logs
        const logsToInsert = events.map(event => ({
          sessionId: dbSessionId,
          eventType: event.type,
          data: event.data,
          timestamp: new Date(event.timestamp),
        }));

        await db.insert(behaviorLogs).values(logsToInsert);

        // Update aggregated behaviors based on events
        await updateAggregatedBehaviors(dbSessionId, events);
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue without DB - tracking should be non-blocking
      }
    }

    return NextResponse.json({ success: true, eventsProcessed: events.length });
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

// Update aggregated behavior metrics
async function updateAggregatedBehaviors(sessionId: string, events: BehaviorEvent[]) {
  const updates: Partial<typeof aggregatedBehaviors.$inferInsert> = {};

  for (const event of events) {
    switch (event.type) {
      case 'time':
        if (event.data.timeOnPage && event.data.path === '/') {
          updates.timeOnHomepage = (updates.timeOnHomepage || 0) + event.data.timeOnPage / 1000;
        }
        break;

      case 'scroll':
        if (event.data.maxDepth) {
          updates.scrollDepth = Math.max(updates.scrollDepth || 0, event.data.maxDepth / 100);
        }
        break;

      case 'click':
        if (event.data.element?.includes('resume')) {
          updates.clickedResume = true;
        }
        if (event.data.element?.includes('code') || event.data.section === 'code') {
          updates.openedCodeSamplesCount = (updates.openedCodeSamplesCount || 0) + 1;
        }
        if (event.data.element?.includes('project') || event.data.section === 'projects') {
          updates.visitedProjectsCount = (updates.visitedProjectsCount || 0) + 1;
        }
        if (event.data.element?.includes('design') || event.data.section === 'design') {
          updates.openedDesignShowcase = true;
        }
        if (event.data.element?.includes('demo') || event.data.element?.includes('game')) {
          updates.playedDemosCount = (updates.playedDemosCount || 0) + 1;
        }
        if (event.data.element?.includes('intake') || event.data.path === '/intake') {
          updates.openedAiIntakeForm = true;
        }
        break;

      case 'interaction':
        if (event.data.interactionType === 'animation') {
          updates.interactedWithAnimations = true;
        }
        break;

      case 'idle':
        if (event.data.idleDuration) {
          updates.idleTime = (updates.idleTime || 0) + event.data.idleDuration / 1000;
        }
        break;

      case 'navigation':
        if (event.data.sequence) {
          updates.navigationPath = event.data.sequence;
        }
        break;
    }
  }

  if (Object.keys(updates).length > 0) {
    updates.updatedAt = new Date();
    await db
      .update(aggregatedBehaviors)
      .set(updates)
      .where(eq(aggregatedBehaviors.sessionId, sessionId));
  }
}
