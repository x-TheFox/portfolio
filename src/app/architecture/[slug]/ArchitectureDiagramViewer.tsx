'use client';

import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import Image from 'next/image';

// Dynamically import PdfViewer to avoid SSR issues with react-pdf
const PdfViewer = dynamic(
  () => import('@/components/ui/PdfViewer').then(mod => mod.PdfViewer),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[600px] bg-zinc-900 rounded-lg flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading viewer...</div>
      </div>
    )
  }
);

interface ArchitectureDiagramViewerProps {
  diagramUrl: string;
  title: string;
}

export function ArchitectureDiagramViewer({ diagramUrl, title }: ArchitectureDiagramViewerProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 30, // 30 minutes
        gcTime: 1000 * 60 * 60, // 1 hour
      },
    },
  }));

  // Check if it's a PDF or an image
  const isPdf = diagramUrl.toLowerCase().endsWith('.pdf') || diagramUrl.includes('/f/') || diagramUrl.includes('uploadthing');
  
  // For PDFs, use the PDF viewer
  if (isPdf) {
    return (
      <QueryClientProvider client={queryClient}>
        <PdfViewer url={diagramUrl} title={title} embedded />
      </QueryClientProvider>
    );
  }

  // For images, display directly
  return (
    <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/50">
      <div className="relative aspect-video">
        <Image
          src={diagramUrl}
          alt={`${title} diagram`}
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
}
