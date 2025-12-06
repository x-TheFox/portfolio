import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/admin';
import { cookies } from 'next/headers';

const GITHUB_API = 'https://api.github.com';

interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  languages_url: string;
  topics: string[];
  stargazers_count: number;
  fork: boolean;
  archived: boolean;
}

interface LanguageStats {
  [language: string]: number;
}

interface ExtractedSkill {
  name: string;
  level: number;
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'language' | 'tool' | 'other';
  source: 'github';
  confidence: number;
}

// Category mapping for common technologies
const TECH_CATEGORIES: Record<string, ExtractedSkill['category']> = {
  // Languages
  'typescript': 'language',
  'javascript': 'language',
  'python': 'language',
  'rust': 'language',
  'go': 'language',
  'java': 'language',
  'c++': 'language',
  'c#': 'language',
  'ruby': 'language',
  'php': 'language',
  'swift': 'language',
  'kotlin': 'language',
  'scala': 'language',
  'shell': 'language',
  'bash': 'language',
  
  // Frontend
  'react': 'frontend',
  'vue': 'frontend',
  'angular': 'frontend',
  'svelte': 'frontend',
  'next.js': 'frontend',
  'nextjs': 'frontend',
  'nuxt': 'frontend',
  'tailwindcss': 'frontend',
  'tailwind': 'frontend',
  'css': 'frontend',
  'html': 'frontend',
  'sass': 'frontend',
  'scss': 'frontend',
  
  // Backend
  'node.js': 'backend',
  'nodejs': 'backend',
  'express': 'backend',
  'fastify': 'backend',
  'nestjs': 'backend',
  'django': 'backend',
  'flask': 'backend',
  'fastapi': 'backend',
  'rails': 'backend',
  'spring': 'backend',
  'graphql': 'backend',
  
  // Database
  'postgresql': 'database',
  'postgres': 'database',
  'mysql': 'database',
  'mongodb': 'database',
  'redis': 'database',
  'sqlite': 'database',
  'prisma': 'database',
  'drizzle': 'database',
  
  // DevOps
  'docker': 'devops',
  'kubernetes': 'devops',
  'aws': 'devops',
  'gcp': 'devops',
  'azure': 'devops',
  'vercel': 'devops',
  'netlify': 'devops',
  'terraform': 'devops',
  'github-actions': 'devops',
  'ci/cd': 'devops',
  
  // Tools
  'git': 'tool',
  'webpack': 'tool',
  'vite': 'tool',
  'eslint': 'tool',
  'jest': 'tool',
  'vitest': 'tool',
  'playwright': 'tool',
  'cypress': 'tool',
};

// Normalize language/tech names
function normalizeName(name: string): string {
  const normalized = name.toLowerCase().trim();
  
  // Handle common variations
  const mappings: Record<string, string> = {
    'typescript': 'TypeScript',
    'javascript': 'JavaScript',
    'python': 'Python',
    'go': 'Go',
    'rust': 'Rust',
    'java': 'Java',
    'c++': 'C++',
    'c#': 'C#',
    'ruby': 'Ruby',
    'php': 'PHP',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'shell': 'Shell',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'sass': 'Sass',
    'vue': 'Vue.js',
    'react': 'React',
    'angular': 'Angular',
    'svelte': 'Svelte',
    'nextjs': 'Next.js',
    'next.js': 'Next.js',
    'nuxt': 'Nuxt.js',
    'nodejs': 'Node.js',
    'node.js': 'Node.js',
    'express': 'Express',
    'fastify': 'Fastify',
    'nestjs': 'NestJS',
    'django': 'Django',
    'flask': 'Flask',
    'fastapi': 'FastAPI',
    'rails': 'Rails',
    'spring': 'Spring',
    'graphql': 'GraphQL',
    'postgresql': 'PostgreSQL',
    'postgres': 'PostgreSQL',
    'mysql': 'MySQL',
    'mongodb': 'MongoDB',
    'redis': 'Redis',
    'sqlite': 'SQLite',
    'prisma': 'Prisma',
    'drizzle': 'Drizzle',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'aws': 'AWS',
    'gcp': 'GCP',
    'azure': 'Azure',
    'vercel': 'Vercel',
    'terraform': 'Terraform',
    'tailwindcss': 'Tailwind CSS',
    'tailwind': 'Tailwind CSS',
    'git': 'Git',
    'webpack': 'Webpack',
    'vite': 'Vite',
    'eslint': 'ESLint',
    'jest': 'Jest',
    'vitest': 'Vitest',
    'playwright': 'Playwright',
    'cypress': 'Cypress',
  };
  
  return mappings[normalized] || name;
}

