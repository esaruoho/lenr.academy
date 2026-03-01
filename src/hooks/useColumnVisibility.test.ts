import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColumnVisibility } from './useColumnVisibility'
import type { TableColumn } from '../components/SortableTable'

const mockColumns: TableColumn<{ name: string; age: number; email: string }>[] = [
  { key: 'name', label: 'Name' },
  { key: 'age', label: 'Age' },
  { key: 'email', label: 'Email' },
]

describe('useColumnVisibility', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows all columns by default', () => {
    const { result } = renderHook(() => useColumnVisibility(mockColumns, 'test'))

    expect(result.current.visibleColumns).toHaveLength(3)
    expect(result.current.hasCustomization).toBe(false)
  })

  it('toggleColumn hides a column', () => {
    const { result } = renderHook(() => useColumnVisibility(mockColumns, 'test'))

    act(() => {
      result.current.toggleColumn('age')
    })

    expect(result.current.visibleColumns).toHaveLength(2)
    expect(result.current.isColumnVisible('age')).toBe(false)
    expect(result.current.isColumnVisible('name')).toBe(true)
    expect(result.current.hasCustomization).toBe(true)
  })

  it('toggleColumn shows a hidden column', () => {
    const { result } = renderHook(() => useColumnVisibility(mockColumns, 'test'))

    act(() => {
      result.current.toggleColumn('age')
    })
    act(() => {
      result.current.toggleColumn('age')
    })

    expect(result.current.visibleColumns).toHaveLength(3)
    expect(result.current.isColumnVisible('age')).toBe(true)
  })

  it('prevents hiding all columns', () => {
    const { result } = renderHook(() => useColumnVisibility(mockColumns, 'test'))

    act(() => { result.current.toggleColumn('name') })
    act(() => { result.current.toggleColumn('age') })
    // Try to hide the last column — should be blocked
    act(() => { result.current.toggleColumn('email') })

    expect(result.current.visibleColumns).toHaveLength(1)
    expect(result.current.isColumnVisible('email')).toBe(true)
  })

  it('resetColumns restores all columns', () => {
    const { result } = renderHook(() => useColumnVisibility(mockColumns, 'test'))

    act(() => { result.current.toggleColumn('name') })
    act(() => { result.current.toggleColumn('age') })
    act(() => { result.current.resetColumns() })

    expect(result.current.visibleColumns).toHaveLength(3)
    expect(result.current.hasCustomization).toBe(false)
  })

  it('persists hidden columns to localStorage', () => {
    const { result } = renderHook(() => useColumnVisibility(mockColumns, 'test'))

    act(() => { result.current.toggleColumn('age') })

    const stored = JSON.parse(localStorage.getItem('lenr-columns-test') || '[]')
    expect(stored).toContain('age')
  })

  it('restores hidden columns from localStorage', () => {
    localStorage.setItem('lenr-columns-test', JSON.stringify(['email']))

    const { result } = renderHook(() => useColumnVisibility(mockColumns, 'test'))

    expect(result.current.visibleColumns).toHaveLength(2)
    expect(result.current.isColumnVisible('email')).toBe(false)
  })

  it('ignores stale keys from localStorage', () => {
    localStorage.setItem('lenr-columns-test', JSON.stringify(['deletedColumn', 'age']))

    const { result } = renderHook(() => useColumnVisibility(mockColumns, 'test'))

    // Only 'age' is valid; 'deletedColumn' is ignored
    expect(result.current.hiddenKeys.size).toBe(1)
    expect(result.current.isColumnVisible('age')).toBe(false)
  })

  it('handles invalid localStorage data gracefully', () => {
    localStorage.setItem('lenr-columns-test', 'not-valid-json')

    const { result } = renderHook(() => useColumnVisibility(mockColumns, 'test'))

    expect(result.current.visibleColumns).toHaveLength(3)
  })

  it('allColumns returns the full column list', () => {
    const { result } = renderHook(() => useColumnVisibility(mockColumns, 'test'))

    expect(result.current.allColumns).toEqual(mockColumns)
  })
})
