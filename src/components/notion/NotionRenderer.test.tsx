// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotionRenderer } from './NotionRenderer';

vi.mock('@/components/ui/MermaidDiagram', () => ({
  MermaidDiagram: ({ chart }: any) => <div data-testid="mermaid">{chart}</div>,
}));

vi.mock('@/components/ui/LaTeX', () => ({
  LaTeXBlock: ({ formula }: any) => <div data-testid="latex">{formula}</div>,
  LaTeXInline: ({ formula }: any) => <span data-testid="latex-inline">{formula}</span>,
}));

describe('NotionRenderer', () => {
  it('renders mermaid blocks', async () => {
    const blocks = [{ id: 'm1', type: 'mermaid', content: 'graph TD\nA-->B' }];
    render(<NotionRenderer blocks={blocks as any} />);
    const el = await screen.findByTestId('mermaid');
    expect(el).toBeDefined();
    expect(el.textContent).toContain('graph TD');
  });

  it('renders equation blocks via LaTeXBlock', async () => {
    const blocks = [{ id: 'e1', type: 'equation', content: 'x^2' }];
    render(<NotionRenderer blocks={blocks as any} />);
    const el = await screen.findByTestId('latex');
    expect(el).toBeDefined();
    expect(el.textContent).toBe('x^2');
  });
});
