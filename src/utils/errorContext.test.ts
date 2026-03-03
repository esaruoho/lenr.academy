import { describe, it, expect, vi, afterEach } from 'vitest';
import { collectErrorContext } from './errorContext';

vi.mock('./errorFingerprint', () => ({
  generateErrorFingerprint: vi.fn(() => 'abc123fingerprint'),
}));

describe('collectErrorContext', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeError(message: string, name = 'Error'): Error {
    const err = new Error(message);
    err.name = name;
    return err;
  }

  it('returns an object with all expected fields', () => {
    const ctx = collectErrorContext(makeError('test error'));
    expect(ctx).toHaveProperty('error');
    expect(ctx).toHaveProperty('errorBoundary');
    expect(ctx).toHaveProperty('timestamp');
    expect(ctx).toHaveProperty('url');
    expect(ctx).toHaveProperty('userAgent');
    expect(ctx).toHaveProperty('browser');
    expect(ctx).toHaveProperty('browserVersion');
    expect(ctx).toHaveProperty('os');
    expect(ctx).toHaveProperty('device');
    expect(ctx).toHaveProperty('appVersion');
    expect(ctx).toHaveProperty('fingerprint');
    expect(ctx).toHaveProperty('stackTrace');
  });

  it('uses provided errorBoundary name', () => {
    const ctx = collectErrorContext(makeError('test'), 'AppErrorBoundary');
    expect(ctx.errorBoundary).toBe('AppErrorBoundary');
  });

  it('defaults errorBoundary to Unknown', () => {
    const ctx = collectErrorContext(makeError('test'));
    expect(ctx.errorBoundary).toBe('Unknown');
  });

  it('sets fingerprint from generateErrorFingerprint', () => {
    const ctx = collectErrorContext(makeError('test'));
    expect(ctx.fingerprint).toBe('abc123fingerprint');
  });

  it('generates valid ISO timestamp', () => {
    const ctx = collectErrorContext(makeError('test'));
    expect(() => new Date(ctx.timestamp)).not.toThrow();
    expect(ctx.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('preserves original error object', () => {
    const err = makeError('original error', 'TypeError');
    const ctx = collectErrorContext(err);
    expect(ctx.error).toBe(err);
    expect(ctx.error.name).toBe('TypeError');
    expect(ctx.error.message).toBe('original error');
  });

  it('includes url from window.location', () => {
    const ctx = collectErrorContext(makeError('test'));
    expect(typeof ctx.url).toBe('string');
  });

  it('includes userAgent string', () => {
    const ctx = collectErrorContext(makeError('test'));
    expect(typeof ctx.userAgent).toBe('string');
  });

  // Browser detection tests (via collectErrorContext output)
  it('detects Chrome browser', () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0.6099.130 Safari/537.36',
      configurable: true,
    });
    const ctx = collectErrorContext(makeError('test'));
    expect(ctx.browser).toBe('Chrome');
    expect(ctx.browserVersion).toMatch(/^120/);
    Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
  });

  it('detects Edge browser (before Chrome check)', () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0.2210.91',
      configurable: true,
    });
    const ctx = collectErrorContext(makeError('test'));
    expect(ctx.browser).toBe('Edge');
    expect(ctx.browserVersion).toMatch(/^120/);
    Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
  });

  it('detects Firefox browser', () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
      configurable: true,
    });
    const ctx = collectErrorContext(makeError('test'));
    expect(ctx.browser).toBe('Firefox');
    expect(ctx.browserVersion).toMatch(/^121/);
    Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
  });

  it('detects Safari browser', () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 Version/17.2 Safari/605.1.15',
      configurable: true,
    });
    const ctx = collectErrorContext(makeError('test'));
    expect(ctx.browser).toBe('Safari');
    expect(ctx.browserVersion).toMatch(/^17/);
    Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
  });

  // OS detection tests
  it('detects Windows OS', () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
      configurable: true,
    });
    const ctx = collectErrorContext(makeError('test'));
    expect(ctx.os).toBe('Windows');
    Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
  });

  it('detects macOS', () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) Safari/605.1.15',
      configurable: true,
    });
    const ctx = collectErrorContext(makeError('test'));
    expect(ctx.os).toBe('macOS');
    Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
  });

  it('detects Linux OS', () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0',
      configurable: true,
    });
    const ctx = collectErrorContext(makeError('test'));
    expect(ctx.os).toBe('Linux');
    Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
  });

  // Stack trace tests
  it('formats stack trace removing error message line', () => {
    const err = makeError('some error');
    err.stack = 'Error: some error\n    at Function.test (file.js:10:5)\n    at Object.<anonymous> (runner.js:1:1)';
    const ctx = collectErrorContext(err);
    expect(ctx.stackTrace).not.toContain('Error: some error');
    expect(ctx.stackTrace).toContain('at Function.test');
  });

  it('handles error with no stack trace', () => {
    const err = makeError('no stack');
    err.stack = undefined;
    const ctx = collectErrorContext(err);
    expect(ctx.stackTrace).toBe('No stack trace available');
  });

  it('device type is Desktop, Mobile, or Tablet', () => {
    const ctx = collectErrorContext(makeError('test'));
    expect(['Desktop', 'Mobile', 'Tablet']).toContain(ctx.device);
  });
});
