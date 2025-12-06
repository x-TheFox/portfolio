import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db, isDatabaseReady } from '@/lib/db';
import { syncLog } from '@/lib/db/schema';
import { createHmac } from 'crypto';

// Verify Notion webhook signature
function verifyNotionSignature(
  body: string, 
  signature: string | null, 
  timestamp: string | null
): boolean {
  const secret = process.env.NOTION_WEBHOOK_SECRET;
  
  // If no secret configured, fall back to bearer token auth
  if (!secret) {
    return false;
  }
  
  if (!signature || !timestamp) {
    return false;
  }
  
  // Notion uses HMAC-SHA256
  const expectedSignature = createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  
  return signature === `v0=${expectedSignature}`;
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    let payload: Record<string, unknown> = {};
    
    try {
      payload = JSON.parse(bodyText);
    } catch {
      // Empty or invalid JSON
    }
    
    // Verify the request - try Notion signature first, then bearer token
    const signature = request.headers.get('x-notion-signature');
    const timestamp = request.headers.get('x-notion-timestamp');
    const authHeader = request.headers.get('authorization');
    const secret = process.env.REVALIDATION_SECRET;
    
    const isValidSignature = verifyNotionSignature(bodyText, signature, timestamp);
    const isValidBearer = secret && authHeader === `Bearer ${secret}`;
    
    if (!isValidSignature && !isValidBearer) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Determine what was updated from the payload
    const updatedPages: string[] = [];
    if (payload.type === 'page_updated' || payload.type === 'page_created') {
      updatedPages.push(payload.page_id as string || 'unknown');
    }
    
    // Revalidate all relevant paths
    const pathsToRevalidate = [
      '/',
      '/now',
      '/projects',
      '/projects/[slug]',
    ];
    
    for (const path of pathsToRevalidate) {
      if (path.includes('[')) {
        revalidatePath(path, 'page');
      } else {
        revalidatePath(path);
      }
    }

    // Log sync event
    if (isDatabaseReady()) {
      try {
        await db.insert(syncLog).values({
          source: 'notion-webhook',
          status: 'success',
          itemsUpdated: updatedPages.length || pathsToRevalidate.length,
          details: { 
            paths: pathsToRevalidate,
            updatedPages,
            webhookType: payload.type || 'unknown',
            timestamp: new Date().toISOString(),
          },
        });
      } catch (logError) {
        console.error('Failed to log sync:', logError);
      }
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      paths: pathsToRevalidate,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    
    // Log error
    if (isDatabaseReady()) {
      try {
        await db.insert(syncLog).values({
          source: 'notion-webhook',
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
      { success: false, error: 'Revalidation failed' },
      { status: 500 }
    );
  }
}

// Also support GET for easier testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get('secret');

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Invalid secret' },
      { status: 401 }
    );
  }

  revalidatePath('/');
  revalidatePath('/now');
  revalidatePath('/projects');

  return NextResponse.json({
    success: true,
    revalidated: true,
    timestamp: Date.now(),
  });
}
