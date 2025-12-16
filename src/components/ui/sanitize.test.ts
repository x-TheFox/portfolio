import { describe, it, expect } from 'vitest';
import { sanitizeContent } from './MarkdownRenderer';

describe('sanitizeContent', () => {
  it('replaces < and > inside math with \\lt and \\gt', () => {
    const input = '$< 1 \\text{ms}$ speed (';
    const output = sanitizeContent(input);
    expect(output).toBe('$\\lt 1 \\text{ms}$ speed (');
  });

  it('works with $< 50 \\text{ms}$ "', () => {
    const input = '$< 50 \\text{ms}$ "';
    const output = sanitizeContent(input);
    expect(output).toBe('$\\lt 50 \\text{ms}$ "');
  });

  it('preserves \"\\mathbf\" and \"\\sim\" math', () => {
    const inputs = ['$\\mathbf{840}$', '$\\sim 1 \\text{ms}$'];
    for (const input of inputs) {
      expect(sanitizeContent(input)).toBe(input);
    }
  });

  it('handles block math with < and > using $$', () => {
    const input = '$$< 1 \\text{ms}$$ speed';
    const output = sanitizeContent(input);
    expect(output).toBe('$$\\lt 1 \\text{ms}$$ speed');

    const multiLine = '$$\n< 1 \\text{ms}\n$$';
    const multiOut = sanitizeContent(multiLine);
    expect(multiOut).toContain('\\lt 1 \\text{ms}');
  });

  it('unescapes heading dots', () => {
    const input = '#### 2\\. Chatbot with Tool Calling';
    const output = sanitizeContent(input);
    expect(output).toBe('#### 2. Chatbot with Tool Calling');
  });
});