'use client';

import { motion } from 'framer-motion';
import { Mail, MessageSquare, Calendar, Send, Briefcase, Coffee, Gamepad } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PersonaType } from '@/types/persona';
import { usePersona } from '@/hooks/usePersona';

interface ContactProps {
  email?: string;
  className?: string;
}

// Persona-specific contact presentation
const PERSONA_CONTACT_CONFIG: Record<PersonaType, {
  headline: string;
  subheadline: string;
  cta: { text: string; href: string; icon: React.ReactNode };
  secondaryCta?: { text: string; href: string; icon: React.ReactNode };
  accent: string;
}> = {
  recruiter: {
    headline: "Let's Discuss Opportunities",
    subheadline: "I'm open to discussing new roles and opportunities. Let's find a great fit.",
    cta: { text: "Send Email", href: "mailto:", icon: <Mail size={18} /> },
    secondaryCta: { text: "View Resume", href: "/resume.pdf", icon: <Briefcase size={18} /> },
    accent: 'from-blue-600 to-blue-500',
  },
  engineer: {
    headline: "Let's Collaborate",
    subheadline: "Interested in working together on something technical? I'm always up for interesting challenges.",
    cta: { text: "Start a Conversation", href: "mailto:", icon: <MessageSquare size={18} /> },
    secondaryCta: { text: "Schedule a Call", href: "/intake", icon: <Calendar size={18} /> },
    accent: 'from-green-600 to-green-500',
  },
  designer: {
    headline: "Let's Create Together",
    subheadline: "Have a design challenge or creative project in mind? I'd love to hear about it.",
    cta: { text: "Get in Touch", href: "mailto:", icon: <Send size={18} /> },
    secondaryCta: { text: "Book a Call", href: "/intake", icon: <Coffee size={18} /> },
    accent: 'from-purple-600 to-purple-500',
  },
  cto: {
    headline: "Let's Talk Strategy",
    subheadline: "Looking for technical leadership or architecture consultation? Let's discuss how I can help.",
    cta: { text: "Schedule a Call", href: "/intake", icon: <Calendar size={18} /> },
    secondaryCta: { text: "Send Email", href: "mailto:", icon: <Mail size={18} /> },
    accent: 'from-amber-600 to-amber-500',
  },
  gamer: {
    headline: "Let's Play",
    subheadline: "Want to collaborate on a game project or just chat about game dev? Hit me up!",
    cta: { text: "Say Hello", href: "mailto:", icon: <Gamepad size={18} /> },
    accent: 'from-red-600 to-red-500',
  },
  curious: {
    headline: "Get in Touch",
    subheadline: "Have questions or want to connect? I'd love to hear from you.",
    cta: { text: "Send a Message", href: "mailto:", icon: <Mail size={18} /> },
    secondaryCta: { text: "Use AI Intake", href: "/intake", icon: <MessageSquare size={18} /> },
    accent: 'from-zinc-600 to-zinc-500',
  },
};

export function Contact({ email = 'hello@example.com', className }: ContactProps) {
  const { persona, isAdapting } = usePersona();
  const config = PERSONA_CONTACT_CONFIG[persona];

  return (
    <section
      id="contact"
      data-section="contact"
      className={cn('py-24 px-6', className)}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          whileInView={{ opacity: isAdapting ? 0.5 : 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
          className={cn(
            'relative p-8 md:p-12 rounded-2xl overflow-hidden',
            'bg-gradient-to-br from-zinc-900 to-zinc-950',
            'border border-zinc-800',
            'hover:border-zinc-700 transition-colors duration-300'
          )}
        >
          {/* Animated accent gradient */}
          <motion.div 
            className={cn(
              'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
              config.accent
            )}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ transformOrigin: 'left' }}
          />

          {/* Content */}
          <div className="text-center">
            <motion.h2
              key={`contact-headline-${persona}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-3xl md:text-4xl font-bold text-white mb-4"
            >
              {config.headline}
            </motion.h2>
            
            <motion.p
              key={`contact-subheadline-${persona}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto"
            >
              {config.subheadline}
            </motion.p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href={config.cta.href === 'mailto:' ? `mailto:${email}` : config.cta.href}
                data-track="contact-cta-primary"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.4 }}
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)'
                }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'inline-flex items-center justify-center gap-2',
                  'px-6 py-3 rounded-lg font-medium',
                  'bg-gradient-to-r text-white',
                  config.accent,
                  'hover:opacity-90 transition-all duration-200'
                )}
              >
                {config.cta.icon}
                {config.cta.text}
              </motion.a>

              {config.secondaryCta && (
                <motion.a
                  href={config.secondaryCta.href === 'mailto:' ? `mailto:${email}` : config.secondaryCta.href}
                  data-track="contact-cta-secondary"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: 'rgba(63, 63, 70, 0.5)'
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'inline-flex items-center justify-center gap-2',
                    'px-6 py-3 rounded-lg font-medium',
                    'border border-zinc-700 text-zinc-300',
                    'hover:border-zinc-500',
                    'transition-all duration-200'
                  )}
                >
                  {config.secondaryCta.icon}
                  {config.secondaryCta.text}
                </motion.a>
              )}
            </div>

            {/* Email display */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-8 text-sm text-zinc-500"
            >
              Or email directly at{' '}
              <a
                href={`mailto:${email}`}
                className="text-zinc-400 hover:text-white transition-colors underline underline-offset-4"
              >
                {email}
              </a>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
