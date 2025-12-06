'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PersonaType } from '@/types/persona';
import { usePersona } from '@/hooks/usePersona';

interface Skill {
  id?: string;
  name: string;
  level: number; // 0-100
  category: string;
  years?: number | null;
  icon?: string | null;
  personas?: string[] | null; // PersonaType[] | ['global'] - which personas see this skill
}

interface SkillsProps {
  skills?: Skill[];
  className?: string;
}

// Default skills (can be overridden via props or fetched from Notion)
const DEFAULT_SKILLS: Skill[] = [
  // Frontend
  { name: 'React/Next.js', level: 95, category: 'frontend', years: 5 },
  { name: 'TypeScript', level: 90, category: 'frontend', years: 4 },
  { name: 'Tailwind CSS', level: 90, category: 'frontend', years: 3 },
  { name: 'Vue.js', level: 75, category: 'frontend', years: 2 },
  // Backend
  { name: 'Node.js', level: 90, category: 'backend', years: 5 },
  { name: 'Python', level: 80, category: 'backend', years: 4 },
  { name: 'PostgreSQL', level: 85, category: 'backend', years: 4 },
  { name: 'GraphQL', level: 80, category: 'backend', years: 3 },
  // DevOps
  { name: 'Docker', level: 80, category: 'devops', years: 3 },
  { name: 'AWS', level: 75, category: 'devops', years: 3 },
  { name: 'CI/CD', level: 85, category: 'devops', years: 4 },
  // Design
  { name: 'Figma', level: 80, category: 'design', years: 3 },
  { name: 'UI/UX Design', level: 75, category: 'design', years: 3 },
  // Leadership
  { name: 'Team Leadership', level: 80, category: 'leadership', years: 3 },
  { name: 'Agile/Scrum', level: 85, category: 'leadership', years: 4 },
  { name: 'System Design', level: 80, category: 'leadership', years: 3 },
];

type SkillCategory = 'frontend' | 'backend' | 'devops' | 'design' | 'leadership' | 'other';

// Persona-specific skill presentation
const PERSONA_SKILL_CONFIG: Record<PersonaType, {
  categories: SkillCategory[];
  displayStyle: 'bars' | 'grid' | 'tree' | 'tags';
  showYears: boolean;
  showLevel: boolean;
  groupBy: 'category' | 'level' | 'none';
  title: string;
  subtitle: string;
}> = {
  recruiter: {
    categories: ['frontend', 'backend', 'leadership'],
    displayStyle: 'grid',
    showYears: true,
    showLevel: false,
    groupBy: 'category',
    title: 'Technical Skills',
    subtitle: 'Core competencies and areas of expertise',
  },
  engineer: {
    categories: ['frontend', 'backend', 'devops'],
    displayStyle: 'bars',
    showYears: true,
    showLevel: true,
    groupBy: 'category',
    title: 'Tech Stack',
    subtitle: 'Languages, frameworks, and tools I work with daily',
  },
  designer: {
    categories: ['design', 'frontend'],
    displayStyle: 'grid',
    showYears: false,
    showLevel: true,
    groupBy: 'none',
    title: 'Design Tools',
    subtitle: 'From ideation to implementation',
  },
  cto: {
    categories: ['leadership', 'backend', 'devops'],
    displayStyle: 'tree',
    showYears: true,
    showLevel: false,
    groupBy: 'category',
    title: 'Capabilities',
    subtitle: 'Technical leadership and system architecture',
  },
  gamer: {
    categories: ['frontend', 'backend', 'design'],
    displayStyle: 'tags',
    showYears: false,
    showLevel: false,
    groupBy: 'none',
    title: 'Game Dev Skills',
    subtitle: 'Tools for creating interactive experiences',
  },
  curious: {
    categories: ['frontend', 'backend', 'design', 'devops'],
    displayStyle: 'grid',
    showYears: false,
    showLevel: false,
    groupBy: 'category',
    title: 'Skills',
    subtitle: 'A broad overview of technical abilities',
  },
};

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  devops: 'DevOps',
  design: 'Design',
  leadership: 'Leadership',
  other: 'Other',
};

