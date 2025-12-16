import { PageObjectResponse, RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import { queryDatabase, getPageBlocks, extractPlainText } from './client';
import { parseBlocks, ParsedBlock } from './blocks';
import { getCaseStudiesFromDB } from '@/lib/cms';

// Parse markdown content into ParsedBlock format for rendering
function parseMarkdownToBlocks(markdown: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const lines = markdown.split('\n');
  let i = 0;
  let blockId = 0; // Unique counter for block IDs
  
  const nextId = () => `md-${blockId++}`;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Skip empty lines (but track them for spacing)
    if (!line.trim()) {
      i++;
      continue;
    }
    
    // Headings
    if (line.startsWith('### ')) {
      blocks.push({
        id: nextId(),
        type: 'heading_3',
        content: line.slice(4).trim(),
      });
      i++;
      continue;
    }
    
    if (line.startsWith('## ')) {
      blocks.push({
        id: nextId(),
        type: 'heading_2',
        content: line.slice(3).trim(),
      });
      i++;
      continue;
    }
    
    if (line.startsWith('# ')) {
      blocks.push({
        id: nextId(),
        type: 'heading_1',
        content: line.slice(2).trim(),
      });
      i++;
      continue;
    }
    
    // Block-level LaTeX equations ($$...$$)
    if (line.trim().startsWith('$$')) {
      // Could be single-line $$formula$$ or multi-line
      if (line.trim().endsWith('$$') && line.trim().length > 4) {
        // Single line: $$ formula $$
        let formula = line.trim().slice(2, -2).trim();
        // Sanitize angle brackets inside block LaTeX
        formula = formula.replace(/</g, '\\lt').replace(/>/g, '\\gt');
        blocks.push({
          id: nextId(),
          type: 'equation',
          content: formula,
        });
        i++;
        continue;
      } else {
        // Multi-line equation block
        const equationLines: string[] = [];
        const firstLine = line.trim().slice(2).trim();
        if (firstLine) equationLines.push(firstLine);
        i++;
        while (i < lines.length && !lines[i].trim().endsWith('$$')) {
          equationLines.push(lines[i]);
          i++;
        }
        // Get last line content before $$
        if (i < lines.length) {
          const lastLine = lines[i].trim();
          if (lastLine !== '$$') {
            equationLines.push(lastLine.slice(0, -2).trim());
          }
        }
        blocks.push({
          id: nextId(),
          type: 'equation',
          content: equationLines.join('\n').trim(),
        });
        i++;
        continue;
      }
    }
    
    // Tables - detect by | at start and alignment row
    if (line.trim().startsWith('|') && i + 1 < lines.length && lines[i + 1].match(/^\|[\s\-:]+\|/)) {
      const tableRows: string[][] = [];
      // Parse header row
      const headerCells = line.split('|').slice(1, -1).map(c => c.trim());
      tableRows.push(headerCells);
      i++; // Skip to alignment row
      i++; // Skip alignment row
      // Parse body rows
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i].split('|').slice(1, -1).map(c => c.trim());
        tableRows.push(cells);
        i++;
      }
      blocks.push({
        id: nextId(),
        type: 'table',
        content: JSON.stringify(tableRows),
        metadata: { 
          hasHeader: true,
          columns: headerCells.length 
        },
      });
      continue;
    }
    
    // Bulleted list items
    if (line.match(/^[\-\*]\s/)) {
      blocks.push({
        id: nextId(),
        type: 'bulleted_list_item',
        content: line.slice(2).trim(),
      });
      i++;
      continue;
    }
    
    // Numbered list items
    if (line.match(/^\d+\.\s/)) {
      const content = line.replace(/^\d+\.\s/, '').trim();
      blocks.push({
        id: nextId(),
        type: 'numbered_list_item',
        content,
      });
      i++;
      continue;
    }
    
    // Code blocks (including mermaid diagrams)
    if (line.startsWith('```')) {
      const language = line.slice(3).trim() || 'plain';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      
      // Special handling for mermaid diagrams
      if (language.toLowerCase() === 'mermaid') {
        blocks.push({
          id: nextId(),
          type: 'mermaid',
          content: codeLines.join('\n'),
        });
      } else {
        blocks.push({
          id: nextId(),
          type: 'code',
          content: codeLines.join('\n'),
          metadata: { language },
        });
      }
      i++; // Skip closing ```
      continue;
    }
    
    // Blockquote
    if (line.startsWith('> ')) {
      blocks.push({
        id: nextId(),
        type: 'quote',
        content: line.slice(2).trim(),
      });
      i++;
      continue;
    }
    
    // Divider
    if (line.match(/^[\-\*\_]{3,}$/)) {
      blocks.push({
        id: nextId(),
        type: 'divider',
        content: '',
      });
      i++;
      continue;
    }
    
    // Regular paragraph - collect consecutive non-empty, non-special lines
    const paragraphLines: string[] = [line];
    i++;
    while (
      i < lines.length && 
      lines[i].trim() && 
      !lines[i].startsWith('#') && 
      !lines[i].match(/^[\-\*]\s/) &&
      !lines[i].match(/^\d+\.\s/) &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('> ') &&
      !lines[i].match(/^[\-\*\_]{3,}$/) &&
      !lines[i].trim().startsWith('|')
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }
    
    blocks.push({
      id: nextId(),
      type: 'paragraph',
      content: paragraphLines.join('\n'),
    });
  }
  
  return blocks;
}

