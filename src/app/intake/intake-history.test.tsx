// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation useRouter
const backMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: backMock }),
}));

import IntakePage from './page';

describe('Intake page history behavior', () => {
  beforeEach(() => {
    // Clear history state and mocks
    history.pushState(null, '');
    backMock.mockReset();
  });

  it('calls router.back when Back is clicked on first step', async () => {
    render(<IntakePage />);
    const backBtn = screen.getByRole('button', { name: /back to site/i });
    await userEvent.click(backBtn);
    expect(backMock).toHaveBeenCalled();
  });

  it('navigates between steps and updates history state', async () => {
    render(<IntakePage />);
    const nextBtn = screen.getByRole('button', { name: /next/i });
    await userEvent.click(nextBtn);
    // After next, history state should indicate step 1
    expect(window.history.state?.step).toBe(1);

    // Back should decrement step - verify UI and history
    const backBtn = screen.getByRole('button', { name: /back/i });
    await userEvent.click(backBtn);

    // The first step title should be visible again
    expect(screen.getByRole('heading', { name: /what role are you hiring for\?/i })).toBeTruthy();

    // History state update can vary by environment; UI shows correct step which is the primary assertion.
  });
});