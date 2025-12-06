import { BlockObjectResponse, RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import { extractPlainText } from './client';

// Parsed block for rendering
export interface ParsedBlock {
  id: string;
  type: string;
  content: string;
  children?: ParsedBlock[];
  metadata?: {
    language?: string;
    url?: string;
    caption?: string;
    checked?: boolean;
    color?: string;
    level?: number;
    icon?: string;
    // Table metadata
    hasHeader?: boolean;
    columns?: number;
  };
}

// Parse Notion blocks to a renderable format
export function parseBlocks(blocks: BlockObjectResponse[]): ParsedBlock[] {
  return blocks.map(block => parseBlock(block)).filter((b): b is ParsedBlock => b !== null);
}

function parseBlock(block: BlockObjectResponse & { children?: BlockObjectResponse[] }): ParsedBlock | null {
  const base = {
    id: block.id,
    type: block.type,
    children: block.children ? parseBlocks(block.children) : undefined,
  };

  switch (block.type) {
    case 'paragraph':
      return {
        ...base,
        content: extractPlainText(block.paragraph.rich_text),
        metadata: { color: block.paragraph.color },
      };

    case 'heading_1':
      return {
        ...base,
        content: extractPlainText(block.heading_1.rich_text),
        metadata: { level: 1, color: block.heading_1.color },
      };

    case 'heading_2':
      return {
        ...base,
        content: extractPlainText(block.heading_2.rich_text),
        metadata: { level: 2, color: block.heading_2.color },
      };

    case 'heading_3':
      return {
        ...base,
        content: extractPlainText(block.heading_3.rich_text),
        metadata: { level: 3, color: block.heading_3.color },
      };

    case 'bulleted_list_item':
      return {
        ...base,
        content: extractPlainText(block.bulleted_list_item.rich_text),
        metadata: { color: block.bulleted_list_item.color },
      };

    case 'numbered_list_item':
      return {
        ...base,
        content: extractPlainText(block.numbered_list_item.rich_text),
        metadata: { color: block.numbered_list_item.color },
      };

    case 'to_do':
      return {
        ...base,
        content: extractPlainText(block.to_do.rich_text),
        metadata: { checked: block.to_do.checked, color: block.to_do.color },
      };

    case 'toggle':
      return {
        ...base,
        content: extractPlainText(block.toggle.rich_text),
        metadata: { color: block.toggle.color },
      };

    case 'code':
      return {
        ...base,
        content: extractPlainText(block.code.rich_text),
        metadata: {
          language: block.code.language,
          caption: block.code.caption ? extractPlainText(block.code.caption) : undefined,
        },
      };

    case 'quote':
      return {
        ...base,
        content: extractPlainText(block.quote.rich_text),
        metadata: { color: block.quote.color },
      };

    case 'callout':
      // Extract icon from callout
      let calloutIcon = '💡';
      if (block.callout.icon) {
        if (block.callout.icon.type === 'emoji') {
          calloutIcon = block.callout.icon.emoji;
        }
      }
      return {
        ...base,
        content: extractPlainText(block.callout.rich_text),
        metadata: {
          color: block.callout.color,
          icon: calloutIcon,
        },
      };

    case 'divider':
      return { ...base, content: '' };

    case 'image':
      const imageUrl = block.image.type === 'external' 
        ? block.image.external.url 
        : block.image.file.url;
      return {
        ...base,
        content: imageUrl,
        metadata: {
          url: imageUrl,
          caption: block.image.caption ? extractPlainText(block.image.caption) : undefined,
        },
      };

    case 'video':
      const videoUrl = block.video.type === 'external'
        ? block.video.external.url
        : block.video.file.url;
      return {
        ...base,
        content: videoUrl,
        metadata: { url: videoUrl },
      };

    case 'bookmark':
      return {
        ...base,
        content: block.bookmark.url,
        metadata: {
          url: block.bookmark.url,
          caption: block.bookmark.caption ? extractPlainText(block.bookmark.caption) : undefined,
        },
      };

    case 'embed':
      return {
        ...base,
        content: block.embed.url,
        metadata: { url: block.embed.url },
      };

    case 'table':
      return {
        ...base,
        content: '',
        metadata: {
          // Table metadata
        },
      };

    default:
      // Return null for unsupported block types
      return null;
  }
}

// Render rich text with formatting
export function parseRichText(richText: RichTextItemResponse[]): {
  text: string;
  annotations: Array<{
    text: string;
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
    href?: string;
  }>;
} {
  return {
    text: extractPlainText(richText),
    annotations: richText.map(rt => ({
      text: rt.plain_text,
      bold: rt.annotations.bold,
      italic: rt.annotations.italic,
      strikethrough: rt.annotations.strikethrough,
      underline: rt.annotations.underline,
      code: rt.annotations.code,
      color: rt.annotations.color,
      href: rt.href ?? undefined,
    })),
  };
}
