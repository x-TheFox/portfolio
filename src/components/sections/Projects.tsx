'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Github, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PersonaType } from '@/types/persona';
import { usePersona } from '@/hooks/usePersona';
import { Project } from '@/lib/notion/projects';

interface ProjectsGridProps {
  projects: Project[];
  className?: string;
}

// Persona-specific project sorting/filtering
function sortProjectsForPersona(projects: Project[], persona: PersonaType): Project[] {
  const priorityMap: Record<PersonaType, (project: Project) => number> = {
    recruiter: (p) => (p.featured ? 10 : 0) + (p.category === 'web' ? 5 : 0),
    engineer: (p) => (p.techStack.length * 2) + (p.category === 'ai' ? 5 : 0),
    designer: (p) => (p.category === 'design' ? 10 : 0) + (p.coverImage ? 5 : 0),
    cto: (p) => (p.featured ? 10 : 0) + (p.category === 'web' ? 3 : 0) + (p.category === 'ai' ? 3 : 0),
    gamer: (p) => (p.category === 'game' ? 15 : 0) + (p.techStack.some(t => t.toLowerCase().includes('unity') || t.toLowerCase().includes('unreal')) ? 5 : 0),
    curious: (p) => (p.featured ? 5 : 0),
  };

  return [...projects].sort((a, b) => priorityMap[persona](b) - priorityMap[persona](a));
}

// Persona-specific card emphasis
const PERSONA_CARD_CONFIG: Record<PersonaType, {
  showTech: boolean;
  showMetrics: boolean;
  showProcess: boolean;
  showInteractive: boolean;
  emphasis: string;
}> = {
  recruiter: {
    showTech: false,
    showMetrics: true,
    showProcess: false,
    showInteractive: false,
    emphasis: 'Impact & results',
  },
  engineer: {
    showTech: true,
    showMetrics: false,
    showProcess: false,
    showInteractive: true,
    emphasis: 'Technical depth',
  },
  designer: {
    showTech: false,
    showMetrics: false,
    showProcess: true,
    showInteractive: false,
    emphasis: 'Design process',
  },
  cto: {
    showTech: true,
    showMetrics: true,
    showProcess: false,
    showInteractive: false,
    emphasis: 'Architecture',
  },
  gamer: {
    showTech: false,
    showMetrics: false,
    showProcess: false,
    showInteractive: true,
    emphasis: 'Playable demos',
  },
  curious: {
    showTech: true,
    showMetrics: false,
    showProcess: false,
    showInteractive: false,
    emphasis: 'Overview',
  },
};

export function ProjectsGrid({ projects, className }: ProjectsGridProps) {
  const { persona, isAdapting } = usePersona();
  const config = PERSONA_CARD_CONFIG[persona];
  const sortedProjects = sortProjectsForPersona(projects, persona);

  const sectionTitles: Record<PersonaType, string> = {
    recruiter: 'Featured Work',
    engineer: 'Technical Projects',
    designer: 'Design Portfolio',
    cto: 'System Architecture',
    gamer: 'Games & Demos',
    curious: 'Projects',
  };

  return (
    <section
      id="projects"
      data-section="projects"
      className={cn('py-24 px-6', className)}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {sectionTitles[persona]}
          </h2>
          <p className="text-zinc-400 text-lg">
            {persona === 'recruiter' && 'Projects that delivered measurable business impact.'}
            {persona === 'engineer' && 'Deep dives into interesting technical challenges.'}
            {persona === 'designer' && 'Case studies showcasing design thinking and process.'}
            {persona === 'cto' && 'Systems designed for scale and maintainability.'}
            {persona === 'gamer' && 'Interactive experiences and playable demos.'}
            {persona === 'curious' && 'A selection of recent and notable work.'}
          </p>
        </motion.div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              config={config}
              index={index}
              isAdapting={isAdapting}
            />
          ))}
        </div>

        {/* Empty state */}
        {sortedProjects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-zinc-500">No projects to display yet.</p>
          </div>
        )}

        {/* View all link */}
        {sortedProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-12"
          >
            <motion.a
              href="/projects"
              data-track="projects-view-all"
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              View all projects
              <ExternalLink size={16} />
            </motion.a>
          </motion.div>
        )}
      </div>
    </section>
  );
}

interface ProjectCardProps {
  project: Project;
  config: typeof PERSONA_CARD_CONFIG[PersonaType];
  index: number;
  isAdapting: boolean;
}

function ProjectCard({ project, config, index, isAdapting }: ProjectCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: isAdapting ? 0.5 : 1, y: 0, scale: 1 }}
      whileHover={{ 
        y: -8,
        transition: { type: 'spring', stiffness: 400, damping: 17 }
      }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        'group relative bg-zinc-900/50 rounded-xl overflow-hidden',
        'border transition-all duration-300',
        'hover:shadow-xl hover:shadow-zinc-900/50',
        project.featured 
          ? 'border-yellow-500/50 hover:border-yellow-400 ring-1 ring-yellow-500/20' 
          : 'border-zinc-800/50 hover:border-zinc-600'
      )}
    >
      {/* Featured badge */}
      {project.featured && (
        <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-yellow-500/90 text-black text-xs font-semibold rounded-full flex items-center gap-1">
          <span>★</span> Featured
        </div>
      )}

      {/* Cover image */}
      {project.coverImage && (
        <div className="aspect-video relative overflow-hidden">
          <img
            src={project.coverImage}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Play button overlay for games */}
          {config.showInteractive && project.category === 'game' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm">
                <Play size={32} className="text-white" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {/* Category badge */}
        <span className={cn(
          'inline-block px-2 py-1 text-xs font-medium rounded mb-3',
          project.category === 'web' && 'bg-blue-500/10 text-blue-400',
          project.category === 'game' && 'bg-red-500/10 text-red-400',
          project.category === 'ai' && 'bg-purple-500/10 text-purple-400',
          project.category === 'design' && 'bg-pink-500/10 text-pink-400',
          project.category === 'other' && 'bg-zinc-500/10 text-zinc-400',
        )}>
          {project.category}
        </span>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
          <a href={`/projects/${project.slug}`} data-track={`project-${project.slug}`}>
            {project.title}
          </a>
        </h3>

        {/* Description */}
        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>

        {/* Tech stack (for engineers) */}
        {config.showTech && project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.techStack.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded"
              >
                {tech}
              </span>
            ))}
            {project.techStack.length > 4 && (
              <span className="px-2 py-0.5 text-xs text-zinc-500">
                +{project.techStack.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Metrics (for recruiters/CTOs) */}
        {config.showMetrics && (
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span>Shipped {new Date(project.createdAt).getFullYear()}</span>
            {project.featured && <span className="text-green-400">★ Featured</span>}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-800">
          <a
            href={`/projects/${project.slug}`}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            View details →
          </a>
        </div>
      </div>
    </motion.article>
  );
}
