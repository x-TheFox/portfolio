'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PersonaType } from '@/types/persona';
import { usePersona } from '@/hooks/usePersona';
import { CaseStudy } from '@/lib/notion/case-studies';
import { PdfViewer } from '@/components/ui/PdfViewer';
import { 
  FileText, 
  ExternalLink, 
  ChevronRight, 
  Building2, 
  Calendar,
  X,
  Briefcase,
  Palette,
  Code,
  Search,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface CaseStudiesProps {
  caseStudies?: CaseStudy[];
  className?: string;
}

// Persona-specific case studies presentation
const PERSONA_CONFIG: Record<PersonaType, {
  title: string;
  subtitle: string;
  showIndustry: boolean;
  showClient: boolean;
  cardStyle: 'detailed' | 'minimal' | 'visual';
  maxItems: number;
}> = {
  recruiter: {
    title: 'Case Studies',
    subtitle: 'Real-world projects and their outcomes',
    showIndustry: true,
    showClient: true,
    cardStyle: 'detailed',
    maxItems: 4,
  },
  engineer: {
    title: 'Technical Case Studies',
    subtitle: 'Deep dives into system architecture and implementation',
    showIndustry: false,
    showClient: false,
    cardStyle: 'minimal',
    maxItems: 6,
  },
  designer: {
    title: 'Design Case Studies',
    subtitle: 'UX research, design process, and creative solutions',
    showIndustry: false,
    showClient: true,
    cardStyle: 'visual',
    maxItems: 6,
  },
  cto: {
    title: 'Strategic Case Studies',
    subtitle: 'Business impact and technical decision-making',
    showIndustry: true,
    showClient: true,
    cardStyle: 'detailed',
    maxItems: 4,
  },
  gamer: {
    title: 'Project Breakdowns',
    subtitle: 'Behind the scenes of game and interactive development',
    showIndustry: false,
    showClient: false,
    cardStyle: 'visual',
    maxItems: 4,
  },
  curious: {
    title: 'Case Studies',
    subtitle: 'Explore detailed project documentation',
    showIndustry: true,
    showClient: false,
    cardStyle: 'minimal',
    maxItems: 4,
  },
};

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
  tech: 'bg-blue-500/20 text-blue-400',
  finance: 'bg-green-500/20 text-green-400',
  healthcare: 'bg-red-500/20 text-red-400',
  retail: 'bg-orange-500/20 text-orange-400',
  gaming: 'bg-purple-500/20 text-purple-400',
  other: 'bg-zinc-500/20 text-zinc-400',
};

// Demo case studies (used when none provided)
const DEFAULT_CASE_STUDIES: CaseStudy[] = [
  {
    id: '1',
    slug: 'fintech-dashboard',
    title: 'FinTech Dashboard Redesign',
    description: 'Complete UX overhaul of a trading platform, improving user engagement by 40%',
    client: 'TradeCorp',
    industry: 'finance',
    type: 'product-design',
    featured: true,
    tags: ['UX', 'Dashboard', 'Trading'],
    createdAt: '2024-01-01',
    updatedAt: '2024-06-01',
  },
  {
    id: '2',
    slug: 'healthcare-api',
    title: 'Healthcare API Architecture',
    description: 'Scalable microservices architecture handling 10M+ daily requests',
    industry: 'healthcare',
    type: 'system-design',
    featured: true,
    tags: ['API', 'Microservices', 'HIPAA'],
    createdAt: '2024-02-01',
    updatedAt: '2024-07-01',
  },
];

