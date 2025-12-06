import { PageObjectResponse, RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import { queryDatabase, getPageBlocks, extractPlainText } from './client';
import { parseBlocks, ParsedBlock } from './blocks';
import { getInProgressProjects, Project } from './projects';

// Now page section types
export type NowSectionType = 'working-on' | 'learning' | 'goals' | 'vibe';

// Now section data
export interface NowSection {
  id: string;
  type: NowSectionType;
  title: string;
  content: string;
  order: number;
  updatedAt: string;
  blocks?: ParsedBlock[];
  // Additional fields from project
  project?: {
    slug: string;
    category: string;
    techStack: string[];
    progress?: number;
    priority?: string;
  };
}

// Full Now page data
export interface NowPageData {
  sections: NowSection[];
  lastUpdated: string;
}

// Convert in-progress projects to Now sections
function projectToNowSection(project: Project, index: number): NowSection {
  return {
    id: project.id,
    type: 'working-on',
    title: project.title,
    content: project.description,
    order: index,
    updatedAt: project.updatedAt,
    project: {
      slug: project.slug,
      category: project.category,
      techStack: project.techStack,
      progress: project.progress,
      priority: project.priority,
    },
  };
}

// Get Now page data from in-progress projects
export async function getNowPageData(): Promise<NowPageData> {
  try {
    const inProgressProjects = await getInProgressProjects();
    
    if (inProgressProjects.length === 0) {
      return { 
        sections: [], 
        lastUpdated: new Date().toISOString() 
      };
    }

    const sections = inProgressProjects.map((project, index) => 
      projectToNowSection(project, index)
    );

    // Find the most recent update
    const lastUpdated = inProgressProjects.reduce((latest, project) => {
      return new Date(project.updatedAt) > new Date(latest) 
        ? project.updatedAt 
        : latest;
    }, inProgressProjects[0].updatedAt);

    return {
      sections,
      lastUpdated,
    };
  } catch (error) {
    console.error('Error fetching Now page data:', error);
    return {
      sections: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Get a specific section with full content
export async function getNowSectionWithContent(sectionId: string): Promise<NowSection | null> {
  const { sections } = await getNowPageData();
  const section = sections.find(s => s.id === sectionId);
  
  if (!section) return null;
  
  // Fetch full page content
  const blocks = await getPageBlocks(sectionId);
  section.blocks = parseBlocks(blocks);
  
  return section;
}