function getCategory(name: string): ExtractedSkill['category'] {
  const normalized = name.toLowerCase();
  return TECH_CATEGORIES[normalized] || 'other';
}

// Calculate skill level based on usage across repos (0-100)
function calculateLevel(bytes: number, maxBytes: number, repoCount: number, totalRepos: number): number {
  // Weighted calculation: 60% based on bytes used, 40% based on repo coverage
  const byteScore = (bytes / maxBytes) * 60;
  const coverageScore = (repoCount / totalRepos) * 40;
  return Math.min(100, Math.round(byteScore + coverageScore));
}

async function fetchGitHubData(username: string, token?: string): Promise<{
  repos: GitHubRepo[];
  languageStats: LanguageStats;
  topics: Set<string>;
  descriptions: string[];
}> {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Portfolio-Skills-Sync',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Fetch all repos (paginated)
  const repos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;
  
  while (true) {
    const response = await fetch(
      `${GITHUB_API}/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`,
      { headers }
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`GitHub user '${username}' not found`);
      }
      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Try adding a GitHub token.');
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const data: GitHubRepo[] = await response.json();
    if (data.length === 0) break;
    
    repos.push(...data);
    if (data.length < perPage) break;
    page++;
  }
  
  // Filter out forks and archived repos for skill calculation
  const activeRepos = repos.filter(r => !r.fork && !r.archived);
  
  // Aggregate language statistics
  const languageStats: LanguageStats = {};
  const languageRepoCount: Record<string, number> = {};
  
  // Fetch detailed language stats for each repo (in parallel, with limit)
  const batchSize = 10;
  for (let i = 0; i < activeRepos.length; i += batchSize) {
    const batch = activeRepos.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (repo) => {
        try {
          const langResponse = await fetch(repo.languages_url, { headers });
          if (langResponse.ok) {
            return await langResponse.json() as LanguageStats;
          }
        } catch (e) {
          // Ignore individual repo errors
        }
        return {};
      })
    );
    
    results.forEach((langs) => {
      Object.entries(langs).forEach(([lang, bytes]) => {
        languageStats[lang] = (languageStats[lang] || 0) + bytes;
        languageRepoCount[lang] = (languageRepoCount[lang] || 0) + 1;
      });
    });
  }
  
  // Collect topics and descriptions
  const topics = new Set<string>();
  const descriptions: string[] = [];
  
  activeRepos.forEach(repo => {
    repo.topics?.forEach(topic => topics.add(topic));
    if (repo.description) {
      descriptions.push(repo.description);
    }
  });
  
  return { repos: activeRepos, languageStats, topics, descriptions };
}

