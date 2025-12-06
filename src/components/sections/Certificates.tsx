'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { usePersona } from '@/hooks/usePersona';
import { cn } from '@/lib/utils';
import { Award, ExternalLink, Calendar, Building2 } from 'lucide-react';

interface Certificate {
  id: string;
  name: string;
  issuer: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  imageUrl?: string | null;
  skills: string[];
  featured?: boolean;
  // Legacy support
  title?: string;
  date?: string;
}

const DEFAULT_CERTIFICATES: Certificate[] = [
  {
    id: '1',
    name: 'AWS Solutions Architect - Associate',
    issuer: 'Amazon Web Services',
    issueDate: '2024',
    credentialId: 'AWS-SAA-123456',
    credentialUrl: 'https://aws.amazon.com/verification',
    skills: ['Cloud Architecture', 'AWS', 'Infrastructure'],
    featured: true,
  },
  {
    id: '2',
    name: 'Professional Scrum Master I',
    issuer: 'Scrum.org',
    issueDate: '2023',
    credentialId: 'PSM-I-789012',
    skills: ['Agile', 'Scrum', 'Team Leadership'],
    featured: true,
  },
  {
    id: '3',
    name: 'Google Cloud Professional Developer',
    issuer: 'Google Cloud',
    issueDate: '2024',
    skills: ['GCP', 'Cloud Development', 'Kubernetes'],
    featured: true,
  },
  {
    id: '4',
    name: 'Meta Front-End Developer Professional',
    issuer: 'Meta (Coursera)',
    issueDate: '2023',
    skills: ['React', 'JavaScript', 'UI Development'],
  },
  {
    id: '5',
    name: 'TensorFlow Developer Certificate',
    issuer: 'Google',
    issueDate: '2023',
    skills: ['Machine Learning', 'TensorFlow', 'Python'],
  },
];

interface CertificatesProps {
  certificates?: Certificate[];
  className?: string;
}

// Staggered animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export function Certificates({ 
  certificates = DEFAULT_CERTIFICATES, 
  className 
}: CertificatesProps) {
  const { persona, isAdapting } = usePersona();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  // Sort certificates based on persona
  const sortedCertificates = [...certificates].sort((a, b) => {
    // Featured always first
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;

    // Then sort by relevance to persona
    const getRelevance = (cert: Certificate) => {
      const skills = cert.skills.join(' ').toLowerCase();
      switch (persona) {
        case 'engineer':
          return skills.includes('cloud') || skills.includes('development') ? 1 : 0;
        case 'cto':
          return skills.includes('architecture') || skills.includes('leadership') ? 1 : 0;
        case 'recruiter':
          return cert.featured ? 1 : 0;
        default:
          return 0;
      }
    };

    return getRelevance(b) - getRelevance(a);
  });

  const sectionTitles: Record<string, string> = {
    recruiter: 'Verified Credentials',
    engineer: 'Technical Certifications',
    designer: 'Professional Credentials',
    cto: 'Leadership & Technical Credentials',
    gamer: 'Achievement Unlocked',
    curious: 'Certifications',
  };

  return (
    <section
      ref={sectionRef}
      id="certificates"
      data-section="certificates"
      className={cn(
        'py-24 px-6 relative overflow-hidden',
        className
      )}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: isInView ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-500/5 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium mb-4"
          >
            <Award className="w-4 h-4" />
            <span>Professional Growth</span>
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            {sectionTitles[persona]}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Industry-recognized certifications demonstrating expertise and commitment to continuous learning.
          </p>
        </motion.div>

        {/* Certificates grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sortedCertificates.map((cert, index) => (
            <motion.div
              key={cert.id}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'group relative p-6 rounded-2xl border transition-all duration-300',
                'bg-white dark:bg-zinc-900',
                'border-zinc-200 dark:border-zinc-800',
                'hover:border-blue-500/50 dark:hover:border-blue-500/50',
                'hover:shadow-xl hover:shadow-blue-500/10',
                cert.featured && 'ring-2 ring-blue-500/20',
                isAdapting && 'animate-pulse'
              )}
            >
              {/* Featured badge */}
              {cert.featured && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className="absolute -top-3 -right-3 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full shadow-lg"
                >
                  Featured
                </motion.div>
              )}

              {/* Certificate icon */}
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Award className="w-6 h-6 text-white" />
              </motion.div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2 group-hover:text-blue-500 transition-colors">
                {cert.name || cert.title}
              </h3>

              {/* Issuer */}
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-sm mb-3">
                <Building2 className="w-4 h-4" />
                <span>{cert.issuer}</span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-500 text-sm mb-4">
                <Calendar className="w-4 h-4" />
                <span>{cert.issueDate || cert.date}</span>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {cert.skills.map((skill) => (
                  <motion.span
                    key={skill}
                    whileHover={{ scale: 1.1 }}
                    className="px-2 py-1 text-xs font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>

              {/* Credential link */}
              {cert.credentialUrl && (
                <motion.a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
                  whileHover={{ x: 5 }}
                >
                  <span>View Credential</span>
                  <ExternalLink className="w-4 h-4" />
                </motion.a>
              )}

              {/* Hover glow effect */}
              <div className="absolute inset-0 -z-10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