const CATEGORY_COLORS: Record<SkillCategory, string> = {
  frontend: 'bg-blue-500',
  backend: 'bg-green-500',
  devops: 'bg-orange-500',
  design: 'bg-purple-500',
  leadership: 'bg-amber-500',
  other: 'bg-zinc-500',
};

// Helper to normalize category strings
function normalizeCategory(category: string): SkillCategory {
  const normalized = category.toLowerCase();
  if (['frontend', 'backend', 'devops', 'design', 'leadership'].includes(normalized)) {
    return normalized as SkillCategory;
  }
  return 'other';
}

// Extended skill type with normalized category
interface NormalizedSkill extends Skill {
  normalizedCategory: SkillCategory;
}

export function Skills({ skills = DEFAULT_SKILLS, className }: SkillsProps) {
  const { persona, isAdapting } = usePersona();
  const config = PERSONA_SKILL_CONFIG[persona];

  // Normalize skills to have proper category type
  const normalizedSkills: NormalizedSkill[] = skills.map(s => ({
    ...s,
    normalizedCategory: normalizeCategory(s.category),
    years: s.years ?? undefined,
  }));

  // Filter skills based on persona preferences AND skill's persona visibility
  const filteredSkills = normalizedSkills.filter(s => {
    // Check category filter
    if (!config.categories.includes(s.normalizedCategory)) return false;
    
    // Check persona visibility (default to global if not set)
    const skillPersonas = s.personas || ['global'];
    if (skillPersonas.includes('global')) return true;
    return skillPersonas.includes(persona);
  });

  // Group skills if needed
  const groupedSkills = config.groupBy === 'category'
    ? config.categories.reduce((acc, cat) => {
        acc[cat] = filteredSkills.filter(s => s.normalizedCategory === cat);
        return acc;
      }, {} as Record<SkillCategory, NormalizedSkill[]>)
    : { all: filteredSkills } as Record<string, NormalizedSkill[]>;

  return (
    <section
      id="skills"
      data-section="skills"
      className={cn('py-24 px-6 bg-zinc-900/30', className)}
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
            {config.title}
          </h2>
          <p className="text-zinc-400 text-lg">
            {config.subtitle}
          </p>
        </motion.div>

        {/* Skills display */}
        {config.displayStyle === 'bars' && (
          <SkillBars groups={groupedSkills} config={config} isAdapting={isAdapting} />
        )}
        {config.displayStyle === 'grid' && (
          <SkillGrid groups={groupedSkills} config={config} isAdapting={isAdapting} />
        )}
        {config.displayStyle === 'tags' && (
          <SkillTags skills={filteredSkills} isAdapting={isAdapting} />
        )}
        {config.displayStyle === 'tree' && (
          <SkillTree groups={groupedSkills} config={config} isAdapting={isAdapting} />
        )}
      </div>
    </section>
  );
}

