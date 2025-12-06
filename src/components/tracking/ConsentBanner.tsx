'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const CONSENT_KEY = 'portfolio_tracking_consent';
const CONSENT_DISMISSED_KEY = 'portfolio_consent_dismissed';

interface ConsentBannerProps {
  onConsent?: (given: boolean) => void;
}

export function ConsentBanner({ onConsent }: ConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleConsentChange = useCallback((given: boolean) => {
    onConsent?.(given);
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('consent-change', { detail: { given } }));
  }, [onConsent]);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(CONSENT_KEY);
    const dismissed = localStorage.getItem(CONSENT_DISMISSED_KEY);
    
    if (consent !== null) {
      handleConsentChange(consent === 'true');
      setHasInteracted(true);
    } else if (dismissed !== 'true') {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [handleConsentChange]);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    document.cookie = `${CONSENT_KEY}=true; max-age=31536000; path=/; SameSite=Lax`;
    setIsVisible(false);
    setHasInteracted(true);
    handleConsentChange(true);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'false');
    document.cookie = `${CONSENT_KEY}=false; max-age=31536000; path=/; SameSite=Lax`;
    setIsVisible(false);
    setHasInteracted(true);
    handleConsentChange(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(CONSENT_DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  if (hasInteracted || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'fixed bottom-4 left-4 right-4 z-50',
            'md:left-auto md:right-4 md:max-w-md'
          )}
        >
          <div className="bg-zinc-900/95 backdrop-blur-lg border border-zinc-800 rounded-2xl p-5 shadow-2xl">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Cookie className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">
                  Personalized Experience
                </h3>
                <p className="text-zinc-400 text-xs mt-0.5">
                  Help me show you what matters most
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
              This portfolio uses anonymous behavior tracking to adapt its content 
              to your interests. I don&apos;t collect personal data — just interaction 
              patterns to provide a better experience.
            </p>

            {/* Privacy note */}
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
              <Shield size={14} />
              <span>No personal data • Anonymous • You can opt out anytime</span>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium',
                  'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
                  'transition-colors'
                )}
              >
                No thanks
              </button>
              <button
                onClick={handleAccept}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium',
                  'bg-blue-600 text-white hover:bg-blue-500',
                  'transition-colors'
                )}
              >
                Personalize
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to check consent status
export function useTrackingConsent(): boolean | null {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    setConsent(stored === 'true' ? true : stored === 'false' ? false : null);

    // Listen for consent changes
    const handleConsentChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ given: boolean }>;
      setConsent(customEvent.detail.given);
    };

    window.addEventListener('consent-change', handleConsentChange);
    return () => window.removeEventListener('consent-change', handleConsentChange);
  }, []);

  return consent;
}

// Hook to manage consent
export function useConsentManager() {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    setConsent(stored === 'true' ? true : stored === 'false' ? false : null);
  }, []);

  const grantConsent = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    document.cookie = `${CONSENT_KEY}=true; max-age=31536000; path=/; SameSite=Lax`;
    setConsent(true);
    window.dispatchEvent(new CustomEvent('consent-change', { detail: { given: true } }));
  };

  const revokeConsent = () => {
    localStorage.setItem(CONSENT_KEY, 'false');
    document.cookie = `${CONSENT_KEY}=false; max-age=31536000; path=/; SameSite=Lax`;
    setConsent(false);
    window.dispatchEvent(new CustomEvent('consent-change', { detail: { given: false } }));
  };

  return { consent, grantConsent, revokeConsent };
}
