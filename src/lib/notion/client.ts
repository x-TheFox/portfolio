import { Client } from '@notionhq/client';
import { 
  BlockObjectResponse, 
  PageObjectResponse,
  PartialBlockObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints';

// Lazy initialize Notion client
let notionClientInstance: Client | null = null;

function getNotionClient(): Client {
  if (!notionClientInstance) {
    if (!process.env.NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY is not configured');
    }
    notionClientInstance = new Client({
      auth: process.env.NOTION_API_KEY,
    });
  }
  return notionClientInstance;
}

// Export notion for direct access where needed (legacy support)
export const notion = {
  get databases() {
    return getNotionClient().databases;
  },
  get pages() {
    return getNotionClient().pages;
  },
  get blocks() {
    return getNotionClient().blocks;
  },
};

// Check if Notion is configured
export function isNotionConfigured(): boolean {
  return !!(
    process.env.NOTION_API_KEY &&
    process.env.NOTION_PROJECTS_DATABASE_ID
  );
}

// Type guard for full block response
export function isFullBlock(
  block: BlockObjectResponse | PartialBlockObjectResponse
): block is BlockObjectResponse {
  return 'type' in block;
}

// Extract plain text from rich text array
export function extractPlainText(richText: RichTextItemResponse[]): string {
  return richText.map(rt => rt.plain_text).join('');
}

// Get all blocks from a page (handles pagination)
export async function getPageBlocks(pageId: string): Promise<BlockObjectResponse[]> {
  const client = getNotionClient();
  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await client.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of response.results) {
      if (isFullBlock(block)) {
        blocks.push(block);
        
        // Recursively get children if block has them
        if (block.has_children) {
          const children = await getPageBlocks(block.id);
          // Store children in a custom property for rendering
          (block as BlockObjectResponse & { children?: BlockObjectResponse[] }).children = children;
        }
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return blocks;
}

// Query a database with filters
export async function queryDatabase<T>(
  databaseId: string,
  filter?: unknown,
  sorts?: unknown
): Promise<T[]> {
  const client = getNotionClient();
  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await client.databases.query({
      database_id: databaseId,
      filter: filter as any,
      sorts: sorts as any,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const page of response.results) {
      if ('properties' in page) {
        results.push(page as PageObjectResponse);
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return results as unknown as T[];
}

// Get a single page by ID
export async function getPage(pageId: string): Promise<PageObjectResponse> {
  const client = getNotionClient();
  const page = await client.pages.retrieve({ page_id: pageId });
  return page as PageObjectResponse;
}

// Create a page in a database (for intake form storage)
export async function createDatabasePage(
  databaseId: string,
  properties: Record<string, unknown>
): Promise<PageObjectResponse> {
  const client = getNotionClient();
  const page = await client.pages.create({
    parent: { database_id: databaseId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: properties as any,
  });
  return page as PageObjectResponse;
}

// Update a page's properties
export async function updatePage(
  pageId: string,
  properties: Record<string, unknown>
): Promise<PageObjectResponse> {
  const client = getNotionClient();
  const page = await client.pages.update({
    page_id: pageId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: properties as any,
  });
  return page as PageObjectResponse;
}

// Archive (delete) a page
export async function archivePage(pageId: string): Promise<PageObjectResponse> {
  const client = getNotionClient();
  const page = await client.pages.update({
    page_id: pageId,
    archived: true,
  });
  return page as PageObjectResponse;
}
