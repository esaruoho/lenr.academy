import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQueryHistory } from './useQueryHistory'
import type { QueryFilter } from '../types'

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => `uuid-${Date.now()}-${Math.random()}`,
})

const fusionFilter: QueryFilter = {
  element1List: ['H'],
  element2List: ['Li'],
}

const fissionFilter: QueryFilter = {
  elements: ['U'],
}

describe('useQueryHistory', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with empty history', () => {
    const { result } = renderHook(() => useQueryHistory())
    expect(result.current.history).toEqual([])
  })

  it('addToHistory adds a query', () => {
    const { result } = renderHook(() => useQueryHistory())

    act(() => {
      result.current.addToHistory('fusion', fusionFilter, 42)
    })

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].queryType).toBe('fusion')
    expect(result.current.history[0].resultCount).toBe(42)
    expect(result.current.history[0].isBookmarked).toBe(false)
  })

  it('generates a name from query type and elements', () => {
    const { result } = renderHook(() => useQueryHistory())

    act(() => {
      result.current.addToHistory('fusion', fusionFilter)
    })

    expect(result.current.history[0].name).toBe('Fusion H + Li')
  })

  it('generates name for two-to-two queries', () => {
    const { result } = renderHook(() => useQueryHistory())

    act(() => {
      result.current.addToHistory('twotwo', { element1List: ['D'], element2List: ['Ni'] })
    })

    expect(result.current.history[0].name).toContain('2→2')
  })

  it('deduplicates queries and moves to top', () => {
    const { result } = renderHook(() => useQueryHistory())

    act(() => {
      result.current.addToHistory('fusion', fusionFilter, 10)
    })
    act(() => {
      result.current.addToHistory('fission', fissionFilter, 5)
    })
    act(() => {
      result.current.addToHistory('fusion', fusionFilter, 20)
    })

    // Should still be 2 entries, fusion moved to top with updated count
    expect(result.current.history).toHaveLength(2)
    expect(result.current.history[0].queryType).toBe('fusion')
    expect(result.current.history[0].resultCount).toBe(20)
  })

  it('toggleBookmark toggles bookmark status', () => {
    const { result } = renderHook(() => useQueryHistory())

    act(() => {
      result.current.addToHistory('fusion', fusionFilter)
    })

    const id = result.current.history[0].id

    act(() => {
      result.current.toggleBookmark(id)
    })
    expect(result.current.history[0].isBookmarked).toBe(true)

    act(() => {
      result.current.toggleBookmark(id)
    })
    expect(result.current.history[0].isBookmarked).toBe(false)
  })

  it('removeFromHistory removes a query', () => {
    const { result } = renderHook(() => useQueryHistory())

    act(() => {
      result.current.addToHistory('fusion', fusionFilter)
      result.current.addToHistory('fission', fissionFilter)
    })

    const id = result.current.history[0].id
    act(() => {
      result.current.removeFromHistory(id)
    })

    expect(result.current.history).toHaveLength(1)
  })

  it('clearHistory removes non-bookmarked queries', () => {
    const { result } = renderHook(() => useQueryHistory())

    act(() => {
      result.current.addToHistory('fusion', fusionFilter)
      result.current.addToHistory('fission', fissionFilter)
    })

    const fusionId = result.current.history.find(q => q.queryType === 'fusion')!.id
    act(() => {
      result.current.toggleBookmark(fusionId)
    })

    act(() => {
      result.current.clearHistory(true) // preserve bookmarks
    })

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].isBookmarked).toBe(true)
  })

  it('clearHistory with preserveBookmarks=false removes everything', () => {
    const { result } = renderHook(() => useQueryHistory())

    act(() => {
      result.current.addToHistory('fusion', fusionFilter)
    })

    const id = result.current.history[0].id
    act(() => { result.current.toggleBookmark(id) })
    act(() => { result.current.clearHistory(false) })

    expect(result.current.history).toHaveLength(0)
  })

  it('getHistoryForType filters by query type', () => {
    const { result } = renderHook(() => useQueryHistory())

    act(() => {
      result.current.addToHistory('fusion', fusionFilter)
      result.current.addToHistory('fission', fissionFilter)
      result.current.addToHistory('twotwo', { element1List: ['D'], element2List: ['Ni'] })
    })

    expect(result.current.getHistoryForType('fusion')).toHaveLength(1)
    expect(result.current.getHistoryForType('fission')).toHaveLength(1)
    expect(result.current.getHistoryForType('twotwo')).toHaveLength(1)
  })

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useQueryHistory())

    act(() => {
      result.current.addToHistory('fusion', fusionFilter)
    })

    const stored = JSON.parse(localStorage.getItem('lenr-query-history') || '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].queryType).toBe('fusion')
  })

  it('restores from localStorage', () => {
    localStorage.setItem('lenr-query-history', JSON.stringify([{
      id: 'test-id',
      name: 'Test Query',
      queryType: 'fusion',
      filter: fusionFilter,
      timestamp: Date.now(),
      isBookmarked: true,
      resultCount: 10,
    }]))

    const { result } = renderHook(() => useQueryHistory())

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].isBookmarked).toBe(true)
  })
})
