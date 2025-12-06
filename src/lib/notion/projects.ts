import { PageObjectResponse, RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import { queryDatabase, getPageBlocks, extractPlainText } from './client';
import { parseBlocks, ParsedBlock } from './blocks';

// Project data structure
export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  techStack: string[];
  category: 'web' | 'game' | 'ai' | 'design' | 'other';
  featured: boolean;
  coverImage?: string;
  status: 'published' | 'draft' | 'in-progress';
  // New fields from Notion schema
  startDate?: string;
  endDate?: string;
  priority?: 'low' | 'medium' | 'high';
  team?: string[];
  progress?: number;
  githubUrl?: string;
  createdAt: string;
  updatedAt: string;
  content?: ParsedBlock[];
}

// Extract project from Notion page
function extractProject(page: PageObjectResponse): Project {
  const props = page.properties;
  
  // Helper to safely extract property values
  const getTitle = (prop: unknown): string => {
    if (prop && typeof prop === 'object' && 'title' in prop) {
      return extractPlainText((prop as { title: RichTextItemResponse[] }).title);
    }
    return '';
  };
  
  const getRichText = (prop: unknown): string => {
    if (prop && typeof prop === 'object' && 'rich_text' in prop) {
      return extractPlainText((prop as { rich_text: RichTextItemResponse[] }).rich_text);
    }
    return '';
  };
  
  const getMultiSelect = (prop: unknown): string[] => {
    if (prop && typeof prop === 'object' && 'multi_select' in prop) {
      return (prop as { multi_select: Array<{ name: string }> }).multi_select.map(s => s.name);
    }
    return [];
  };
  
  const getSelect = (prop: unknown): string => {
    if (prop && typeof prop === 'object' && 'select' in prop) {
      return (prop as { select: { name: string } | null }).select?.name ?? '';
    }
    return '';
  };
  
  // Handle Notion Status type (different from Select)
  const getStatus = (prop: unknown): string => {
    if (prop && typeof prop === 'object' && 'status' in prop) {
      return (prop as { status: { name: string } | null }).status?.name ?? '';
    }
    return '';
  };
  
  const getDate = (prop: unknown): string | undefined => {
    if (prop && typeof prop === 'object' && 'date' in prop) {
      const date = (prop as { date: { start: string } | null }).date;
      return date?.start;
    }
    return undefined;
  };
  
  const getNumber = (prop: unknown): number | undefined => {
    if (prop && typeof prop === 'object' && 'number' in prop) {
      return (prop as { number: number | null }).number ?? undefined;
    }
    return undefined;
  };
  
  const getCheckbox = (prop: unknown): boolean => {
    if (prop && typeof prop === 'object' && 'checkbox' in prop) {
      return (prop as { checkbox: boolean }).checkbox;
    }
    return false;
  };
  
  const getFiles = (prop: unknown): string | undefined => {
    if (prop && typeof prop === 'object' && 'files' in prop) {
      const files = (prop as { files: Array<{ file?: { url: string }; external?: { url: string } }> }).files;
      if (files.length > 0) {
        return files[0].file?.url ?? files[0].external?.url;
      }
    }
    return undefined;
  };

  const getURL = (prop: unknown): string | undefined => {
    if (prop && typeof prop === 'object' && 'url' in prop) {
      return (prop as { url: string | null }).url ?? undefined;
    }
    return undefined;
  };

  const category = getSelect(props.Category)?.toLowerCase() as Project['category'] || 'other';
  
  // Map Notion Status type values to our status enum
  const notionStatus = getStatus(props.Status);
  const statusMap: Record<string, Project['status']> = {
    'Not started': 'draft',
    'In progress': 'in-progress',
    'Done': 'published',
  };
  const status = statusMap[notionStatus] || 'draft';
  
  // Map priority
  const priorityRaw = getSelect(props.Priority)?.toLowerCase();
  const priority = ['low', 'medium', 'high'].includes(priorityRaw) 
    ? priorityRaw as Project['priority'] 
    : undefined;

  return {
    id: page.id,
    slug: getRichText(props.Slug) || page.id,
    title: getTitle(props['Project name']) || getTitle(props.Title) || getTitle(props.Name) || 'Untitled',
    description: getRichText(props.Description),
    techStack: getMultiSelect(props['Tech Stack']),
    category,
    featured: getCheckbox(props.Featured),
    coverImage: getFiles(props.Cover) || getFiles(props['Attach file']) || (page.cover?.type === 'external' ? page.cover.external.url : page.cover?.type === 'file' ? page.cover.file.url : undefined),
    status,
    startDate: getDate(props['Start date']),
    endDate: getDate(props['End date']),
    priority,
    team: getMultiSelect(props.Team),
    progress: getNumber(props.Progress),
    githubUrl: getURL(props.git) || getURL(props.Git) || getURL(props.GitHub) || getURL(props.github),
    createdAt: page.created_time,
    updatedAt: page.last_edited_time,
  };
}

