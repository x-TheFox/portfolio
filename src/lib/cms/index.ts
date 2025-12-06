import { db, isDatabaseReady } from '@/lib/db';
import { 
  profile, heroContent, skills, certificates, aboutSection,
  Profile, HeroContent, Skill, Certificate, AboutSection
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { PersonaType } from '@/types/persona';

// ============================================
// DEFAULT FALLBACKS (from original hardcoded values)
// ============================================

const DEFAULT_PROFILE: Omit<Profile, 'id' | 'updatedAt'> = {
  name: 'Sam Adrian',
  email: 'itsmesamuel.2007@gmail.com',
  bio: 'A passionate developer building modern web experiences.',
  shortBio: 'Building the future, one commit at a time.',
  profileImageUrl: null,
  resumeUrl: null,
  socialLinks: {
    github: 'https://github.com/X-TheFox',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
  },
  location: 'Chennai, IN',
  available: true,
};

const DEFAULT_HERO_CONTENT: Record<PersonaType, Omit<HeroContent, 'id' | 'updatedAt'>> = {
  recruiter: {
    persona: 'recruiter',
    headline: 'Senior Full-Stack Engineer',
    subheadline: '5+ years shipping production apps. Open to new opportunities.',
    ctaText: 'Download Resume',
    ctaHref: '/resume.pdf',
    secondaryCtaText: 'View Experience',
    secondaryCtaHref: '#experience',
    accentColor: 'from-blue-600 to-blue-500',
    showStats: true,
  },
  engineer: {
    persona: 'engineer',
    headline: 'Code. Ship. Repeat.',
    subheadline: 'TypeScript enthusiast. Open source contributor. Always learning.',
    ctaText: 'View GitHub',
    ctaHref: 'https://github.com',
    secondaryCtaText: 'Tech Stack',
    secondaryCtaHref: '#skills',
    accentColor: 'from-green-600 to-green-500',
    showStats: false,
  },
  designer: {
    persona: 'designer',
    headline: 'Design + Development',
    subheadline: 'Bridging the gap between beautiful designs and functional code.',
    ctaText: 'View Portfolio',
    ctaHref: '#projects',
    secondaryCtaText: 'Design Process',
    secondaryCtaHref: '/process',
    accentColor: 'from-purple-600 to-purple-500',
    showStats: false,
  },
  cto: {
    persona: 'cto',
    headline: 'Technical Leadership',
    subheadline: 'Scaling teams and systems. From architecture to delivery.',
    ctaText: 'Schedule a Call',
    ctaHref: '/intake',
    secondaryCtaText: 'View Case Studies',
    secondaryCtaHref: '#projects',
    accentColor: 'from-amber-600 to-amber-500',
    showStats: true,
  },
  gamer: {
    persona: 'gamer',
    headline: 'Game Dev & Interactive',
    subheadline: 'Creating immersive experiences. Unity, Unreal, and the web.',
    ctaText: 'Play Demos',
    ctaHref: '#games',
    secondaryCtaText: 'View Projects',
    secondaryCtaHref: '#projects',
    accentColor: 'from-red-600 to-red-500',
    showStats: false,
  },
  curious: {
    persona: 'curious',
    headline: 'Welcome!',
    subheadline: 'Developer, creator, and lifelong learner. Explore my work.',
    ctaText: 'Get Started',
    ctaHref: '#projects',
    secondaryCtaText: 'About Me',
    secondaryCtaHref: '#about',
    accentColor: 'from-zinc-600 to-zinc-500',
    showStats: false,
  },
};

const DEFAULT_ABOUT: Omit<AboutSection, 'id' | 'updatedAt'> = {
  title: 'About Me',
  content: `I'm a full-stack developer passionate about building products that make a difference. With expertise spanning frontend frameworks, backend systems, and cloud infrastructure, I bring ideas to life from concept to deployment.

When I'm not coding, you'll find me exploring new technologies, contributing to open source, or sharing knowledge through blog posts and talks.`,
  highlights: [
    { label: 'Years Experience', value: '5+', icon: 'calendar' },
    { label: 'Projects Shipped', value: '50+', icon: 'rocket' },
    { label: 'Happy Clients', value: '30+', icon: 'smile' },
  ],
  showTimeline: false,
};

// ============================================
// CMS DATA GETTERS
// ============================================

/**
 * Get profile data with fallback to defaults
 */
export async function getProfile(): Promise<Profile> {
  if (!isDatabaseReady()) {
    return {
      id: 'default',
      ...DEFAULT_PROFILE,
      updatedAt: new Date(),
    } as Profile;
  }

  try {
    const database = db;
    const result = await db.select().from(profile).limit(1);
    
    if (result.length === 0) {
      return {
        id: 'default',
        ...DEFAULT_PROFILE,
        updatedAt: new Date(),
      } as Profile;
    }
    
    return result[0];
  } catch (error) {
    console.error('Error fetching profile:', error);
    return {
      id: 'default',
      ...DEFAULT_PROFILE,
      updatedAt: new Date(),
    } as Profile;
  }
}

/**
 * Get hero content for a specific persona with fallback
 */
export async function getHeroContent(persona: PersonaType): Promise<HeroContent> {
  const fallback = {
    id: 'default',
    ...DEFAULT_HERO_CONTENT[persona],
    updatedAt: new Date(),
  } as HeroContent;

  if (!isDatabaseReady()) {
    return fallback;
  }

  try {
    const database = db;
    const result = await database
      .select()
      .from(heroContent)
      .where(eq(heroContent.persona, persona))
      .limit(1);
    
    if (result.length === 0) {
      return fallback;
    }
    
    return result[0];
  } catch (error) {
    console.error('Error fetching hero content:', error);
    return fallback;
  }
}

/**
 * Get all hero content for all personas
 */
export async function getAllHeroContent(): Promise<Record<PersonaType, HeroContent>> {
  const personas: PersonaType[] = ['recruiter', 'engineer', 'designer', 'cto', 'gamer', 'curious'];
  const result: Record<string, HeroContent> = {};
  
  for (const persona of personas) {
    result[persona] = await getHeroContent(persona);
  }
  
  return result as Record<PersonaType, HeroContent>;
}

/**
 * Get skills merged from DB (priority) and defaults
 */
export async function getSkills(): Promise<Skill[]> {
  if (!isDatabaseReady()) {
    return [];
  }

  try {
    const database = db;
    const result = await database
      .select()
      .from(skills)
      .orderBy(skills.sortOrder);
    
    return result;
  } catch (error) {
    console.error('Error fetching skills:', error);
    return [];
  }
}

/**
 * Get certificates merged from DB (priority) and defaults
 */
export async function getCertificates(): Promise<Certificate[]> {
  if (!isDatabaseReady()) {
    return [];
  }

  try {
    const database = db;
    const result = await database
      .select()
      .from(certificates)
      .orderBy(certificates.sortOrder);
    
    return result;
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return [];
  }
}

/**
 * Get about section content with fallback
 */
export async function getAbout(): Promise<AboutSection> {
  const fallback = {
    id: 'default',
    ...DEFAULT_ABOUT,
    updatedAt: new Date(),
  } as AboutSection;

  if (!isDatabaseReady()) {
    return fallback;
  }

  try {
    const database = db;
    const result = await db.select().from(aboutSection).limit(1);
    
    if (result.length === 0) {
      return fallback;
    }
    
    return result[0];
  } catch (error) {
    console.error('Error fetching about section:', error);
    return fallback;
  }
}

// ============================================
// CMS DATA SETTERS (for admin)
// ============================================

export async function updateProfile(data: Partial<Profile>): Promise<Profile | null> {
  if (!isDatabaseReady()) return null;

  try {
    const database = db;
    const existing = await db.select().from(profile).limit(1);
    
    // Exclude 'id' from data to prevent UUID errors
    const { id: _dataId, ...dataWithoutId } = data as typeof data & { id?: string };
    
    if (existing.length === 0) {
      // Create new profile - exclude 'id' to let DB generate UUID
      const result = await database
        .insert(profile)
        .values({ ...dataWithoutId, updatedAt: new Date() })
        .returning();
      return result[0];
    }
    
    // Update existing
    const result = await database
      .update(profile)
      .set({ ...dataWithoutId, updatedAt: new Date() })
      .where(eq(profile.id, existing[0].id))
      .returning();
    
    return result[0];
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
}

export async function updateHeroContent(persona: PersonaType, data: Partial<HeroContent>): Promise<HeroContent | null> {
  if (!isDatabaseReady()) return null;

  try {
    const database = db;
    const existing = await database
      .select()
      .from(heroContent)
      .where(eq(heroContent.persona, persona))
      .limit(1);
    
    if (existing.length === 0) {
      // Create new
      const result = await database
        .insert(heroContent)
        .values({ 
          ...DEFAULT_HERO_CONTENT[persona], 
          ...data, 
          persona,
          updatedAt: new Date() 
        })
        .returning();
      return result[0];
    }
    
    // Update existing
    const result = await database
      .update(heroContent)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(heroContent.id, existing[0].id))
      .returning();
    
    return result[0];
  } catch (error) {
    console.error('Error updating hero content:', error);
    return null;
  }
}

export async function updateAbout(data: Partial<AboutSection>): Promise<AboutSection | null> {
  if (!isDatabaseReady()) return null;

  try {
    const database = db;
    const existing = await db.select().from(aboutSection).limit(1);
    
    if (existing.length === 0) {
      // Don't include 'id' - let DB generate UUID
      const { id, ...aboutData } = { ...DEFAULT_ABOUT, ...data };
      const result = await database
        .insert(aboutSection)
        .values({ ...aboutData, updatedAt: new Date() })
        .returning();
      return result[0];
    }
    
    const result = await database
      .update(aboutSection)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(aboutSection.id, existing[0].id))
      .returning();
    
    return result[0];
  } catch (error) {
    console.error('Error updating about section:', error);
    return null;
  }
}