// Case Study data structure
export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  description: string;
  client?: string;
  industry: 'tech' | 'finance' | 'healthcare' | 'retail' | 'gaming' | 'other';
  type: 'product-design' | 'system-design' | 'ux-research' | 'branding' | 'full-project';
  featured: boolean;
  coverImage?: string;
  pdfUrl?: string;
  relatedProjectId?: string;
  tags: string[];
  date?: string;
  createdAt: string;
  updatedAt: string;
  content?: ParsedBlock[];
}

// Extract case study from Notion page
function extractCaseStudy(page: PageObjectResponse): CaseStudy {
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

  const getRelation = (prop: unknown): string | undefined => {
    if (prop && typeof prop === 'object' && 'relation' in prop) {
      const relations = (prop as { relation: Array<{ id: string }> }).relation;
      return relations.length > 0 ? relations[0].id : undefined;
    }
    return undefined;
  };

  // Map industry
  const industryRaw = getSelect(props.Industry)?.toLowerCase();
  const industry = ['tech', 'finance', 'healthcare', 'retail', 'gaming', 'other'].includes(industryRaw)
    ? industryRaw as CaseStudy['industry']
    : 'other';

  // Map type
  const typeRaw = getSelect(props.Type)?.toLowerCase().replace(/\s+/g, '-');
  const type = ['product-design', 'system-design', 'ux-research', 'branding', 'full-project'].includes(typeRaw)
    ? typeRaw as CaseStudy['type']
    : 'full-project';

  return {
    id: page.id,
    slug: getRichText(props.Slug) || page.id,
    title: getTitle(props.Name) || getTitle(props.Title) || 'Untitled',
    description: getRichText(props.Description),
    client: getRichText(props.Client) || undefined,
    industry,
    type,
    featured: getCheckbox(props.Featured),
    coverImage: getURL(props.Cover) || (page.cover?.type === 'external' ? page.cover.external.url : page.cover?.type === 'file' ? page.cover.file.url : undefined),
    pdfUrl: getURL(props['PDF URL']) || getURL(props.PDF) || getURL(props.pdf),
    relatedProjectId: getRichText(props['Related Project']) || undefined,
    tags: getMultiSelect(props.Tags),
    date: getDate(props.Date),
    createdAt: page.created_time,
    updatedAt: page.last_edited_time,
  };
}

