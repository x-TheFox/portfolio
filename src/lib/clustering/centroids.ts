import { PersonaType } from '@/types/persona';
import { BehaviorVector } from '@/types/behavior';
import { cosineSimilarity } from '@/lib/utils';

// Pre-computed persona centroids based on typical behavior patterns
// Each dimension corresponds to BehaviorVector fields (0-1 normalized)
export const PERSONA_CENTROIDS: Record<PersonaType, number[]> = {
  // Recruiter: High resume focus, professional mood, quick scanning
  recruiter: [
    0.9,  // resumeFocus - very high
    0.2,  // codeFocus - low
    0.2,  // designFocus - low
    0.3,  // leadershipFocus - moderate
    0.1,  // gameFocus - very low
    0.4,  // explorationBreadth - moderate
    0.4,  // engagementDepth - moderate (scanning)
    0.6,  // interactionRate - moderate-high
    0.3,  // technicalInterest - low-moderate
    0.3,  // visualInterest - low-moderate
    0.7,  // navigationSpeed - fast
    0.8,  // intentClarity - high (focused on hiring)
  ],
  
  // Engineer: High code/technical focus, deep engagement
  engineer: [
    0.2,  // resumeFocus - low
    0.9,  // codeFocus - very high
    0.3,  // designFocus - low
    0.5,  // leadershipFocus - moderate
    0.4,  // gameFocus - moderate
    0.6,  // explorationBreadth - moderate-high
    0.8,  // engagementDepth - high (deep reading)
    0.7,  // interactionRate - high
    0.9,  // technicalInterest - very high
    0.3,  // visualInterest - low
    0.4,  // navigationSpeed - slow (reading code)
    0.7,  // intentClarity - high
  ],
  
  // Designer: High visual/design focus, process-oriented
  designer: [
    0.2,  // resumeFocus - low
    0.3,  // codeFocus - low
    0.9,  // designFocus - very high
    0.3,  // leadershipFocus - low
    0.4,  // gameFocus - moderate
    0.6,  // explorationBreadth - moderate-high
    0.7,  // engagementDepth - high
    0.6,  // interactionRate - moderate-high
    0.3,  // technicalInterest - low
    0.9,  // visualInterest - very high
    0.5,  // navigationSpeed - moderate
    0.7,  // intentClarity - high
  ],
  
  // CTO/Manager: Broad exploration, architecture/leadership focus
  cto: [
    0.5,  // resumeFocus - moderate
    0.6,  // codeFocus - moderate-high
    0.4,  // designFocus - moderate
    0.9,  // leadershipFocus - very high
    0.2,  // gameFocus - low
    0.8,  // explorationBreadth - high (looks at everything)
    0.7,  // engagementDepth - high
    0.6,  // interactionRate - moderate-high
    0.7,  // technicalInterest - high
    0.5,  // visualInterest - moderate
    0.5,  // navigationSpeed - moderate
    0.8,  // intentClarity - high
  ],
  
  // Gamer: Interactive elements, playful exploration
  gamer: [
    0.1,  // resumeFocus - very low
    0.4,  // codeFocus - moderate
    0.3,  // designFocus - low-moderate
    0.1,  // leadershipFocus - very low
    0.9,  // gameFocus - very high
    0.7,  // explorationBreadth - high
    0.6,  // engagementDepth - moderate-high
    0.9,  // interactionRate - very high
    0.5,  // technicalInterest - moderate
    0.6,  // visualInterest - moderate-high
    0.6,  // navigationSpeed - moderate
    0.5,  // intentClarity - moderate
  ],
  
  // Curious Visitor: Balanced, exploratory, no clear focus
  curious: [
    0.4,  // resumeFocus - moderate
    0.4,  // codeFocus - moderate
    0.4,  // designFocus - moderate
    0.3,  // leadershipFocus - low-moderate
    0.3,  // gameFocus - low-moderate
    0.5,  // explorationBreadth - moderate
    0.4,  // engagementDepth - moderate
    0.4,  // interactionRate - moderate
    0.4,  // technicalInterest - moderate
    0.4,  // visualInterest - moderate
    0.5,  // navigationSpeed - moderate
    0.3,  // intentClarity - low (wandering)
  ],
};

// Classify persona based on behavior vector using cosine similarity
export function classifyByVector(vector: number[]): {
  persona: PersonaType;
  confidence: number;
  allScores: Record<PersonaType, number>;
} {
  const scores: Record<string, number> = {};
  let bestPersona: PersonaType = 'curious';
  let bestScore = -1;

  for (const [persona, centroid] of Object.entries(PERSONA_CENTROIDS)) {
    const similarity = cosineSimilarity(vector, centroid);
    scores[persona] = similarity;
    
    if (similarity > bestScore) {
      bestScore = similarity;
      bestPersona = persona as PersonaType;
    }
  }

  // Convert similarity to confidence (0.5 similarity = 0 confidence, 1.0 = 1.0)
  const confidence = Math.max(0, Math.min(1, (bestScore - 0.5) * 2));

  return {
    persona: bestPersona,
    confidence,
    allScores: scores as Record<PersonaType, number>,
  };
}

// Get closest personas (top N)
export function getClosestPersonas(
  vector: number[],
  count: number = 3
): Array<{ persona: PersonaType; score: number }> {
  const result = classifyByVector(vector);
  
  return Object.entries(result.allScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([persona, score]) => ({
      persona: persona as PersonaType,
      score,
    }));
}
