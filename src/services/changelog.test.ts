import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchReleaseNotes, clearReleaseNotesCache } from './changelog';
import type { ReleaseNotes } from './changelog';

function mockFetchImpl(response: object, status = 200): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 404 ? 'Not Found' : 'OK',
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  });
}

function mockFetchSequence(...responses: Array<{ body: object; status?: number }>): typeof fetch {
  const fn = vi.fn();
  for (const [i, resp] of responses.entries()) {
    const status = resp.status ?? 200;
    fn.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 404 ? 'Not Found' : 'OK',
      json: () => Promise.resolve(resp.body),
      text: () => Promise.resolve(JSON.stringify(resp.body)),
    });
    // Ensure unused value doesn't trigger lint
    void i;
  }
  return fn;
}

const sampleRelease = {
  tag_name: 'v0.1.0-alpha.21',
  name: 'Release v0.1.0-alpha.21',
  body: '## Changes\n- Fixed something',
  published_at: '2026-02-23T00:00:00Z',
  html_url: 'https://github.com/Episk-pos/lenr.academy/releases/tag/v0.1.0-alpha.21',
};

describe('changelog', () => {
  beforeEach(() => {
    clearReleaseNotesCache();
  });

  describe('fetchReleaseNotes', () => {
    it('fetches release notes for a tag', async () => {
      const fetchImpl = mockFetchImpl(sampleRelease);

      const result = await fetchReleaseNotes('v0.1.0-alpha.21', { fetchImpl });

      expect(result.tagName).toBe('v0.1.0-alpha.21');
      expect(result.name).toBe('Release v0.1.0-alpha.21');
      expect(result.body).toContain('Fixed something');
      expect(result.publishedAt).toBe('2026-02-23T00:00:00Z');
      expect(result.htmlUrl).toContain('v0.1.0-alpha.21');
    });

    it('normalizes tags without v prefix', async () => {
      const fetchImpl = mockFetchImpl(sampleRelease);

      await fetchReleaseNotes('0.1.0-alpha.21', { fetchImpl });

      expect(fetchImpl).toHaveBeenCalledWith(
        expect.stringContaining('v0.1.0-alpha.21'),
        expect.any(Object),
      );
    });

    it('caches results and returns cached on second call', async () => {
      const fetchImpl = mockFetchImpl(sampleRelease);

      const first = await fetchReleaseNotes('v0.1.0-alpha.21', { fetchImpl });
      const second = await fetchReleaseNotes('v0.1.0-alpha.21', { fetchImpl });

      expect(first).toEqual(second);
      // Should only have called fetch once
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it('falls back to releases list when tag endpoint returns 404', async () => {
      const fetchImpl = mockFetchSequence(
        { body: {}, status: 404 },
        { body: [sampleRelease], status: 200 },
      );

      const result = await fetchReleaseNotes('v0.1.0-alpha.21', { fetchImpl });

      expect(result.tagName).toBe('v0.1.0-alpha.21');
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });

    it('throws ReleaseNotFoundError when tag not found in fallback list', async () => {
      const fetchImpl = mockFetchSequence(
        { body: {}, status: 404 },
        { body: [{ ...sampleRelease, tag_name: 'v999.0.0' }], status: 200 },
      );

      await expect(
        fetchReleaseNotes('v0.1.0-alpha.21', { fetchImpl }),
      ).rejects.toThrow('Release not found for tag "v0.1.0-alpha.21"');
    });

    it('throws on non-404 errors', async () => {
      const fetchImpl = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error'),
      });

      await expect(
        fetchReleaseNotes('v1.0.0', { fetchImpl }),
      ).rejects.toThrow('Server error');
    });

    it('handles missing fields gracefully', async () => {
      const fetchImpl = mockFetchImpl({
        tag_name: 'v1.0.0',
        // name, body, published_at, html_url all missing
      });

      const result = await fetchReleaseNotes('v1.0.0', { fetchImpl });

      expect(result.tagName).toBe('v1.0.0');
      expect(result.name).toBe('v1.0.0'); // Falls back to tag_name
      expect(result.body).toBe('');
      expect(result.publishedAt).toBeNull();
      expect(result.htmlUrl).toContain('Episk-pos/lenr.academy');
    });

    it('passes abort signal to fetch', async () => {
      const fetchImpl = mockFetchImpl(sampleRelease);
      const controller = new AbortController();

      await fetchReleaseNotes('v1.0.0', {
        fetchImpl,
        signal: controller.signal,
      });

      expect(fetchImpl).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });

  describe('clearReleaseNotesCache', () => {
    it('clears the cache so next fetch hits the API', async () => {
      const fetchImpl = mockFetchImpl(sampleRelease);

      await fetchReleaseNotes('v1.0.0', { fetchImpl });
      expect(fetchImpl).toHaveBeenCalledTimes(1);

      clearReleaseNotesCache();

      await fetchReleaseNotes('v1.0.0', { fetchImpl });
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });
  });
});
