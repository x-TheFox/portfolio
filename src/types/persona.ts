// Persona types detected by the ML + GPT system
export type PersonaType = 
  | 'recruiter'
  | 'engineer'
  | 'designer'
  | 'cto'
  | 'gamer'
  | 'curious';

// Classification result from GPT
export interface PersonaClassification {
  persona: PersonaType;
  confidence: number; // 0-1
  mood: 'professional' | 'casual' | 'exploratory' | 'focused' | 'playful';
  reasoning?: string;
}

// Persona display configuration
export interface PersonaConfig {
  id: PersonaType;
  name: string;
  description: string;
  primaryColor: string;
  tone: 'formal' | 'technical' | 'creative' | 'strategic' | 'playful' | 'friendly';
  priorities: string[]; // Sections to prioritize
}

// All persona configurations
export const PERSONA_CONFIGS: Record<PersonaType, PersonaConfig> = {
  recruiter: {
    id: 'recruiter',
    name: 'Recruiter',
    description: 'Talent acquisition professional',
    primaryColor: 'blue',
    tone: 'formal',
    priorities: ['resume', 'experience', 'skills', 'contact'],
  },
  engineer: {
    id: 'engineer',
    name: 'Engineer',
    description: 'Software developer or technical professional',
    primaryColor: 'green',
    tone: 'technical',
    priorities: ['projects', 'code', 'skills', 'github'],
  },
  designer: {
    id: 'designer',
    name: 'Designer',
    description: 'UX/UI or visual designer',
    primaryColor: 'purple',
    tone: 'creative',
    priorities: ['portfolio', 'case-studies', 'process', 'aesthetics'],
  },
  cto: {
    id: 'cto',
    name: 'CTO / Manager',
    description: 'Technical leader or engineering manager',
    primaryColor: 'amber',
    tone: 'strategic',
    priorities: ['architecture', 'leadership', 'methodology', 'scale'],
  },
  gamer: {
    id: 'gamer',
    name: 'Gamer',
    description: 'Gaming enthusiast or game developer',
    primaryColor: 'red',
    tone: 'playful',
    priorities: ['games', 'demos', 'interactive', 'fun'],
  },
  curious: {
    id: 'curious',
    name: 'Curious Visitor',
    description: 'General explorer',
    primaryColor: 'slate',
    tone: 'friendly',
    priorities: ['overview', 'highlights', 'about', 'explore'],
  },
};

// Default persona for new visitors
export const DEFAULT_PERSONA: PersonaType = 'curious';
