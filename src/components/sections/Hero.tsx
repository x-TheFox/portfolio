'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Download, Github, Terminal, Palette, Gamepad2, Users, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PersonaType } from '@/types/persona';
import { usePersona } from '@/hooks/usePersona';
import { useState, useEffect, useMemo } from 'react';

interface ProfileData {
  name: string;
  email: string | null;
  bio: string | null;
  shortBio: string | null;
  profileImageUrl: string | null;
  resumeUrl: string | null;
  socialLinks: Record<string, string> | null;
  location: string | null;
  available: boolean;
}

interface HeroProps {
  name?: string;
  title?: string;
  className?: string;
  profile?: ProfileData;
}

// Persona-specific hero content
const HERO_CONTENT: Record<PersonaType, {
  headline: string;
  subheadline: string;
  cta: { text: string; href: string; icon: React.ReactNode };
  secondaryCta?: { text: string; href: string };
  accent: string;
  bgGradient: string;
}> = {
  recruiter: {
    headline: 'Full-Stack Developer',
    subheadline: 'Building scalable applications with modern technologies. 5+ years of experience delivering impactful solutions.',
    cta: { text: 'Download Resume', href: '/resume.pdf', icon: <Download size={18} /> },
    secondaryCta: { text: 'View Skills', href: '#skills' },
    accent: 'text-blue-400',
    bgGradient: 'from-blue-950/50 via-transparent to-transparent',
  },
  engineer: {
    headline: 'Building with Code',
    subheadline: 'TypeScript, React, Node.js, and beyond. Passionate about clean architecture and developer experience.',
    cta: { text: 'View GitHub', href: 'https://github.com', icon: <Github size={18} /> },
    secondaryCta: { text: 'Explore Projects', href: '/projects' },
    accent: 'text-green-400',
    bgGradient: 'from-green-950/50 via-transparent to-transparent',
  },
  designer: {
    headline: 'Crafting Experiences',
    subheadline: 'Where aesthetics meet functionality. Designing interfaces that delight users and solve real problems.',
    cta: { text: 'View Portfolio', href: '/projects?category=design', icon: <Palette size={18} /> },
    secondaryCta: { text: 'See Case Studies', href: '/case-studies' },
    accent: 'text-purple-400',
    bgGradient: 'from-purple-950/50 via-transparent to-transparent',
  },
  cto: {
    headline: 'Engineering Leadership',
    subheadline: 'Architecting systems at scale. Experience building and leading high-performance engineering teams.',
    cta: { text: 'Let\'s Talk Strategy', href: '/intake', icon: <Users size={18} /> },
    secondaryCta: { text: 'View Skills', href: '#skills' },
    accent: 'text-amber-400',
    bgGradient: 'from-amber-950/50 via-transparent to-transparent',
  },
  gamer: {
    headline: 'Code & Play',
    subheadline: 'Game dev enthusiast building interactive experiences. Unity, Unreal, and web-based games.',
    cta: { text: 'Play Demos', href: '/projects?category=game', icon: <Gamepad2 size={18} /> },
    secondaryCta: { text: 'See All Projects', href: '/projects' },
    accent: 'text-red-400',
    bgGradient: 'from-red-950/50 via-transparent to-transparent',
  },
  curious: {
    headline: 'Welcome, Explorer',
    subheadline: 'Developer, designer, builder. Take a look around and discover what interests you.',
    cta: { text: 'Start Exploring', href: '#projects', icon: <Compass size={18} /> },
    secondaryCta: { text: 'About Me', href: '#about' },
    accent: 'text-zinc-400',
    bgGradient: 'from-zinc-900/50 via-transparent to-transparent',
  },
};

