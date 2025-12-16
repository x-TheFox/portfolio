import { describe, it, expect } from 'vitest';
import { parseBlocks } from './blocks';

describe('parseBlocks', () => {
  it('maps Notion code block with language mermaid to mermaid block', () => {
    const blocks: any[] = [
      {
        id: '1',
        type: 'code',
        code: {
          rich_text: [{ plain_text: 'graph TD\nA-->B' }],
          language: 'mermaid',
          caption: [],
        },
      },
    ];

    const parsed = parseBlocks(blocks as any);
    expect(parsed[0].type).toBe('mermaid');
    expect(parsed[0].content).toBe('graph TD\nA-->B');
  });

  it('parses Notion equation block to equation type', () => {
    const blocks: any[] = [
      {
        id: '2',
        type: 'equation',
        equation: {
          expression: 'E=mc^2',
        },
      },
    ];

    const parsed = parseBlocks(blocks as any);
    expect(parsed[0].type).toBe('equation');
    expect(parsed[0].content).toBe('E=mc^2');
  });
});
