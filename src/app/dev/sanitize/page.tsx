'use client';

import React from 'react';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

export default function DevSanitizePage() {
  const inline = `$< 1 \\text{ms}$ speed (`;
  const singleLineBlock = `$$< 50 \\text{ms}$$`;
  const multiLineBlock = `$$
< 1 \\text{ms}
$$`;
  const encodedBlock = `$$\\u003c 100 \\text{ms}$$`;
  const htmlEntityBlock = `$$&lt; 200 \\text{ms}$$`;
  const testContent = `${inline}\n\n${singleLineBlock}\n\n${multiLineBlock}\n\n${encodedBlock}\n\n${htmlEntityBlock}`;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sanitizer Test</h1>
      <div id="raw-content" className="mb-4">
        <strong>Raw:</strong> <pre>{testContent}</pre>
      </div>
      <div id="rendered-content">
        <strong>Rendered:</strong>
        <MarkdownRenderer content={testContent} />
      </div>
    </div>
  );
}
