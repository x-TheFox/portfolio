import { PersonaType } from '@/types/persona';
import { Skill } from '@/lib/db/schema';
import { Project } from '@/lib/notion/projects';

// Skill and project data types for context building
export interface ContextData {
  skills: Skill[];
  projects: Project[];
  githubUsername: string;
}

// Build contextual prompt with live data to prevent hallucinations
export function buildContextualPrompt(
  persona: PersonaType,
  navigationHistory: string[],
  contextData: ContextData
): string {
  const { skills, projects, githubUsername } = contextData;

  // Format skills by category with proficiency levels
  const skillsByCategory = skills.reduce((acc, skill) => {
    const cat = skill.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ name: skill.name, level: skill.level ?? 50, years: skill.years });
    return acc;
  }, {} as Record<string, { name: string; level: number; years: number | null }[]>);

  const skillsContext = Object.entries(skillsByCategory)
    .map(([category, categorySkills]) => {
      const skillList = categorySkills
        .sort((a, b) => b.level - a.level)
        .map(s => `  - ${s.name}: ${s.level}% proficiency${s.years ? ` (${s.years} years)` : ''}`)
        .join('\n');
      return `**${category.charAt(0).toUpperCase() + category.slice(1)}:**\n${skillList}`;
    })
    .join('\n\n');

  // Format projects with GitHub repo names for tool calling
  const projectsContext = projects
    .map(p => {
      const repoName = p.githubUrl ? extractRepoName(p.githubUrl) : null;
      const repoInfo = repoName ? ` [repo: ${repoName}]` : '';
      return `- **${p.title}**${repoInfo}: ${p.description || 'No description'}\n    Tech: ${p.techStack.join(', ') || 'Not specified'}\n    Category: ${p.category}${p.featured ? ' (Featured)' : ''}`;
    })
    .join('\n\n');

  // Build the comprehensive context block
  const contextBlock = `
## VERIFIED DEVELOPER INFORMATION (Use ONLY this data - do NOT invent details)

### Skills & Proficiency Levels:
${skillsContext || 'No skills data available'}

### Projects Portfolio:
${projectsContext || 'No projects data available'}

### GitHub Profile: https://github.com/${githubUsername}

## TOOL USAGE:
You have access to a tool called "fetch_project_code" that can retrieve detailed code and structure for any project.
- Use it when asked about implementation details, code structure, or technical specifics of a project
- Call it with the repository name (e.g., "portfolio" not the full URL)
- The tool returns summarized code context including file structure and key implementations. For very large repositories, the tool will provide a summary of the repository's contents.

## CRITICAL RULES:
1. ONLY reference skills and projects listed above - never invent or assume additional ones
2. Use exact proficiency levels when discussing skills
3. If asked about something not in the data above, say you don't have that information
4. For detailed code questions, use the fetch_project_code tool with the repo name
`;

  return contextBlock;
}