// Bar chart style (for engineers)
function SkillBars({ groups, config, isAdapting }: {
  groups: Record<string, NormalizedSkill[]>;
  config: typeof PERSONA_SKILL_CONFIG[PersonaType];
  isAdapting: boolean;
}) {
  return (
    <div className="space-y-12">
      {Object.entries(groups).map(([category, skills]) => (
        skills.length > 0 && (
          <div key={category}>
            <h3 className="text-lg font-semibold text-zinc-300 mb-6">
              {CATEGORY_LABELS[category as SkillCategory] || category}
            </h3>
            <div className="space-y-4">
              {skills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: isAdapting ? 0.5 : 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-zinc-300">{skill.name}</span>
                    <div className="flex items-center gap-3 text-sm text-zinc-500">
                      {config.showYears && skill.years && <span>{skill.years}y</span>}
                      {config.showLevel && <span>{skill.level}%</span>}
                    </div>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.level}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: index * 0.05 }}
                      className={cn('h-full rounded-full', CATEGORY_COLORS[skill.normalizedCategory])}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}

// Grid style (for recruiters, designers)
function SkillGrid({ groups, config, isAdapting }: {
  groups: Record<string, NormalizedSkill[]>;
  config: typeof PERSONA_SKILL_CONFIG[PersonaType];
  isAdapting: boolean;
}) {
  return (
    <div className="space-y-12">
      {Object.entries(groups).map(([category, skills]) => (
        skills.length > 0 && (
          <div key={category}>
            {config.groupBy === 'category' && (
              <h3 className="text-lg font-semibold text-zinc-300 mb-6">
                {CATEGORY_LABELS[category as SkillCategory] || category}
              </h3>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {skills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  whileInView={{ opacity: isAdapting ? 0.5 : 1, scale: 1, y: 0 }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -5,
                    transition: { type: 'spring', stiffness: 400, damping: 17 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  className={cn(
                    'p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50',
                    'hover:border-zinc-500 hover:bg-zinc-800/70 transition-colors cursor-default',
                    'hover:shadow-lg hover:shadow-zinc-900/50'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-zinc-200">{skill.name}</span>
                    <span className={cn('w-2 h-2 rounded-full', CATEGORY_COLORS[skill.normalizedCategory])} />
                  </div>
                  {config.showYears && skill.years && (
                    <span className="text-xs text-zinc-500">{skill.years} years</span>
                  )}
                  {config.showLevel && (
                    <div className="mt-2 h-1 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', CATEGORY_COLORS[skill.normalizedCategory])}
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}

// Tags style (for gamers)
function SkillTags({ skills, isAdapting }: { skills: NormalizedSkill[]; isAdapting: boolean }) {
  return (
    <div className="flex flex-wrap gap-3">
      {skills.map((skill, index) => (
        <motion.span
          key={skill.name}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          whileInView={{ opacity: isAdapting ? 0.5 : 1, scale: 1, y: 0 }}
          whileHover={{ 
            scale: 1.1, 
            y: -3,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
          }}
          whileTap={{ scale: 0.95 }}
          viewport={{ once: true }}
          transition={{ 
            duration: 0.4, 
            delay: index * 0.04,
            type: 'spring',
            stiffness: 300
          }}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium',
            'bg-zinc-800 text-zinc-300 border border-zinc-700',
            'hover:border-zinc-400 hover:text-white transition-colors cursor-default'
          )}
        >
          {skill.name}
        </motion.span>
      ))}
    </div>
  );
}

// Tree style (for CTOs)
function SkillTree({ groups, config, isAdapting }: {
  groups: Record<string, NormalizedSkill[]>;
  config: typeof PERSONA_SKILL_CONFIG[PersonaType];
  isAdapting: boolean;
}) {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {Object.entries(groups).map(([category, skills], categoryIndex) => (
        skills.length > 0 && (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: isAdapting ? 0.5 : 1, y: 0 }}
            whileHover={{ 
              scale: 1.02,
              transition: { type: 'spring', stiffness: 400 }
            }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            className={cn(
              'p-6 rounded-xl bg-zinc-900/50 border border-zinc-800',
              'relative overflow-hidden group',
              'hover:border-zinc-600 hover:shadow-xl hover:shadow-zinc-900/50 transition-all duration-300'
            )}
          >
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Category header */}
            <div className="flex items-center gap-3 mb-6 relative">
              <motion.span 
                className={cn('w-3 h-3 rounded-full', CATEGORY_COLORS[category as SkillCategory] || CATEGORY_COLORS.other)}
                whileHover={{ scale: 1.3 }}
              />
              <h3 className="text-lg font-semibold text-white">
                {CATEGORY_LABELS[category as SkillCategory] || category}
              </h3>
            </div>

            {/* Skills list */}
            <ul className="space-y-3 relative">
              {skills.map((skill, index) => (
                <motion.li 
                  key={skill.name} 
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: categoryIndex * 0.1 + index * 0.05 }}
                >
                  <span className="text-zinc-300 group-hover:text-zinc-200 transition-colors">{skill.name}</span>
                  {config.showYears && skill.years && (
                    <span className="text-xs text-zinc-500">{skill.years}y exp</span>
                  )}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )
      ))}
    </div>
  );
}
