import { Suspense } from 'react';
import { getProjects, Project } from '@/lib/notion/projects';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight, ArrowLeft, Filter, Folder, Search, Sparkles } from 'lucide-react';

// ISR with 5-minute revalidation
export const revalidate = 300;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const params = await searchParams;
  const allProjects = await getProjects();
  
  // Sort: featured first, then by date
  const sortedProjects = [...allProjects].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Filter by category if specified
  let projects = sortedProjects;
  if (params.category) {
    projects = projects.filter(p => p.category === params.category);
  }

  // Get unique categories for filter
  const categories = [...new Set(allProjects.map(p => p.category))];
  const featuredProjects = projects.filter(p => p.featured);
  const regularProjects = projects.filter(p => !p.featured);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-4">
            <Folder size={16} />
            <span>Portfolio</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Projects
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl">
            A collection of work I&apos;ve shipped — from production web apps to experimental side projects.
          </p>
          
          {/* Stats */}
          <div className="flex gap-8 mt-8 pt-8 border-t border-zinc-800/50">
            <div>
              <div className="text-2xl font-bold text-white">{allProjects.length}</div>
              <div className="text-sm text-zinc-500">Total Projects</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">{featuredProjects.length}</div>
              <div className="text-sm text-zinc-500">Featured</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{categories.length}</div>
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
              href="/projects"
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                !params.category
                  ? 'bg-white text-zinc-900 shadow-lg shadow-white/10'
                  : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-white'
              )}
            >
              All Projects
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/projects?category=${cat}`}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium capitalize transition-all duration-200',
                  params.category === cat
                    ? 'bg-white text-zinc-900 shadow-lg shadow-white/10'
                    : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                )}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {projects.length > 0 ? (
          <div className="space-y-12">
            {/* Featured Projects - Larger cards */}
            {featuredProjects.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-lg font-semibold text-white">Featured Projects</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {featuredProjects.map((project) => (
                    <FeaturedProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </section>
            )}
            
            {/* Regular Projects */}
            {regularProjects.length > 0 && (
              <section>
                {featuredProjects.length > 0 && (
                  <h2 className="text-lg font-semibold text-white mb-6">All Projects</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <EmptyState category={params.category} />
        )}
      </div>
    </main>
  );
}

function FeaturedProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`}>
      <article
        className={cn(
          'group relative rounded-2xl overflow-hidden',
          'bg-gradient-to-br from-zinc-900 to-zinc-900/50',
          'border border-yellow-500/30 hover:border-yellow-400/50',
          'transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-500/10',
          'hover:-translate-y-1'
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          {project.coverImage && (
            <div className="md:w-1/2 aspect-video md:aspect-auto relative overflow-hidden">
              <img
                src={project.coverImage}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/80 hidden md:block" />
            </div>
          )}
          
          {/* Content */}
          <div className={cn("p-6 md:p-8 flex flex-col justify-center", project.coverImage ? "md:w-1/2" : "w-full")}>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn(
                'px-2 py-1 text-xs font-medium rounded capitalize',
                project.category === 'web' && 'bg-blue-500/20 text-blue-400',
                project.category === 'game' && 'bg-red-500/20 text-red-400',
                project.category === 'ai' && 'bg-purple-500/20 text-purple-400',
                project.category === 'design' && 'bg-pink-500/20 text-pink-400',
                project.category === 'other' && 'bg-zinc-500/20 text-zinc-400',
              )}>
                {project.category}
              </span>
              <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                <Sparkles size={10} /> Featured
              </span>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors">
              {project.title}
            </h3>
            
            <p className="text-zinc-400 mb-4 line-clamp-2">
              {project.description}
            </p>
            
            {project.techStack.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {project.techStack.slice(0, 5).map((tech) => (
                  <span key={tech} className="px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded">
                    {tech}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium group-hover:gap-3 transition-all">
              View Project <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`}>
      <article
        className={cn(
          'group relative h-full rounded-xl overflow-hidden',
          'bg-zinc-900/50 hover:bg-zinc-900',
          'border border-zinc-800/50 hover:border-zinc-700',
          'transition-all duration-300 hover:shadow-xl hover:shadow-zinc-900/50',
          'hover:-translate-y-1'
        )}
      >
        {/* Cover image */}
        {project.coverImage && (
          <div className="aspect-video relative overflow-hidden">
            <img
              src={project.coverImage}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {/* Category badge */}
          <span className={cn(
            'inline-block px-2 py-1 text-xs font-medium rounded mb-3 capitalize',
            project.category === 'web' && 'bg-blue-500/10 text-blue-400',
            project.category === 'game' && 'bg-red-500/10 text-red-400',
            project.category === 'ai' && 'bg-purple-500/10 text-purple-400',
            project.category === 'design' && 'bg-pink-500/10 text-pink-400',
            project.category === 'other' && 'bg-zinc-500/10 text-zinc-400',
          )}>
            {project.category}
          </span>

          {/* Title */}
          <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
            {project.title}
          </h2>

          {/* Description */}
          <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
            {project.description}
          </p>

          {/* Tech stack */}
          {project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.techStack.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded"
                >
                  {tech}
                </span>
              ))}
              {project.techStack.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-zinc-500">
                  +{project.techStack.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

function EmptyState({ category }: { category?: string }) {
  return (
    <div className="text-center py-24">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800/50 flex items-center justify-center">
        <Search className="w-10 h-10 text-zinc-600" />
      </div>
      <h2 className="text-2xl font-semibold text-zinc-300 mb-3">
        No projects found
      </h2>
      <p className="text-zinc-500 max-w-md mx-auto mb-6">
        {category
          ? `No projects in the "${category}" category yet. Check back later!`
          : 'Projects will appear here once they are added to the Notion database.'}
      </p>
      {category && (
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
        >
          View all projects
        </Link>
      )}
    </div>
  );
}