export async function addSkill(data: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Skill | null> {
  if (!isDatabaseReady()) return null;

  try {
    const database = db;
    const result = await database
      .insert(skills)
      .values({ ...data, source: 'local', createdAt: new Date(), updatedAt: new Date() })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error adding skill:', error);
    return null;
  }
}

export async function deleteSkill(id: string): Promise<boolean> {
  if (!isDatabaseReady()) return false;

  try {
    const database = db;
    await db.delete(skills).where(eq(skills.id, id));
    return true;
  } catch (error) {
    console.error('Error deleting skill:', error);
    return false;
  }
}

export async function updateSkill(id: string, data: Partial<Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Skill | null> {
  if (!isDatabaseReady()) return null;

  try {
    const database = db;
    const result = await database
      .update(skills)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(skills.id, id))
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error('Error updating skill:', error);
    return null;
  }
}

export async function addCertificate(data: Omit<Certificate, 'id' | 'createdAt' | 'updatedAt'>): Promise<Certificate | null> {
  if (!isDatabaseReady()) return null;

  try {
    const database = db;
    const result = await database
      .insert(certificates)
      .values({ ...data, source: 'local', createdAt: new Date(), updatedAt: new Date() })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error adding certificate:', error);
    return null;
  }
}

export async function deleteCertificate(id: string): Promise<boolean> {
  if (!isDatabaseReady()) return false;

  try {
    const database = db;
    await db.delete(certificates).where(eq(certificates.id, id));
    return true;
  } catch (error) {
    console.error('Error deleting certificate:', error);
    return false;
  }
}

// ============================================
// CASE STUDIES (Synced to Notion)
// ============================================

import { caseStudies, architectureDocs, CaseStudyRecord, NewCaseStudyRecord, ArchitectureDocRecord, NewArchitectureDocRecord } from '@/lib/db/schema';
import { createDatabasePage, updatePage, archivePage } from '@/lib/notion/client';

// Helper to build Notion properties for case study
function buildCaseStudyNotionProperties(data: Partial<NewCaseStudyRecord>) {
  const properties: Record<string, unknown> = {};
  
  if (data.title) {
    properties['Name'] = { title: [{ text: { content: data.title } }] };
  }
  if (data.slug) {
    properties['Slug'] = { rich_text: [{ text: { content: data.slug } }] };
  }
  if (data.description) {
    properties['Description'] = { rich_text: [{ text: { content: data.description } }] };
  }
  if (data.client) {
    properties['Client'] = { rich_text: [{ text: { content: data.client } }] };
  }
  if (data.industry) {
    properties['Industry'] = { select: { name: data.industry.charAt(0).toUpperCase() + data.industry.slice(1) } };
  }
  if (data.type) {
    const typeTitle = data.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    properties['Type'] = { select: { name: typeTitle } };
  }
  if (data.featured !== undefined) {
    properties['Featured'] = { checkbox: data.featured };
  }
  if (data.pdfUrl) {
    properties['PDF URL'] = { url: data.pdfUrl };
  }
  if (data.coverImage) {
    properties['Cover'] = { url: data.coverImage };
  }
  if (data.relatedProjectId) {
    properties['Related Project'] = { rich_text: [{ text: { content: data.relatedProjectId } }] };
  }
  if (data.tags && Array.isArray(data.tags)) {
    properties['Tags'] = { multi_select: (data.tags as string[]).map(tag => ({ name: tag })) };
  }
  if (data.date) {
    properties['Date'] = { date: { start: data.date } };
  }
  // Set status to Done so it shows up
  properties['Status'] = { status: { name: 'Done' } };
  
  return properties;
}

export async function getCaseStudiesFromDB(): Promise<CaseStudyRecord[]> {
  if (!isDatabaseReady()) return [];

  try {
    const result = await db
      .select()
      .from(caseStudies)
      .orderBy(caseStudies.sortOrder);
    return result;
  } catch (error) {
    console.error('Error fetching case studies:', error);
    return [];
  }
}

export async function addCaseStudy(data: Omit<NewCaseStudyRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<CaseStudyRecord | null> {
  if (!isDatabaseReady()) return null;

  try {
    // First, create in Notion if database ID is configured
    let notionId: string | null = null;
    if (process.env.NOTION_CASE_STUDIES_DATABASE_ID) {
      try {
        const properties = buildCaseStudyNotionProperties(data);
        const notionPage = await createDatabasePage(
          process.env.NOTION_CASE_STUDIES_DATABASE_ID,
          properties
        );
        notionId = notionPage.id;
      } catch (notionError) {
        console.error('Error creating case study in Notion:', notionError);
        // Continue without Notion sync
      }
    }

    // Then store locally with Notion reference
    const result = await db
      .insert(caseStudies)
      .values({
        ...data,
        source: notionId ? 'notion' : 'local',
        notionId,
        updatedAt: new Date(),
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error adding case study:', error);
    return null;
  }
}

export async function updateCaseStudy(id: string, data: Partial<Omit<CaseStudyRecord, 'id' | 'createdAt'>>): Promise<CaseStudyRecord | null> {
  if (!isDatabaseReady()) return null;

  try {
    // Get existing record to find Notion ID
    const existing = await db.select().from(caseStudies).where(eq(caseStudies.id, id)).limit(1);
    
    if (existing.length > 0 && existing[0].notionId) {
      // Update in Notion
      try {
        const properties = buildCaseStudyNotionProperties(data as Partial<NewCaseStudyRecord>);
        await updatePage(existing[0].notionId, properties);
      } catch (notionError) {
        console.error('Error updating case study in Notion:', notionError);
      }
    }

    const result = await db
      .update(caseStudies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(caseStudies.id, id))
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error('Error updating case study:', error);
    return null;
  }
}

export async function deleteCaseStudy(id: string): Promise<boolean> {
  if (!isDatabaseReady()) return false;

  try {
    // Get existing record to find Notion ID
    const existing = await db.select().from(caseStudies).where(eq(caseStudies.id, id)).limit(1);
    
    if (existing.length > 0 && existing[0].notionId) {
      // Archive in Notion
      try {
        await archivePage(existing[0].notionId);
      } catch (notionError) {
        console.error('Error archiving case study in Notion:', notionError);
      }
    }

    await db.delete(caseStudies).where(eq(caseStudies.id, id));
    return true;
  } catch (error) {
    console.error('Error deleting case study:', error);
    return false;
  }
}

// ============================================
// ARCHITECTURE DOCS (Synced to Notion)
// ============================================

// Helper to build Notion properties for architecture doc
function buildArchitectureNotionProperties(data: Partial<NewArchitectureDocRecord>) {
  const properties: Record<string, unknown> = {};
  
  if (data.title) {
    properties['Name'] = { title: [{ text: { content: data.title } }] };
  }
  if (data.slug) {
    properties['Slug'] = { rich_text: [{ text: { content: data.slug } }] };
  }
  if (data.description) {
    properties['Description'] = { rich_text: [{ text: { content: data.description } }] };
  }
  if (data.type) {
    const typeTitle = data.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    properties['Type'] = { select: { name: typeTitle } };
  }
  if (data.featured !== undefined) {
    properties['Featured'] = { checkbox: data.featured };
  }
  if (data.diagramUrl) {
    properties['Diagram URL'] = { url: data.diagramUrl };
  }
  if (data.coverImage) {
    properties['Cover'] = { url: data.coverImage };
  }
  if (data.relatedProjectId) {
    properties['Related Project'] = { rich_text: [{ text: { content: data.relatedProjectId } }] };
  }
  if (data.techStack && Array.isArray(data.techStack)) {
    properties['Tech Stack'] = { multi_select: (data.techStack as string[]).map(tech => ({ name: tech })) };
  }
  // Set status to Done so it shows up
  properties['Status'] = { status: { name: 'Done' } };
  
  return properties;
}

export async function getArchitectureDocsFromDB(): Promise<ArchitectureDocRecord[]> {
  if (!isDatabaseReady()) return [];

  try {
    const result = await db
      .select()
      .from(architectureDocs)
      .orderBy(architectureDocs.sortOrder);
    return result;
  } catch (error) {
    console.error('Error fetching architecture docs:', error);
    return [];
  }
}

export async function addArchitectureDoc(data: Omit<NewArchitectureDocRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ArchitectureDocRecord | null> {
  if (!isDatabaseReady()) return null;

  try {
    // First, create in Notion if database ID is configured
    let notionId: string | null = null;
    if (process.env.NOTION_ARCHITECTURE_DATABASE_ID) {
      try {
        const properties = buildArchitectureNotionProperties(data);
        const notionPage = await createDatabasePage(
          process.env.NOTION_ARCHITECTURE_DATABASE_ID,
          properties
        );
        notionId = notionPage.id;
      } catch (notionError) {
        console.error('Error creating architecture doc in Notion:', notionError);
        // Continue without Notion sync
      }
    }

    // Then store locally with Notion reference
    const result = await db
      .insert(architectureDocs)
      .values({
        ...data,
        source: notionId ? 'notion' : 'local',
        notionId,
        updatedAt: new Date(),
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error adding architecture doc:', error);
    return null;
  }
}

export async function updateArchitectureDoc(id: string, data: Partial<Omit<ArchitectureDocRecord, 'id' | 'createdAt'>>): Promise<ArchitectureDocRecord | null> {
  if (!isDatabaseReady()) return null;

  try {
    // Get existing record to find Notion ID
    const existing = await db.select().from(architectureDocs).where(eq(architectureDocs.id, id)).limit(1);
    
    if (existing.length > 0 && existing[0].notionId) {
      // Update in Notion
      try {
        const properties = buildArchitectureNotionProperties(data as Partial<NewArchitectureDocRecord>);
        await updatePage(existing[0].notionId, properties);
      } catch (notionError) {
        console.error('Error updating architecture doc in Notion:', notionError);
      }
    }

    const result = await db
      .update(architectureDocs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(architectureDocs.id, id))
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error('Error updating architecture doc:', error);
    return null;
  }
}

export async function deleteArchitectureDoc(id: string): Promise<boolean> {
  if (!isDatabaseReady()) return false;

  try {
    // Get existing record to find Notion ID
    const existing = await db.select().from(architectureDocs).where(eq(architectureDocs.id, id)).limit(1);
    
    if (existing.length > 0 && existing[0].notionId) {
      // Archive in Notion
      try {
        await archivePage(existing[0].notionId);
      } catch (notionError) {
        console.error('Error archiving architecture doc in Notion:', notionError);
      }
    }

    await db.delete(architectureDocs).where(eq(architectureDocs.id, id));
    return true;
  } catch (error) {
    console.error('Error deleting architecture doc:', error);
    return false;
  }
}

// ============================================
// SYNC LOCAL TO NOTION (for records created before Notion sync)
// ============================================

export async function syncLocalCaseStudiesToNotion(): Promise<{ synced: number; errors: number }> {
  if (!isDatabaseReady() || !process.env.NOTION_CASE_STUDIES_DATABASE_ID) {
    return { synced: 0, errors: 0 };
  }

  let synced = 0;
  let errors = 0;

  try {
    // Get all local case studies without notionId
    const localStudies = await db
      .select()
      .from(caseStudies)
      .where(eq(caseStudies.source, 'local'));

    for (const study of localStudies) {
      if (study.notionId) continue; // Already synced

      try {
        const properties = buildCaseStudyNotionProperties(study);
        const notionPage = await createDatabasePage(
          process.env.NOTION_CASE_STUDIES_DATABASE_ID!,
          properties
        );

        // Update local record with Notion ID
        await db
          .update(caseStudies)
          .set({ notionId: notionPage.id, source: 'notion' })
          .where(eq(caseStudies.id, study.id));

        synced++;
      } catch (error) {
        console.error(`Error syncing case study ${study.slug} to Notion:`, error);
        errors++;
      }
    }
  } catch (error) {
    console.error('Error syncing case studies to Notion:', error);
  }

  return { synced, errors };
}

export async function syncLocalArchitectureToNotion(): Promise<{ synced: number; errors: number }> {
  if (!isDatabaseReady() || !process.env.NOTION_ARCHITECTURE_DATABASE_ID) {
    return { synced: 0, errors: 0 };
  }

  let synced = 0;
  let errors = 0;

  try {
    // Get all local architecture docs without notionId
    const localDocs = await db
      .select()
      .from(architectureDocs)
      .where(eq(architectureDocs.source, 'local'));

    for (const doc of localDocs) {
      if (doc.notionId) continue; // Already synced

      try {
        const properties = buildArchitectureNotionProperties(doc);
        const notionPage = await createDatabasePage(
          process.env.NOTION_ARCHITECTURE_DATABASE_ID!,
          properties
        );

        // Update local record with Notion ID
        await db
          .update(architectureDocs)
          .set({ notionId: notionPage.id, source: 'notion' })
          .where(eq(architectureDocs.id, doc.id));

        synced++;
      } catch (error) {
        console.error(`Error syncing architecture doc ${doc.slug} to Notion:`, error);
        errors++;
      }
    }
  } catch (error) {
    console.error('Error syncing architecture docs to Notion:', error);
  }

  return { synced, errors };
}

// Export defaults for components that need them
export { DEFAULT_PROFILE, DEFAULT_HERO_CONTENT, DEFAULT_ABOUT };
