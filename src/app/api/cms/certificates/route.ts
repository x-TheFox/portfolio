import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/admin';
import { getCertificates, addCertificate, deleteCertificate } from '@/lib/cms';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const certificates = await getCertificates();
    return NextResponse.json({ success: true, data: certificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch certificates' },
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
    
    // Validate required fields (support both 'title' and 'name' for backwards compatibility)
    const name = data.title || data.name;
    if (!name || !data.issuer) {
      return NextResponse.json(
        { success: false, error: 'Title and issuer are required' },
        { status: 400 }
      );
    }
    
    const result = await addCertificate({
      name: name,
      issuer: data.issuer,
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
      credentialId: data.credentialId,
      credentialUrl: data.credentialUrl,
      imageUrl: data.imageUrl,
      skills: data.skills ?? [],
      featured: data.featured ?? false,
      sortOrder: data.sortOrder ?? 0,
      source: 'local',
      notionId: null,
    });
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to add certificate' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error adding certificate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add certificate' },
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
        { success: false, error: 'Certificate ID is required' },
        { status: 400 }
      );
    }
    
    const success = await deleteCertificate(id);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete certificate' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete certificate' },
      { status: 500 }
    );
  }
}
