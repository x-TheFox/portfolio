export interface RepoMeta {
  owner: string;
  repo: string;
  name: string;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
  updatedAt?: string;
  readmeSnippet?: string;
  htmlUrl: string;
}

function extractOwnerRepo(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname !== 'github.com') return null;
    const parts = u.pathname.replace(/^\//, '').split('/');
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

async function fetchJSON(url: string, token?: string) {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function fetchRepoMetaFromUrl(url: string): Promise<RepoMeta> {
  const parsed = extractOwnerRepo(url);
  if (!parsed) throw new Error('Invalid GitHub URL');
  const { owner, repo } = parsed;
  const token = process.env.GITHUB_TOKEN;

  // Fetch repo
  const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const repoData = await fetchJSON(repoUrl, token);

  // Try to fetch README snippet
  let readmeSnippet: string | undefined;
  try {
    const readmeUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
    const readmeData = await fetchJSON(readmeUrl, token);
    if (readmeData && readmeData.content && readmeData.encoding === 'base64') {
      const decoded = Buffer.from(readmeData.content, 'base64').toString('utf8');
      // Split into paragraphs and choose the first non-heading paragraph
      const paragraphs = decoded.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
      let chosen = paragraphs.find(p => !p.trim().startsWith('#') && !p.trim().startsWith('>')) || paragraphs[0] || '';
      // Remove markdown links, emphasis, code ticks, and headings markers for a clean snippet
      chosen = chosen.replace(/\[(.*?)\]\((.*?)\)/g, '$1').replace(/[*`~>#]/g, '').trim();
      readmeSnippet = chosen.slice(0, 300);
    }
  } catch (err) {
    // ignore readme errors
    readmeSnippet = undefined;
  }

  const meta: RepoMeta = {
    owner,
    repo,
    name: repoData.full_name || `${owner}/${repo}`,
    description: repoData.description ?? undefined,
    language: repoData.language ?? undefined,
    stars: repoData.stargazers_count ?? 0,
    forks: repoData.forks_count ?? 0,
    updatedAt: repoData.updated_at ?? undefined,
    readmeSnippet,
    htmlUrl: repoData.html_url || url,
  };

  return meta;
}
