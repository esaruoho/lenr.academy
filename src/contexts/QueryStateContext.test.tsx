import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QueryStateProvider, useQueryState } from './QueryStateContext';

// Mock cascadeResultsCache
vi.mock('../services/cascadeResultsCache', () => ({
  saveCascadeResults: vi.fn().mockResolvedValue(undefined),
  getCascadeResults: vi.fn().mockResolvedValue(null),
  deleteCascadeResults: vi.fn().mockResolvedValue(undefined),
  cleanupOldResults: vi.fn().mockResolvedValue(undefined),
}));

// Helper component to test the context
function TestConsumer() {
  const {
    queryStates,
    updateFusionState,
    updateFissionState,
    updateTwoToTwoState,
    getFusionState,
    getFissionState,
    getTwoToTwoState,
    clearAllStates,
    clearPageState,
  } = useQueryState();

  return (
    <div>
      <div data-testid="fusion-state">{JSON.stringify(getFusionState() || 'undefined')}</div>
      <div data-testid="fission-state">{JSON.stringify(getFissionState() || 'undefined')}</div>
      <div data-testid="twotwo-state">{JSON.stringify(getTwoToTwoState() || 'undefined')}</div>
      <div data-testid="version">{queryStates.version}</div>
      <button onClick={() => updateFusionState({ filter: { element1List: ['H'] } })}>
        Set Fusion
      </button>
      <button onClick={() => updateFissionState({ filter: { element1List: ['U'] } })}>
        Set Fission
      </button>
      <button onClick={() => updateTwoToTwoState({ filter: { element1List: ['D'] } })}>
        Set TwoToTwo
      </button>
      <button onClick={() => clearAllStates()}>Clear All</button>
      <button onClick={() => clearPageState('fusion')}>Clear Fusion</button>
    </div>
  );
}

describe('QueryStateContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('provides default empty state', () => {
    render(
      <QueryStateProvider>
        <TestConsumer />
      </QueryStateProvider>
    );
    expect(screen.getByTestId('fusion-state')).toHaveTextContent('undefined');
    expect(screen.getByTestId('version')).toHaveTextContent('1');
  });

  it('updates fusion state', () => {
    render(
      <QueryStateProvider>
        <TestConsumer />
      </QueryStateProvider>
    );
    act(() => {
      screen.getByText('Set Fusion').click();
    });
    const state = screen.getByTestId('fusion-state').textContent;
    expect(state).toContain('"element1List":["H"]');
  });

  it('updates fission state', () => {
    render(
      <QueryStateProvider>
        <TestConsumer />
      </QueryStateProvider>
    );
    act(() => {
      screen.getByText('Set Fission').click();
    });
    const state = screen.getByTestId('fission-state').textContent;
    expect(state).toContain('"element1List":["U"]');
  });

  it('updates two-to-two state', () => {
    render(
      <QueryStateProvider>
        <TestConsumer />
      </QueryStateProvider>
    );
    act(() => {
      screen.getByText('Set TwoToTwo').click();
    });
    const state = screen.getByTestId('twotwo-state').textContent;
    expect(state).toContain('"element1List":["D"]');
  });

  it('clears all states', () => {
    render(
      <QueryStateProvider>
        <TestConsumer />
      </QueryStateProvider>
    );
    act(() => {
      screen.getByText('Set Fusion').click();
      screen.getByText('Set Fission').click();
    });
    act(() => {
      screen.getByText('Clear All').click();
    });
    expect(screen.getByTestId('fusion-state')).toHaveTextContent('undefined');
    expect(screen.getByTestId('fission-state')).toHaveTextContent('undefined');
  });

  it('clears individual page state', () => {
    render(
      <QueryStateProvider>
        <TestConsumer />
      </QueryStateProvider>
    );
    act(() => {
      screen.getByText('Set Fusion').click();
      screen.getByText('Set Fission').click();
    });
    act(() => {
      screen.getByText('Clear Fusion').click();
    });
    expect(screen.getByTestId('fusion-state')).toHaveTextContent('undefined');
    // Fission should still be set
    const fissionState = screen.getByTestId('fission-state').textContent;
    expect(fissionState).toContain('"element1List":["U"]');
  });

  it('persists state to localStorage', () => {
    render(
      <QueryStateProvider>
        <TestConsumer />
      </QueryStateProvider>
    );
    act(() => {
      screen.getByText('Set Fusion').click();
    });
    // Check that something was saved to localStorage
    const keys = Object.keys(localStorage);
    const stateKey = keys.find(k => k.startsWith('lenr-query-states'));
    expect(stateKey).toBeDefined();
    const stored = JSON.parse(localStorage.getItem(stateKey!)!);
    expect(stored.version).toBe(1);
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useQueryState must be used within a QueryStateProvider');
    consoleSpy.mockRestore();
  });

  it('generates a tab ID in sessionStorage', () => {
    render(
      <QueryStateProvider>
        <TestConsumer />
      </QueryStateProvider>
    );
    const tabId = sessionStorage.getItem('lenr-tab-id');
    expect(tabId).toBeTruthy();
    expect(tabId).toMatch(/^tab-\d+-/);
  });
});
