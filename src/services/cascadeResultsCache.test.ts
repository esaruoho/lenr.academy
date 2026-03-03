import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  saveCascadeResults,
  getCascadeResults,
  deleteCascadeResults,
  cleanupOldResults,
} from './cascadeResultsCache';
import type { CascadeResults } from '../types';

function makeMockResults(overrides?: Partial<CascadeResults>): CascadeResults {
  return {
    generations: [],
    totalReactions: 5,
    totalUniqueNuclides: 10,
    executionTimeMs: 42,
    ...overrides,
  } as CascadeResults;
}

describe('cascadeResultsCache', () => {
  beforeEach(async () => {
    const req = indexedDB.open('CascadeResultsCache', 1);
    const db = await new Promise<IDBDatabase>((resolve) => {
      req.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        if (!database.objectStoreNames.contains('results')) {
          database.createObjectStore('results', { keyPath: 'tabId' });
        }
      };
      req.onsuccess = () => resolve(req.result);
    });
    const tx = db.transaction('results', 'readwrite');
    tx.objectStore('results').clear();
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });
    db.close();
  });

  describe('saveCascadeResults', () => {
    it('stores results for a tab', async () => {
      await saveCascadeResults('tab-1', makeMockResults());
      const result = await getCascadeResults('tab-1');
      expect(result).not.toBeNull();
      expect(result!.totalReactions).toBe(5);
    });

    it('overwrites results for same tab', async () => {
      await saveCascadeResults('tab-1', makeMockResults({ totalReactions: 5 }));
      await saveCascadeResults('tab-1', makeMockResults({ totalReactions: 99 }));
      const result = await getCascadeResults('tab-1');
      expect(result!.totalReactions).toBe(99);
    });

    it('stores results for multiple tabs', async () => {
      await saveCascadeResults('tab-1', makeMockResults({ totalReactions: 1 }));
      await saveCascadeResults('tab-2', makeMockResults({ totalReactions: 2 }));
      const r1 = await getCascadeResults('tab-1');
      const r2 = await getCascadeResults('tab-2');
      expect(r1!.totalReactions).toBe(1);
      expect(r2!.totalReactions).toBe(2);
    });
  });

  describe('getCascadeResults', () => {
    it('returns null for non-existent tab', async () => {
      const result = await getCascadeResults('nonexistent');
      expect(result).toBeNull();
    });

    it('returns stored results for existing tab', async () => {
      await saveCascadeResults('tab-1', makeMockResults({ totalUniqueNuclides: 42 }));
      const result = await getCascadeResults('tab-1');
      expect(result!.totalUniqueNuclides).toBe(42);
    });
  });

  describe('deleteCascadeResults', () => {
    it('deletes results for a specific tab', async () => {
      await saveCascadeResults('tab-1', makeMockResults());
      await deleteCascadeResults('tab-1');
      const result = await getCascadeResults('tab-1');
      expect(result).toBeNull();
    });

    it('does not affect other tabs', async () => {
      await saveCascadeResults('tab-1', makeMockResults());
      await saveCascadeResults('tab-2', makeMockResults());
      await deleteCascadeResults('tab-1');
      const r2 = await getCascadeResults('tab-2');
      expect(r2).not.toBeNull();
    });

    it('handles deleting non-existent tab gracefully', async () => {
      await expect(deleteCascadeResults('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('cleanupOldResults', () => {
    it('does not delete recent results', async () => {
      await saveCascadeResults('recent-tab', makeMockResults());
      await cleanupOldResults();
      const result = await getCascadeResults('recent-tab');
      expect(result).not.toBeNull();
    });

    it('deletes results older than 7 days', async () => {
      const req = indexedDB.open('CascadeResultsCache', 1);
      const db = await new Promise<IDBDatabase>((resolve) => {
        req.onsuccess = () => resolve(req.result);
      });
      const tx = db.transaction('results', 'readwrite');
      tx.objectStore('results').put({
        tabId: 'old-tab',
        results: makeMockResults(),
        savedAt: Date.now() - (8 * 24 * 60 * 60 * 1000),
      });
      await new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
      });
      db.close();

      await cleanupOldResults();
      const result = await getCascadeResults('old-tab');
      expect(result).toBeNull();
    });

    it('keeps recent while deleting old results', async () => {
      await saveCascadeResults('recent', makeMockResults({ totalReactions: 1 }));

      const req = indexedDB.open('CascadeResultsCache', 1);
      const db = await new Promise<IDBDatabase>((resolve) => {
        req.onsuccess = () => resolve(req.result);
      });
      const tx = db.transaction('results', 'readwrite');
      tx.objectStore('results').put({
        tabId: 'old',
        results: makeMockResults({ totalReactions: 99 }),
        savedAt: Date.now() - (10 * 24 * 60 * 60 * 1000),
      });
      await new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
      });
      db.close();

      await cleanupOldResults();

      const recent = await getCascadeResults('recent');
      const old = await getCascadeResults('old');
      expect(recent).not.toBeNull();
      expect(old).toBeNull();
    });

    it('handles empty store gracefully', async () => {
      await expect(cleanupOldResults()).resolves.not.toThrow();
    });
  });
});
