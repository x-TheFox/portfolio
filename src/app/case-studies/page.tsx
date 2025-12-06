import { Suspense } from 'react';
import { getCaseStudies, CaseStudy } from '@/lib/notion/case-studies';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { 
  ArrowRight, 
  ArrowLeft,
  Filter, 
  FileText, 
  Search, 
  Sparkles,
  Building2,
  Calendar,
  Palette,
  Code,
  Briefcase,
  Layers
} from 'lucide-react';

// ISR with 5-minute revalidation
export const revalidate = 300;

const TYPE_ICONS: Record<CaseStudy['type'], React.ReactNode> = {
  'product-design': <Palette size={16} />,
  'system-design': <Code size={16} />,
  'ux-research': <Search size={16} />,
  'branding': <Layers size={16} />,
  'full-project': <Briefcase size={16} />,
};

const TYPE_LABELS: Record<CaseStudy['type'], string> = {
  'product-design': 'Product Design',
  'system-design': 'System Design',
  'ux-research': 'UX Research',
  'branding': 'Branding',
  'full-project': 'Full Project',
};

const INDUSTRY_COLORS: Record<CaseStudy['industry'], string> = {
  tech: 'bg-blue-500/20 text-blue-400 ring-blue-500/30',
  finance: 'bg-green-500/20 text-green-400 ring-green-500/30',
  healthcare: 'bg-red-500/20 text-red-400 ring-red-500/30',
  retail: 'bg-orange-500/20 text-orange-400 ring-orange-500/30',
  gaming: 'bg-purple-500/20 text-purple-400 ring-purple-500/30',
  other: 'bg-zinc-500/20 text-zinc-400 ring-zinc-500/30',
};

export default async function CaseStudiesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; industry?: string }>;
}) {
  const params = await searchParams;
  const allCaseStudies = await getCaseStudies();
  
  // Sort: featured first, then by date
  const sortedStudies = [...allCaseStudies].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Filter by type/industry if specified
  let caseStudies = sortedStudies;
  if (params.type) {
    caseStudies = caseStudies.filter(cs => cs.type === params.type);
  }
  if (params.industry) {
    caseStudies = caseStudies.filter(cs => cs.industry === params.industry);
  }

  // Get unique types and industries for filters
  const types = [...new Set(allCaseStudies.map(cs => cs.type))];
  const industries = [...new Set(allCaseStudies.map(cs => cs.industry))];
  const featuredStudies = caseStudies.filter(cs => cs.featured);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2 text-purple-400 text-sm font-medium mb-4">
            <FileText size={16} />
            <span>Documentation</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Case Studies
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl">
            Deep dives into real projects — exploring problems, process, and outcomes.
          </p>
          
          {/* Stats */}
          <div className="flex gap-8 mt-8 pt-8 border-t border-zinc-800/50">
            <div>
              <div className="text-2xl font-bold text-white">{allCaseStudies.length}</div>
              <div className="text-sm text-zinc-500">Case Studies</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">{featuredStudies.length}</div>
              <div className="text-sm text-zinc-500">Featured</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{industries.length}</div>
              <div className="text-sm text-zinc-500">Industries</div>
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
              href="/case-studies"
              className={cn(
                'px-3 py-1.5 text-sm rounded-full transition-colors',
                !params.type && !params.industry
                  ? 'bg-white text-zinc-900'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              )}
            >
              All
            </Link>
            
            {types.map((type) => (
              <Link
                key={type}
                href={`/case-studies?type=${type}`}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5',
                  params.type === type
                    ? 'bg-purple-500 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                )}
              >
                {TYPE_ICONS[type]}
                {TYPE_LABELS[type]}
              </Link>
            ))}
          </div>
          
          {/* Industry filters */}
          {industries.length > 1 && (
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-zinc-800/50">
              <span className="text-sm text-zinc-500">Industry:</span>
              {industries.map((industry) => (
                <Link
                  key={industry}
                  href={`/case-studies?industry=${industry}`}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full transition-colors capitalize',
                    params.industry === industry
                      ? 'bg-white text-zinc-900'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  )}
                >
                  {industry}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Case Studies Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {caseStudies.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto mb-4 text-zinc-700" />
            <h2 className="text-xl font-semibold mb-2">No case studies found</h2>
            <p className="text-zinc-500 mb-6">Try adjusting your filters or check back later.</p>
            <Link
              href="/case-studies"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <>
            {/* Featured Case Studies */}
            {featuredStudies.length > 0 && !params.type && !params.industry && (
              <section className="mb-16">
                <h2 className="flex items-center gap-2 text-xl font-semibold mb-6 text-yellow-400">
                  <Sparkles size={20} />
                  Featured
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredStudies.map((study) => (
                    <CaseStudyCard key={study.id} study={study} featured />
                  ))}
                </div>
              </section>
            )}

            {/* All Case Studies */}
            <section>
              {featuredStudies.length > 0 && !params.type && !params.industry && (
                <h2 className="text-xl font-semibold mb-6">All Case Studies</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(params.type || params.industry ? caseStudies : caseStudies.filter(cs => !cs.featured)).map((study) => (
                  <CaseStudyCard key={study.id} study={study} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

// Case Study Card Component
function CaseStudyCard({ study, featured = false }: { study: CaseStudy; featured?: boolean }) {
  return (
    <Link
      href={`/case-studies/${study.slug}`}
      className={cn(
        'group relative overflow-hidden rounded-xl border transition-all duration-300',
        featured
          ? 'bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-700 hover:border-zinc-600'
          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
      )}
    >
      {/* Cover Image */}
      {study.coverImage && (
        <div className="aspect-video relative overflow-hidden">
          <Image
            src={study.coverImage}
            alt={study.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
        </div>
      )}

      <div className="p-6">
        {/* Type and Industry Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs">
            {TYPE_ICONS[study.type]}
            {TYPE_LABELS[study.type]}
          </span>
          <span className={cn(
            'px-2.5 py-1 rounded-full text-xs capitalize ring-1',
            INDUSTRY_COLORS[study.industry]
          )}>
            {study.industry}
          </span>
        </div>

        {/* Title */}
        <h3 className={cn(
          'font-semibold mb-2 group-hover:text-purple-400 transition-colors',
          featured ? 'text-xl' : 'text-lg'
        )}>
          {study.title}
        </h3>

        {/* Client */}
        {study.client && (
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-3">
            <Building2 size={14} />
            {study.client}
          </div>
        )}

        {/* Description */}
        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
          {study.description}
        </p>

        {/* Tags */}
        {study.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {study.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
            {study.tags.length > 3 && (
              <span className="text-xs text-zinc-600">+{study.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
          {study.date && (
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Calendar size={12} />
              {new Date(study.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          )}
          <span className="text-sm text-purple-400 group-hover:text-purple-300 flex items-center gap-1 transition-colors">
            Read more
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}
