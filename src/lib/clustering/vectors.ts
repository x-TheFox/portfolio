import { AggregatedBehavior } from '@/lib/db/schema';
import { BehaviorVector } from '@/types/behavior';
import { normalize } from '@/lib/utils';

// Thresholds for normalization
const THRESHOLDS = {
  timeOnHomepage: { min: 0, max: 300 }, // 0-5 minutes
  scrollDepth: { min: 0, max: 1 }, // Already 0-1
  codeViews: { min: 0, max: 10 },
  projectViews: { min: 0, max: 15 },
  demoPlays: { min: 0, max: 5 },
  idleTime: { min: 0, max: 120 }, // 0-2 minutes
  navigationSpeed: { min: 5, max: 60 }, // seconds per page
};

// Section keywords for interest detection
const SECTION_KEYWORDS = {
  resume: ['resume', 'cv', 'experience', 'work', 'employment', 'career', 'hire'],
  code: ['code', 'github', 'repository', 'source', 'implementation', 'technical'],
  design: ['design', 'ui', 'ux', 'visual', 'portfolio', 'case-study', 'mockup'],
  leadership: ['architecture', 'system', 'team', 'lead', 'manager', 'scale', 'methodology'],
  game: ['game', 'demo', 'play', 'interactive', 'engine', 'unity', 'unreal'],
};

// Convert aggregated behavior to 12-dimensional vector
export function behaviorToVector(behavior: AggregatedBehavior): number[] {
  const navPath = (behavior.navigationPath as string[]) || [];
  const hoveredKw = (behavior.hoveredKeywords as string[]) || [];
  
  // Calculate focus scores based on clicks and navigation
  const resumeFocus = calculateFocus(navPath, hoveredKw, SECTION_KEYWORDS.resume, behavior.clickedResume ?? false);
  const codeFocus = calculateFocus(navPath, hoveredKw, SECTION_KEYWORDS.code, false) + 
    normalize(behavior.openedCodeSamplesCount || 0, 0, THRESHOLDS.codeViews.max) * 0.5;
  const designFocus = calculateFocus(navPath, hoveredKw, SECTION_KEYWORDS.design, behavior.openedDesignShowcase || false);
  const leadershipFocus = calculateFocus(navPath, hoveredKw, SECTION_KEYWORDS.leadership, false);
  const gameFocus = calculateFocus(navPath, hoveredKw, SECTION_KEYWORDS.game, false) +
    normalize(behavior.playedDemosCount || 0, 0, THRESHOLDS.demoPlays.max) * 0.5;

  // Calculate engagement metrics
  const explorationBreadth = calculateExplorationBreadth(navPath);
  const engagementDepth = calculateEngagementDepth(behavior);
  const interactionRate = calculateInteractionRate(behavior);
  
  // Calculate interest areas
  const technicalInterest = (codeFocus + leadershipFocus) / 2;
  const visualInterest = (designFocus + gameFocus) / 2;
  
  // Navigation speed (inverse of time per page)
  const avgTimePerPage = navPath.length > 0 
    ? (behavior.timeOnHomepage || 0) / Math.max(navPath.length, 1)
    : 30;
  const navigationSpeed = 1 - normalize(avgTimePerPage, THRESHOLDS.navigationSpeed.min, THRESHOLDS.navigationSpeed.max);
  
  // Intent clarity (how focused vs scattered)
  const intentClarity = calculateIntentClarity([
    resumeFocus, codeFocus, designFocus, leadershipFocus, gameFocus
  ]);

  // Return 12-dimensional vector
  return [
    Math.min(1, resumeFocus),
    Math.min(1, codeFocus),
    Math.min(1, designFocus),
    Math.min(1, leadershipFocus),
    Math.min(1, gameFocus),
    explorationBreadth,
    engagementDepth,
    interactionRate,
    technicalInterest,
    visualInterest,
    navigationSpeed,
    intentClarity,
  ];
}

// Calculate focus on a particular area
function calculateFocus(
  navPath: string[],
  keywords: string[],
  targetKeywords: string[],
  directAction: boolean
): number {
  let score = directAction ? 0.5 : 0;
  
  // Check navigation path
  for (const path of navPath) {
    const pathLower = path.toLowerCase();
    for (const keyword of targetKeywords) {
      if (pathLower.includes(keyword)) {
        score += 0.15;
      }
    }
  }
  
  // Check hovered keywords
  for (const kw of keywords) {
    const kwLower = kw.toLowerCase();
    for (const target of targetKeywords) {
      if (kwLower.includes(target)) {
        score += 0.1;
      }
    }
  }
  
  return Math.min(1, score);
}

// Calculate how broadly the user explored
function calculateExplorationBreadth(navPath: string[]): number {
  const uniquePaths = new Set(navPath);
  return normalize(uniquePaths.size, 0, 10);
}

// Calculate depth of engagement
function calculateEngagementDepth(behavior: AggregatedBehavior): number {
  const timeScore = normalize(behavior.timeOnHomepage || 0, 0, THRESHOLDS.timeOnHomepage.max);
  const scrollScore = behavior.scrollDepth || 0;
  const interactionScore = behavior.interactedWithAnimations ? 0.3 : 0;
  
  return (timeScore * 0.4 + scrollScore * 0.4 + interactionScore * 0.2);
}

// Calculate rate of interaction
function calculateInteractionRate(behavior: AggregatedBehavior): number {
  const totalInteractions = 
    (behavior.openedCodeSamplesCount || 0) +
    (behavior.visitedProjectsCount || 0) +
    (behavior.playedDemosCount || 0) +
    (behavior.clickedResume ? 1 : 0) +
    (behavior.openedDesignShowcase ? 1 : 0) +
    (behavior.openedAiIntakeForm ? 1 : 0);
  
  const timeMinutes = Math.max((behavior.timeOnHomepage || 60) / 60, 1);
  const ratePerMinute = totalInteractions / timeMinutes;
  
  return normalize(ratePerMinute, 0, 5);
}

// Calculate how focused vs scattered the user's interest is
function calculateIntentClarity(focusScores: number[]): number {
  const max = Math.max(...focusScores);
  const sum = focusScores.reduce((a, b) => a + b, 0);
  
  if (sum === 0) return 0.3;
  
  // High clarity = one area dominates
  return max / sum;
}

// Create behavior vector from raw metrics
export function createBehaviorVector(metrics: Partial<BehaviorVector>): number[] {
  return [
    metrics.resumeFocus ?? 0.3,
    metrics.codeFocus ?? 0.3,
    metrics.designFocus ?? 0.3,
    metrics.leadershipFocus ?? 0.3,
    metrics.gameFocus ?? 0.3,
    metrics.explorationBreadth ?? 0.5,
    metrics.engagementDepth ?? 0.5,
    metrics.interactionRate ?? 0.5,
    metrics.technicalInterest ?? 0.5,
    metrics.visualInterest ?? 0.5,
    metrics.navigationSpeed ?? 0.5,
    metrics.intentClarity ?? 0.3,
  ];
}
