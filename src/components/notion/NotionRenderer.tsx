'use client';

import { ParsedBlock } from '@/lib/notion/blocks';
import { cn } from '@/lib/utils';
import { ExternalLink, Check, ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import MermaidDiagram to avoid SSR issues
const MermaidDiagram = dynamic(
  () => import('@/components/ui/MermaidDiagram').then(mod => mod.MermaidDiagram),
  { 
    ssr: false,
    loading: () => (
      <div className="my-6 p-8 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading diagram...</div>
      </div>
    )
  }
);

// Dynamically import LaTeX components
const LaTeXBlock = dynamic(
  () => import('@/components/ui/LaTeX').then(mod => mod.LaTeXBlock),
  { 
    ssr: false,
    loading: () => <span className="text-zinc-500">...</span>
  }
);

const LaTeXInline = dynamic(
  () => import('@/components/ui/LaTeX').then(mod => mod.LaTeXInline),
  { 
    ssr: false,
    loading: () => <span className="text-zinc-500">...</span>
  }
);

interface NotionRendererProps {
  blocks: ParsedBlock[];
  className?: string;
}

// Parse inline markdown like **bold**, *italic*, `code`, and $latex$
function parseInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  
  const parts: React.ReactNode[] = [];
  let key = 0;
  
  // First, handle block-level LaTeX ($$...$$) - these should be on their own
  // For inline parsing, we handle: **bold**, *italic*, `code`, and $inline latex$
  // Order matters: check $$ before $, ** before *
  // Use [\s\S] for $$ to allow multiline block math
  const regex = /(\$\$([\s\S]+?)\$\$|\$([^$]+?)\$|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    if (match[2]) {
      // $$block latex$$
      const blockFormula = match[2].trim();
      const sanitizedBlockFormula = blockFormula
        .replace(/\\u003c/g, '\\lt')
        .replace(/\\u003e/g, '\\gt')
        .replace(/&lt;|&#60;|&#x3c;/gi, '\\lt')
        .replace(/&gt;|&#62;|&#x3e;/gi, '\\gt')
        .replace(/</g, '\\lt')
        .replace(/>/g, '\\gt');
      parts.push(<LaTeXBlock key={key++} formula={sanitizedBlockFormula} />);
    } else if (match[3]) {
      // $inline latex$
      const inlineFormula = match[3].trim();
      const sanitizedInlineFormula = inlineFormula
        .replace(/\\u003c/g, '\\lt')
        .replace(/\\u003e/g, '\\gt')
        .replace(/&lt;|&#60;|&#x3c;/gi, '\\lt')
        .replace(/&gt;|&#62;|&#x3e;/gi, '\\gt')
        .replace(/</g, '\\lt')
        .replace(/>/g, '\\gt');
      parts.push(<LaTeXInline key={key++} formula={sanitizedInlineFormula} />);
    } else if (match[4]) {
      // **bold** - recursively parse inner content so nested math/formatting works
      const inner = match[4];
      parts.push(
        <strong key={key++} className="font-semibold text-white">
          {parseInlineMarkdown(inner)}
        </strong>
      );
    } else if (match[5]) {
      // *italic* - recursively parse inner content
      const inner = match[5];
      parts.push(
        <em key={key++} className="italic">
          {parseInlineMarkdown(inner)}
        </em>
      );
    } else if (match[6]) {
      // `code` - do not parse inside code spans
      parts.push(<code key={key++} className="text-yellow-400 bg-zinc-800/50 px-1.5 py-0.5 rounded text-sm">{match[6]}</code>);
    }

    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
}

export function NotionRenderer({ blocks, className }: NotionRendererProps) {
  return (
    <article className={cn(
      'notion-content prose prose-invert prose-lg max-w-none',
      // Custom prose overrides
      'prose-headings:text-white prose-headings:font-semibold',
      'prose-p:text-zinc-300 prose-p:leading-relaxed',
      'prose-a:text-yellow-400 prose-a:no-underline hover:prose-a:underline',
      'prose-strong:text-white prose-strong:font-semibold',
      // removed inline prose-code styles to allow inline code components to style themselves
      className
    )}>
      {renderBlocksWithLists(blocks)}

      {/* Dev-only debug: show parsed blocks JSON when ?showParsed=1 is in the URL */}
      {process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location.search.includes('showParsed=1') && (
        <details className="my-6 p-4 bg-zinc-900/40 rounded border border-zinc-800 text-sm text-zinc-300">
          <summary className="cursor-pointer font-mono text-xs text-zinc-400">Show parsed Notion blocks (dev)</summary>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap">{JSON.stringify(blocks, null, 2)}</pre>
        </details>
      )}
    </article>
  );
}

function Block({ block }: { block: ParsedBlock }) {
  switch (block.type) {
    case 'paragraph':
      if (!block.content) {
        return <div className="h-4" />; // Empty paragraph spacer
      }

      // Support markdown-style headings pasted into Notion paragraphs like "#### 1\\. Heading"
      const mdHeadingMatch = block.content.match(/^(#{1,6})\s*(.*)$/);
      if (mdHeadingMatch) {
        const level = mdHeadingMatch[1].length;
        // Unescape heading dots: "1\. " -> "1. "
        const headingText = mdHeadingMatch[2].replace(/\\\./g, '.').trim();
        const headingChildren = parseInlineMarkdown(headingText);

        if (level === 1) return (
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-12 mb-6 pb-3 border-b border-zinc-800">{headingChildren}</h2>
        );
        if (level === 2) return (
          <h3 className="text-2xl md:text-3xl font-semibold text-white mt-10 mb-4">{headingChildren}</h3>
        );
        if (level === 3) return (
          <h4 className="text-xl md:text-2xl font-medium text-zinc-100 mt-8 mb-3">{headingChildren}</h4>
        );
        if (level === 4) return (
          <h5 className="text-lg font-medium text-zinc-100 mt-6 mb-2">{headingChildren}</h5>
        );
        if (level === 5) return (
          <h6 className="text-base font-medium text-zinc-100 mt-4 mb-2">{headingChildren}</h6>
        );
        return (
          <h6 className="text-base font-medium text-zinc-100 mt-4 mb-2">{headingChildren}</h6>
        );
      }

      return (
        <p className="text-zinc-300 leading-relaxed mb-6 text-lg">
          {parseInlineMarkdown(block.content)}
        </p>
      );

    case 'heading_1':
      return (
        <h2 className="text-3xl md:text-4xl font-bold text-white mt-12 mb-6 pb-3 border-b border-zinc-800">
          {parseInlineMarkdown(block.content)}
        </h2>
      );

    case 'heading_2':
      return (
        <h3 className="text-2xl md:text-3xl font-semibold text-white mt-10 mb-4">
          {parseInlineMarkdown(block.content)}
        </h3>
      );

    case 'heading_3':
      return (
        <h4 className="text-xl md:text-2xl font-medium text-zinc-100 mt-8 mb-3">
          {parseInlineMarkdown(block.content)}
        </h4>
      );

    case 'bulleted_list_item':
      return (
        <li className="text-zinc-300 mb-2 pl-2">
          <span className="leading-relaxed">{parseInlineMarkdown(block.content)}</span>
          {block.children && block.children.length > 0 && (
            <ul className="mt-2 space-y-2 list-disc list-inside">
              {block.children.map((child) => (
                <Block key={child.id} block={child} />
              ))}
            </ul>
          )}
        </li>
      );

    case 'numbered_list_item':
      return (
        <li className="text-zinc-300 mb-2 pl-2">
          <span className="leading-relaxed">{parseInlineMarkdown(block.content)}</span>
          {block.children && block.children.length > 0 && (
            <ol className="mt-2 space-y-2 list-decimal list-inside">
              {block.children.map((child) => (
                <Block key={child.id} block={child} />
              ))}
            </ol>
          )}
        </li>
      );

    case 'to_do':
      return (
        <div className="flex items-start gap-3 mb-3 group">
          <div className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors',
            block.metadata?.checked 
              ? 'bg-green-500/20 border-green-500 text-green-400' 
              : 'border-zinc-600 group-hover:border-zinc-500'
          )}>
            {block.metadata?.checked && <Check className="w-3 h-3" />}
          </div>
          <span className={cn(
            'text-lg leading-relaxed',
            block.metadata?.checked ? 'line-through text-zinc-500' : 'text-zinc-300'
          )}>
            {block.content}
          </span>
        </div>
      );

    case 'toggle':
      return (
        <details className="mb-4 group">
          <summary className="cursor-pointer text-zinc-200 hover:text-white font-medium flex items-center gap-2 py-2">
            <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
            {block.content}
          </summary>
          {block.children && (
            <div className="ml-6 mt-3 pl-4 border-l-2 border-zinc-800">
              {block.children.map((child) => (
                <Block key={child.id} block={child} />
              ))}
            </div>
          )}
        </details>
      );

    case 'code':
      return (
        <div className="mb-6 group">
          {block.metadata?.language && (
            <div className="flex items-center justify-between bg-zinc-800 rounded-t-lg px-4 py-2 border border-b-0 border-zinc-700">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                {block.metadata.language}
              </span>
            </div>
          )}
          <pre className={cn(
            'bg-zinc-900 p-4 overflow-x-auto',
            'border border-zinc-700',
            block.metadata?.language ? 'rounded-b-lg' : 'rounded-lg'
          )}>
            <code className="text-sm text-zinc-300 font-mono leading-relaxed">
              {block.content}
            </code>
          </pre>
          {block.metadata?.caption && (
            <p className="text-sm text-zinc-500 mt-2 italic">{block.metadata.caption}</p>
          )}
        </div>
      );

    case 'mermaid':
      return (
        <MermaidDiagram chart={block.content} />
      );

    case 'equation':
      // Sanitize angle brackets inside block LaTeX to avoid HTML/tokenization issues
      const sanitizedEquation = (block.content || '').replace(/</g, '\\lt').replace(/>/g, '\\gt');
      return (
        <div className="my-8 p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-x-auto">
          <LaTeXBlock formula={sanitizedEquation} />
        </div>
      );

    case 'quote':
      return (
        <blockquote className={cn(
          'border-l-4 border-yellow-500/50 pl-6 my-8',
          'text-xl text-zinc-400 italic'
        )}>
          <p className="leading-relaxed">{block.content}</p>
        </blockquote>
      );

    case 'callout':
      return (
        <div className={cn(
          'flex gap-4 p-5 rounded-xl mb-6',
          'bg-gradient-to-r from-zinc-800/80 to-zinc-800/40',
          'border border-zinc-700/50',
          'backdrop-blur-sm'
        )}>
          <span className="text-2xl flex-shrink-0">{block.metadata?.icon || '💡'}</span>
          <p className="text-zinc-300 leading-relaxed">{block.content}</p>
        </div>
      );

    case 'divider':
      return (
        <div className="my-10 flex items-center justify-center gap-2">
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent flex-1" />
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent flex-1" />
        </div>
      );

    case 'image':
      return (
        <figure className="my-8">
          <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
            <img
              src={block.content}
              alt={block.metadata?.caption || 'Image'}
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
          {block.metadata?.caption && (
            <figcaption className="text-sm text-zinc-500 mt-3 text-center italic">
              {block.metadata.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'video':
      return (
        <div className="my-8">
          <div className="aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
            <video
              src={block.content}
              controls
              className="w-full h-full"
            />
          </div>
        </div>
      );

    case 'bookmark':
    case 'embed':
      return (
        <a
          href={block.metadata?.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex items-center justify-between gap-4 p-4 rounded-xl mb-6',
            'bg-zinc-800/50 border border-zinc-700/50',
            'hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-200',
            'group'
          )}
        >
          <div className="flex-1 min-w-0">
            <span className="text-yellow-400 font-medium group-hover:text-yellow-300 transition-colors block truncate">
              {block.metadata?.caption || block.metadata?.url}
            </span>
            {block.metadata?.caption && block.metadata?.url && (
              <span className="text-sm text-zinc-500 truncate block mt-1">
                {block.metadata.url}
              </span>
            )}
          </div>
          <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-zinc-400 flex-shrink-0" />
        </a>
      );

    case 'table':
      // Handle both Notion table format (children) and markdown table format (JSON string in content)
      let tableData: string[][] = [];
      
      if (block.content) {
        try {
          // Markdown table format - content is JSON array
          tableData = JSON.parse(block.content);
        } catch {
          // Fallback: content might be pipe-separated
          tableData = [[block.content]];
        }
      } else if (block.children) {
        // Notion table format - rows as children
        tableData = block.children.map(row => 
          (row.content as string)?.split('|').map(cell => cell.trim()) || []
        );
      }

      if (tableData.length === 0) return null;

      const hasHeader = block.metadata?.hasHeader !== false;
      const headerRow = hasHeader ? tableData[0] : null;
      const bodyRows = hasHeader ? tableData.slice(1) : tableData;

      return (
        <div className="my-6 overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full">
            {headerRow && (
              <thead>
                <tr className="bg-zinc-800/50">
                  {headerRow.map((cell, cellIndex) => (
                    <th key={cellIndex} className="px-4 py-3 text-left text-white font-semibold border-b border-zinc-700">
                      {parseInlineMarkdown(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {bodyRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-zinc-800 hover:bg-zinc-800/30">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 text-zinc-300">
                      {parseInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      // Unsupported block type - show debug info in development
      if (process.env.NODE_ENV === 'development') {
        return (
          <div className="text-xs text-zinc-600 mb-2">
            [Unsupported: {block.type}]
          </div>
        );
      }
      return null;
  }
}

// Wrapper for list items (groups consecutive list items)
function renderBlocksWithLists(blocks: ParsedBlock[]): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let currentList: ParsedBlock[] = [];
  let listType: 'bulleted' | 'numbered' | null = null;

  const flushList = () => {
    if (currentList.length > 0) {
      const listKey = `${listType}-${currentList[0]?.id || result.length}`;
      if (listType === 'bulleted') {
        result.push(
          <ul key={listKey} className="mb-6 space-y-1 list-disc list-inside marker:text-yellow-500/50">
            {currentList.map((block) => (
              <Block key={block.id} block={block} />
            ))}
          </ul>
        );
      } else {
        result.push(
          <ol key={listKey} className="mb-6 space-y-1 list-decimal list-inside marker:text-yellow-500/50">
            {currentList.map((block) => (
              <Block key={block.id} block={block} />
            ))}
          </ol>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  for (const block of blocks) {
    if (block.type === 'bulleted_list_item') {
      if (listType !== 'bulleted') {
        flushList();
        listType = 'bulleted';
      }
      currentList.push(block);
    } else if (block.type === 'numbered_list_item') {
      if (listType !== 'numbered') {
        flushList();
        listType = 'numbered';
      }
      currentList.push(block);
    } else {
      flushList();
      result.push(<Block key={block.id} block={block} />);
    }
  }

  flushList();
  return result;
}

// Export for custom usage
export { renderBlocksWithLists };
