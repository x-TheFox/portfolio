'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersona } from '@/hooks/usePersona';
import { PersonaType } from '@/types/persona';
import { cn } from '@/lib/utils';
import { 
  Bug, X, User, Briefcase, Code, Palette, 
  Building2, Gamepad2, HelpCircle, RefreshCw
} from 'lucide-react';

const PERSONAS: { type: PersonaType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'recruiter', label: 'Recruiter', icon: Briefcase },
  { type: 'engineer', label: 'Engineer', icon: Code },
  { type: 'designer', label: 'Designer', icon: Palette },
  { type: 'cto', label: 'CTO', icon: Building2 },
  { type: 'gamer', label: 'Gamer', icon: Gamepad2 },
  { type: 'curious', label: 'Curious', icon: HelpCircle },
];

export function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const { persona, confidence, forcedPersona, forcePersona, refreshPersona, isAdapting } = usePersona();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 left-6 z-50',
          'w-10 h-10 rounded-full',
          'bg-purple-600 text-white shadow-lg',
          'hover:bg-purple-500 transition-colors',
          'flex items-center justify-center',
          forcedPersona && 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-zinc-900'
        )}
        title="Dev Tools"
      >
        <Bug size={18} />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            className={cn(
              'fixed bottom-20 left-6 z-50',
              'w-72 p-4 rounded-xl',
              'bg-zinc-900 border border-zinc-700',
              'shadow-2xl'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bug size={16} className="text-purple-400" />
                <span className="font-medium text-white text-sm">Dev Tools</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            {/* Current State */}
            <div className="mb-4 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
              <div className="flex items-center gap-2 mb-2">
                <User size={14} className="text-zinc-400" />
                <span className="text-xs text-zinc-400">Current Persona</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white font-medium capitalize">{persona}</span>
                <span className="text-xs text-zinc-500">
                  {Math.round(confidence * 100)}% confidence
                </span>
              </div>
              {forcedPersona && (
                <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  Forced (dev override)
                </div>
              )}
            </div>

            {/* Persona Selector */}
            <div className="mb-4">
              <div className="text-xs text-zinc-400 mb-2">Force Persona</div>
              <div className="grid grid-cols-3 gap-2">
                {PERSONAS.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => forcePersona(forcedPersona === type ? null : type)}
                    className={cn(
                      'p-2 rounded-lg text-xs flex flex-col items-center gap-1 transition-all',
                      forcedPersona === type
                        ? 'bg-purple-600 text-white'
                        : persona === type && !forcedPersona
                        ? 'bg-zinc-700 text-white ring-1 ring-zinc-600'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => forcePersona(null)}
                disabled={!forcedPersona}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                Reset
              </button>
              <button
                onClick={() => refreshPersona()}
                disabled={isAdapting}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  'bg-blue-600 text-white hover:bg-blue-500',
                  'disabled:opacity-50 flex items-center justify-center gap-1'
                )}
              >
                <RefreshCw size={12} className={isAdapting ? 'animate-spin' : ''} />
                Re-classify
              </button>
            </div>

            {/* Quick Info */}
            <div className="mt-4 pt-3 border-t border-zinc-700">
              <div className="text-xs text-zinc-500">
                <p>• Click persona to force it</p>
                <p>• Click again to unforce</p>
                <p>• Persists in session only</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