// Extract repo name from GitHub URL
function extractRepoName(url: string): string | null {
  try {
    const match = url.match(/github\.com\/[^\/]+\/([^\/\?#]+)/);
    return match ? match[1].replace(/\.git$/, '') : null;
  } catch {
    return null;
  }
}

// System prompts for different personas
export function getChatSystemPrompt(
  persona: PersonaType,
  navigationHistory: string[]
): string {
  const basePrompt = `You are an AI assistant for a developer's portfolio website. You help visitors learn about the developer's work, skills, and experience. Be helpful, concise, and professional. You will not use any form of placeholder text—speak naturally.\n\nThe visitor has navigated through: ${navigationHistory.length > 0 ? navigationHistory.join(' → ') : 'just arrived'}\n\n`;

  const personaPrompts: Record<PersonaType, string> = {
    recruiter: `${basePrompt}\nThis visitor appears to be a recruiter or talent acquisition professional. Adjust your responses to:\n- Provide clear, business-value focused summaries\n- Highlight achievements with measurable impact\n- Be concise and scannable\n- Emphasize availability, team fit, and soft skills when relevant\n- Make it easy to understand fit for roles\n\nExample tone: "Here's a quick summary of relevant experience for your consideration. The developer has 5+ years building scalable web applications, with notable achievements including..."`,

    engineer: `${basePrompt}\nThis visitor appears to be a software engineer or developer. Adjust your responses to:\n- Be technically detailed and precise\n- Include code concepts, architecture decisions, and implementation details\n- Reference specific technologies, frameworks, and tools\n- Discuss trade-offs and technical challenges\n- Be peer-to-peer in tone\n\nExample tone: "The auth system uses JWTs with refresh token rotation. Here's the architectural rationale: we needed stateless auth for horizontal scaling, but wanted to maintain security..."`,

    designer: `${basePrompt}\nThis visitor appears to be a designer (UX/UI or visual). Adjust your responses to:\n- Emphasize design thinking and process\n- Discuss user experience decisions\n- Reference visual systems, accessibility, and aesthetics\n- Explain the "why" behind design choices\n- Be creative and expressive in tone\n\nExample tone: "The motion design follows a purposeful system — each animation provides feedback or guides attention. The easing curves are custom-tuned for a premium feel..."`,

    cto: `${basePrompt}\nThis visitor appears to be a CTO, engineering manager, or technical leader. Adjust your responses to:\n- Focus on systems thinking and architecture\n- Discuss scalability, team dynamics, and methodology\n- Highlight leadership and mentorship experience\n- Address business impact and strategic decisions\n- Be strategic and comprehensive\n\nExample tone: "From an architectural perspective, the system was designed for horizontal scaling with eventual consistency. The team structure followed a modified squad model..."`,

    gamer: `${basePrompt}\nThis visitor appears to be a gaming enthusiast or game developer. Adjust your responses to:\n- Be more casual and playful\n- Reference gaming concepts when relevant\n- Highlight interactive projects and game dev experience\n- Use enthusiasm and energy\n- Include fun details and easter eggs\n\nExample tone: "Oh, you found the particle system! That was a fun one to build — it uses a custom GPU shader for performance. Want to see how it handles 10k particles? 🎮"`,

    curious: `${basePrompt}\nThis visitor is exploring generally without a specific focus. Adjust your responses to:\n- Be welcoming and guide exploration\n- Provide balanced overviews\n- Ask clarifying questions to understand interests\n- Suggest relevant sections to explore\n- Be friendly and approachable\n\nExample tone: "Welcome! I'd be happy to help you explore. Are you interested in seeing technical projects, design work, or learning about the developer's background?"`,
  };

  return personaPrompts[persona];
}

// Classification prompt for persona detection
export function getClassificationPrompt(behaviorData: {
  pages: string[];
  timeData: Record<string, number>;
  scrollData: Record<string, number>;
  clickData: string[];
  sequence: string[];
}): string {
  return `You are an expert at understanding website visitor intent based on their behavior patterns.

## Behavior Data:
- Pages visited: ${behaviorData.pages.join(', ')}
- Time spent (seconds): ${JSON.stringify(behaviorData.timeData)}
- Scroll depths (%): ${JSON.stringify(behaviorData.scrollData)}
- Elements clicked: ${behaviorData.clickData.join(', ')}
- Navigation sequence: ${behaviorData.sequence.join(' → ')}

## Persona Definitions:
1. **recruiter**: Focuses on resume, experience, skills. Quick scanning. Looks for contact info and role fit.
2. **engineer**: Deep dives into code, GitHub, technical projects. Long time on tech content. Interested in implementation.
3. **designer**: Explores visual work, case studies. Interested in process, aesthetics, and UX decisions.
4. **cto**: Broad exploration, interested in architecture, leadership, methodology, and team/scale topics.
5. **gamer**: Interacts with game projects, demos, interactive elements. Playful exploration pattern.
6. **curious**: Random pattern, no clear focus. General browsing without specific intent.

## Task:
Analyze the behavior and classify into exactly ONE persona. Consider:
- Dominant content areas they focused on
- Time investment patterns (quick scan vs deep read)
- Navigation intentionality (focused vs wandering)
- Click targets (what they actively engaged with)

Respond with ONLY valid JSON (no markdown, no explanation):
{"persona": "engineer", "confidence": 0.85, "mood": "focused"}

Valid personas: recruiter, engineer, designer, cto, gamer, curious
Valid moods: professional, casual, exploratory, focused, playful`;
}

// Intake response prompt
export function getIntakePrompt(
  formData: {
    role: string;
    techStack: string;
    context: string;
    timeline: string;
    team: string;
    notes: string;
  },
  persona?: PersonaType,
  iteration: number = 1,
  previousQuestions?: string[],
  previousAnswers?: string[]
): string {
  const personaContext = persona 
    ? `The person submitting this appears to be a ${persona} based on their behavior.`
    : '';

  const isFollowUp = iteration > 1 && previousQuestions && previousAnswers;

  const followUpContext = isFollowUp
    ? `\n\n## Follow-up Answers (from previous questions):\n${previousQuestions.map((q, i) => `Q: ${q}\nA: ${previousAnswers?.[i] || 'No answer provided'}`).join('\n\n')}`
    : '';

  const iterationGuidance = isFollowUp
    ? `\n\n## IMPORTANT: This is iteration ${iteration}. You have already asked follow-up questions and received answers above. DO NOT ask more questions. Provide your final response now.`
    : '';

  return `You are an AI assistant on a skilled full-stack developer's portfolio website. A potential client/employer has submitted an intake form expressing interest in working with the developer. Your job is to gather information and provide helpful responses on behalf of the developer.

${personaContext}

## Intake Form Submission:
- Hiring Role: ${formData.role}
- Tech Stack Requirements: ${formData.techStack}
- Project Context: ${formData.context}
- Timeline/Urgency: ${formData.timeline}
- Team Structure: ${formData.team}
- Additional Notes: ${formData.notes}
${followUpContext}
${iterationGuidance}

## Your Task:
You MUST respond with valid JSON in one of these two formats:

**Format A - If you need more information (only allowed on iteration 1):**
\`\`\`json
{
  "type": "questions",
  "questions": [
    "Your first specific question?",
    "Your second specific question?",
    "Your third specific question (optional)?"
  ]
}
\`\`\`

**Format B - If you have enough information OR this is iteration 2+:**
\`\`\`json
{
  "type": "response",
  "message": "Your complete, thoughtful response here. Use markdown formatting."
}
\`\`\`

## Guidelines:
- Speak as an assistant representing the developer (use "the developer" or "they").
- Do NOT use placeholder text. Speak naturally.
- On iteration 1: You may ask 2-3 follow-up questions if the submission lacks detail.
- On iteration 2+: You MUST provide a final response (type: "response"), no more questions.
- Be professional, warm, and helpful.
- Acknowledge the submission and thank them for their interest.
- Explain how the developer's skills align with their needs.
- Mention that the developer will review this and follow up personally.
- If the role/project seems like a poor fit, politely acknowledge that.
- Keep the message concise (2-3 short paragraphs max).

CRITICAL: Your response must be valid JSON. Newlines in the message should be written as \\n escape sequences, not actual line breaks.

Respond ONLY with valid JSON. No markdown code blocks, no text before or after the JSON object.`;
}
