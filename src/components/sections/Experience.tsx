'use client';

import { motion } from 'framer-motion';
import { Building2, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PersonaType } from '@/types/persona';
import { usePersona } from '@/hooks/usePersona';

interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
  achievements: string[];
  techStack: string[];
  teamSize?: number;
}

interface ExperienceProps {
  experiences?: Experience[];
  className?: string;
}

// Default experiences (can be overridden via props or fetched from Notion)
const DEFAULT_EXPERIENCES: Experience[] = [
  {
    id: '1',
    company: 'Tech Startup',
    role: 'Senior Full-Stack Developer',
    period: '2022 - Present',
    description: 'Leading development of the core product platform, mentoring junior developers, and driving technical decisions.',
    achievements: [
      'Reduced page load time by 60% through optimization',
      'Led migration from monolith to microservices',
      'Implemented CI/CD pipeline reducing deploy time by 80%',
    ],
    techStack: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
    teamSize: 8,
  },
  {
    id: '2',
    company: 'Digital Agency',
    role: 'Full-Stack Developer',
    period: '2020 - 2022',
    description: 'Built custom web applications for enterprise clients across various industries.',
    achievements: [
      'Delivered 15+ client projects on time and budget',
      'Introduced TypeScript adoption across the team',
      'Built reusable component library used in all projects',
    ],
    techStack: ['Vue.js', 'Python', 'Django', 'Docker'],
    teamSize: 12,
  },
  {
    id: '3',
    company: 'Freelance',
    role: 'Web Developer',
    period: '2018 - 2020',
    description: 'Independent consulting and development work for small businesses and startups.',
    achievements: [
      'Built 20+ websites and applications',
      'Established long-term retainer relationships',
      'Grew freelance income to 6-figures',
    ],
    techStack: ['React', 'WordPress', 'Node.js'],
  },
];

// Persona-specific experience presentation
const PERSONA_EXP_CONFIG: Record<PersonaType, {
  showAchievements: boolean;
  showTech: boolean;
  showTeamSize: boolean;
  showTimeline: boolean;
  emphasis: 'achievements' | 'technical' | 'leadership' | 'balanced';
  title: string;
  subtitle: string;
}> = {
  recruiter: {
    showAchievements: true,
    showTech: false,
    showTeamSize: true,
    showTimeline: true,
    emphasis: 'achievements',
    title: 'Experience',
    subtitle: 'Career progression and key achievements',
  },
  engineer: {
    showAchievements: true,
    showTech: true,
    showTeamSize: false,
    showTimeline: true,
    emphasis: 'technical',
    title: 'Work History',
    subtitle: 'Technical contributions and engineering challenges',
  },
  designer: {
    showAchievements: true,
    showTech: false,
    showTeamSize: false,
    showTimeline: true,
    emphasis: 'balanced',
    title: 'Professional Journey',
    subtitle: 'Evolution of craft and creative growth',
  },
  cto: {
    showAchievements: true,
    showTech: true,
    showTeamSize: true,
    showTimeline: true,
    emphasis: 'leadership',
    title: 'Leadership Experience',
    subtitle: 'Team building and technical strategy',
  },
  gamer: {
    showAchievements: false,
    showTech: true,
    showTeamSize: false,
    showTimeline: false,
    emphasis: 'technical',
    title: 'Background',
    subtitle: 'Where I\'ve honed my skills',
  },
  curious: {
    showAchievements: false,
    showTech: true,
    showTeamSize: false,
    showTimeline: true,
    emphasis: 'balanced',
    title: 'Work Experience',
    subtitle: 'A brief professional history',
  },
};

export function Experience({ experiences = DEFAULT_EXPERIENCES, className }: ExperienceProps) {
  const { persona, isAdapting } = usePersona();
  const config = PERSONA_EXP_CONFIG[persona];

  return (
    <section
      data-section="experience"
      className={cn('py-24 px-6', className)}
    >
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {config.title}
          </h2>
          <p className="text-zinc-400 text-lg">
            {config.subtitle}
          </p>
        </motion.div>

        {/* Experience list */}
        <div className="space-y-8">
          {experiences.map((exp, index) => (
            <ExperienceCard
              key={exp.id}
              experience={exp}
              config={config}
              index={index}
              isAdapting={isAdapting}
              isLast={index === experiences.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface ExperienceCardProps {
  experience: Experience;
  config: typeof PERSONA_EXP_CONFIG[PersonaType];
  index: number;
  isAdapting: boolean;
  isLast: boolean;
}

function ExperienceCard({ experience, config, index, isAdapting, isLast }: ExperienceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: isAdapting ? 0.5 : 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative"
    >
      {/* Timeline connector */}
      {config.showTimeline && !isLast && (
        <div className="absolute left-6 top-16 bottom-0 w-px bg-zinc-800" />
      )}

      <div className={cn(
        'relative p-6 rounded-xl',
        'bg-zinc-900/30 border border-zinc-800/50',
        'hover:border-zinc-700 transition-colors'
      )}>
        {/* Timeline dot */}
        {config.showTimeline && (
          <div className="absolute left-6 top-6 w-3 h-3 -ml-1.5 rounded-full bg-zinc-700 border-2 border-zinc-900" />
        )}

        <div className={cn(config.showTimeline && 'ml-8')}>
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                <Building2 size={14} />
                <span>{experience.company}</span>
                {config.showTeamSize && experience.teamSize && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span>{experience.teamSize} person team</span>
                  </>
                )}
              </div>
              <h3 className="text-xl font-semibold text-white">
                {experience.role}
              </h3>
            </div>
            <div className="flex items-center gap-1 text-sm text-zinc-500">
              <Calendar size={14} />
              <span>{experience.period}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-zinc-400 mb-4">
            {experience.description}
          </p>

          {/* Achievements (for recruiter/CTO emphasis) */}
          {config.showAchievements && experience.achievements.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-2">Key Achievements</h4>
              <ul className="space-y-1">
                {experience.achievements.map((achievement, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                    <ChevronRight size={14} className="mt-0.5 text-green-500 flex-shrink-0" />
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tech stack (for engineers) */}
          {config.showTech && experience.techStack.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {experience.techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
