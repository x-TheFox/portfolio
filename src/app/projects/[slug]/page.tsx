import { notFound } from 'next/navigation';
import { getProjectBySlug, getAllProjectSlugs, getProjects } from '@/lib/notion/projects';
import { NotionRenderer } from '@/components/notion';
import { RepoCard } from '@/components/projects/RepoCard';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Calendar, Clock, ExternalLink, Github, Sparkles, Users } from 'lucide-react';

// ISR with 5-minute revalidation
export const revalidate = 300;

// Use dynamic rendering - Notion data fetched at request time
export const dynamic = 'force-dynamic';

// Generate static paths - returns empty array if Notion not configured
export async function generateStaticParams() {
  try {
    const slugs = await getAllProjectSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  // Get related projects (same category, excluding current)
  const allProjects = await getProjects();
  const relatedProjects = allProjects
    .filter(p => p.category === project.category && p.id !== project.id)
    .slice(0, 3);

  // Fetch GitHub repo metadata if available
  let repoMeta = null;
  if (project.githubUrl) {
    try {
      const githubUrl = project.githubUrl as string;
      const meta = await import('@/lib/github').then(m => m.fetchRepoMetaFromUrl(githubUrl));
      repoMeta = meta;
    } catch (err) {
      // Ignore fetch errors - we'll render a simple link instead
      repoMeta = null;
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        
        {/* Back link */}
        <div className="relative max-w-5xl mx-auto px-6 pt-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to projects
          </Link>
        </div>

        {/* Header */}
        <header className="relative max-w-5xl mx-auto px-6 py-12 md:py-16">
          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-full capitalize',
              project.category === 'web' && 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30',
              project.category === 'game' && 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30',
              project.category === 'ai' && 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30',
              project.category === 'design' && 'bg-pink-500/20 text-pink-400 ring-1 ring-pink-500/30',
              project.category === 'other' && 'bg-zinc-500/20 text-zinc-400 ring-1 ring-zinc-500/30',
            )}>
              {project.category}
            </span>
            
            {project.featured && (
              <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30 flex items-center gap-1.5">
                <Sparkles size={14} />
                Featured
              </span>
            )}
            
            <span className="flex items-center gap-1.5 text-sm text-zinc-500">
              <Calendar size={14} />
              {new Date(project.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
            
            {project.team && project.team.length > 0 && (
              <span className="flex items-center gap-1.5 text-sm text-zinc-500">
                <Users size={14} />
                {project.team.join(', ')}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
            {project.title}
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-3xl leading-relaxed">
            {project.description}
          </p>

          {/* Tech stack */}
          {project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-4 py-2 text-sm bg-zinc-800/80 text-zinc-300 rounded-full border border-zinc-700/50 hover:border-zinc-600 transition-colors"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </header>
      </div>

      {/* Cover image */}
      {project.coverImage && (
        <div className="max-w-6xl mx-auto px-6 mb-16">
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl shadow-black/50">
            <img
              src={project.coverImage}
              alt={project.title}
              className="w-full"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
          </div>
        </div>
      )}

      {/* Content */}
      <article className="max-w-4xl mx-auto px-6 pb-16">
        {project.content && project.content.length > 0 ? (
          <div className="prose prose-lg prose-invert prose-zinc max-w-none">
            <NotionRenderer blocks={project.content} />
          </div>
        ) : (
          <div className="text-center py-16 px-8 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <p className="text-zinc-500">This project doesn&apos;t have additional content yet.</p>
          </div>
        )}
        {/* GitHub repo preview */}
        {project.githubUrl && (
          <div className="mt-8">
            <RepoCard githubUrl={project.githubUrl} repo={repoMeta ?? undefined} />
          </div>
        )}      </article>

      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <section className="border-t border-zinc-800 bg-zinc-900/30">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <h2 className="text-2xl font-bold text-white mb-8">More {project.category} projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProjects.map((related) => (
                <Link
                  key={related.id}
                  href={`/projects/${related.slug}`}
                  className="group block p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:-translate-y-1"
                >
                  {related.coverImage && (
                    <div className="aspect-video rounded-lg overflow-hidden mb-4">
                      <img
                        src={related.coverImage}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">
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
            href="/projects"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            All projects
          </Link>
          <Link
            href="/intake"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Work with me
            <ArrowRight size={16} />
          </Link>
        </div>
      </footer>
    </main>
  );
}
