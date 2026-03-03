import { describe, it, expect, vi } from 'vitest';
import {
  getGitHubSearchUrl,
  getGitHubNewIssueUrl,
  formatErrorReportForClipboard,
  copyErrorReportToClipboard,
} from './githubErrorReporting';
import type { ErrorContext } from './errorContext';

function makeErrorContext(overrides?: Partial<ErrorContext>): ErrorContext {
  const error = new Error('Something went wrong in the fusion query');
  error.name = 'TypeError';
  return {
    error,
    errorBoundary: 'FusionErrorBoundary',
    timestamp: '2026-02-01T12:00:00.000Z',
    url: 'https://lenr.academy/fusion',
    userAgent: 'Mozilla/5.0 Chrome/120.0',
    browser: 'Chrome',
    browserVersion: '120.0',
    os: 'macOS',
    device: 'Desktop',
    appVersion: 'v0.1.0-alpha.21',
    fingerprint: 'fp-abc123',
    stackTrace: '    at FusionQuery (fusion.tsx:42:10)',
    ...overrides,
  };
}

describe('getGitHubSearchUrl', () => {
  it('returns a GitHub issue search URL', () => {
    const url = getGitHubSearchUrl(makeErrorContext());
    expect(url).toContain('https://github.com/Episk-pos/lenr.academy/issues');
  });

  it('includes error fingerprint in search query', () => {
    const url = getGitHubSearchUrl(makeErrorContext());
    expect(url).toContain('fp-abc123');
  });

  it('includes error message in search', () => {
    const url = getGitHubSearchUrl(makeErrorContext());
    expect(url).toContain(encodeURIComponent('Something went wrong'));
  });

  it('includes bug label in search query', () => {
    const url = getGitHubSearchUrl(makeErrorContext());
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('label:bug');
  });

  it('truncates long error messages to 60 characters', () => {
    const longMessage = 'A'.repeat(200);
    const ctx = makeErrorContext({ error: Object.assign(new Error(longMessage), { name: 'Error' }) });
    const url = getGitHubSearchUrl(ctx);
    const decoded = decodeURIComponent(url);
    const aCount = (decoded.match(/A/g) || []).length;
    expect(aCount).toBe(60);
  });
});

describe('getGitHubNewIssueUrl', () => {
  it('returns a GitHub new issue URL', () => {
    const url = getGitHubNewIssueUrl(makeErrorContext());
    expect(url).toContain('https://github.com/Episk-pos/lenr.academy/issues/new');
  });

  it('uses error_report.yml template', () => {
    const url = getGitHubNewIssueUrl(makeErrorContext());
    expect(url).toContain('template=error_report.yml');
  });

  it('includes bug label', () => {
    const url = getGitHubNewIssueUrl(makeErrorContext());
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('bug');
  });

  it('includes fingerprint in title', () => {
    const url = getGitHubNewIssueUrl(makeErrorContext());
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('fp-abc123');
  });

  it('includes error name and message in title', () => {
    const url = getGitHubNewIssueUrl(makeErrorContext());
    // URLSearchParams encodes spaces as +, so decode both + and %XX
    const decoded = decodeURIComponent(url.replace(/\+/g, ' '));
    expect(decoded).toContain('TypeError');
    expect(decoded).toContain('Something went wrong');
  });

  it('truncates long error messages in title to 80 chars', () => {
    const longMessage = 'X'.repeat(200);
    const ctx = makeErrorContext({ error: Object.assign(new Error(longMessage), { name: 'Error' }) });
    const url = getGitHubNewIssueUrl(ctx);
    const decoded = decodeURIComponent(url.replace(/\+/g, ' '));
    const titleMatch = decoded.match(/title=\[Bug\] Error: (X+)/);
    expect(titleMatch).toBeTruthy();
    expect(titleMatch![1].length).toBe(80);
  });
});

describe('formatErrorReportForClipboard', () => {
  it('includes error fingerprint', () => {
    const report = formatErrorReportForClipboard(makeErrorContext());
    expect(report).toContain('fp-abc123');
  });

  it('includes error type', () => {
    const report = formatErrorReportForClipboard(makeErrorContext());
    expect(report).toContain('TypeError');
  });

  it('includes error message in code block', () => {
    const report = formatErrorReportForClipboard(makeErrorContext());
    expect(report).toContain('Something went wrong in the fusion query');
    expect(report).toContain('```');
  });

  it('includes stack trace', () => {
    const report = formatErrorReportForClipboard(makeErrorContext());
    expect(report).toContain('at FusionQuery');
  });

  it('includes environment details', () => {
    const report = formatErrorReportForClipboard(makeErrorContext());
    expect(report).toContain('Chrome 120.0');
    expect(report).toContain('macOS');
    expect(report).toContain('Desktop');
    expect(report).toContain('v0.1.0-alpha.21');
  });

  it('includes URL and timestamp', () => {
    const report = formatErrorReportForClipboard(makeErrorContext());
    expect(report).toContain('https://lenr.academy/fusion');
    expect(report).toContain('2026-02-01T12:00:00.000Z');
  });

  it('includes steps to reproduce placeholder', () => {
    const report = formatErrorReportForClipboard(makeErrorContext());
    expect(report).toContain('Steps to Reproduce');
  });

  it('includes expected/actual behavior sections', () => {
    const report = formatErrorReportForClipboard(makeErrorContext());
    expect(report).toContain('Expected Behavior');
    expect(report).toContain('Actual Behavior');
  });

  it('includes automated generation notice', () => {
    const report = formatErrorReportForClipboard(makeErrorContext());
    expect(report).toContain('automatically generated');
  });
});

describe('copyErrorReportToClipboard', () => {
  it('uses Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    await copyErrorReportToClipboard(makeErrorContext());
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('fp-abc123'));
  });

  it('falls back to execCommand when Clipboard API fails', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });

    const execCommand = vi.fn().mockReturnValue(true);
    document.execCommand = execCommand;

    await copyErrorReportToClipboard(makeErrorContext());
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('throws when both clipboard methods fail', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });

    document.execCommand = vi.fn().mockReturnValue(false);

    await expect(copyErrorReportToClipboard(makeErrorContext())).rejects.toThrow(
      'execCommand copy failed'
    );
  });
});
