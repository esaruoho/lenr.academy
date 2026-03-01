import { describe, it, expect, vi, beforeEach } from 'vitest';
import { collectErrorContext } from './errorContext';

describe('errorContext', () => {
  beforeEach(() => {
    // Provide a stable userAgent for testing
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      writable: true,
      configurable: true,
    });

    // Mock window properties
    Object.defineProperty(window, 'innerWidth', {
      value: 1920,
      writable: true,
      configurable: true,
    });
  });

  describe('collectErrorContext', () => {
    it('collects all expected fields', () => {
      const error = new Error('Test error');
      const ctx = collectErrorContext(error, 'TestBoundary');

      expect(ctx.error).toBe(error);
      expect(ctx.errorBoundary).toBe('TestBoundary');
      expect(ctx.timestamp).toBeDefined();
      expect(ctx.url).toBeDefined();
      expect(ctx.userAgent).toBeDefined();
      expect(ctx.browser).toBeDefined();
      expect(ctx.browserVersion).toBeDefined();
      expect(ctx.os).toBeDefined();
      expect(ctx.device).toBeDefined();
      expect(ctx.appVersion).toBeDefined();
      expect(ctx.fingerprint).toBeDefined();
      expect(ctx.stackTrace).toBeDefined();
    });

    it('detects Chrome browser from user agent', () => {
      const ctx = collectErrorContext(new Error('test'));
      expect(ctx.browser).toBe('Chrome');
      expect(ctx.browserVersion).toMatch(/^\d+/);
    });

    it('detects macOS from user agent', () => {
      const ctx = collectErrorContext(new Error('test'));
      expect(ctx.os).toBe('macOS');
    });

    it('detects Desktop device when no touch support', () => {
      // jsdom may have ontouchstart or maxTouchPoints; explicitly remove them
      delete (window as any).ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        writable: true,
        configurable: true,
      });
      const ctx = collectErrorContext(new Error('test'));
      expect(ctx.device).toBe('Desktop');
    });

    it('defaults errorBoundary to Unknown', () => {
      const ctx = collectErrorContext(new Error('test'));
      expect(ctx.errorBoundary).toBe('Unknown');
    });

    it('generates a fingerprint string', () => {
      const ctx = collectErrorContext(new Error('test'));
      expect(typeof ctx.fingerprint).toBe('string');
      expect(ctx.fingerprint.length).toBeGreaterThan(0);
    });

    it('formats stack trace without the error message line', () => {
      const error = new Error('My error message');
      const ctx = collectErrorContext(error);
      // Stack trace should not start with the error message
      expect(ctx.stackTrace).not.toMatch(/^Error: My error message/);
    });

    it('detects Edge browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        configurable: true,
      });
      const ctx = collectErrorContext(new Error('test'));
      expect(ctx.browser).toBe('Edge');
    });

    it('detects Firefox browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
        configurable: true,
      });
      const ctx = collectErrorContext(new Error('test'));
      expect(ctx.browser).toBe('Firefox');
      expect(ctx.os).toBe('Linux');
    });

    it('detects Windows OS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        configurable: true,
      });
      const ctx = collectErrorContext(new Error('test'));
      expect(ctx.os).toBe('Windows');
    });
  });
});
