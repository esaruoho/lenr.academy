import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import en from '../i18n/locales/en.json';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const parts = key.split('.');
      let value: unknown = en;
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = (value as Record<string, unknown>)[part];
        } else {
          return key;
        }
      }
      let result = value as string;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v));
        });
      }
      return result;
    },
  }),
}));

vi.mock('lucide-react', () => ({
  Loader2: (props: Record<string, unknown>) => <svg data-testid="loader-icon" className={props.className as string} />,
  XCircle: () => <svg data-testid="xcircle-icon" />,
}));

import CascadeProgressCard from './CascadeProgressCard';

describe('CascadeProgressCard', () => {
  const baseProgress = {
    loop: 3,
    totalLoops: 10,
    newReactionsCount: 5,
    percentage: 40,
  };

  it('renders running simulation title', () => {
    render(<CascadeProgressCard progress={baseProgress} onCancel={vi.fn()} />);
    expect(screen.getByText('Running Cascade Simulation...')).toBeDefined();
  });

  it('shows loop progress', () => {
    render(<CascadeProgressCard progress={baseProgress} onCancel={vi.fn()} />);
    expect(screen.getByText('4 / 10')).toBeDefined();
  });

  it('shows new reactions count when >= 0', () => {
    render(<CascadeProgressCard progress={baseProgress} onCancel={vi.fn()} />);
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('New Reactions (this loop)')).toBeDefined();
  });

  it('shows finalizing status when newReactionsCount is -1', () => {
    const progress = { ...baseProgress, newReactionsCount: -1 };
    render(<CascadeProgressCard progress={progress} onCancel={vi.fn()} />);
    expect(screen.getByText('Finalizing...')).toBeDefined();
    expect(screen.getByText('Starting finalization process...')).toBeDefined();
  });

  it('shows calculating energy status when newReactionsCount is -2', () => {
    const progress = { ...baseProgress, newReactionsCount: -2 };
    render(<CascadeProgressCard progress={progress} onCancel={vi.fn()} />);
    expect(screen.getByText('Calculating energy...')).toBeDefined();
    expect(screen.getByText('Computing total energy from all reactions...')).toBeDefined();
  });

  it('shows preparing results status when newReactionsCount is -3', () => {
    const progress = { ...baseProgress, newReactionsCount: -3 };
    render(<CascadeProgressCard progress={progress} onCancel={vi.fn()} />);
    expect(screen.getByText('Preparing results...')).toBeDefined();
    expect(screen.getByText('Serializing results for display...')).toBeDefined();
  });

  it('shows percentage complete', () => {
    render(<CascadeProgressCard progress={baseProgress} onCancel={vi.fn()} />);
    expect(screen.getByText('40% complete')).toBeDefined();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<CascadeProgressCard progress={baseProgress} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows searching reactions info text for normal progress', () => {
    render(<CascadeProgressCard progress={baseProgress} onCancel={vi.fn()} />);
    expect(screen.getByText('Searching for reactions between active nuclides and products...')).toBeDefined();
  });

  it('renders progress bar with correct width', () => {
    const { container } = render(<CascadeProgressCard progress={baseProgress} onCancel={vi.fn()} />);
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toBeDefined();
    expect((progressBar as HTMLElement).style.width).toBe('40%');
  });

  it('clamps progress bar width to 100%', () => {
    const progress = { ...baseProgress, percentage: 150 };
    const { container } = render(<CascadeProgressCard progress={progress} onCancel={vi.fn()} />);
    const progressBar = container.querySelector('[style*="width"]');
    expect((progressBar as HTMLElement).style.width).toBe('100%');
  });
});
