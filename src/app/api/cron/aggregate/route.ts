import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { behaviorLogs, aggregatedBehaviors } from "@/lib/db/schema";
import { sql, lt, eq } from "drizzle-orm";

// Vercel Cron: runs daily at 3am UTC
// cron: 0 3 * * *

export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Step 1: Get all sessions with logs older than 24h but not yet aggregated
    const sessionsToAggregate = await db
      .select({ sessionId: behaviorLogs.sessionId })
      .from(behaviorLogs)
      .where(lt(behaviorLogs.timestamp, oneDayAgo))
      .groupBy(behaviorLogs.sessionId);

    let aggregatedCount = 0;

    // Step 2: For each session, aggregate their logs
    for (const { sessionId } of sessionsToAggregate) {
      // Get all logs for this session
      const logs = await db
        .select()
        .from(behaviorLogs)
        .where(eq(behaviorLogs.sessionId, sessionId));

      if (logs.length === 0) continue;

      // Aggregate behavior data
      const aggregated = {
        totalEvents: logs.length,
        scrollDepthMax: 0,
        clickedResume: false,
        openedCodeSamplesCount: 0,
        visitedProjectsCount: 0,
        openedDesignShowcase: false,
        playedDemosCount: 0,
        openedAiIntakeForm: false,
        timeOnHomepage: 0,
        navigationPath: [] as string[],
        hoveredKeywords: [] as string[],
      };

      for (const log of logs) {
        const data = log.data as Record<string, unknown>;

        // Scroll tracking
        if (log.eventType === "scroll" && typeof data.depth === "number") {
          aggregated.scrollDepthMax = Math.max(aggregated.scrollDepthMax, data.depth);
        }
        
        // Click tracking
        if (log.eventType === "click") {
          const target = data.target as string | undefined;
          if (target?.includes("resume")) aggregated.clickedResume = true;
          if (target?.includes("code") || target?.includes("github")) aggregated.openedCodeSamplesCount++;
          if (target?.includes("project")) aggregated.visitedProjectsCount++;
          if (target?.includes("design")) aggregated.openedDesignShowcase = true;
          if (target?.includes("demo") || target?.includes("game")) aggregated.playedDemosCount++;
          if (target?.includes("intake") || target?.includes("contact")) aggregated.openedAiIntakeForm = true;
        }
        
        // Time tracking
        if (log.eventType === "time_on_page" && typeof data.duration === "number") {
          aggregated.timeOnHomepage += data.duration;
        }
        
        // Navigation tracking
        if (log.eventType === "navigation" && typeof data.page === "string") {
          aggregated.navigationPath.push(data.page);
        }
        
        // Hover tracking
        if (log.eventType === "hover" && typeof data.keyword === "string") {
          aggregated.hoveredKeywords.push(data.keyword);
        }
      }

      // Generate behavior vector (12 dimensions)
      const vector = [
        aggregated.clickedResume ? 1 : 0,
        Math.min(1, aggregated.openedCodeSamplesCount / 10),
        aggregated.openedDesignShowcase ? 1 : 0,
        0, // leadership focus placeholder
        Math.min(1, aggregated.playedDemosCount / 5),
        Math.min(1, new Set(aggregated.navigationPath).size / 10),
        Math.min(1, aggregated.scrollDepthMax),
        Math.min(1, aggregated.totalEvents / 50),
        Math.min(1, aggregated.openedCodeSamplesCount / 5),
        aggregated.openedDesignShowcase || aggregated.playedDemosCount > 0 ? 0.5 : 0,
        Math.min(1, aggregated.navigationPath.length > 0 ? 1 / (aggregated.timeOnHomepage / Math.max(aggregated.navigationPath.length, 1) / 30) : 0.5),
        aggregated.openedAiIntakeForm ? 1 : 0.3,
      ];

      // Upsert aggregated behavior
      await db
        .insert(aggregatedBehaviors)
        .values({
          sessionId,
          behaviorVector: vector,
          scrollDepth: aggregated.scrollDepthMax,
          clickedResume: aggregated.clickedResume,
          openedCodeSamplesCount: aggregated.openedCodeSamplesCount,
          visitedProjectsCount: aggregated.visitedProjectsCount,
          openedDesignShowcase: aggregated.openedDesignShowcase,
          playedDemosCount: aggregated.playedDemosCount,
          openedAiIntakeForm: aggregated.openedAiIntakeForm,
          timeOnHomepage: aggregated.timeOnHomepage,
          navigationPath: aggregated.navigationPath,
          hoveredKeywords: aggregated.hoveredKeywords,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: aggregatedBehaviors.sessionId,
          set: {
            behaviorVector: vector,
            scrollDepth: aggregated.scrollDepthMax,
            clickedResume: aggregated.clickedResume,
            openedCodeSamplesCount: sql`${aggregatedBehaviors.openedCodeSamplesCount} + ${aggregated.openedCodeSamplesCount}`,
            visitedProjectsCount: sql`${aggregatedBehaviors.visitedProjectsCount} + ${aggregated.visitedProjectsCount}`,
            openedDesignShowcase: aggregated.openedDesignShowcase,
            playedDemosCount: sql`${aggregatedBehaviors.playedDemosCount} + ${aggregated.playedDemosCount}`,
            openedAiIntakeForm: aggregated.openedAiIntakeForm,
            timeOnHomepage: sql`${aggregatedBehaviors.timeOnHomepage} + ${aggregated.timeOnHomepage}`,
            updatedAt: now,
          },
        });

      aggregatedCount++;
    }

    // Step 3: Delete logs older than 7 days
    await db
      .delete(behaviorLogs)
      .where(lt(behaviorLogs.timestamp, sevenDaysAgo));

    // Step 4: Clean up old aggregated behaviors (keep for 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    await db
      .delete(aggregatedBehaviors)
      .where(lt(aggregatedBehaviors.updatedAt, thirtyDaysAgo));

    return NextResponse.json({
      success: true,
      aggregatedSessions: aggregatedCount,
      message: `Aggregated ${aggregatedCount} sessions, cleaned up old logs`,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron aggregation error:", error);
    return NextResponse.json(
      { error: "Aggregation failed", details: String(error) },
      { status: 500 }
    );
  }
}
