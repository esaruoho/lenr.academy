import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import en from '../i18n/locales/en.json';

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

vi.mock('lucide-react', () => ({
  Share2: () => <svg data-testid="share-icon" />,
  Check: () => <svg data-testid="check-icon" />,
}));

import ShareQueryButton from './ShareQueryButton';

describe('ShareQueryButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with share text', () => {
    render(<ShareQueryButton />);
    expect(screen.getByText('Copy Link')).toBeDefined();
  });

  it('has correct title attribute', () => {
    render(<ShareQueryButton />);
    expect(screen.getByTitle('Copy a shareable URL for this query to clipboard')).toBeDefined();
  });

  it('shows share icon initially', () => {
    render(<ShareQueryButton />);
    expect(screen.getByTestId('share-icon')).toBeDefined();
  });

  it('copies URL to clipboard and shows success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ShareQueryButton />);
    await act(async () => {
      fireEvent.click(screen.getByText('Copy Link'));
    });

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(screen.getByText('Link Copied!')).toBeDefined();
    expect(screen.getByTestId('check-icon')).toBeDefined();
  });

  it('reverts to share text after 2 seconds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ShareQueryButton />);
    await act(async () => {
      fireEvent.click(screen.getByText('Copy Link'));
    });

    expect(screen.getByText('Link Copied!')).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Copy Link')).toBeDefined();
  });

  it('falls back to execCommand when clipboard API fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.assign(navigator, { clipboard: { writeText } });

    // Define execCommand on document since jsdom doesn't have it
    document.execCommand = vi.fn().mockReturnValue(true);

    render(<ShareQueryButton />);
    await act(async () => {
      fireEvent.click(screen.getByText('Copy Link'));
    });

    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(screen.getByText('Link Copied!')).toBeDefined();
  });

  it('has aria-live polite for accessibility', () => {
    render(<ShareQueryButton />);
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-live')).toBe('polite');
  });
});
