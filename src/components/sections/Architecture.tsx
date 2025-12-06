'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PersonaType } from '@/types/persona';
import { usePersona } from '@/hooks/usePersona';
import { ArchitectureDoc } from '@/lib/notion/architecture';
import { 
  Layers, 
  Server, 
  Database, 
  Code2, 
  GitBranch,
  ExternalLink,
  ChevronRight,
  Box,
  Network,
  Workflow
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ArchitectureProps {
  docs?: ArchitectureDoc[];
  className?: string;
}

// Persona-specific architecture presentation
const PERSONA_CONFIG: Record<PersonaType, {
  title: string;
  subtitle: string;
  showTechStack: boolean;
  cardStyle: 'detailed' | 'minimal' | 'visual';
  maxItems: number;
}> = {
  recruiter: {
    title: 'System Architecture',
    subtitle: 'Technical infrastructure and design expertise',
    showTechStack: true,
    cardStyle: 'detailed',
    maxItems: 3,
  },
  engineer: {
    title: 'Architecture & Design',
    subtitle: 'System designs, API contracts, and infrastructure patterns',
    showTechStack: true,
    cardStyle: 'detailed',
    maxItems: 6,
  },
  designer: {
    title: 'Technical Foundation',
    subtitle: 'The systems powering design implementations',
    showTechStack: false,
    cardStyle: 'visual',
    maxItems: 3,
  },
  cto: {
    title: 'Architecture Portfolio',
    subtitle: 'Scalable systems, infrastructure decisions, and technical strategy',
    showTechStack: true,
    cardStyle: 'detailed',
    maxItems: 6,
  },
  gamer: {
    title: 'Game Architecture',
    subtitle: 'How the magic happens behind the scenes',
    showTechStack: false,
    cardStyle: 'visual',
    maxItems: 4,
  },
  curious: {
    title: 'Architecture',
    subtitle: 'How things are built',
    showTechStack: false,
    cardStyle: 'minimal',
    maxItems: 4,
  },
};

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
  'system-design': 'bg-blue-500/20 text-blue-400',
  'infrastructure': 'bg-orange-500/20 text-orange-400',
  'api-design': 'bg-green-500/20 text-green-400',
  'data-model': 'bg-purple-500/20 text-purple-400',
  'methodology': 'bg-cyan-500/20 text-cyan-400',
};

// Demo architecture docs
const DEFAULT_DOCS: ArchitectureDoc[] = [
  {
    id: '1',
    slug: 'microservices-architecture',
    title: 'Microservices Event-Driven Architecture',
    description: 'Scalable microservices with event sourcing and CQRS patterns',
    type: 'system-design',
    featured: true,
    techStack: ['Kubernetes', 'Kafka', 'PostgreSQL', 'Redis'],
    createdAt: '2024-01-01',
    updatedAt: '2024-06-01',
  },
  {
    id: '2',
    slug: 'real-time-api',
    title: 'Real-time API Gateway',
    description: 'WebSocket-based API gateway with GraphQL subscriptions',
    type: 'api-design',
    featured: true,
    techStack: ['GraphQL', 'WebSockets', 'Node.js', 'Redis'],
    createdAt: '2024-02-01',
    updatedAt: '2024-07-01',
  },
];

export function Architecture({ docs = DEFAULT_DOCS, className }: ArchitectureProps) {
  const { persona, isAdapting } = usePersona();
  const config = PERSONA_CONFIG[persona];

  // Limit displayed docs
  const displayedDocs = docs.slice(0, config.maxItems);

  return (
    <section
      id="architecture"
      data-section="architecture"
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

        {/* Architecture Grid */}
        <div className={cn(
          'grid gap-6',
          config.cardStyle === 'visual' 
            ? 'grid-cols-1 md:grid-cols-2' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        )}>
          {displayedDocs.map((doc, index) => (
            <ArchitectureCard
              key={doc.id}
              doc={doc}
              config={config}
              index={index}
              isAdapting={isAdapting}
            />
          ))}
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Link
            href="/architecture"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-white"
          >
            View All Architecture
            <ChevronRight size={18} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// Individual Architecture Card
interface CardProps {
  doc: ArchitectureDoc;
  config: typeof PERSONA_CONFIG[PersonaType];
  index: number;
  isAdapting: boolean;
}

function ArchitectureCard({ doc, config, index, isAdapting }: CardProps) {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
  };

  if (config.cardStyle === 'visual') {
    return (
      <motion.div
        custom={index}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={cardVariants}
        className={cn(
          'group relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all',
          isAdapting && 'opacity-50'
        )}
      >
        {/* Cover Image or Gradient */}
        {doc.coverImage ? (
          <div className="aspect-video relative overflow-hidden">
            <Image
              src={doc.coverImage}
              alt={doc.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
          </div>
        ) : (
          <div className="aspect-video relative bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <Box size={48} className="text-zinc-700" />
          </div>
        )}
        
        <div className="p-6">
          {/* Type Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs',
              TYPE_COLORS[doc.type]
            )}>
              {TYPE_ICONS[doc.type]}
              {TYPE_LABELS[doc.type]}
            </span>
          </div>

          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
            {doc.title}
          </h3>

          <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
            {doc.description}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href={`/architecture/${doc.slug}`}
              className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Explore
              <ChevronRight size={14} />
            </Link>
            {doc.diagramUrl && (
              <a
                href={doc.diagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <ExternalLink size={14} />
                View Diagram
              </a>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (config.cardStyle === 'minimal') {
    return (
      <motion.div
        custom={index}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={cardVariants}
        className={cn(
          'group p-5 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all',
          isAdapting && 'opacity-50'
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <span className={cn(
            'inline-flex items-center gap-1.5 text-xs',
            TYPE_COLORS[doc.type].replace('bg-', 'text-').split(' ')[1]
          )}>
            {TYPE_ICONS[doc.type]}
            {TYPE_LABELS[doc.type]}
          </span>
        </div>

        <h3 className="text-lg font-medium text-white mb-2 group-hover:text-cyan-400 transition-colors">
          {doc.title}
        </h3>

        <p className="text-zinc-500 text-sm mb-4 line-clamp-2">
          {doc.description}
        </p>

        <Link
          href={`/architecture/${doc.slug}`}
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Learn more →
        </Link>
      </motion.div>
    );
  }

  // Detailed card style (default)
  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={cardVariants}
      className={cn(
        'group p-6 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all',
        isAdapting && 'opacity-50'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <span className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs',
          TYPE_COLORS[doc.type]
        )}>
          {TYPE_ICONS[doc.type]}
          {TYPE_LABELS[doc.type]}
        </span>
        {doc.featured && (
          <span className="text-amber-500 text-xs font-medium">Featured</span>
        )}
      </div>

      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
        {doc.title}
      </h3>

      <p className="text-zinc-400 text-sm mb-4 line-clamp-3">
        {doc.description}
      </p>

      {/* Tech Stack */}
      {config.showTechStack && doc.techStack.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {doc.techStack.slice(0, 4).map(tech => (
            <span key={tech} className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
              {tech}
            </span>
          ))}
          {doc.techStack.length > 4 && (
            <span className="text-xs text-zinc-600">+{doc.techStack.length - 4}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
        <Link
          href={`/architecture/${doc.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          View Details
          <ExternalLink size={14} />
        </Link>
        {doc.diagramUrl && (
          <a
            href={doc.diagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <Layers size={14} />
            Diagram
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default Architecture;