export function CaseStudies({ caseStudies = DEFAULT_CASE_STUDIES, className }: CaseStudiesProps) {
  const { persona, isAdapting } = usePersona();
  const config = PERSONA_CONFIG[persona];
  const [selectedStudy, setSelectedStudy] = useState<CaseStudy | null>(null);
  const [showPdf, setShowPdf] = useState(false);

  // Limit displayed case studies
  const displayedStudies = caseStudies.slice(0, config.maxItems);

  const handleOpenPdf = (study: CaseStudy) => {
    if (study.pdfUrl) {
      setSelectedStudy(study);
      setShowPdf(true);
    }
  };

  const handleClosePdf = () => {
    setShowPdf(false);
    setSelectedStudy(null);
  };

  return (
    <section
      id="case-studies"
      data-section="case-studies"
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
            {config.title}
          </h2>
          <p className="text-zinc-400 text-lg">
            {config.subtitle}
          </p>
        </motion.div>

        {/* Case Studies Grid */}
        <div className={cn(
          'grid gap-6',
          config.cardStyle === 'visual' 
            ? 'grid-cols-1 md:grid-cols-2' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        )}>
          {displayedStudies.map((study, index) => (
            <CaseStudyCard
              key={study.id}
              study={study}
              config={config}
              index={index}
              isAdapting={isAdapting}
              onOpenPdf={() => handleOpenPdf(study)}
            />
          ))}
        </div>

        {/* View All Link */}
        {caseStudies.length > config.maxItems && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <Link
              href="/case-studies"
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-white"
            >
              View All Case Studies
              <ChevronRight size={18} />
            </Link>
          </motion.div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {showPdf && selectedStudy?.pdfUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleClosePdf}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-5xl max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <PdfViewer
                url={selectedStudy.pdfUrl}
                title={selectedStudy.title}
                onClose={handleClosePdf}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// Individual Case Study Card
interface CardProps {
  study: CaseStudy;
  config: typeof PERSONA_CONFIG[PersonaType];
  index: number;
  isAdapting: boolean;
  onOpenPdf: () => void;
}

function CaseStudyCard({ study, config, index, isAdapting, onOpenPdf }: CardProps) {
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
        {/* Cover Image */}
        {study.coverImage && (
          <div className="aspect-video relative overflow-hidden">
            <Image
              src={study.coverImage}
              alt={study.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {/* Type Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs">
              {TYPE_ICONS[study.type]}
              {TYPE_LABELS[study.type]}
            </span>
            {config.showIndustry && (
              <span className={cn(
                'px-2.5 py-1 rounded-full text-xs capitalize',
                INDUSTRY_COLORS[study.industry]
              )}>
                {study.industry}
              </span>
            )}
          </div>

          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
            {study.title}
          </h3>
          
          {config.showClient && study.client && (
            <div className="flex items-center gap-2 text-zinc-500 text-sm mb-3">
              <Building2 size={14} />
              {study.client}
            </div>
          )}

          <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
            {study.description}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href={`/case-studies/${study.slug}`}
              className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Read More
              <ChevronRight size={14} />
            </Link>
            {study.pdfUrl && (
              <button
                onClick={onOpenPdf}
                className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <FileText size={14} />
                View PDF
              </button>
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
          <span className="inline-flex items-center gap-1.5 text-zinc-500 text-xs">
            {TYPE_ICONS[study.type]}
            {TYPE_LABELS[study.type]}
          </span>
          {study.date && (
            <span className="text-zinc-600 text-xs flex items-center gap-1">
              <Calendar size={12} />
              {new Date(study.date).getFullYear()}
            </span>
          )}
        </div>

        <h3 className="text-lg font-medium text-white mb-2 group-hover:text-blue-400 transition-colors">
          {study.title}
        </h3>

        <p className="text-zinc-500 text-sm mb-4 line-clamp-2">
          {study.description}
        </p>

        <div className="flex items-center gap-4">
          <Link
            href={`/case-studies/${study.slug}`}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Details →
          </Link>
          {study.pdfUrl && (
            <button
              onClick={onOpenPdf}
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              PDF
            </button>
          )}
        </div>
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
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs">
            {TYPE_ICONS[study.type]}
            {TYPE_LABELS[study.type]}
          </span>
          {config.showIndustry && (
            <span className={cn(
              'px-2.5 py-1 rounded-full text-xs capitalize',
              INDUSTRY_COLORS[study.industry]
            )}>
              {study.industry}
            </span>
          )}
        </div>
        {study.featured && (
          <span className="text-amber-500 text-xs font-medium">Featured</span>
        )}
      </div>

      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
        {study.title}
      </h3>

      {config.showClient && study.client && (
        <div className="flex items-center gap-2 text-zinc-500 text-sm mb-3">
          <Building2 size={14} />
          {study.client}
        </div>
      )}

      <p className="text-zinc-400 text-sm mb-4 line-clamp-3">
        {study.description}
      </p>

      {/* Tags */}
      {study.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {study.tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
        <Link
          href={`/case-studies/${study.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Read Full Study
          <ExternalLink size={14} />
        </Link>
        {study.pdfUrl && (
          <button
            onClick={onOpenPdf}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <FileText size={14} />
            View PDF
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default CaseStudies;
