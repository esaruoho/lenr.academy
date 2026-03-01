import { describe, it, expect, vi } from 'vitest';
import {
  getGitHubSearchUrl,
  getGitHubNewIssueUrl,
  formatErrorReportForClipboard,
  copyErrorReportToClipboard,
} from './githubErrorReporting';
import type { ErrorContext } from './errorContext';

function makeErrorContext(overrides?: Partial<ErrorContext>): ErrorContext {
  const error = new Error('Something went wrong');
  return {
    error,
    errorBoundary: 'TestBoundary',
    timestamp: '2026-03-01T12:00:00.000Z',
    url: 'https://lenr.academy/fusion',
    userAgent: 'Mozilla/5.0 Chrome/120.0.0.0',
    browser: 'Chrome',
    browserVersion: '120.0.0.0',
    os: 'macOS',
    device: 'Desktop',
    appVersion: 'v0.1.0-alpha.21',
    fingerprint: 'abc123def',
    stackTrace: '    at FusionQuery.render (FusionQuery.tsx:42)',
    ...overrides,
  };
}

describe('githubErrorReporting', () => {
  describe('getGitHubSearchUrl', () => {
    it('generates a search URL with fingerprint and error message', () => {
      const ctx = makeErrorContext();
      const url = getGitHubSearchUrl(ctx);

      expect(url).toContain('github.com/Episk-pos/lenr.academy/issues');
      expect(url).toContain('fingerprint%3Aabc123def');
      expect(url).toContain('Something%20went%20wrong');
      expect(url).toContain('label%3Abug');
    });

    it('truncates long error messages to 60 characters', () => {
      const longMessage = 'A'.repeat(100);
      const ctx = makeErrorContext({
        error: new Error(longMessage),
      });
      const url = getGitHubSearchUrl(ctx);
      // The URL-encoded message should be truncated
      expect(url).toContain('A'.repeat(60));
      expect(url).not.toContain('A'.repeat(61));
    });
  });

  describe('getGitHubNewIssueUrl', () => {
    it('generates a new issue URL with template and labels', () => {
      const ctx = makeErrorContext();
      const url = getGitHubNewIssueUrl(ctx);

      expect(url).toContain('github.com/Episk-pos/lenr.academy/issues/new');
      expect(url).toContain('template=error_report.yml');
      expect(url).toContain('labels=bug');
      expect(url).toContain('needs-triage');
      expect(url).toContain('automated-report');
    });

    it('includes error name and fingerprint in title', () => {
      const ctx = makeErrorContext();
      const url = getGitHubNewIssueUrl(ctx);
      // URLSearchParams encodes spaces as +, so decode accordingly
      const decoded = decodeURIComponent(url.replace(/\+/g, ' '));

      expect(decoded).toContain('[Bug] Error:');
      expect(decoded).toContain('[fp:abc123def]');
    });

    it('truncates long error messages in title to 80 characters', () => {
      const longMessage = 'B'.repeat(100);
      const ctx = makeErrorContext({
        error: new Error(longMessage),
      });
      const url = decodeURIComponent(getGitHubNewIssueUrl(ctx));
      // Title should have error name + truncated message + fingerprint
      expect(url).toContain('B'.repeat(80));
      expect(url).not.toContain('B'.repeat(81));
    });
  });

  describe('formatErrorReportForClipboard', () => {
    it('includes all error context fields', () => {
      const ctx = makeErrorContext();
      const report = formatErrorReportForClipboard(ctx);

      expect(report).toContain('abc123def'); // fingerprint
      expect(report).toContain('Something went wrong'); // error message
      expect(report).toContain('Chrome 120.0.0.0'); // browser
      expect(report).toContain('macOS'); // os
      expect(report).toContain('Desktop'); // device
      expect(report).toContain('v0.1.0-alpha.21'); // app version
      expect(report).toContain('https://lenr.academy/fusion'); // url
      expect(report).toContain('2026-03-01T12:00:00.000Z'); // timestamp
    });

    it('includes stack trace in code block', () => {
      const ctx = makeErrorContext();
      const report = formatErrorReportForClipboard(ctx);
      expect(report).toContain('```\n    at FusionQuery.render');
    });

    it('includes placeholder sections for user input', () => {
      const ctx = makeErrorContext();
      const report = formatErrorReportForClipboard(ctx);
      expect(report).toContain('Steps to Reproduce');
      expect(report).toContain('Expected Behavior');
      expect(report).toContain('Actual Behavior');
    });

    it('includes reminder about filling in details', () => {
      const ctx = makeErrorContext();
      const report = formatErrorReportForClipboard(ctx);
      expect(report).toContain('REMINDER');
      expect(report).toContain('search for existing issues');
    });
  });

  describe('copyErrorReportToClipboard', () => {
    it('uses Clipboard API when available', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText },
      });

      const ctx = makeErrorContext();
      await copyErrorReportToClipboard(ctx);

      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining('Automated Error Report'),
      );
    });

    it('falls back to execCommand when Clipboard API fails', async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Not allowed')),
        },
      });

      // jsdom doesn't define execCommand, so stub it on the prototype
      document.execCommand = vi.fn().mockReturnValue(true);

      const ctx = makeErrorContext();
      await copyErrorReportToClipboard(ctx);

      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    it('throws when both clipboard methods fail', async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Not allowed')),
        },
      });

      document.execCommand = vi.fn().mockReturnValue(false);

      const ctx = makeErrorContext();
      await expect(copyErrorReportToClipboard(ctx)).rejects.toThrow(
        'execCommand copy failed',
      );
    });
  });
});
