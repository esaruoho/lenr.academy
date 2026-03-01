import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import OfflineIndicator from './OfflineIndicator';

describe('OfflineIndicator', () => {
  let originalOnLine: boolean;

  beforeEach(() => {
    vi.useFakeTimers();
    originalOnLine = navigator.onLine;
    // Reset CSS variable
    document.documentElement.style.removeProperty('--offline-banner-height');
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(navigator, 'onLine', { value: originalOnLine, writable: true, configurable: true });
    document.documentElement.style.removeProperty('--offline-banner-height');
  });

  it('renders nothing when online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    const { container } = render(<OfflineIndicator />);
    expect(container.innerHTML).toBe('');
  });

  it('shows offline banner when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    render(<OfflineIndicator />);
    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
    expect(screen.getByText("You're offline")).toBeInTheDocument();
  });

  it('shows full text initially then minimizes after 5 seconds', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    render(<OfflineIndicator />);
    expect(screen.getByText("You're offline")).toBeInTheDocument();
    expect(screen.getByText(/query the database/i)).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.queryByText("You're offline")).not.toBeInTheDocument();
  });

  it('shows offline banner on offline event', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    render(<OfflineIndicator />);
    expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument();

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
  });

  it('shows reconnected message when coming back online after going offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    render(<OfflineIndicator />);

    // Go offline first (this sets wasOffline = true)
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();

    // Go back online
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.getByTestId('offline-reconnected')).toBeInTheDocument();
    expect(screen.getByText('Connection restored')).toBeInTheDocument();
  });

  it('hides reconnected message after 2.8 seconds', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    render(<OfflineIndicator />);

    // Go offline first
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });
    // Go back online
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.getByTestId('offline-reconnected')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(2800); });
    expect(screen.queryByTestId('offline-reconnected')).not.toBeInTheDocument();
  });

  it('sets CSS variable for offline banner height', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    render(<OfflineIndicator />);
    const height = document.documentElement.style.getPropertyValue('--offline-banner-height');
    expect(height).toBe('48px');
  });

  it('sets slim CSS variable height after auto-minimize', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    render(<OfflineIndicator />);
    act(() => { vi.advanceTimersByTime(5000); });
    const height = document.documentElement.style.getPropertyValue('--offline-banner-height');
    expect(height).toBe('16px');
  });

  it('has role="alert" with aria-live="assertive" when offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    render(<OfflineIndicator />);
    const indicator = screen.getByTestId('offline-indicator');
    expect(indicator).toHaveAttribute('role', 'alert');
    expect(indicator).toHaveAttribute('aria-live', 'assertive');
  });
});
