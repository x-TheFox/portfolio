import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/admin';
import { getHeroContent, getAllHeroContent, updateHeroContent } from '@/lib/cms';
import { cookies } from 'next/headers';
import { PersonaType } from '@/types/persona';

const VALID_PERSONAS: PersonaType[] = ['recruiter', 'engineer', 'designer', 'cto', 'gamer', 'curious'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const persona = searchParams.get('persona') as PersonaType | null;
    
    if (persona) {
      if (!VALID_PERSONAS.includes(persona)) {
        return NextResponse.json(
          { success: false, error: 'Invalid persona' },
          { status: 400 }
        );
      }
      const content = await getHeroContent(persona);
      return NextResponse.json({ success: true, data: content });
    }
    
    // Return all hero content
    const allContent = await getAllHeroContent();
    return NextResponse.json({ success: true, data: allContent });
  } catch (error) {
    console.error('Error fetching hero content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hero content' },
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
    
    const { persona, ...data } = await request.json();
    
    if (!persona || !VALID_PERSONAS.includes(persona)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing persona' },
        { status: 400 }
      );
    }
    
    const result = await updateHeroContent(persona, data);
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to update hero content' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating hero content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update hero content' },
      { status: 500 }
    );
  }
}
