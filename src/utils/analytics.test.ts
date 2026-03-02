import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadUmamiScript, isUmamiLoaded } from './analytics';

describe('analytics', () => {
  const originalEnv = import.meta.env.MODE;

  beforeEach(() => {
    // Clean up any injected scripts
    document.querySelectorAll('script[src*="umami"]').forEach((el) => el.remove());
  });

  afterEach(() => {
    document.querySelectorAll('script[src*="umami"]').forEach((el) => el.remove());
  });

  describe('isUmamiLoaded', () => {
    it('returns false when no script present', () => {
      expect(isUmamiLoaded()).toBe(false);
    });

    it('returns true when script is present', () => {
      const script = document.createElement('script');
      script.src = 'https://cloud.umami.is/script.js';
      document.head.appendChild(script);
      expect(isUmamiLoaded()).toBe(true);
    });
  });

  describe('loadUmamiScript', () => {
    it('resolves immediately when script already exists', async () => {
      const script = document.createElement('script');
      script.src = 'https://cloud.umami.is/script.js';
      document.head.appendChild(script);

      await expect(loadUmamiScript()).resolves.toBeUndefined();
      // Should not add a duplicate
      const scripts = document.querySelectorAll('script[src*="umami"]');
      expect(scripts.length).toBe(1);
    });

    it('creates script element with correct attributes in production', async () => {
      // In test mode (not development, no VITE_CI), it will try to inject a script
      // The script won't actually load in jsdom, so we simulate onload
      const originalCreateElement = document.createElement.bind(document);
      const mockScript: Partial<HTMLScriptElement> = {
        defer: false,
        src: '',
        setAttribute: vi.fn(),
        onload: null,
        onerror: null,
      };

      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'script') {
          return mockScript as HTMLScriptElement;
        }
        return originalCreateElement(tag);
      });

      vi.spyOn(document.head, 'appendChild').mockImplementation((node: Node) => {
        // Simulate successful load
        if ((mockScript as any).onload) {
          (mockScript as any).onload();
        }
        return node;
      });

      await loadUmamiScript();

      expect(mockScript.defer).toBe(true);
      expect(mockScript.src).toBe('https://cloud.umami.is/script.js');
      expect(mockScript.setAttribute).toHaveBeenCalledWith('data-website-id', expect.any(String));

      vi.restoreAllMocks();
    });
  });
});
