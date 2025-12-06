import { getArchitectureDocs, ArchitectureDoc } from '@/lib/notion/architecture';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { 
  ArrowRight, 
  ArrowLeft,
  Filter, 
  Layers, 
  Sparkles,
  Server,
  Database,
  Code2,
  Network,
  Workflow,
  ExternalLink
} from 'lucide-react';
import { DiagramLink } from './DiagramLink';

// ISR with 5-minute revalidation
export const revalidate = 300;

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

export default async function ArchitecturePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const allDocs = await getArchitectureDocs();
  
  // Sort: featured first, then by date
  const sortedDocs = [...allDocs].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Filter by type if specified
  let docs = sortedDocs;
  if (params.type) {
    docs = docs.filter(d => d.type === params.type);
  }

  // Get unique types for filters
  const types = [...new Set(allDocs.map(d => d.type))];
  const featuredDocs = docs.filter(d => d.featured);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium mb-4">
            <Layers size={16} />
            <span>Technical</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Architecture
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl">
            System designs, infrastructure patterns, and technical architecture documentation.
          </p>
          
          {/* Stats */}
          <div className="flex gap-8 mt-8 pt-8 border-t border-zinc-800/50">
            <div>
              <div className="text-2xl font-bold text-white">{allDocs.length}</div>
              <div className="text-sm text-zinc-500">Documents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">{featuredDocs.length}</div>
              <div className="text-sm text-zinc-500">Featured</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-400">{types.length}</div>
              <div className="text-sm text-zinc-500">Categories</div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-zinc-500 mr-2">
              <Filter size={14} />
              <span className="text-sm">Filter:</span>
            </div>
            
            <Link
              href="/architecture"
              className={cn(
                'px-3 py-1.5 text-sm rounded-full transition-colors',
                !params.type
                  ? 'bg-white text-zinc-900'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              )}
            >
              All
            </Link>
            
            {types.map((type) => (
              <Link
                key={type}
                href={`/architecture?type=${type}`}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5',
                  params.type === type
                    ? 'bg-cyan-500 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                )}
              >
                {TYPE_ICONS[type]}
                {TYPE_LABELS[type]}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {docs.length === 0 ? (
          <div className="text-center py-16">
            <Layers size={48} className="mx-auto mb-4 text-zinc-700" />
            <h2 className="text-xl font-semibold mb-2">No architecture docs found</h2>
            <p className="text-zinc-500 mb-6">Try adjusting your filters or check back later.</p>
            <Link
              href="/architecture"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <>
            {/* Featured Docs */}
            {featuredDocs.length > 0 && !params.type && (
              <section className="mb-16">
                <h2 className="flex items-center gap-2 text-xl font-semibold mb-6 text-yellow-400">
                  <Sparkles size={20} />
                  Featured
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredDocs.map((doc) => (
                    <ArchitectureCard key={doc.id} doc={doc} featured />
                  ))}
                </div>
              </section>
            )}

            {/* All Docs */}
            <section>
              {featuredDocs.length > 0 && !params.type && (
                <h2 className="text-xl font-semibold mb-6">All Architecture</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(params.type ? docs : docs.filter(d => !d.featured)).map((doc) => (
                  <ArchitectureCard key={doc.id} doc={doc} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

// Architecture Card Component
function ArchitectureCard({ doc, featured = false }: { doc: ArchitectureDoc; featured?: boolean }) {
  return (
    <Link
      href={`/architecture/${doc.slug}`}
      className={cn(
        'group relative overflow-hidden rounded-xl border transition-all duration-300',
        featured
          ? 'bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-700 hover:border-zinc-600'
          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
      )}
    >
      {/* Cover Image or Gradient */}
      {doc.coverImage ? (
        <div className="aspect-video relative overflow-hidden">
          <Image
            src={doc.coverImage}
            alt={doc.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
        </div>
      ) : (
        <div className="aspect-video relative bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
          <div className="text-zinc-700">
            {TYPE_ICONS[doc.type] ? (
              <div className="scale-[3]">{TYPE_ICONS[doc.type]}</div>
            ) : (
              <Layers size={48} />
            )}
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Type Badge */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ring-1',
            TYPE_COLORS[doc.type]
          )}>
            {TYPE_ICONS[doc.type]}
            {TYPE_LABELS[doc.type]}
          </span>
          {doc.featured && !featured && (
            <span className="text-amber-400 text-xs">Featured</span>
          )}
        </div>

        {/* Title */}
        <h3 className={cn(
          'font-semibold mb-2 group-hover:text-cyan-400 transition-colors',
          featured ? 'text-xl' : 'text-lg'
        )}>
          {doc.title}
        </h3>

        {/* Description */}
        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
          {doc.description}
        </p>

        {/* Tech Stack */}
        {doc.techStack.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {doc.techStack.slice(0, 4).map(tech => (
              <span key={tech} className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded">
                {tech}
              </span>
            ))}
            {doc.techStack.length > 4 && (
              <span className="text-xs text-zinc-600">+{doc.techStack.length - 4}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
          {doc.diagramUrl && (
            <DiagramLink url={doc.diagramUrl} />
          )}
          <span className="text-sm text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1 transition-colors ml-auto">
            Explore
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}
