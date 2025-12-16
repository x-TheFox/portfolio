// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RepoCard } from './RepoCard';

const sample = {
  owner: 'x-TheFox',
  repo: 'portfolio',
  name: 'x-TheFox/portfolio',
  description: 'Example project',
  language: 'TypeScript',
  stars: 12,
  forks: 3,
  updatedAt: '2025-01-01T00:00:00Z',
  readmeSnippet: 'This is a README snippet',
  htmlUrl: 'https://github.com/x-TheFox/portfolio',
};

describe('RepoCard', () => {
  it('renders repo data when provided', () => {
    render(<RepoCard githubUrl={sample.htmlUrl} repo={sample as any} />);
    expect(screen.getByText(/x-TheFox\/portfolio/i)).toBeTruthy();
    expect(screen.getByText(/Example project/i)).toBeTruthy();
    expect(screen.getByText(/TypeScript/i)).toBeTruthy();
  });

  it('renders link when repo meta is missing', () => {
    render(<RepoCard githubUrl={'https://github.com/x-TheFox/portfolio'} />);
    expect(screen.getByText(/https:\/\/github.com\/x-TheFox\/portfolio/i)).toBeTruthy();
  });
});
