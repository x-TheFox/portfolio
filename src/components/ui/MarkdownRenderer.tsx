'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import dynamic from 'next/dynamic';

// Dynamically import MermaidDiagram to avoid SSR issues
const MermaidDiagram = dynamic(
  () => import('@/components/ui/MermaidDiagram').then(mod => mod.MermaidDiagram),
  {
    ssr: false,
    loading: () => <div className="text-zinc-500">Loading diagram...</div>,
  }
);
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  compact?: boolean;
}

export function sanitizeContent(input: string) {
  if (!input) return input;

  function replaceAngleBrackets(s: string) {
    return s
      .replace(/\\u003c/g, '\\lt')
      .replace(/\\u003e/g, '\\gt')
      .replace(/&lt;|&#60;|&#x3c;/gi, '\\lt')
      .replace(/&gt;|&#62;|&#x3e;/gi, '\\gt')
      .replace(/</g, '\\lt')
      .replace(/>/g, '\\gt');
  }

  // Replace < and > inside inline and block math (handles $$ and $)
  const mathFixed = input.replace(/(\${1,2})([\s\S]*?)\1/gm, (_match, delim, body) => {
    const fixedBody = replaceAngleBrackets(body);
    return `${delim}${fixedBody}${delim}`;
  });

  // Unescape \\.(backslash dot) in headings so "#### 2\\. Title" becomes "#### 2. Title"
  const headingFixed = mathFixed.replace(/(^|\n)(#{1,6}\s[^\n]*?)\\\./g, '$1$2.');

  return headingFixed;
}

export function MarkdownRenderer({ content, className, compact = false }: MarkdownRendererProps) {
  const safeContent = sanitizeContent(content);

  return (
    <div
      className={cn(
        'markdown-content',
        compact ? 'prose-sm' : 'prose prose-lg',
        'prose-invert max-w-none',
        'prose-headings:text-white prose-headings:font-semibold',
        'prose-p:text-zinc-300 prose-p:leading-relaxed',
        'prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline prose-a:transition-colors',
        'prose-strong:text-white prose-strong:font-semibold',
        'prose-em:text-zinc-200 prose-em:italic',
        // removed inline prose-code styles to let the custom inline code component control styling
        'prose-pre:bg-zinc-900/90 prose-pre:border prose-pre:border-zinc-700/50 prose-pre:rounded-xl prose-pre:shadow-lg prose-pre:shadow-cyan-500/5',
        'prose-blockquote:border-l-cyan-500 prose-blockquote:bg-zinc-800/30 prose-blockquote:rounded-r-lg prose-blockquote:py-1',
        'prose-ul:text-zinc-300 prose-ol:text-zinc-300',
        'prose-li:marker:text-cyan-500',
        'prose-hr:border-zinc-700',
        'prose-table:text-zinc-300',
        'prose-th:text-white prose-th:bg-zinc-800/50 prose-th:border-zinc-700',
        'prose-td:border-zinc-700',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeKatex,
          rehypeHighlight,
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
        ]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent animate-fadeIn">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-white animate-fadeIn animation-delay-100">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-white animate-fadeIn animation-delay-200">
              {children}
            </h3>
          ),
          pre: ({ children }) => (
            <pre className="relative group overflow-hidden bg-zinc-900/90 border border-zinc-700/50 rounded-xl p-4">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {children}
            </pre>
          ),
          code: ({ className, children }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="text-cyan-300 bg-zinc-800/80 px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }
            const match = /language-(\w+)/.exec(className || '');
            const lang = match?.[1];
            const codeText = String(children).replace(/\n$/, '');
            if (lang === 'mermaid') {
              return <MermaidDiagram chart={codeText} />;
            }
            return (
              <code className={cn(className, 'font-mono text-sm')}>
                {children}
              </code>
            );
          },

          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-cyan-500/50 pl-4 italic text-zinc-400 bg-zinc-800/20 rounded-r-lg py-2 animate-fadeIn">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-zinc-700/50 shadow-lg">
              <table className="w-full">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-white bg-zinc-800/70 border-b border-zinc-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-zinc-300 border-b border-zinc-800/50">
              {children}
            </td>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-cyan-400 hover:text-cyan-300 transition-colors underline-offset-4 hover:underline"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="space-y-2 list-disc list-inside marker:text-cyan-500">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-2 list-decimal list-inside marker:text-cyan-500">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-zinc-300">
              {children}
            </li>
          ),
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
}
