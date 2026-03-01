import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PrivacyBanner from './PrivacyBanner';
import en from '../i18n/locales/en.json';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const parts = key.split('.');
      let value: unknown = en;
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = (value as Record<string, unknown>)[part];
        } else {
          return key;
        }
      }
      return value as string;
    },
  }),
}));

// Mock analytics
vi.mock('../utils/analytics', () => ({
  loadUmamiScript: vi.fn().mockResolvedValue(undefined),
}));

const ANALYTICS_CONSENT_KEY = 'lenr-analytics-consent';

describe('PrivacyBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows banner when no consent stored', async () => {
    render(<PrivacyBanner />);
    // Need to wait for requestAnimationFrame to set isActive
    await act(async () => {
      // Flush the requestAnimationFrame
      vi.advanceTimersByTime(16);
    });
    expect(screen.getByTestId('analytics-banner')).toBeInTheDocument();
  });

  it('does not show banner when consent already given', () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'accepted');
    const { container } = render(<PrivacyBanner />);
    expect(container.innerHTML).toBe('');
  });

  it('does not show banner when consent is declined', () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'declined');
    const { container } = render(<PrivacyBanner />);
    expect(container.innerHTML).toBe('');
  });

  it('sets accepted consent on accept click', async () => {
    render(<PrivacyBanner />);
    await act(async () => { vi.advanceTimersByTime(16); });
    const acceptBtn = screen.getByText(/accept/i);
    await act(async () => {
      fireEvent.click(acceptBtn);
    });
    expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('accepted');
  });

  it('sets declined consent on opt-out click', async () => {
    render(<PrivacyBanner />);
    await act(async () => { vi.advanceTimersByTime(16); });
    const optOutBtn = screen.getByText(/opt.?out/i);
    await act(async () => {
      fireEvent.click(optOutBtn);
    });
    expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('declined');
  });

  it('sets declined consent on close button click', async () => {
    render(<PrivacyBanner />);
    await act(async () => { vi.advanceTimersByTime(16); });
    const closeBtn = screen.getByLabelText(/close/i);
    await act(async () => {
      fireEvent.click(closeBtn);
    });
    expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('declined');
  });

  it('hides banner after accept with exit animation', async () => {
    render(<PrivacyBanner />);
    await act(async () => { vi.advanceTimersByTime(16); });
    expect(screen.getByTestId('analytics-banner')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText(/accept/i));
    });
    // After exit animation time
    await act(async () => { vi.advanceTimersByTime(250); });
    expect(screen.queryByTestId('analytics-banner')).not.toBeInTheDocument();
  });
});
