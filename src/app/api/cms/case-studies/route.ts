import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/admin';
import { getCaseStudiesFromDB, addCaseStudy, updateCaseStudy, deleteCaseStudy } from '@/lib/cms';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const caseStudies = await getCaseStudiesFromDB();
    return NextResponse.json({ success: true, data: caseStudies });
  } catch (error) {
    console.error('Error fetching case studies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch case studies' },
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
    
    const result = await addCaseStudy({
      slug: data.slug,
      title: data.title,
      description: data.description || null,
      client: data.client || null,
      industry: data.industry || 'tech',
      type: data.type || 'full-project',
      featured: data.featured ?? false,
      coverImage: data.coverImage || null,
      pdfUrl: data.pdfUrl || null,
      relatedProjectId: data.relatedProjectId || null,
      tags: data.tags ?? [],
      date: data.date || null,
      content: data.content || null,
      sortOrder: data.sortOrder ?? 0,
      source: 'local',
      notionId: null,
    });
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to add case study' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error adding case study:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add case study' },
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
    const result = await updateCaseStudy(id, updateData);
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to update case study' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating case study:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update case study' },
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
        { success: false, error: 'Case study ID is required' },
        { status: 400 }
      );
    }
    
    const success = await deleteCaseStudy(id);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete case study' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting case study:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete case study' },
      { status: 500 }
    );
  }
}
