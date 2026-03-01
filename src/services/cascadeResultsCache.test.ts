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
    reactions: [],
    productDistribution: new Map(),
    nuclides: [],
    elements: [],
    totalEnergy: 42.5,
    loopsExecuted: 3,
    executionTime: 150,
    terminationReason: 'max_loops',
    ...overrides,
  };
}

describe('cascadeResultsCache', () => {
  beforeEach(async () => {
    // Clear the object store between tests
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
    it('saves results with a tabId key', async () => {
      const results = makeMockResults();
      await saveCascadeResults('tab-1', results);

      const retrieved = await getCascadeResults('tab-1');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.totalEnergy).toBe(42.5);
      expect(retrieved!.loopsExecuted).toBe(3);
      expect(retrieved!.terminationReason).toBe('max_loops');
    });

    it('overwrites existing results for the same tabId', async () => {
      await saveCascadeResults('tab-1', makeMockResults({ totalEnergy: 10 }));
      await saveCascadeResults('tab-1', makeMockResults({ totalEnergy: 99 }));

      const retrieved = await getCascadeResults('tab-1');
      expect(retrieved!.totalEnergy).toBe(99);
    });

    it('stores results independently per tabId', async () => {
      await saveCascadeResults('tab-a', makeMockResults({ totalEnergy: 1 }));
      await saveCascadeResults('tab-b', makeMockResults({ totalEnergy: 2 }));

      const a = await getCascadeResults('tab-a');
      const b = await getCascadeResults('tab-b');
      expect(a!.totalEnergy).toBe(1);
      expect(b!.totalEnergy).toBe(2);
    });
  });

  describe('getCascadeResults', () => {
    it('returns null for non-existent tabId', async () => {
      const result = await getCascadeResults('nonexistent');
      expect(result).toBeNull();
    });

    it('returns the saved results', async () => {
      const results = makeMockResults({
        loopsExecuted: 7,
        executionTime: 500,
        terminationReason: 'no_new_products',
      });
      await saveCascadeResults('tab-x', results);

      const retrieved = await getCascadeResults('tab-x');
      expect(retrieved!.loopsExecuted).toBe(7);
      expect(retrieved!.executionTime).toBe(500);
      expect(retrieved!.terminationReason).toBe('no_new_products');
    });
  });

  describe('deleteCascadeResults', () => {
    it('removes results for a specific tabId', async () => {
      await saveCascadeResults('tab-1', makeMockResults());
      await saveCascadeResults('tab-2', makeMockResults());

      await deleteCascadeResults('tab-1');

      const deleted = await getCascadeResults('tab-1');
      const kept = await getCascadeResults('tab-2');
      expect(deleted).toBeNull();
      expect(kept).not.toBeNull();
    });

    it('does not throw when deleting non-existent tabId', async () => {
      await expect(deleteCascadeResults('nonexistent')).resolves.toBeUndefined();
    });
  });

  describe('cleanupOldResults', () => {
    it('removes entries older than 7 days', async () => {
      // Save a result directly with an old savedAt timestamp
      const db = await new Promise<IDBDatabase>((resolve) => {
        const req = indexedDB.open('CascadeResultsCache', 1);
        req.onsuccess = () => resolve(req.result);
      });

      const tx = db.transaction('results', 'readwrite');
      const store = tx.objectStore('results');

      // Old entry: 8 days ago
      store.put({
        tabId: 'old-tab',
        results: makeMockResults({ totalEnergy: 1 }),
        savedAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
      });

      // Recent entry: 1 day ago
      store.put({
        tabId: 'recent-tab',
        results: makeMockResults({ totalEnergy: 2 }),
        savedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      });

      await new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
      });
      db.close();

      await cleanupOldResults();

      const oldResult = await getCascadeResults('old-tab');
      const recentResult = await getCascadeResults('recent-tab');
      expect(oldResult).toBeNull();
      expect(recentResult).not.toBeNull();
      expect(recentResult!.totalEnergy).toBe(2);
    });

    it('keeps entries within 7 days', async () => {
      await saveCascadeResults('fresh', makeMockResults({ totalEnergy: 42 }));
      await cleanupOldResults();

      const result = await getCascadeResults('fresh');
      expect(result).not.toBeNull();
      expect(result!.totalEnergy).toBe(42);
    });
  });
});
