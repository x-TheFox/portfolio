import { notFound } from 'next/navigation';
import { getCaseStudyBySlug, getAllCaseStudySlugs, getCaseStudies } from '@/lib/notion/case-studies';
import { NotionRenderer } from '@/components/notion';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  ArrowRight, 
  Calendar, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  Building2,
  Download,
  Palette,
  Code,
  Search,
  Briefcase,
  Layers
} from 'lucide-react';
import { CaseStudy } from '@/lib/notion/case-studies';
import { CaseStudyPdfViewer } from './CaseStudyPdfViewer';

// ISR with 5-minute revalidation
export const revalidate = 300;

// Use dynamic rendering
export const dynamic = 'force-dynamic';

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

// Generate static paths
export async function generateStaticParams() {
  try {
    const slugs = await getAllCaseStudySlugs();
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = await getCaseStudyBySlug(slug);

  if (!caseStudy) {
    notFound();
  }

  // Get related case studies (same type, excluding current)
  const allCaseStudies = await getCaseStudies();
  const relatedStudies = allCaseStudies
    .filter(cs => cs.type === caseStudy.type && cs.id !== caseStudy.id)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        
        {/* Back link */}
        <div className="relative max-w-5xl mx-auto px-6 pt-8">
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to case studies
          </Link>
        </div>

        {/* Header */}
        <header className="relative max-w-5xl mx-auto px-6 py-12 md:py-16">
          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-300 text-sm">
              {TYPE_ICONS[caseStudy.type]}
              {TYPE_LABELS[caseStudy.type]}
            </span>
            
            <span className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-full capitalize ring-1',
              INDUSTRY_COLORS[caseStudy.industry]
            )}>
              {caseStudy.industry}
            </span>
            
            {caseStudy.featured && (
              <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30 flex items-center gap-1.5">
                <Sparkles size={14} />
                Featured
              </span>
            )}
            
            {caseStudy.date && (
              <span className="flex items-center gap-1.5 text-sm text-zinc-500">
                <Calendar size={14} />
                {new Date(caseStudy.date).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
            {caseStudy.title}
          </h1>

          {/* Client */}
          {caseStudy.client && (
            <div className="flex items-center gap-2 text-zinc-400 text-lg mb-4">
              <Building2 size={18} />
              {caseStudy.client}
            </div>
          )}

          {/* Description */}
          <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-3xl leading-relaxed">
            {caseStudy.description}
          </p>

          {/* Tags */}
          {caseStudy.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {caseStudy.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 text-sm bg-zinc-800/80 text-zinc-300 rounded-full border border-zinc-700/50 hover:border-zinc-600 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>
      </div>

      {/* Cover image */}
      {caseStudy.coverImage && (
        <div className="max-w-6xl mx-auto px-6 mb-16">
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl shadow-black/50 aspect-video">
            <Image
              src={caseStudy.coverImage}
              alt={caseStudy.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
          </div>
        </div>
      )}

      {/* PDF Viewer (if available) */}
      {caseStudy.pdfUrl && (
        <div className="max-w-5xl mx-auto px-6 mb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText size={20} />
              Case Study Document
            </h2>
            <a
              href={caseStudy.pdfUrl}
              download
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm"
            >
              <Download size={16} />
              Download PDF
            </a>
          </div>
          <CaseStudyPdfViewer url={caseStudy.pdfUrl} title={caseStudy.title} />
        </div>
      )}

      {/* Content */}
      <article className="max-w-4xl mx-auto px-6 pb-16">
        {caseStudy.content && caseStudy.content.length > 0 ? (
          <div className="prose prose-lg prose-invert prose-zinc max-w-none">
            <NotionRenderer blocks={caseStudy.content} />
          </div>
        ) : !caseStudy.pdfUrl ? (
          <div className="text-center py-16 px-8 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <p className="text-zinc-500">This case study doesn&apos;t have additional content yet.</p>
          </div>
        ) : null}
      </article>

      {/* Related Case Studies */}
      {relatedStudies.length > 0 && (
        <section className="border-t border-zinc-800 bg-zinc-900/30">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <h2 className="text-2xl font-bold text-white mb-8">More {TYPE_LABELS[caseStudy.type]} case studies</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedStudies.map((related) => (
                <Link
                  key={related.id}
                  href={`/case-studies/${related.slug}`}
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
                  <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors mb-1">
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
            href="/case-studies"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            All case studies
          </Link>
          <Link
            href="/intake"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            Work with me
            <ArrowRight size={16} />
          </Link>
        </div>
      </footer>
    </main>
  );
}
