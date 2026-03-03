import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQueryWorker } from './useQueryWorker';
import type { QueryFilter } from '../types';

// Mock Worker
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  postMessage = vi.fn();
  terminate = vi.fn();
}

let mockWorkerInstance: MockWorker;

vi.stubGlobal(
  'Worker',
  vi.fn(function (this: any) {
    mockWorkerInstance = new MockWorker();
    return mockWorkerInstance;
  }),
);

describe('useQueryWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with isRunning=false and error=null', () => {
    const { result } = renderHook(() => useQueryWorker());
    expect(result.current.isRunning).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('creates a Worker on mount', () => {
    renderHook(() => useQueryWorker());
    expect(Worker).toHaveBeenCalledTimes(1);
  });

  it('terminates Worker on unmount', () => {
    const { unmount } = renderHook(() => useQueryWorker());
    unmount();
    expect(mockWorkerInstance.terminate).toHaveBeenCalled();
  });

  it('posts a message to the Worker when runQuery is called', async () => {
    const { result } = renderHook(() => useQueryWorker());

    const filter: QueryFilter = { element1List: ['H'] };
    const buffer = new ArrayBuffer(8);

    // Start the query (don't await yet)
    let queryPromise: Promise<any>;
    act(() => {
      queryPromise = result.current.runQuery('fusion', filter, buffer);
    });

    expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'query',
        queryType: 'fusion',
        filter,
      }),
      [buffer],
    );

    // Simulate worker response
    act(() => {
      mockWorkerInstance.onmessage!({
        data: {
          type: 'complete',
          result: {
            reactions: [],
            nuclides: [],
            elements: [],
            radioactiveNuclides: [],
            executionTime: 100,
            rowCount: 0,
            totalCount: 0,
          },
        },
      } as any);
    });

    const queryResult = await queryPromise!;
    expect(queryResult.executionTime).toBe(100);
    expect(queryResult.radioactiveNuclides).toBeInstanceOf(Set);
  });

  it('converts radioactiveNuclides array back to Set', async () => {
    const { result } = renderHook(() => useQueryWorker());

    let queryPromise: Promise<any>;
    act(() => {
      queryPromise = result.current.runQuery(
        'fission',
        {},
        new ArrayBuffer(8),
      );
    });

    act(() => {
      mockWorkerInstance.onmessage!({
        data: {
          type: 'complete',
          result: {
            reactions: [],
            nuclides: [],
            elements: [],
            radioactiveNuclides: ['U-238', 'Th-234', 'Pa-234'],
            executionTime: 50,
            rowCount: 3,
            totalCount: 3,
          },
        },
      } as any);
    });

    const queryResult = await queryPromise!;
    expect(queryResult.radioactiveNuclides).toBeInstanceOf(Set);
    expect(queryResult.radioactiveNuclides.has('U-238')).toBe(true);
    expect(queryResult.radioactiveNuclides.has('Th-234')).toBe(true);
    expect(queryResult.radioactiveNuclides.size).toBe(3);
  });

  it('rejects the promise on worker error message', async () => {
    const { result } = renderHook(() => useQueryWorker());

    let queryPromise: Promise<any>;
    act(() => {
      queryPromise = result.current.runQuery(
        'twotwo',
        {},
        new ArrayBuffer(8),
      );
    });

    act(() => {
      mockWorkerInstance.onmessage!({
        data: {
          type: 'error',
          error: 'SQL execution failed',
        },
      } as any);
    });

    await expect(queryPromise!).rejects.toThrow('SQL execution failed');
    expect(result.current.error).toBe('SQL execution failed');
    expect(result.current.isRunning).toBe(false);
  });

  it('rejects the promise on worker onerror', async () => {
    const { result } = renderHook(() => useQueryWorker());

    let queryPromise: Promise<any>;
    act(() => {
      queryPromise = result.current.runQuery(
        'fusion',
        {},
        new ArrayBuffer(8),
      );
    });

    act(() => {
      mockWorkerInstance.onerror!({
        message: 'Worker crashed',
      } as any);
    });

    await expect(queryPromise!).rejects.toThrow('Worker crashed');
    expect(result.current.error).toBe('Worker crashed');
  });

  it('rejects pending promise when unmounted', async () => {
    const { result, unmount } = renderHook(() => useQueryWorker());

    let queryPromise: Promise<any>;
    act(() => {
      queryPromise = result.current.runQuery(
        'fusion',
        {},
        new ArrayBuffer(8),
      );
    });

    unmount();

    await expect(queryPromise!).rejects.toThrow('Worker terminated on unmount');
  });

  it('sets isRunning while query is in flight', async () => {
    const { result } = renderHook(() => useQueryWorker());
    expect(result.current.isRunning).toBe(false);

    let queryPromise: Promise<any>;
    act(() => {
      queryPromise = result.current.runQuery(
        'fusion',
        {},
        new ArrayBuffer(8),
      );
    });

    expect(result.current.isRunning).toBe(true);

    // Resolve the query
    act(() => {
      mockWorkerInstance.onmessage!({
        data: {
          type: 'complete',
          result: {
            reactions: [],
            nuclides: [],
            elements: [],
            radioactiveNuclides: [],
            executionTime: 10,
            rowCount: 0,
            totalCount: 0,
          },
        },
      } as any);
    });

    await queryPromise!;
    expect(result.current.isRunning).toBe(false);
  });
});