async function extractSkillsWithAI(
  languageStats: LanguageStats,
  topics: Set<string>,
  descriptions: string[]
): Promise<ExtractedSkill[]> {
  const skills: ExtractedSkill[] = [];
  const maxBytes = Math.max(...Object.values(languageStats), 1);
  const totalLanguages = Object.keys(languageStats).length;
  
  // Convert language stats to skills
  Object.entries(languageStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20) // Top 20 languages
    .forEach(([lang, bytes]) => {
      const name = normalizeName(lang);
      const level = calculateLevel(bytes, maxBytes, 1, totalLanguages);
      
      if (level >= 10) { // Only include languages with meaningful usage
        skills.push({
          name,
          level,
          category: getCategory(lang),
          source: 'github',
          confidence: Math.min(100, level + 20),
        });
      }
    });
  
  // Add topics as skills (frameworks, tools, etc.)
  topics.forEach(topic => {
    const name = normalizeName(topic);
    const category = getCategory(topic);
    
    // Skip if already added from languages or is a generic topic
    const genericTopics = ['portfolio', 'website', 'project', 'app', 'application', 'web'];
    if (
      skills.some(s => s.name.toLowerCase() === name.toLowerCase()) ||
      genericTopics.includes(topic.toLowerCase())
    ) {
      return;
    }
    
    if (category !== 'other') {
      skills.push({
        name,
        level: 60, // Default level for topic-detected skills
        category,
        source: 'github',
        confidence: 70,
      });
    }
  });
  
  // Use AI to extract additional skills from descriptions
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey && descriptions.length > 0) {
    try {
      const prompt = `Analyze these GitHub repository descriptions and extract technology skills mentioned. Return ONLY a JSON array of skill names (strings). Focus on frameworks, libraries, databases, and tools. Exclude generic words.

Descriptions:
${descriptions.slice(0, 20).join('\n')}

Return format: ["skill1", "skill2", ...]`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        // Extract JSON array from response
        const match = content.match(/\[[\s\S]*?\]/);
        if (match) {
          const aiSkills: string[] = JSON.parse(match[0]);
          
          aiSkills.forEach(skill => {
            const name = normalizeName(skill);
            const category = getCategory(skill);
            
            // Skip if already exists
            if (!skills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
              skills.push({
                name,
                level: 50,
                category,
                source: 'github',
                confidence: 60,
              });
            }
          });
        }
      }
    } catch (e) {
      console.error('AI skill extraction failed:', e);
      // Continue without AI-extracted skills
    }
  }
  
  return skills.sort((a, b) => b.level - a.level);
}

export async function GET(request: NextRequest) {
  try {
    // Validate session (require admin auth)
    const cookieStore = await cookies();
    const session = await validateSession(cookieStore);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const username = request.nextUrl.searchParams.get('username');
    
    if (!username) {
      return NextResponse.json(
        { success: false, error: 'GitHub username is required' },
        { status: 400 }
      );
    }
    
    const token = process.env.GITHUB_ACCESS_TOKEN;
    
    // Fetch GitHub data
    const { languageStats, topics, descriptions } = await fetchGitHubData(username, token);
    
    // Extract skills
    const skills = await extractSkillsWithAI(languageStats, topics, descriptions);
    
    return NextResponse.json({
      success: true,
      skills,
      stats: {
        languagesFound: Object.keys(languageStats).length,
        topicsFound: topics.size,
        descriptionsAnalyzed: descriptions.length,
      },
    });
  } catch (error) {
    console.error('GitHub skills sync error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to sync GitHub skills' },
      { status: 500 }
    );
  }
}

// POST to import selected skills to database
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await validateSession(cookieStore);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { skills } = await request.json() as { skills: ExtractedSkill[] };
    
    if (!skills || !Array.isArray(skills)) {
      return NextResponse.json(
        { success: false, error: 'Skills array is required' },
        { status: 400 }
      );
    }
    
    // Import to database via CMS functions
    const { getSkills, addSkill, updateSkill } = await import('@/lib/cms');
    const { db, isDatabaseReady } = await import('@/lib/db');
    const { skills: skillsTable } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');
    
    if (!isDatabaseReady()) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      );
    }
    
    const existingSkills = await getSkills();
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const skill of skills) {
      const existing = existingSkills.find(
        s => s.name.toLowerCase() === skill.name.toLowerCase()
      );
      
      if (existing) {
        // Update only if GitHub level is higher and skill is from github source
        if (existing.source === 'github' && skill.level > (existing.level ?? 0)) {
          await db.update(skillsTable)
            .set({ level: skill.level, updatedAt: new Date() })
            .where(eq(skillsTable.id, existing.id));
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Add new skill
        await addSkill({
          name: skill.name,
          level: skill.level,
          category: skill.category,
          years: null,
          icon: null,
          sortOrder: 0,
          source: 'github',
          notionId: null,
          personas: ['global'],
        });
        imported++;
      }
    }
    
    return NextResponse.json({
      success: true,
      imported,
      updated,
      skipped,
    });
  } catch (error) {
    console.error('GitHub skills import error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import skills' },
      { status: 500 }
    );
  }
}
