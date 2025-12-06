'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LaTeXProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
}

export function LaTeX({ formula, displayMode = false, className = '' }: LaTeXProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(formula, containerRef.current, {
          displayMode,
          throwOnError: false,
          trust: true,
          strict: false,
        });
      } catch (error) {
        console.error('KaTeX render error:', error);
        containerRef.current.textContent = formula;
      }
    }
  }, [formula, displayMode]);

  if (displayMode) {
    return (
      <div className={`my-6 overflow-x-auto ${className}`}>
        <span ref={containerRef} className="text-zinc-200" />
      </div>
    );
  }

  return <span ref={containerRef} className={`text-zinc-200 ${className}`} />;
}

// Block-level LaTeX ($$...$$)
export function LaTeXBlock({ formula, className = '' }: { formula: string; className?: string }) {
  return <LaTeX formula={formula} displayMode className={className} />;
}

// Inline LaTeX ($...$)
export function LaTeXInline({ formula, className = '' }: { formula: string; className?: string }) {
  return <LaTeX formula={formula} displayMode={false} className={className} />;
}