// Get all published projects (Status = Done)
export async function getProjects(): Promise<Project[]> {
  if (!process.env.NOTION_PROJECTS_DATABASE_ID) {
    console.warn('NOTION_PROJECTS_DATABASE_ID not set');
    return [];
  }

  const pages = await queryDatabase<PageObjectResponse>(
    process.env.NOTION_PROJECTS_DATABASE_ID,
    {
      property: 'Status',
      status: { equals: 'Done' },
    },
    [{ property: 'Featured', direction: 'descending' }]
  );

  return pages.map(extractProject);
}

// Get in-progress projects (for Now page)
export async function getInProgressProjects(): Promise<Project[]> {
  if (!process.env.NOTION_PROJECTS_DATABASE_ID) {
    console.warn('NOTION_PROJECTS_DATABASE_ID not set');
    return [];
  }

  const pages = await queryDatabase<PageObjectResponse>(
    process.env.NOTION_PROJECTS_DATABASE_ID,
    {
      property: 'Status',
      status: { equals: 'In progress' },
    },
    [{ property: 'Priority', direction: 'descending' }]
  );

  return pages.map(extractProject);
}

// Get featured projects
export async function getFeaturedProjects(): Promise<Project[]> {
  if (!process.env.NOTION_PROJECTS_DATABASE_ID) {
    return [];
  }

  const pages = await queryDatabase<PageObjectResponse>(
    process.env.NOTION_PROJECTS_DATABASE_ID,
    {
      and: [
        { property: 'Status', status: { equals: 'Done' } },
        { property: 'Featured', checkbox: { equals: true } },
      ],
    }
  );

  return pages.map(extractProject);
}

// Get project by slug
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  if (!process.env.NOTION_PROJECTS_DATABASE_ID) {
    return null;
  }

  const pages = await queryDatabase<PageObjectResponse>(
    process.env.NOTION_PROJECTS_DATABASE_ID,
    {
      and: [
        { property: 'Status', status: { equals: 'Done' } },
        { property: 'Slug', rich_text: { equals: slug } },
      ],
    }
  );

  if (pages.length === 0) return null;

  const project = extractProject(pages[0]);
  
  // Get page content
  const blocks = await getPageBlocks(pages[0].id);
  project.content = parseBlocks(blocks);

  return project;
}

// Get projects by category
export async function getProjectsByCategory(category: Project['category']): Promise<Project[]> {
  if (!process.env.NOTION_PROJECTS_DATABASE_ID) {
    return [];
  }

  const pages = await queryDatabase<PageObjectResponse>(
    process.env.NOTION_PROJECTS_DATABASE_ID,
    {
      and: [
        { property: 'Status', status: { equals: 'Done' } },
        { property: 'Category', select: { equals: category.charAt(0).toUpperCase() + category.slice(1) } },
      ],
    }
  );

  return pages.map(extractProject);
}

// Get all project slugs for static generation
export async function getAllProjectSlugs(): Promise<string[]> {
  const projects = await getProjects();
  return projects.map(p => p.slug);
}
