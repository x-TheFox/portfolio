import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/admin';
import { getAbout, updateAbout } from '@/lib/cms';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const about = await getAbout();
    return NextResponse.json({ success: true, data: about });
  } catch (error) {
    console.error('Error fetching about section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch about section' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    
    const data = await request.json();
    const result = await updateAbout(data);
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to update about section' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating about section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update about section' },
      { status: 500 }
    );
  }
}
