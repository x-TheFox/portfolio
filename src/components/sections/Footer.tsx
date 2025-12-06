'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Linkedin, Twitter, Mail, Globe, Download, Heart, ArrowUp, Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileData {
  name: string;
  email: string | null;
  resumeUrl: string | null;
  socialLinks: Record<string, string> | null;
}

interface FooterProps {
  profile?: ProfileData;
  className?: string;
}

// Social icon mapping
const socialIconMap: Record<string, React.ReactNode> = {
  github: <Github className="w-5 h-5" />,
  linkedin: <Linkedin className="w-5 h-5" />,
  twitter: <Twitter className="w-5 h-5" />,
  email: <Mail className="w-5 h-5" />,
};

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Skills', href: '#skills' },
  { label: 'Certificates', href: '#certificates' },
  { label: 'Contact', href: '#contact' },
];

export function Footer({ profile, className }: FooterProps) {
  const [showResume, setShowResume] = useState(false);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();
  const hasResume = profile?.resumeUrl && profile.resumeUrl.length > 0;

  return (
    <>
      {/* Resume Modal */}
      <AnimatePresence>
        {showResume && hasResume && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowResume(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl h-[85vh] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-700"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-900">
                <h3 className="text-white font-medium">Resume</h3>
                <div className="flex items-center gap-2">
                  <a
                    href={profile?.resumeUrl || ''}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                  <button
                    onClick={() => setShowResume(false)}
                    className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {/* PDF Viewer */}
              <iframe
                src={`${profile?.resumeUrl}#toolbar=0`}
                className="w-full h-[calc(85vh-60px)]"
                title="Resume"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer
        className={cn(
          'relative py-16 px-6 bg-zinc-950 border-t border-zinc-800',
          className
        )}
      >
      <div className="max-w-6xl mx-auto">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Brand section */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl font-bold text-white"
            >
              &lt;{profile?.name || 'Sam'}/&gt;
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-zinc-400 text-sm leading-relaxed max-w-md"
            >
              Full-stack developer passionate about building 
              exceptional digital experiences. Always learning, 
              always creating.
            </motion.p>
            
            {/* Resume buttons - only show if resume URL exists */}
            {hasResume && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-2"
              >
                <motion.button
                  onClick={() => setShowResume(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Resume
                </motion.button>
                <motion.a
                  href={profile?.resumeUrl || ''}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </motion.a>
              </motion.div>
            )}
            
            {/* Quick links - inline */}
            <nav className="flex flex-wrap gap-4 pt-4">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="text-zinc-500 hover:text-white text-sm transition-colors"
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>
          </div>

          {/* Connect section */}
          <div className="space-y-4 md:text-right">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-sm font-semibold text-zinc-300 uppercase tracking-wider"
            >
              Connect
            </motion.h3>
            
            {/* Social links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex gap-3 md:justify-end"
            >
              {profile?.socialLinks && Object.entries(profile.socialLinks).map(([platform, url], index) => (
                <motion.a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
                  title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                >
                  {socialIconMap[platform.toLowerCase()] || <Globe className="w-5 h-5" />}
                </motion.a>
              ))}
              
              {/* Email link */}
              {profile?.email && (
                <motion.a
                  href={`mailto:${profile.email}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
                  title="Send Email"
                >
                  <Mail className="w-5 h-5" />
                </motion.a>
              )}
            </motion.div>

            {/* Email text */}
            {profile?.email && (
              <motion.a
                href={`mailto:${profile.email}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-zinc-400 hover:text-white text-sm transition-colors"
              >
                {profile.email}
              </motion.a>
            )}
          </div>
        </div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-8"
        />

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-zinc-500 text-sm flex items-center gap-1"
          >
            © {currentYear} {profile?.name || 'Sam'}. Built with{' '}
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />{' '}
            and Next.js
          </motion.p>

          {/* Back to top button */}
          <motion.button
            onClick={scrollToTop}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
          >
            <ArrowUp className="w-4 h-4" />
            Back to top
          </motion.button>
        </div>
      </div>
    </footer>
    </>
  );
}
