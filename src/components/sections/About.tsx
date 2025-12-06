'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  Calendar, Rocket, Smile, MapPin, Github, Linkedin, Twitter, Globe, Mail, Code2,
  Briefcase, Award, Users, Star, Heart, Coffee, Zap, Target, TrendingUp, Clock,
  CheckCircle, Trophy, Book, Lightbulb, Building, Layers, Database, Server,
  Monitor, Smartphone, Laptop, Terminal, FileCode, GitBranch, Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Highlight {
  label: string;
  value: string;
  icon?: string;
}

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

interface AboutProps {
  title?: string;
  content?: string;
  highlights?: Highlight[];
  profile?: ProfileData;
  className?: string;
}

// Comprehensive icon mapping for highlights
const iconMap: Record<string, React.ReactNode> = {
  // Time & Experience
  calendar: <Calendar className="w-5 h-5" />,
  clock: <Clock className="w-5 h-5" />,
  
  // Achievement & Success
  rocket: <Rocket className="w-5 h-5" />,
  trophy: <Trophy className="w-5 h-5" />,
  award: <Award className="w-5 h-5" />,
  star: <Star className="w-5 h-5" />,
  target: <Target className="w-5 h-5" />,
  'trending-up': <TrendingUp className="w-5 h-5" />,
  check: <CheckCircle className="w-5 h-5" />,
  
  // People & Social
  smile: <Smile className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  heart: <Heart className="w-5 h-5" />,
  
  // Work & Business
  briefcase: <Briefcase className="w-5 h-5" />,
  building: <Building className="w-5 h-5" />,
  
  // Tech & Development
  code: <Code2 className="w-5 h-5" />,
  terminal: <Terminal className="w-5 h-5" />,
  'file-code': <FileCode className="w-5 h-5" />,
  'git-branch': <GitBranch className="w-5 h-5" />,
  package: <Package className="w-5 h-5" />,
  layers: <Layers className="w-5 h-5" />,
  database: <Database className="w-5 h-5" />,
  server: <Server className="w-5 h-5" />,
  
  // Devices
  monitor: <Monitor className="w-5 h-5" />,
  smartphone: <Smartphone className="w-5 h-5" />,
  laptop: <Laptop className="w-5 h-5" />,
  
  // Ideas & Learning
  lightbulb: <Lightbulb className="w-5 h-5" />,
  book: <Book className="w-5 h-5" />,
  
  // Energy & Action
  zap: <Zap className="w-5 h-5" />,
  coffee: <Coffee className="w-5 h-5" />,
};

// Social icon mapping
const socialIconMap: Record<string, React.ReactNode> = {
  github: <Github className="w-5 h-5" />,
  linkedin: <Linkedin className="w-5 h-5" />,
  twitter: <Twitter className="w-5 h-5" />,
  website: <Globe className="w-5 h-5" />,
  email: <Mail className="w-5 h-5" />,
};

export function About({
  title = 'About Me',
  content = '',
  highlights = [],
  profile,
  className,
}: AboutProps) {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      ref={sectionRef}
      id="about"
      data-section="about"
      className={cn('py-24 px-6 relative overflow-hidden', className)}
    >
      {/* Background gradient */}
      <motion.div
        className="absolute inset-0 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: isInView ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent" />
      </motion.div>

      <div className="max-w-3xl mx-auto">
        {/* Card container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative p-8 md:p-12 rounded-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm"
        >
          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-tr-2xl" />
          
          {/* Header with icon */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Code2 className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>

          {/* Status badges */}
          {profile && (profile.location || profile.available) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-3 mb-8"
            >
              {profile.location && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-zinc-800 text-zinc-300 border border-zinc-700">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  {profile.location}
                </span>
              )}
              {profile.available && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-green-500/10 text-green-400 border border-green-500/20">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Available for work
                </span>
              )}
            </motion.div>
          )}

          {/* Bio text */}
          <div className="space-y-4 mb-8">
            {content.split('\n\n').map((paragraph, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="text-zinc-400 leading-relaxed"
              >
                {paragraph}
              </motion.p>
            ))}
          </div>

          {/* Social Links */}
          {profile?.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5 }}
              className="flex gap-2 pt-4 border-t border-zinc-800"
            >
              {Object.entries(profile.socialLinks).map(([platform, url]) => (
                <motion.a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                  title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                >
                  {socialIconMap[platform.toLowerCase()] || <Globe className="w-5 h-5" />}
                </motion.a>
              ))}
            </motion.div>
          )}

          {/* Highlights */}
          {highlights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-4 pt-8 mt-8 border-t border-zinc-800"
            >
              {highlights.map((highlight, index) => (
                <motion.div
                  key={highlight.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl font-bold text-white mb-1">{highlight.value}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">{highlight.label}</div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
