import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColumnVisibility } from './useColumnVisibility';
import type { TableColumn } from '../components/SortableTable';

const STORAGE_PREFIX = 'lenr-columns-';

const columns: TableColumn<unknown>[] = [
  { key: 'name', label: 'Name', render: () => null },
  { key: 'symbol', label: 'Symbol', render: () => null },
  { key: 'mass', label: 'Mass', render: () => null },
  { key: 'number', label: 'Number', render: () => null },
];

describe('useColumnVisibility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns all columns as visible by default', () => {
    const { result } = renderHook(() => useColumnVisibility(columns, 'test'));
    expect(result.current.visibleColumns).toHaveLength(4);
    expect(result.current.hasCustomization).toBe(false);
  });

  it('toggleColumn hides a column', () => {
    const { result } = renderHook(() => useColumnVisibility(columns, 'test'));
    act(() => { result.current.toggleColumn('mass'); });
    expect(result.current.visibleColumns).toHaveLength(3);
    expect(result.current.isColumnVisible('mass')).toBe(false);
    expect(result.current.isColumnVisible('name')).toBe(true);
    expect(result.current.hasCustomization).toBe(true);
  });

  it('toggleColumn shows a hidden column', () => {
    const { result } = renderHook(() => useColumnVisibility(columns, 'test'));
    act(() => { result.current.toggleColumn('mass'); });
    expect(result.current.isColumnVisible('mass')).toBe(false);
    act(() => { result.current.toggleColumn('mass'); });
    expect(result.current.isColumnVisible('mass')).toBe(true);
  });

  it('prevents hiding all columns', () => {
    const { result } = renderHook(() => useColumnVisibility(columns, 'test'));
    act(() => { result.current.toggleColumn('name'); });
    act(() => { result.current.toggleColumn('symbol'); });
    act(() => { result.current.toggleColumn('mass'); });
    act(() => { result.current.toggleColumn('number'); });
    expect(result.current.visibleColumns).toHaveLength(1);
    expect(result.current.isColumnVisible('number')).toBe(true);
  });

  it('resetColumns makes all columns visible', () => {
    const { result } = renderHook(() => useColumnVisibility(columns, 'test'));
    act(() => { result.current.toggleColumn('mass'); });
    act(() => { result.current.toggleColumn('symbol'); });
    expect(result.current.visibleColumns).toHaveLength(2);
    act(() => { result.current.resetColumns(); });
    expect(result.current.visibleColumns).toHaveLength(4);
    expect(result.current.hasCustomization).toBe(false);
  });

  it('persists hidden columns to localStorage', () => {
    const { result } = renderHook(() => useColumnVisibility(columns, 'test'));
    act(() => { result.current.toggleColumn('mass'); });
    const stored = JSON.parse(localStorage.getItem(STORAGE_PREFIX + 'test') || '[]');
    expect(stored).toEqual(['mass']);
  });

  it('restores hidden columns from localStorage', () => {
    localStorage.setItem(STORAGE_PREFIX + 'test', JSON.stringify(['symbol', 'number']));
    const { result } = renderHook(() => useColumnVisibility(columns, 'test'));
    expect(result.current.isColumnVisible('symbol')).toBe(false);
    expect(result.current.isColumnVisible('number')).toBe(false);
    expect(result.current.isColumnVisible('name')).toBe(true);
    expect(result.current.visibleColumns).toHaveLength(2);
  });

  it('filters out stale keys from localStorage', () => {
    localStorage.setItem(STORAGE_PREFIX + 'test', JSON.stringify(['symbol', 'deleted_col']));
    const { result } = renderHook(() => useColumnVisibility(columns, 'test'));
    expect(result.current.isColumnVisible('symbol')).toBe(false);
    expect(result.current.visibleColumns).toHaveLength(3);
  });

  it('handles invalid localStorage data gracefully', () => {
    localStorage.setItem(STORAGE_PREFIX + 'test', 'invalid json{');
    const { result } = renderHook(() => useColumnVisibility(columns, 'test'));
    expect(result.current.visibleColumns).toHaveLength(4);
  });

  it('uses different storage keys for different instances', () => {
    const { result: result1 } = renderHook(() => useColumnVisibility(columns, 'table1'));
    const { result: result2 } = renderHook(() => useColumnVisibility(columns, 'table2'));
    act(() => { result1.current.toggleColumn('mass'); });
    expect(result1.current.isColumnVisible('mass')).toBe(false);
    expect(result2.current.isColumnVisible('mass')).toBe(true);
  });

  it('allColumns returns the original columns array', () => {
    const { result } = renderHook(() => useColumnVisibility(columns, 'test'));
    expect(result.current.allColumns).toBe(columns);
  });
});
