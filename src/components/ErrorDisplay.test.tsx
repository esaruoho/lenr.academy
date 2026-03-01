import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ErrorDisplay from './ErrorDisplay';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

// Mock errorContext
vi.mock('../utils/errorContext', () => ({
  collectErrorContext: vi.fn((_error: Error, _boundary: string) => ({
    timestamp: '2026-03-01T12:00:00Z',
    browser: 'Chrome',
    browserVersion: '120',
    os: 'Linux',
    device: 'Desktop',
    url: 'http://localhost:5173',
    appVersion: '0.1.0',
    stackTrace: 'Error: test\n    at Test.tsx:10:5',
    fingerprint: 'abc123',
    errorMessage: 'Test error',
    errorBoundary: 'App',
  })),
}));

// Mock githubErrorReporting
vi.mock('../utils/githubErrorReporting', () => ({
  getGitHubSearchUrl: vi.fn(() => 'https://github.com/search'),
  getGitHubNewIssueUrl: vi.fn(() => 'https://github.com/new-issue'),
  copyErrorReportToClipboard: vi.fn().mockResolvedValue(undefined),
}));

// Mock dbCache
vi.mock('../services/dbCache', () => ({
  clearAllCache: vi.fn().mockResolvedValue(undefined),
}));

describe('ErrorDisplay', () => {
  let windowOpenSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('renders error message', () => {
    render(<ErrorDisplay error={new Error('Database connection lost')} />);
    expect(screen.getByText('Database connection lost')).toBeInTheDocument();
  });

  it('shows "Something went wrong" title by default', () => {
    render(<ErrorDisplay error={new Error('Test error')} />);
    // The first heading in ErrorDisplay
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(/something went wrong/i);
  });

  it('shows "Database Error" title when isDatabaseError is true', () => {
    render(<ErrorDisplay error={new Error('DB fail')} isDatabaseError />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Database Error');
  });

  it('shows Sentry notice', () => {
    render(<ErrorDisplay error={new Error('Test')} />);
    expect(screen.getByText(/automatically reported/i)).toBeInTheDocument();
  });

  it('has a Technical Details expandable section', () => {
    render(<ErrorDisplay error={new Error('Test')} />);
    const detailsBtn = screen.getByText('Technical Details');
    expect(detailsBtn).toBeInTheDocument();
  });

  it('expands technical details on click', () => {
    render(<ErrorDisplay error={new Error('Test')} />);
    fireEvent.click(screen.getByText('Technical Details'));
    expect(screen.getByText(/Error Fingerprint/i)).toBeInTheDocument();
    expect(screen.getByText('abc123')).toBeInTheDocument();
  });

  it('shows Search Similar Issues button', () => {
    render(<ErrorDisplay error={new Error('Test')} />);
    expect(screen.getByText(/Search Similar Issues/i)).toBeInTheDocument();
  });

  it('opens GitHub search on Search Similar Issues click', () => {
    render(<ErrorDisplay error={new Error('Test')} />);
    fireEvent.click(screen.getByText(/Search Similar Issues/i));
    expect(windowOpenSpy).toHaveBeenCalledWith('https://github.com/search', '_blank', 'noopener,noreferrer');
  });

  it('shows Report button as disabled until search is done', () => {
    render(<ErrorDisplay error={new Error('Test')} />);
    const reportBtn = screen.getByText(/Report This Error/i).closest('button')!;
    expect(reportBtn).toBeDisabled();
  });

  it('enables Report button after searching', () => {
    render(<ErrorDisplay error={new Error('Test')} />);
    fireEvent.click(screen.getByText(/Search Similar Issues/i));
    const reportBtn = screen.getByText(/Report This Error/i).closest('button')!;
    expect(reportBtn).not.toBeDisabled();
  });

  it('shows Try Again button when resetError is provided', () => {
    const resetError = vi.fn();
    render(<ErrorDisplay error={new Error('Test')} resetError={resetError} />);
    const tryAgainBtn = screen.getByText('Try Again');
    expect(tryAgainBtn).toBeInTheDocument();
    fireEvent.click(tryAgainBtn);
    expect(resetError).toHaveBeenCalledOnce();
  });

  it('shows Return to Home button', () => {
    render(<ErrorDisplay error={new Error('Test')} />);
    expect(screen.getByText('Return to Home')).toBeInTheDocument();
  });

  it('shows module loading error recovery for module errors', () => {
    render(
      <ErrorDisplay error={new Error('Importing a module script failed')} />
    );
    expect(screen.getByText('Module Loading Failed')).toBeInTheDocument();
    expect(screen.getByText(/content blockers or ad blockers/i)).toBeInTheDocument();
  });

  it('shows database corruption recovery for corruption errors', () => {
    render(
      <ErrorDisplay
        error={new Error('file is not a database')}
        isDatabaseError
      />
    );
    expect(screen.getByText(/Database Corruption Detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Clear Cache & Reload/i)).toBeInTheDocument();
  });

  it('does not clear cache when user cancels confirm dialog', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <ErrorDisplay
        error={new Error('file is not a database')}
        isDatabaseError
      />
    );

    fireEvent.click(screen.getByText(/Clear Cache & Reload/i));
    // Confirm was called
    expect(confirmSpy).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('shows helper text to search first before reporting', () => {
    render(<ErrorDisplay error={new Error('Test')} />);
    expect(screen.getByText(/search for similar issues/i)).toBeInTheDocument();
  });

  it('does not show module or corruption sections for generic errors', () => {
    render(<ErrorDisplay error={new Error('Generic error')} />);
    expect(screen.queryByText(/Module Loading Failed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Database Corruption/i)).not.toBeInTheDocument();
  });
});
