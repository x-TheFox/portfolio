import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/admin';
import { getArchitectureDocsFromDB, addArchitectureDoc, updateArchitectureDoc, deleteArchitectureDoc } from '@/lib/cms';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const docs = await getArchitectureDocsFromDB();
    return NextResponse.json({ success: true, data: docs });
  } catch (error) {
    console.error('Error fetching architecture docs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch architecture docs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await validateSession(cookieStore);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    if (!data.title || !data.slug) {
      return NextResponse.json(
        { success: false, error: 'Title and slug are required' },
        { status: 400 }
      );
    }
    
    const result = await addArchitectureDoc({
      slug: data.slug,
      title: data.title,
      description: data.description || null,
      type: data.type || 'system-design',
      featured: data.featured ?? false,
      coverImage: data.coverImage || null,
      diagramUrl: data.diagramUrl || null,
      techStack: data.techStack ?? [],
      relatedProjectId: data.relatedProjectId || null,
      content: data.content || null,
      sortOrder: data.sortOrder ?? 0,
      source: 'local',
      notionId: null,
    });
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to add architecture doc' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error adding architecture doc:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add architecture doc' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await validateSession(cookieStore);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const { id, ...updateData } = data;
    const result = await updateArchitectureDoc(id, updateData);
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to update architecture doc' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating architecture doc:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update architecture doc' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
        { success: false, error: 'Architecture doc ID is required' },
        { status: 400 }
      );
    }
    
    const success = await deleteArchitectureDoc(id);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete architecture doc' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting architecture doc:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete architecture doc' },
      { status: 500 }
    );
  }
}
