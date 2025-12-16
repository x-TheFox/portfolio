// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PageLoading } from './PageLoading';

describe('PageLoading', () => {
  it('renders with default message', () => {
    render(<PageLoading />);
    expect(screen.getByText(/loading/i)).toBeTruthy();
  });

  it('renders custom message', () => {
    render(<PageLoading message="Loading data..." />);
    expect(screen.getByText(/loading data/i)).toBeTruthy();
  });
});
