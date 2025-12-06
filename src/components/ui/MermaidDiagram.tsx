'use client';

import { useEffect, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#3b82f6',
    primaryTextColor: '#fff',
    primaryBorderColor: '#3b82f6',
    lineColor: '#6b7280',
    secondaryColor: '#1f2937',
    tertiaryColor: '#374151',
    background: '#18181b',
    mainBkg: '#18181b',
    nodeBorder: '#3b82f6',
    clusterBkg: '#1f2937',
    clusterBorder: '#374151',
    titleColor: '#fff',
    edgeLabelBackground: '#1f2937',
  },
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
});

export function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart?.trim()) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the mermaid diagram
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      } finally {
        setIsLoading(false);
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className={`my-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 ${className || ''}`}>
        <p className="text-red-400 text-sm font-medium mb-2">Failed to render diagram</p>
        <pre className="text-xs text-red-300/70 overflow-x-auto">{error}</pre>
        <details className="mt-2">
          <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400">Show source</summary>
          <pre className="mt-2 text-xs text-zinc-400 bg-zinc-900 p-2 rounded overflow-x-auto">{chart}</pre>
        </details>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`my-6 p-8 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-center ${className || ''}`}>
        <div className="animate-pulse text-zinc-500">Loading diagram...</div>
      </div>
    );
  }

  if (!svg) {
    return null;
  }

  return (
    <div 
      className={`my-6 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-x-auto ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
