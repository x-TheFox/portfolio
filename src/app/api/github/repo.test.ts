import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as route from '@/app/api/github/repo/route';

// Mock fetch responses for GitHub API
const repoResp = {
  full_name: 'x-TheFox/portfolio',
  description: 'Example',
  language: 'TypeScript',
  stargazers_count: 10,
  forks_count: 2,
  updated_at: '2025-01-01T00:00:00Z',
  html_url: 'https://github.com/x-TheFox/portfolio',
};

const readmeResp = {
  content: Buffer.from('# Title\n\nThis is a README.').toString('base64'),
  encoding: 'base64',
};

describe('GET /api/github/repo', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if ((url as string).includes('/readme')) {
        return {
          ok: true,
          json: async () => readmeResp,
        } as any;
      }
      return {
        ok: true,
        json: async () => repoResp,
      } as any;
    }));
  });

  it('returns repo meta for url param', async () => {
    const req = new Request('https://example.com/api/github/repo?url=https://github.com/x-TheFox/portfolio');
    const res = await route.GET(req as any);
    const data = await res.json();

    expect(data.name).toBe('x-TheFox/portfolio');
    expect(data.language).toBe('TypeScript');
    expect(data.readmeSnippet).toContain('This is a README');
  });
});
