'use client';

import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2, X, Download, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Dynamically import react-pdf components to avoid SSR issues
const Document = dynamic(
  () => import('react-pdf').then(mod => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import('react-pdf').then(mod => mod.Page),
  { ssr: false }
);

// Configure PDF.js worker only on client side
if (typeof window !== 'undefined') {
  import('react-pdf').then(({ pdfjs }) => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  });
}

interface PdfViewerProps {
  url: string;
  title?: string;
  onClose?: () => void;
  initialPage?: number;
  className?: string;
  embedded?: boolean; // If true, shows inline without modal styling
}

export function PdfViewer({ 
  url, 
  title, 
  onClose, 
  initialPage = 1,
  className = '',
  embedded = false 
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [cssLoaded, setCssLoaded] = useState(false);

  // Load react-pdf CSS on client side
  useEffect(() => {
    // @ts-expect-error - Dynamic CSS import for client-side only
    import('react-pdf/dist/Page/AnnotationLayer.css');
    // @ts-expect-error - Dynamic CSS import for client-side only
    import('react-pdf/dist/Page/TextLayer.css');
    setCssLoaded(true);
  }, []);

  // Cache PDF data with react-query
  const { data: pdfData, isLoading, error } = useQuery({
    queryKey: ['pdf', url],
    queryFn: async () => {
      const response = await fetch(url);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
  });

  // Handle container resize
  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById('pdf-container');
      if (container) {
        setContainerWidth(container.clientWidth - 48); // Padding
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [isFullscreen]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfData) {
        URL.revokeObjectURL(pdfData);
      }
    };
  }, [pdfData]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));
  
  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  
  const toggleFullscreen = () => setIsFullscreen(prev => !prev);

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-zinc-900'
    : embedded
      ? `relative bg-zinc-100 dark:bg-zinc-900 rounded-lg ${className}`
      : `relative bg-zinc-100 dark:bg-zinc-900 rounded-lg shadow-xl ${className}`;

  if (error) {
    return (
      <div className={`${containerClasses} flex items-center justify-center p-8`}>
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load PDF</p>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Open in new tab
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses} id="pdf-container">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 rounded-t-lg">
        <div className="flex items-center gap-4">
          {title && (
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">
              {title}
            </h3>
          )}
          <span className="text-sm text-zinc-500">
            {numPages > 0 ? `Page ${pageNumber} of ${numPages}` : 'Loading...'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border-l border-zinc-300 dark:border-zinc-600 pl-2">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-sm text-zinc-600 dark:text-zinc-400 w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              disabled={scale >= 3}
              className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
          </div>

          {/* Fullscreen & Download */}
          <div className="flex items-center gap-1 border-l border-zinc-300 dark:border-zinc-600 pl-2">
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <a
              href={url}
              download
              className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
              aria-label="Download PDF"
            >
              <Download size={18} />
            </a>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 ml-1"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div 
        className={`overflow-auto ${isFullscreen ? 'h-[calc(100vh-56px)]' : embedded ? 'h-[600px]' : 'h-[70vh]'} flex justify-center bg-zinc-200 dark:bg-zinc-950`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : pdfData ? (
          <Document
            file={pdfData}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
              </div>
            }
            error={
              <div className="flex items-center justify-center h-full text-red-500">
                Failed to load PDF
              </div>
            }
            className="py-4"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              width={Math.min(containerWidth, 900)}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg"
            />
          </Document>
        ) : null}
      </div>

      {/* Mobile Page Navigation */}
      {numPages > 1 && (
        <div className="md:hidden flex items-center justify-center gap-4 py-3 bg-zinc-100 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 rounded-b-lg">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            {pageNumber} / {numPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default PdfViewer;
