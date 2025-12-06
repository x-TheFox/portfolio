import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/admin';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { db, isDatabaseReady } from '@/lib/db';
import { syncLog } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { syncLocalCaseStudiesToNotion, syncLocalArchitectureToNotion } from '@/lib/cms';

export async function POST() {
  try {
    // Validate session
    const cookieStore = await cookies();
    const session = await validateSession(cookieStore);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Sync local records to Notion first
    const caseStudySync = await syncLocalCaseStudiesToNotion();
    const architectureSync = await syncLocalArchitectureToNotion();
    
    // Revalidate all pages that use Notion data
    const pathsToRevalidate = [
      '/',
      '/projects',
      '/now',
      '/case-studies',
      '/architecture',
    ];
    
    for (const path of pathsToRevalidate) {
      revalidatePath(path);
    }
    
    // Log sync event
    if (isDatabaseReady()) {
      try {
        await db.insert(syncLog).values({
          source: 'manual',
          status: 'success',
          itemsUpdated: pathsToRevalidate.length + caseStudySync.synced + architectureSync.synced,
          details: { 
            paths: pathsToRevalidate,
            triggeredBy: 'admin',
            timestamp: new Date().toISOString(),
            notionSync: {
              caseStudies: caseStudySync,
              architecture: architectureSync,
            },
          },
        });
      } catch (logError) {
        console.error('Failed to log sync:', logError);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Synced successfully',
      paths: pathsToRevalidate,
      notionSync: {
        caseStudies: caseStudySync,
        architecture: architectureSync,
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    
    // Log error
    if (isDatabaseReady()) {
      try {
        await db.insert(syncLog).values({
          source: 'manual',
          status: 'error',
          itemsUpdated: 0,
          details: { 
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          },
        });
      } catch (logError) {
        console.error('Failed to log sync error:', logError);
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to sync' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve sync log
export async function GET() {
  try {
    if (!isDatabaseReady()) {
      return NextResponse.json({ 
        success: true, 
        logs: [],
        message: 'Database not configured'
      });
    }
    
    const logs = await db
      .select()
      .from(syncLog)
      .orderBy(desc(syncLog.timestamp))
      .limit(20);
    
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sync logs' },
      { status: 500 }
    );
  }
}
