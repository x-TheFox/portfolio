import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/admin';
import { getSkills, addSkill, deleteSkill } from '@/lib/cms';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const skills = await getSkills();
    return NextResponse.json({ success: true, data: skills });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    
    // Validate required fields
    if (!data.name || !data.category) {
      return NextResponse.json(
        { success: false, error: 'Name and category are required' },
        { status: 400 }
      );
    }
    
    const result = await addSkill({
      name: data.name,
      level: data.level ?? 50,
      category: data.category,
      years: data.years,
      icon: data.icon,
      sortOrder: data.sortOrder ?? 0,
      source: 'local',
      notionId: null,
      personas: data.personas || ['global'], // Default to global visibility
    });
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to add skill' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error adding skill:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add skill' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Skill ID is required' },
        { status: 400 }
      );
    }
    
    const success = await deleteSkill(id);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete skill' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting skill:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete skill' },
      { status: 500 }
    );
  }
}
