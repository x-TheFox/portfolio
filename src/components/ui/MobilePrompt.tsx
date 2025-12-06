'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { detectDeviceType } from '@/lib/utils';

const MOBILE_PROMPT_KEY = 'portfolio_mobile_prompt_dismissed';

export function MobilePrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');

  useEffect(() => {
    const device = detectDeviceType();
    setDeviceType(device);

    // Only show on mobile/tablet, and only once per session
    if (device !== 'desktop') {
      const dismissed = sessionStorage.getItem(MOBILE_PROMPT_KEY);
      if (!dismissed) {
        // Show after a delay
        const timer = setTimeout(() => setIsVisible(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(MOBILE_PROMPT_KEY, 'true');
    setIsVisible(false);
  };

  if (deviceType === 'desktop' || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'fixed top-4 left-4 right-4 z-50',
            'bg-gradient-to-r from-blue-900/90 to-purple-900/90',
            'backdrop-blur-lg border border-white/10 rounded-xl p-4',
            'shadow-2xl'
          )}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 text-white/60 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                Full Experience on Desktop
              </h3>
              <p className="text-white/70 text-xs mt-1 leading-relaxed">
                This portfolio adapts to your behavior with personalized layouts. 
                Visit on desktop for the complete adaptive experience.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className={cn(
              'mt-3 w-full py-2 rounded-lg text-sm font-medium',
              'bg-white/10 text-white hover:bg-white/20',
              'transition-colors'
            )}
          >
            Got it, continue on {deviceType}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
