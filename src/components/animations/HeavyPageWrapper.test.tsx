// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act } from 'react';

// Make framer-motion a no-op for deterministic tests
vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: (props: any) => React.createElement('div', props, props.children),
    },
    AnimatePresence: (props: any) => props.children,
  };
});

import { HeavyPageWrapper } from './HeavyPageWrapper';

describe('HeavyPageWrapper', () => {
  afterEach(() => {
    vi.useRealTimers();
    // cleanup any mocked raf
    if ((global as any).__rafMock) {
      delete (global as any).requestAnimationFrame;
      delete (global as any).__rafMock;
    }
  });

  it('shows overlay initially and hides after mount', async () => {
    // mock requestAnimationFrame to call callback immediately with a timestamp
    (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => { cb(0); return 0; };
    (global as any).__rafMock = true;

    render(
      // set delay=0 so we don't rely on timers in tests
      <HeavyPageWrapper delay={0}>
        <div data-testid="content">Page Content</div>
      </HeavyPageWrapper>
    );

    // overlay should be present immediately
    expect(screen.getByText(/loading/i)).toBeTruthy();
    expect(screen.getByTestId('content')).toBeTruthy();

    // flush effects
    await act(async () => Promise.resolve());

    // wait for overlay to be removed from DOM
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).toBeNull();
    });

    // content should still be visible
    expect(screen.getByTestId('content')).toBeTruthy();
  });
});
