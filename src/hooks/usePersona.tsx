'use client';

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { PersonaType, PersonaClassification, DEFAULT_PERSONA } from '@/types/persona';
import { generateFingerprint } from '@/lib/utils';

interface PersonaContextValue {
  persona: PersonaType;
  confidence: number;
  classification: PersonaClassification | null;
  isLoading: boolean;
  isAdapting: boolean;
  sessionId: string | null;
  refreshPersona: () => Promise<void>;
  // Dev tools
  forcePersona: (persona: PersonaType | null) => void;
  forcedPersona: PersonaType | null;
}

const PersonaContext = createContext<PersonaContextValue>({
  persona: DEFAULT_PERSONA,
  confidence: 0,
  classification: null,
  isLoading: true,
  isAdapting: false,
  sessionId: null,
  refreshPersona: async () => {},
  forcePersona: () => {},
  forcedPersona: null,
});

export function usePersona() {
  return useContext(PersonaContext);
}

interface PersonaProviderProps {
  children: React.ReactNode;
}

export function PersonaProvider({ children }: PersonaProviderProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [classification, setClassification] = useState<PersonaClassification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdapting, setIsAdapting] = useState(false);
  const [forcedPersona, setForcedPersona] = useState<PersonaType | null>(null);
  
  // Use refs to avoid infinite loops in callbacks
  const lastClassifiedAtRef = useRef(0);
  const classificationRef = useRef<PersonaClassification | null>(null);
  const isInitializedRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    classificationRef.current = classification;
  }, [classification]);

  // Load forced persona from sessionStorage (dev only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const stored = sessionStorage.getItem('dev_forced_persona');
      if (stored) {
        setForcedPersona(stored as PersonaType);
      }
    }
  }, []);

  // Force persona function (dev only)
  const forcePersona = useCallback((persona: PersonaType | null) => {
    if (process.env.NODE_ENV !== 'development') return;
    
    setForcedPersona(persona);
    if (persona) {
      sessionStorage.setItem('dev_forced_persona', persona);
    } else {
      sessionStorage.removeItem('dev_forced_persona');
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    const initSession = async () => {
      // Check for existing session
      let existingSessionId = localStorage.getItem('portfolio_session_id');
      
      if (!existingSessionId) {
        // Generate new session based on fingerprint
        const fingerprint = await generateFingerprint();
        existingSessionId = fingerprint;
        localStorage.setItem('portfolio_session_id', existingSessionId);
      }
      
      // Check for cached persona
      const cached = localStorage.getItem('portfolio_persona');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setClassification(parsed);
          classificationRef.current = parsed;
        } catch {
          // Invalid cache
        }
      }
      
      setSessionId(existingSessionId);
      setIsLoading(false);
    };

    initSession();
  }, []);

  const classifyPersona = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    // Prevent too-frequent classification (min 30 seconds between calls)
    const now = Date.now();
    if (now - lastClassifiedAtRef.current < 30000 && classificationRef.current) {
      return;
    }

    try {
      setIsAdapting(true);
      
      const response = await fetch('/api/persona/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, useAI: true }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.classification) {
          // Only update if persona changed or confidence improved
          const current = classificationRef.current;
          if (
            !current ||
            data.classification.persona !== current.persona ||
            data.classification.confidence > current.confidence
          ) {
            setClassification(data.classification);
            classificationRef.current = data.classification;
          }
        }
      }

      lastClassifiedAtRef.current = now;
    } catch (error) {
      console.error('Failed to classify persona:', error);
    } finally {
      // Slight delay before removing adapting state (for animation)
      setTimeout(() => setIsAdapting(false), 500);
    }
  }, [sessionId]);

  // Initial classification after session is ready
  useEffect(() => {
    if (!sessionId) return;

    // Wait a bit for behavior data to accumulate
    const timer = setTimeout(classifyPersona, 5000);
    return () => clearTimeout(timer);
  }, [sessionId, classifyPersona]);

  // Re-classify periodically (every 2 minutes while active)
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(classifyPersona, 120000);
    return () => clearInterval(interval);
  }, [sessionId, classifyPersona]);

  // Cache classification
  useEffect(() => {
    if (classification) {
      localStorage.setItem('portfolio_persona', JSON.stringify(classification));
    }
  }, [classification]);

  const value: PersonaContextValue = {
    persona: forcedPersona ?? classification?.persona ?? DEFAULT_PERSONA,
    confidence: forcedPersona ? 1 : (classification?.confidence ?? 0),
    classification: forcedPersona ? { persona: forcedPersona, confidence: 1, mood: 'focused' } : classification,
    isLoading,
    isAdapting,
    sessionId,
    refreshPersona: classifyPersona,
    forcePersona,
    forcedPersona,
  };

  return (
    <PersonaContext.Provider value={value}>
      {children}
    </PersonaContext.Provider>
  );
}
