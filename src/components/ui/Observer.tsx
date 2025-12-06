'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Sparkles, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePersona } from '@/hooks/usePersona';

type ObserverState = 'idle' | 'analyzing' | 'personalizing' | 'complete';

interface ObserverProps {
  className?: string;
}

export function Observer({ className }: ObserverProps) {
  const { isAdapting, persona, classification } = usePersona();
  
  const state: ObserverState = isAdapting 
    ? 'analyzing' 
    : classification?.confidence && classification.confidence > 0.6 
      ? 'complete' 
      : 'idle';

  const stateConfig = {
    idle: {
      icon: Eye,
      text: 'Observing...',
      color: 'text-zinc-500',
      bg: 'bg-zinc-900/50',
    },
    analyzing: {
      icon: Sparkles,
      text: 'Analyzing your path...',
      color: 'text-blue-400',
      bg: 'bg-blue-950/50',
    },
    personalizing: {
      icon: Sparkles,
      text: 'Personalizing layout...',
      color: 'text-purple-400',
      bg: 'bg-purple-950/50',
    },
    complete: {
      icon: CheckCircle,
      text: `Optimized for ${persona}`,
      color: 'text-green-400',
      bg: 'bg-green-950/50',
    },
  };

  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'fixed bottom-4 left-4 z-40',
          'flex items-center gap-2 px-3 py-2 rounded-full',
          'border border-zinc-800/50 backdrop-blur-sm',
          'text-xs font-medium',
          config.bg,
          config.color,
          className
        )}
      >
        <motion.div
          animate={state === 'analyzing' ? { rotate: 360 } : {}}
          transition={{ duration: 2, repeat: state === 'analyzing' ? Infinity : 0, ease: 'linear' }}
        >
          <Icon size={14} />
        </motion.div>
        <span>{config.text}</span>
        
        {/* Pulsing dot for active states */}
        {state === 'analyzing' && (
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-blue-400"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