export function Hero({ name = 'Developer', title, className, profile }: HeroProps) {
  const { persona, isAdapting } = usePersona();
  const content = HERO_CONTENT[persona];
  const displayName = profile?.name || name;
  const resumeUrl = profile?.resumeUrl || '/resume.pdf';
  const githubUrl = (profile?.socialLinks as { github?: string })?.github || 'https://github.com';

  // Generate stable particle positions on client side only to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use seeded random for consistent positions
  const particles = useMemo(() => {
    const seed = 12345;
    const seededRandom = (i: number) => {
      const x = Math.sin(seed + i * 9999) * 10000;
      return x - Math.floor(x);
    };
    return [...Array(20)].map((_, i) => ({
      id: i,
      initialX: seededRandom(i) * 100,
      initialY: seededRandom(i + 100) * 100,
      targetX: seededRandom(i + 200) * 100,
      targetY: seededRandom(i + 300) * 100,
      duration: seededRandom(i + 400) * 20 + 10,
    }));
  }, []);

  return (
    <section
      id="hero"
      data-section="hero"
      className={cn(
        'relative min-h-[90vh] flex items-center justify-center',
        'px-6 py-24 overflow-hidden',
        className
      )}
    >
      {/* Animated background particles - only render on client */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute w-2 h-2 bg-blue-500/20 rounded-full"
              initial={{
                left: `${p.initialX}%`,
                top: `${p.initialY}%`,
              }}
              animate={{
                left: `${p.targetX}%`,
                top: `${p.targetY}%`,
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            />
          ))}
        </div>
      )}

      {/* Background gradient based on persona */}
      <motion.div
        key={persona}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className={cn(
          'absolute inset-0 bg-gradient-to-b',
          content.bgGradient
        )}
      />

      {/* Terminal decoration for engineer persona */}
      {persona === 'engineer' && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 0.1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute top-20 right-10 hidden lg:block"
        >
          <Terminal size={300} className="text-green-500" />
        </motion.div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Profile Image */}
        {profile?.profileImageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <img
              src={profile.profileImageUrl}
              alt={displayName}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto border-4 border-zinc-700/50 shadow-xl object-cover"
            />
          </motion.div>
        )}
        
        {/* Name/Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <span className={cn('text-sm font-medium tracking-wider uppercase', content.accent)}>
            {displayName}
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          key={`headline-${persona}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isAdapting ? 0.5 : 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
        >
          {title || content.headline}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          key={`subheadline-${persona}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isAdapting ? 0.5 : 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto"
        >
          {content.subheadline}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {/* Primary CTA */}
          <motion.a
            href={
              content.cta.text === 'Download Resume'
                ? resumeUrl 
                : content.cta.text === 'View GitHub'
                  ? githubUrl
                  : content.cta.href
            }
            download={content.cta.text === 'Download Resume' ? true : undefined}
            target={content.cta.href.startsWith('http') || content.cta.text === 'View GitHub' ? '_blank' : undefined}
            rel={content.cta.href.startsWith('http') || content.cta.text === 'View GitHub' ? 'noopener noreferrer' : undefined}
            data-track="hero-cta-primary"
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'inline-flex items-center justify-center gap-2',
              'px-8 py-4 rounded-xl font-medium',
              'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
              'shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40',
              'transition-all duration-300'
            )}
          >
            {content.cta.icon}
            {content.cta.text}
          </motion.a>

          {/* Secondary CTA */}
          {content.secondaryCta && (
            <motion.a
              href={content.secondaryCta.href}
              data-track="hero-cta-secondary"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'inline-flex items-center justify-center gap-2',
                'px-8 py-4 rounded-xl font-medium',
                'border-2 border-zinc-700 text-zinc-300',
                'hover:bg-zinc-800/50 hover:border-zinc-500',
                'transition-all duration-300 group'
              )}
            >
              {content.secondaryCta.text}
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <ArrowRight size={16} />
              </motion.span>
            </motion.a>
          )}
        </motion.div>

        {/* Quick stats for recruiter persona */}
        {persona === 'recruiter' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            {[
              { value: '5+', label: 'Years Experience' },
              { value: '50+', label: 'Projects Shipped' },
              { value: '100%', label: 'Remote Ready' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
