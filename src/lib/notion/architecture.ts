import { PageObjectResponse, RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import { queryDatabase, getPageBlocks, extractPlainText } from './client';
import { parseBlocks, ParsedBlock } from './blocks';
import { getArchitectureDocsFromDB } from '@/lib/cms';

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

// Architecture document data structure
export interface ArchitectureDoc {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: 'system-design' | 'infrastructure' | 'api-design' | 'data-model' | 'methodology';
  featured: boolean;
  coverImage?: string;
  diagramUrl?: string;
  techStack: string[];
  relatedProjectId?: string;
  createdAt: string;
  updatedAt: string;
  content?: ParsedBlock[];
}

// Extract architecture doc from Notion page
function extractArchitectureDoc(page: PageObjectResponse): ArchitectureDoc {
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

  // Map type
  const typeRaw = getSelect(props.Type)?.toLowerCase().replace(/\s+/g, '-');
  const type = ['system-design', 'infrastructure', 'api-design', 'data-model', 'methodology'].includes(typeRaw)
    ? typeRaw as ArchitectureDoc['type']
    : 'system-design';

  return {
    id: page.id,
    slug: getRichText(props.Slug) || page.id,
    title: getTitle(props.Name) || getTitle(props.Title) || 'Untitled',
    description: getRichText(props.Description),
    type,
    featured: getCheckbox(props.Featured),
    coverImage: getURL(props.Cover) || (page.cover?.type === 'external' ? page.cover.external.url : page.cover?.type === 'file' ? page.cover.file.url : undefined),
    diagramUrl: getURL(props['Diagram URL']) || getURL(props.Diagram) || getURL(props.diagram),
    techStack: getMultiSelect(props['Tech Stack']),
    relatedProjectId: getRichText(props['Related Project']) || undefined,
    createdAt: page.created_time,
    updatedAt: page.last_edited_time,
  };
}

// Get all published architecture docs (Status = Done) - merges Notion and local DB
export async function getArchitectureDocs(): Promise<ArchitectureDoc[]> {
  // Fetch from local database
  let localDocs: ArchitectureDoc[] = [];
  try {
    const dbDocs = await getArchitectureDocsFromDB();
    localDocs = dbDocs.map(doc => ({
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      description: doc.description || '',
      type: doc.type as ArchitectureDoc['type'],
      featured: doc.featured || false,
      coverImage: doc.coverImage || undefined,
      diagramUrl: doc.diagramUrl || undefined,
      techStack: (doc.techStack as string[]) || [],
      relatedProjectId: doc.relatedProjectId || undefined,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching architecture docs from DB:', error);
  }

  // Fetch from Notion if configured
  let notionDocs: ArchitectureDoc[] = [];
  if (process.env.NOTION_ARCHITECTURE_DATABASE_ID) {
    try {
      const pages = await queryDatabase<PageObjectResponse>(
        process.env.NOTION_ARCHITECTURE_DATABASE_ID,
        {
          property: 'Status',
          status: { equals: 'Done' },
        },
        [{ property: 'Featured', direction: 'descending' }]
      );
      notionDocs = pages.map(extractArchitectureDoc);
    } catch (error) {
      console.error('Error fetching architecture docs from Notion:', error);
    }
  }

  // Merge: local docs first (they override Notion if same slug), then Notion
  const docMap = new Map<string, ArchitectureDoc>();
  
  // Add Notion docs first
  for (const doc of notionDocs) {
    docMap.set(doc.slug, doc);
  }
  
  // Add/override with local docs
  for (const doc of localDocs) {
    docMap.set(doc.slug, doc);
  }

  return Array.from(docMap.values());
}

// Get featured architecture docs - merges Notion and local DB
export async function getFeaturedArchitectureDocs(): Promise<ArchitectureDoc[]> {
  const allDocs = await getArchitectureDocs();
  return allDocs.filter(doc => doc.featured);
}

// Get architecture doc by slug - checks local DB first, then Notion
export async function getArchitectureDocBySlug(slug: string): Promise<ArchitectureDoc | null> {
  // Check local database first
  try {
    const dbDocs = await getArchitectureDocsFromDB();
    const localDoc = dbDocs.find(doc => doc.slug === slug);
    if (localDoc) {
      return {
        id: localDoc.id,
        slug: localDoc.slug,
        title: localDoc.title,
        description: localDoc.description || '',
        type: localDoc.type as ArchitectureDoc['type'],
        featured: localDoc.featured || false,
        coverImage: localDoc.coverImage || undefined,
        diagramUrl: localDoc.diagramUrl || undefined,
        techStack: (localDoc.techStack as string[]) || [],
        relatedProjectId: localDoc.relatedProjectId || undefined,
        createdAt: localDoc.createdAt.toISOString(),
        updatedAt: localDoc.updatedAt.toISOString(),
        // Local entries can have markdown content stored - parse into blocks
        content: localDoc.content ? parseMarkdownToBlocks(localDoc.content) : undefined,
      };
    }
  } catch (error) {
    console.error('Error fetching architecture doc from DB:', error);
  }

  // Check Notion if not found locally
  if (!process.env.NOTION_ARCHITECTURE_DATABASE_ID) {
    return null;
  }

  try {
    const pages = await queryDatabase<PageObjectResponse>(
      process.env.NOTION_ARCHITECTURE_DATABASE_ID,
      {
        and: [
          { property: 'Status', status: { equals: 'Done' } },
          { property: 'Slug', rich_text: { equals: slug } },
        ],
      }
    );

    if (pages.length === 0) return null;

    const doc = extractArchitectureDoc(pages[0]);
    
    // Get page content
    const blocks = await getPageBlocks(pages[0].id);
    doc.content = parseBlocks(blocks);

    return doc;
  } catch (error) {
    console.error('Error fetching architecture doc by slug:', error);
    return null;
  }
}

// Get architecture docs by type
export async function getArchitectureDocsByType(type: ArchitectureDoc['type']): Promise<ArchitectureDoc[]> {
  if (!process.env.NOTION_ARCHITECTURE_DATABASE_ID) {
    return [];
  }

  // Convert type back to title case for Notion
  const typeTitle = type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  try {
    const pages = await queryDatabase<PageObjectResponse>(
      process.env.NOTION_ARCHITECTURE_DATABASE_ID,
      {
        and: [
          { property: 'Status', status: { equals: 'Done' } },
          { property: 'Type', select: { equals: typeTitle } },
        ],
      }
    );

    return pages.map(extractArchitectureDoc);
  } catch (error) {
    console.error('Error fetching architecture docs by type:', error);
    return [];
  }
}

// Get all architecture doc slugs for static generation
export async function getAllArchitectureDocSlugs(): Promise<string[]> {
  const docs = await getArchitectureDocs();
  return docs.map(d => d.slug);
}
