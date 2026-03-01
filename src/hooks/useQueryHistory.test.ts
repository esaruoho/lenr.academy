import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQueryHistory } from './useQueryHistory';

const STORAGE_KEY = 'lenr-query-history';

describe('useQueryHistory', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('crypto', {
      randomUUID: () => `test-${Date.now()}-${Math.random()}`,
    });
  });

  it('starts with empty history', () => {
    const { result } = renderHook(() => useQueryHistory());
    expect(result.current.history).toEqual([]);
  });

  it('loads existing history from localStorage', () => {
    const existingHistory = [{
      id: '1',
      name: 'Fusion H',
      queryType: 'fusion',
      filter: { element1List: ['H'] },
      timestamp: Date.now(),
      isBookmarked: false,
    }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingHistory));
    const { result } = renderHook(() => useQueryHistory());
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].id).toBe('1');
  });

  it('addToHistory adds a new query', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => {
      result.current.addToHistory('fusion', { element1List: ['H'] }, 10);
    });
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].queryType).toBe('fusion');
    expect(result.current.history[0].resultCount).toBe(10);
  });

  it('addToHistory persists to localStorage', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => {
      result.current.addToHistory('fission', { elements: ['U'] });
    });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    expect(stored).toHaveLength(1);
  });

  it('addToHistory deduplicates same query', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => {
      result.current.addToHistory('fusion', { element1List: ['H'] }, 5);
    });
    act(() => {
      result.current.addToHistory('fusion', { element1List: ['H'] }, 10);
    });
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].resultCount).toBe(10);
  });

  it('addToHistory generates a name with query type', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => {
      result.current.addToHistory('fusion', { element1List: ['H'], element2List: ['Li'] });
    });
    expect(result.current.history[0].name).toContain('Fusion');
    expect(result.current.history[0].name).toContain('H');
  });

  it('toggleBookmark toggles bookmark state', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => {
      result.current.addToHistory('fusion', { element1List: ['H'] });
    });
    const id = result.current.history[0].id;
    expect(result.current.history[0].isBookmarked).toBe(false);
    act(() => { result.current.toggleBookmark(id); });
    expect(result.current.history[0].isBookmarked).toBe(true);
    act(() => { result.current.toggleBookmark(id); });
    expect(result.current.history[0].isBookmarked).toBe(false);
  });

  it('removeFromHistory removes a query', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => {
      result.current.addToHistory('fusion', { element1List: ['H'] });
    });
    const id = result.current.history[0].id;
    act(() => { result.current.removeFromHistory(id); });
    expect(result.current.history).toHaveLength(0);
  });

  it('clearHistory preserves bookmarks by default', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => {
      result.current.addToHistory('fusion', { element1List: ['H'] });
    });
    act(() => {
      result.current.addToHistory('fission', { elements: ['U'] });
    });
    const id = result.current.history[0].id;
    act(() => { result.current.toggleBookmark(id); });
    act(() => { result.current.clearHistory(); });
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].isBookmarked).toBe(true);
  });

  it('clearHistory removes all when preserveBookmarks is false', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => {
      result.current.addToHistory('fusion', { element1List: ['H'] });
    });
    const id = result.current.history[0].id;
    act(() => { result.current.toggleBookmark(id); });
    act(() => { result.current.clearHistory(false); });
    expect(result.current.history).toHaveLength(0);
  });

  it('getHistoryForType filters by query type', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => {
      result.current.addToHistory('fusion', { element1List: ['H'] });
    });
    act(() => {
      result.current.addToHistory('fission', { elements: ['U'] });
    });
    act(() => {
      result.current.addToHistory('fusion', { element1List: ['Li'] });
    });
    const fusionHistory = result.current.getHistoryForType('fusion');
    expect(fusionHistory).toHaveLength(2);
    expect(fusionHistory.every(q => q.queryType === 'fusion')).toBe(true);
  });

  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json');
    const { result } = renderHook(() => useQueryHistory());
    expect(result.current.history).toEqual([]);
  });
});
