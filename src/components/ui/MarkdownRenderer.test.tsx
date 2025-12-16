// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MarkdownRenderer } from './MarkdownRenderer';

vi.mock('@/components/ui/MermaidDiagram', () => ({
  MermaidDiagram: ({ chart }: any) => <div data-testid="mermaid">{chart}</div>,
}));

describe('MarkdownRenderer', () => {
  it('renders mermaid fenced blocks as MermaidDiagram', async () => {
    render(<MarkdownRenderer content={`\`\`\`mermaid
graph TD
A-->B
\`\`\``} />);
    const el = await screen.findByTestId('mermaid');
    expect(el).toBeDefined();
    expect(el.textContent).toContain('graph TD');
  });

  it('renders block math with KaTeX', () => {
    const { container } = render(<MarkdownRenderer content={'$$E=mc^2$$'} />);
    const katex = container.querySelector('.katex');
    expect(katex).toBeTruthy();
  });
});
