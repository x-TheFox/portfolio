// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NotionRenderer } from './NotionRenderer';

describe('NotionRenderer inline parsing', () => {
  it('converts markdown-style heading in paragraph to a heading element and unescapes dot', () => {
    const blocks = [{ id: 'h1', type: 'paragraph', content: '#### 1\\. Visitor Experience & Tracking Loop' }];
    render(<NotionRenderer blocks={blocks as any} />);
    const heading = screen.getByText('1. Visitor Experience & Tracking Loop');
    expect(heading).toBeTruthy();
  });

  it('renders inline LaTeX inside paragraphs and inside bold', async () => {
    const blocks = [
      { id: 'm1', type: 'paragraph', content: '$< 1 \\text{ms}$ speed' },
      { id: 'm2', type: 'paragraph', content: '**$<50 \\text{ms}$ latency**' },
    ];
    const { container } = render(<NotionRenderer blocks={blocks as any} />);

    // Inline math exists somewhere in the DOM
    const matches = await screen.findAllByText((content, node) => node?.textContent?.includes('\\lt 1') ?? false);
    expect(matches.length).toBeGreaterThan(0);

    // For bold-wrapped math, ensure KaTeX element exists inside a <strong>
    const strongs = Array.from(container.querySelectorAll('strong'));
    const foundInsideStrong = strongs.some(s => s.querySelector('.katex'));
    expect(foundInsideStrong).toBe(true);
  });
});