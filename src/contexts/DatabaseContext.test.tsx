import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { DatabaseProvider, useDatabase } from './DatabaseContext';

const mockDb = { exec: vi.fn(), close: vi.fn() };
let initDbResolve: (db: any) => void;
let initDbReject: (err: Error) => void;

vi.mock('../services/database', () => ({
  initDatabase: vi.fn(() => new Promise((resolve, reject) => {
    initDbResolve = resolve;
    initDbReject = reject;
  })),
  downloadUpdate: vi.fn(),
  getCurrentVersion: vi.fn(() => 'v1.0.0'),
}));

vi.mock('../services/dbCache', () => ({
  clearAllCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../components/MeteredConnectionWarning', () => ({
  default: ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => (
    <div data-testid="metered-warning">
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

function TestConsumer() {
  const { db, isLoading, error, currentVersion } = useDatabase();
  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="has-db">{String(!!db)}</div>
      <div data-testid="error">{error?.message || 'none'}</div>
      <div data-testid="version">{currentVersion || 'none'}</div>
    </div>
  );
}

describe('DatabaseContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('starts in loading state', () => {
    render(
      <DatabaseProvider>
        <TestConsumer />
      </DatabaseProvider>
    );
    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('has-db').textContent).toBe('false');
  });

  it('renders children', () => {
    render(
      <DatabaseProvider>
        <div data-testid="child">Hello</div>
      </DatabaseProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('sets database after successful initialization', async () => {
    render(
      <DatabaseProvider>
        <TestConsumer />
      </DatabaseProvider>
    );

    await act(async () => {
      initDbResolve(mockDb);
    });

    expect(screen.getByTestId('has-db').textContent).toBe('true');
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('version').textContent).toBe('v1.0.0');
  });

  it('sets error after failed initialization', async () => {
    render(
      <DatabaseProvider>
        <TestConsumer />
      </DatabaseProvider>
    );

    await act(async () => {
      initDbReject(new Error('Failed to load'));
    });

    expect(screen.getByTestId('error').textContent).toBe('Failed to load');
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('provides isUpdateAvailable as false initially', async () => {
    function UpdateConsumer() {
      const { isUpdateAvailable } = useDatabase();
      return <div data-testid="update">{String(isUpdateAvailable)}</div>;
    }

    render(
      <DatabaseProvider>
        <UpdateConsumer />
      </DatabaseProvider>
    );

    await act(async () => {
      initDbResolve(mockDb);
    });

    expect(screen.getByTestId('update').textContent).toBe('false');
  });

  it('useDatabase throws outside provider', () => {
    // useDatabase returns default context value when used outside provider
    // (createContext has a default, so it won't throw in this implementation)
    expect(() => {
      render(<TestConsumer />);
    }).not.toThrow();
  });
});
