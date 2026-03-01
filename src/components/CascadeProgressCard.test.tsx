import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CascadeProgressCard from './CascadeProgressCard';
import en from '../i18n/locales/en.json';

// Mock react-i18next
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
        for (const [k, v] of Object.entries(params)) {
          result = result.replace(`{{${k}}}`, String(v));
        }
      }
      return result;
    },
  }),
}));

describe('CascadeProgressCard', () => {
  const baseProgress = {
    loop: 2,
    totalLoops: 10,
    percentage: 30,
    newReactionsCount: 15,
  };

  it('renders simulation title', () => {
    render(<CascadeProgressCard progress={baseProgress} onCancel={vi.fn()} />);
    expect(screen.getByText(/running.*simulation/i)).toBeInTheDocument();
  });

  it('displays loop progress', () => {
    render(<CascadeProgressCard progress={baseProgress} onCancel={vi.fn()} />);
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
  });

  it('displays new reactions count', () => {
    render(<CascadeProgressCard progress={baseProgress} onCancel={vi.fn()} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('shows percentage in progress bar', () => {
    render(<CascadeProgressCard progress={baseProgress} onCancel={vi.fn()} />);
    expect(screen.getByText(/30%/)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<CascadeProgressCard progress={baseProgress} onCancel={onCancel} />);
    const cancelBtn = screen.getByRole('button');
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows finalizing status when newReactionsCount is -1', () => {
    render(
      <CascadeProgressCard
        progress={{ ...baseProgress, newReactionsCount: -1 }}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText('Finalizing...')).toBeInTheDocument();
  });

  it('shows calculating energy status when newReactionsCount is -2', () => {
    render(
      <CascadeProgressCard
        progress={{ ...baseProgress, newReactionsCount: -2 }}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText(/calculat/i)).toBeInTheDocument();
  });

  it('shows preparing results status when newReactionsCount is -3', () => {
    render(
      <CascadeProgressCard
        progress={{ ...baseProgress, newReactionsCount: -3 }}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText(/prepar/i)).toBeInTheDocument();
  });
});
