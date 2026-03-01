import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ShareQueryButton from './ShareQueryButton';
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

describe('ShareQueryButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with copy link text initially', () => {
    render(<ShareQueryButton />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveTextContent(/Copy Link/i);
  });

  it('copies current URL to clipboard on click', async () => {
    render(<ShareQueryButton />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
  });

  it('shows copied state after click', async () => {
    render(<ShareQueryButton />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(screen.getByRole('button')).toHaveTextContent(/Link Copied/i);
  });

  it('reverts to initial state after 2 seconds', async () => {
    render(<ShareQueryButton />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(screen.getByRole('button')).toHaveTextContent(/Link Copied/i);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByRole('button')).toHaveTextContent(/Copy Link/i);
  });

  it('has aria-live attribute for accessibility', () => {
    render(<ShareQueryButton />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-live', 'polite');
  });
});
