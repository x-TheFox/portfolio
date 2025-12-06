'use client';

import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

// Dynamically import PdfViewer to avoid SSR issues with react-pdf
const PdfViewer = dynamic(
  () => import('@/components/ui/PdfViewer').then(mod => mod.PdfViewer),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[600px] bg-zinc-900 rounded-lg flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading PDF viewer...</div>
      </div>
    )
  }
);

interface CaseStudyPdfViewerProps {
  url: string;
  title: string;
}

export function CaseStudyPdfViewer({ url, title }: CaseStudyPdfViewerProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 30, // 30 minutes
        gcTime: 1000 * 60 * 60, // 1 hour
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <PdfViewer url={url} title={title} embedded />
    </QueryClientProvider>
  );
}