// Get all published case studies (Status = Done) - merges Notion and local DB
export async function getCaseStudies(): Promise<CaseStudy[]> {
  // Fetch from local database
  let localStudies: CaseStudy[] = [];
  try {
    const dbStudies = await getCaseStudiesFromDB();
    localStudies = dbStudies.map(cs => ({
      id: cs.id,
      slug: cs.slug,
      title: cs.title,
      description: cs.description || '',
      client: cs.client || undefined,
      industry: cs.industry as CaseStudy['industry'],
      type: cs.type as CaseStudy['type'],
      featured: cs.featured || false,
      coverImage: cs.coverImage || undefined,
      pdfUrl: cs.pdfUrl || undefined,
      relatedProjectId: cs.relatedProjectId || undefined,
      tags: (cs.tags as string[]) || [],
      date: cs.date || undefined,
      createdAt: cs.createdAt.toISOString(),
      updatedAt: cs.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching case studies from DB:', error);
  }

  // Fetch from Notion if configured
  let notionStudies: CaseStudy[] = [];
  if (process.env.NOTION_CASE_STUDIES_DATABASE_ID) {
    try {
      const pages = await queryDatabase<PageObjectResponse>(
        process.env.NOTION_CASE_STUDIES_DATABASE_ID,
        {
          property: 'Status',
          status: { equals: 'Done' },
        },
        [{ property: 'Featured', direction: 'descending' }]
      );
      notionStudies = pages.map(extractCaseStudy);
    } catch (error) {
      console.error('Error fetching case studies from Notion:', error);
    }
  }

  // Merge: local studies first (they override Notion if same slug), then Notion
  const studyMap = new Map<string, CaseStudy>();
  
  // Add Notion studies first
  for (const study of notionStudies) {
    studyMap.set(study.slug, study);
  }
  
  // Add/override with local studies
  for (const study of localStudies) {
    studyMap.set(study.slug, study);
  }

  return Array.from(studyMap.values());
}

// Get featured case studies - merges Notion and local DB
export async function getFeaturedCaseStudies(): Promise<CaseStudy[]> {
  const allStudies = await getCaseStudies();
  return allStudies.filter(cs => cs.featured);
}

// Get case study by slug - checks local DB first, then Notion
export async function getCaseStudyBySlug(slug: string): Promise<CaseStudy | null> {
  // Check local database first
  try {
    const dbStudies = await getCaseStudiesFromDB();
    const localStudy = dbStudies.find(cs => cs.slug === slug);
    if (localStudy) {
      return {
        id: localStudy.id,
        slug: localStudy.slug,
        title: localStudy.title,
        description: localStudy.description || '',
        client: localStudy.client || undefined,
        industry: localStudy.industry as CaseStudy['industry'],
        type: localStudy.type as CaseStudy['type'],
        featured: localStudy.featured || false,
        coverImage: localStudy.coverImage || undefined,
        pdfUrl: localStudy.pdfUrl || undefined,
        relatedProjectId: localStudy.relatedProjectId || undefined,
        tags: (localStudy.tags as string[]) || [],
        date: localStudy.date || undefined,
        createdAt: localStudy.createdAt.toISOString(),
        updatedAt: localStudy.updatedAt.toISOString(),
        // Local entries can have markdown content stored - parse into blocks
        content: localStudy.content ? parseMarkdownToBlocks(localStudy.content) : undefined,
      };
    }
  } catch (error) {
    console.error('Error fetching case study from DB:', error);
  }

  // Check Notion if not found locally
  if (!process.env.NOTION_CASE_STUDIES_DATABASE_ID) {
    return null;
  }

  try {
    const pages = await queryDatabase<PageObjectResponse>(
      process.env.NOTION_CASE_STUDIES_DATABASE_ID,
      {
        and: [
          { property: 'Status', status: { equals: 'Done' } },
          { property: 'Slug', rich_text: { equals: slug } },
        ],
      }
    );

    if (pages.length === 0) return null;

    const caseStudy = extractCaseStudy(pages[0]);
    
    // Get page content
    const blocks = await getPageBlocks(pages[0].id);
    caseStudy.content = parseBlocks(blocks);

    return caseStudy;
  } catch (error) {
    console.error('Error fetching case study by slug:', error);
    return null;
  }
}

// Get case studies by industry
export async function getCaseStudiesByIndustry(industry: CaseStudy['industry']): Promise<CaseStudy[]> {
  if (!process.env.NOTION_CASE_STUDIES_DATABASE_ID) {
    return [];
  }

  try {
    const pages = await queryDatabase<PageObjectResponse>(
      process.env.NOTION_CASE_STUDIES_DATABASE_ID,
      {
        and: [
          { property: 'Status', status: { equals: 'Done' } },
          { property: 'Industry', select: { equals: industry.charAt(0).toUpperCase() + industry.slice(1) } },
        ],
      }
    );

    return pages.map(extractCaseStudy);
  } catch (error) {
    console.error('Error fetching case studies by industry:', error);
    return [];
  }
}

// Get case studies by type
export async function getCaseStudiesByType(type: CaseStudy['type']): Promise<CaseStudy[]> {
  if (!process.env.NOTION_CASE_STUDIES_DATABASE_ID) {
    return [];
  }

  // Convert type back to title case for Notion
  const typeTitle = type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  try {
    const pages = await queryDatabase<PageObjectResponse>(
      process.env.NOTION_CASE_STUDIES_DATABASE_ID,
      {
        and: [
          { property: 'Status', status: { equals: 'Done' } },
          { property: 'Type', select: { equals: typeTitle } },
        ],
      }
    );

    return pages.map(extractCaseStudy);
  } catch (error) {
    console.error('Error fetching case studies by type:', error);
    return [];
  }
}

// Get all case study slugs for static generation
export async function getAllCaseStudySlugs(): Promise<string[]> {
  const caseStudies = await getCaseStudies();
  return caseStudies.map(cs => cs.slug);
}
