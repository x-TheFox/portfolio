'use client';

import { ExternalLink } from 'lucide-react';

export function DiagramLink({ url }: { url: string }) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
    >
      <ExternalLink size={12} />
      View Diagram
    </button>
  );
}
