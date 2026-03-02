import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

vi.mock('../utils/errorContext', () => ({
  collectErrorContext: vi.fn((_error: Error, boundary: string) => ({
    error: _error,
    errorBoundary: boundary || 'App',
    timestamp: '2026-01-01T00:00:00.000Z',
    url: 'http://localhost:5173/',
    userAgent: 'Mozilla/5.0 (Macintosh) Chrome/120',
    browser: 'Chrome',
    browserVersion: '120',
    os: 'macOS',
    device: 'Desktop' as const,
    appVersion: '0.1.0',
    fingerprint: 'abc123',
    stackTrace: 'at App.tsx:10:5\n  at render (react-dom.js:1:1)',
  })),
}));

vi.mock('../utils/githubErrorReporting', () => ({
  getGitHubSearchUrl: vi.fn(() => 'https://github.com/search?q=test'),
  getGitHubNewIssueUrl: vi.fn(() => 'https://github.com/new?title=test'),
  copyErrorReportToClipboard: vi.fn(() => Promise.resolve()),
}));

vi.mock('../services/dbCache', () => ({
  clearAllCache: vi.fn(() => Promise.resolve()),
}));

import ErrorDisplay from './ErrorDisplay';

describe('ErrorDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error message', async () => {
    const error = new Error('Something broke');
    await act(async () => {
      render(<ErrorDisplay error={error} />);
    });
    expect(screen.getByText('Something broke')).toBeDefined();
  });

  it('shows generic title for non-database errors', async () => {
    const error = new Error('Test error');
    await act(async () => {
      render(<ErrorDisplay error={error} />);
    });
    expect(screen.getByText('Something went wrong')).toBeDefined();
  });

  it('shows database title for database errors', async () => {
    const error = new Error('Database connection failed');
    await act(async () => {
      render(<ErrorDisplay error={error} isDatabaseError />);
    });
    expect(screen.getByText('Database Error')).toBeDefined();
  });

  it('shows Sentry notice', async () => {
    const error = new Error('Test');
    await act(async () => {
      render(<ErrorDisplay error={error} />);
    });
    expect(screen.getByText('This error has been automatically reported to our team.')).toBeDefined();
  });

  it('shows Technical Details toggle', async () => {
    const error = new Error('Test');
    await act(async () => {
      render(<ErrorDisplay error={error} />);
    });
    expect(screen.getByText('Technical Details')).toBeDefined();
  });

  it('expands technical details on click', async () => {
    const error = new Error('Test');
    await act(async () => {
      render(<ErrorDisplay error={error} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Technical Details'));
    });
    expect(screen.getByText('Error Fingerprint:')).toBeDefined();
    expect(screen.getByText('abc123')).toBeDefined();
  });

  it('shows Search Similar Issues button', async () => {
    const error = new Error('Test');
    await act(async () => {
      render(<ErrorDisplay error={error} />);
    });
    expect(screen.getByText('Search Similar Issues')).toBeDefined();
  });

  it('shows Report This Error button (disabled until search)', async () => {
    const error = new Error('Test');
    await act(async () => {
      render(<ErrorDisplay error={error} />);
    });
    const reportBtn = screen.getByText('Report This Error');
    expect(reportBtn.closest('button')?.disabled).toBe(true);
  });

  it('enables report button after searching', async () => {
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    const error = new Error('Test');
    await act(async () => {
      render(<ErrorDisplay error={error} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Search Similar Issues'));
    });
    const reportBtn = screen.getByText('Report This Error');
    expect(reportBtn.closest('button')?.disabled).toBe(false);
    windowOpen.mockRestore();
  });

  it('shows Try Again button when resetError provided', async () => {
    const resetError = vi.fn();
    const error = new Error('Test');
    await act(async () => {
      render(<ErrorDisplay error={error} resetError={resetError} />);
    });
    const tryAgain = screen.getByText('Try Again');
    expect(tryAgain).toBeDefined();
    fireEvent.click(tryAgain);
    expect(resetError).toHaveBeenCalledTimes(1);
  });

  it('shows Return to Home button', async () => {
    const error = new Error('Test');
    await act(async () => {
      render(<ErrorDisplay error={error} />);
    });
    expect(screen.getByText('Return to Home')).toBeDefined();
  });

  it('shows module load error recovery for module errors', async () => {
    const error = new Error('Importing a module script failed');
    await act(async () => {
      render(<ErrorDisplay error={error} />);
    });
    expect(screen.getByText('Module Loading Failed')).toBeDefined();
  });

  it('shows corruption recovery for database corruption', async () => {
    const error = new Error('file is not a database');
    await act(async () => {
      render(<ErrorDisplay error={error} isDatabaseError />);
    });
    expect(screen.getByText('Database Corruption Detected')).toBeDefined();
    expect(screen.getByText('Clear Cache & Reload')).toBeDefined();
  });

  it('shows helper text to search first', async () => {
    const error = new Error('Test');
    await act(async () => {
      render(<ErrorDisplay error={error} />);
    });
    expect(screen.getByText(/search for similar issues/i)).toBeDefined();
  });
});
