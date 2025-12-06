// Behavior event types
export type BehaviorEventType = 
  | 'pageview'
  | 'scroll'
  | 'click'
  | 'hover'
  | 'time'
  | 'navigation'
  | 'interaction'
  | 'idle';

// Base behavior event
export interface BehaviorEvent {
  sessionId: string;
  timestamp: number;
  type: BehaviorEventType;
  data: BehaviorEventData;
}

// Event data variants
export interface BehaviorEventData {
  // Pageview
  path?: string;
  referrer?: string;
  
  // Scroll
  depth?: number; // 0-100 percentage
  maxDepth?: number;
  
  // Click
  element?: string; // CSS selector or element identifier
  elementType?: 'link' | 'button' | 'card' | 'image' | 'code' | 'other';
  section?: string;
  
  // Hover
  duration?: number; // ms
  keywords?: string[];
  
  // Time
  timeOnPage?: number; // ms
  totalTime?: number;
  
  // Navigation
  from?: string;
  to?: string;
  sequence?: string[];
  speed?: 'fast' | 'medium' | 'slow';
  
  // Interaction
  interactionType?: 'animation' | 'demo' | 'code' | 'form' | 'chat';
  
  // Idle
  idleDuration?: number; // ms
}

// Aggregated behavior metrics (for vectorization)
export interface BehaviorMetrics {
  timeOnHomepage: number;
  scrollDepth: number;
  clickedResume: boolean;
  openedCodeSamplesCount: number;
  visitedProjectsCount: number;
  openedDesignShowcase: boolean;
  playedDemosCount: number;
  openedAiIntakeForm: boolean;
  mouseHeatmapDensity: number;
  navigationSpeed: number;
  hoveredKeywords: string[];
  interactedWithAnimations: boolean;
  idleTime: number;
  navigationPath: string[];
}

// Behavior vector dimensions (12D)
export interface BehaviorVector {
  resumeFocus: number;      // 0: Resume/experience interactions
  codeFocus: number;        // 1: Code samples, GitHub
  designFocus: number;      // 2: Design, visuals, case studies
  leadershipFocus: number;  // 3: Architecture, methodology
  gameFocus: number;        // 4: Games, demos, interactive
  explorationBreadth: number; // 5: Navigation variety
  engagementDepth: number;  // 6: Time spent, scroll depth
  interactionRate: number;  // 7: Click/interaction frequency
  technicalInterest: number; // 8: Technical content engagement
  visualInterest: number;   // 9: Visual content engagement
  navigationSpeed: number;  // 10: Fast scanner vs deep reader
  intentClarity: number;    // 11: Focused vs wandering
}

// Session with tracking consent
export interface TrackingSession {
  id: string;
  fingerprintHash: string;
  consentGiven: boolean;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  createdAt: Date;
}
