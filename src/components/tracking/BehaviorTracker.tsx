'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { nanoid } from 'nanoid';
import { throttle, generateFingerprint, detectDeviceType } from '@/lib/utils';
import { BehaviorEvent, BehaviorEventType } from '@/types/behavior';
import { useTrackingConsent } from './ConsentBanner';

const SESSION_KEY = 'portfolio_session_id';
const FLUSH_INTERVAL = 5000; // 5 seconds
const SCROLL_THROTTLE = 1000; // 1 second

interface BehaviorTrackerProps {
  enabled?: boolean;
  onSessionReady?: (sessionId: string) => void;
}

export function BehaviorTracker({ enabled: enabledProp, onSessionReady }: BehaviorTrackerProps) {
  const consent = useTrackingConsent();
  // Use prop if provided, otherwise use consent status
  const enabled = enabledProp ?? consent === true;
  
  const sessionIdRef = useRef<string>('');
  const bufferRef = useRef<BehaviorEvent[]>([]);
  const pageLoadTimeRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());
  const maxScrollDepthRef = useRef<number>(0);
  const navigationPathRef = useRef<string[]>([]);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get or create session ID
  const getSessionId = useCallback((): string => {
    if (sessionIdRef.current) return sessionIdRef.current;

    // Check localStorage first
    let sessionId = localStorage.getItem(SESSION_KEY);
    
    if (!sessionId) {
      // Generate fingerprint-based or random ID
      const fingerprint = generateFingerprint();
      sessionId = fingerprint !== 'server' ? `fp_${fingerprint}` : `rand_${nanoid()}`;
      localStorage.setItem(SESSION_KEY, sessionId);
    }

    sessionIdRef.current = sessionId;
    return sessionId;
  }, []);

  // Queue an event
  const queueEvent = useCallback((type: BehaviorEventType, data: BehaviorEvent['data']) => {
    if (!enabled) return;

    bufferRef.current.push({
      sessionId: getSessionId(),
      timestamp: Date.now(),
      type,
      data,
    });

    lastActivityRef.current = Date.now();
  }, [enabled, getSessionId]);

  // Flush events to server
  const flushEvents = useCallback(() => {
    if (bufferRef.current.length === 0) return;

    const events = [...bufferRef.current];
    bufferRef.current = [];

    // Use sendBeacon for reliable delivery (even on page unload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', JSON.stringify({
        events,
        deviceType: detectDeviceType(),
      }));
    } else {
      // Fallback to fetch
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events, deviceType: detectDeviceType() }),
        keepalive: true,
      }).catch(() => {
        // Silent fail - tracking is non-critical
      });
    }
  }, []);

  // Calculate scroll depth percentage
  const getScrollDepth = useCallback((): number => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
  }, []);

  // Reset idle timer
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = setTimeout(() => {
      const idleDuration = Date.now() - lastActivityRef.current;
      queueEvent('idle', { idleDuration });
    }, 30000); // 30 seconds of inactivity = idle
  }, [queueEvent]);

  useEffect(() => {
    if (!enabled) return;

    const sessionId = getSessionId();
    onSessionReady?.(sessionId);

    // Track initial pageview
    const currentPath = window.location.pathname;
    navigationPathRef.current.push(currentPath);
    queueEvent('pageview', {
      path: currentPath,
      referrer: document.referrer,
    });

    // Scroll tracking (throttled)
    const handleScroll = throttle(() => {
      const depth = getScrollDepth();
      if (depth > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = depth;
      }
      queueEvent('scroll', { depth, maxDepth: maxScrollDepthRef.current });
      resetIdleTimer();
    }, SCROLL_THROTTLE);

    // Click tracking
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const element = target.closest('[data-track]') || target.closest('a, button');
      
      if (element) {
        const trackId = element.getAttribute('data-track') || element.tagName.toLowerCase();
        const section = element.closest('section')?.getAttribute('data-section');
        const elementType = element.tagName.toLowerCase() as BehaviorEvent['data']['elementType'];
        
        queueEvent('click', {
          element: trackId,
          elementType,
          section: section || undefined,
        });
      }
      resetIdleTimer();
    };

    // Mouse move (for general activity, very throttled)
    const handleMouseMove = throttle(() => {
      resetIdleTimer();
    }, 5000);

    // Visibility change (track time on page)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const timeOnPage = Date.now() - pageLoadTimeRef.current;
        queueEvent('time', { 
          timeOnPage,
          path: window.location.pathname,
        });
        flushEvents();
      } else {
        pageLoadTimeRef.current = Date.now();
      }
    };

    // Before unload
    const handleBeforeUnload = () => {
      const timeOnPage = Date.now() - pageLoadTimeRef.current;
      queueEvent('time', { 
        timeOnPage,
        totalTime: timeOnPage,
        path: window.location.pathname,
      });
      queueEvent('scroll', { 
        depth: getScrollDepth(), 
        maxDepth: maxScrollDepthRef.current 
      });
      flushEvents();
    };

    // Popstate (navigation)
    const handlePopState = () => {
      const newPath = window.location.pathname;
      const oldPath = navigationPathRef.current[navigationPathRef.current.length - 1];
      
      if (newPath !== oldPath) {
        navigationPathRef.current.push(newPath);
        queueEvent('navigation', {
          from: oldPath,
          to: newPath,
          sequence: [...navigationPathRef.current],
        });
        queueEvent('pageview', { path: newPath });
        maxScrollDepthRef.current = 0;
        pageLoadTimeRef.current = Date.now();
      }
    };

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Periodic flush
    const flushInterval = setInterval(flushEvents, FLUSH_INTERVAL);

    // Initial idle timer
    resetIdleTimer();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      clearInterval(flushInterval);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      flushEvents();
    };
  }, [enabled, getSessionId, onSessionReady, queueEvent, flushEvents, getScrollDepth, resetIdleTimer]);

  // This component renders nothing - it's purely for side effects
  return null;
}

// Custom hook for manual event tracking
export function useTrackEvent() {
  const trackEvent = useCallback((
    type: BehaviorEventType,
    data: BehaviorEvent['data']
  ) => {
    const sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) return;

    const event: BehaviorEvent = {
      sessionId,
      timestamp: Date.now(),
      type,
      data,
    };

    // Send immediately for manual events
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: [event] }),
    }).catch(() => {});
  }, []);

  return trackEvent;
}
