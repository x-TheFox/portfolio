import { notFound } from 'next/navigation';
import { getArchitectureDocBySlug, getAllArchitectureDocSlugs, getArchitectureDocs } from '@/lib/notion/architecture';
import { NotionRenderer } from '@/components/notion';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  ArrowRight, 
  ExternalLink, 
  Sparkles,
  Server,
  Database,
  Code2,
  Network,
  Workflow,
  Layers
} from 'lucide-react';
import { ArchitectureDoc } from '@/lib/notion/architecture';
import { ArchitectureDiagramViewer } from './ArchitectureDiagramViewer';

// ISR with 5-minute revalidation
export const revalidate = 300;

// Use dynamic rendering
export const dynamic = 'force-dynamic';

const TYPE_ICONS: Record<ArchitectureDoc['type'], React.ReactNode> = {
  'system-design': <Network size={16} />,
  'infrastructure': <Server size={16} />,
  'api-design': <Code2 size={16} />,
  'data-model': <Database size={16} />,
  'methodology': <Workflow size={16} />,
};

const TYPE_LABELS: Record<ArchitectureDoc['type'], string> = {
  'system-design': 'System Design',
  'infrastructure': 'Infrastructure',
  'api-design': 'API Design',
  'data-model': 'Data Model',
  'methodology': 'Methodology',
};

const TYPE_COLORS: Record<ArchitectureDoc['type'], string> = {
  'system-design': 'bg-blue-500/20 text-blue-400 ring-blue-500/30',
  'infrastructure': 'bg-orange-500/20 text-orange-400 ring-orange-500/30',
  'api-design': 'bg-green-500/20 text-green-400 ring-green-500/30',
  'data-model': 'bg-purple-500/20 text-purple-400 ring-purple-500/30',
  'methodology': 'bg-cyan-500/20 text-cyan-400 ring-cyan-500/30',
};

// Generate static paths
export async function generateStaticParams() {
  try {
    const slugs = await getAllArchitectureDocSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function ArchitectureDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await getArchitectureDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  // Get related docs (same type, excluding current)
  const allDocs = await getArchitectureDocs();
  const relatedDocs = allDocs
    .filter(d => d.type === doc.type && d.id !== doc.id)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
        
        {/* Back link */}
        <div className="relative max-w-5xl mx-auto px-6 pt-8">
          <Link
            href="/architecture"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to architecture
          </Link>
        </div>

        {/* Header */}
        <header className="relative max-w-5xl mx-auto px-6 py-12 md:py-16">
          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ring-1',
              TYPE_COLORS[doc.type]
            )}>
              {TYPE_ICONS[doc.type]}
              {TYPE_LABELS[doc.type]}
            </span>
            
            {doc.featured && (
              <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30 flex items-center gap-1.5">
                <Sparkles size={14} />
                Featured
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
            {doc.title}
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-3xl leading-relaxed">
            {doc.description}
          </p>

          {/* Tech Stack */}
          {doc.techStack.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {doc.techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-4 py-2 text-sm bg-zinc-800/80 text-zinc-300 rounded-full border border-zinc-700/50 hover:border-zinc-600 transition-colors"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          {/* Diagram Link */}
          {doc.diagramUrl && (
            <a
              href={doc.diagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
            >
              <Layers size={18} />
              View Full Diagram
              <ExternalLink size={14} />
            </a>
          )}
        </header>
      </div>

      {/* Cover image */}
      {doc.coverImage && (
        <div className="max-w-6xl mx-auto px-6 mb-16">
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl shadow-black/50 aspect-video">
            <Image
              src={doc.coverImage}
              alt={doc.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
          </div>
        </div>
      )}

      {/* Diagram Viewer (if available) */}
      {doc.diagramUrl && (
        <div className="max-w-5xl mx-auto px-6 mb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Layers size={20} />
              Architecture Diagram
            </h2>
            <a
              href={doc.diagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm"
            >
              <ExternalLink size={16} />
              Open Full Size
            </a>
          </div>
          <ArchitectureDiagramViewer diagramUrl={doc.diagramUrl} title={doc.title} />
        </div>
      )}

      {/* Content */}
      <article className="max-w-4xl mx-auto px-6 pb-16">
        {doc.content && doc.content.length > 0 ? (
          <div className="prose prose-lg prose-invert prose-zinc max-w-none">
            <NotionRenderer blocks={doc.content} />
          </div>
        ) : (
          <div className="text-center py-16 px-8 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <p className="text-zinc-500">This architecture document doesn&apos;t have additional content yet.</p>
            {doc.diagramUrl && (
              <a
                href={doc.diagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View the diagram instead
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        )}
      </article>

      {/* Related Docs */}
      {relatedDocs.length > 0 && (
        <section className="border-t border-zinc-800 bg-zinc-900/30">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <h2 className="text-2xl font-bold text-white mb-8">More {TYPE_LABELS[doc.type]}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedDocs.map((related) => (
                <Link
                  key={related.id}
                  href={`/architecture/${related.slug}`}
                  className="group block p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:-translate-y-1"
                >
                  {related.coverImage && (
                    <div className="aspect-video rounded-lg overflow-hidden mb-4 relative">
                      <Image
                        src={related.coverImage}
                        alt={related.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors mb-1">
                    {related.title}
                  </h3>
                  <p className="text-sm text-zinc-500 line-clamp-2">
                    {related.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer navigation */}
      <footer className="border-t border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-8 flex justify-between items-center">
          <Link
            href="/architecture"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            All architecture
          </Link>
          <Link
            href="/intake"
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
          >
            Work with me
            <ArrowRight size={16} />
          </Link>
        </div>
      </footer>
    </main>
  );
}
