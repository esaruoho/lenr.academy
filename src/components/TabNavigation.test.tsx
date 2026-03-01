import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TabNavigation from './TabNavigation';
import type { Tab } from './TabNavigation';

// Mock react-router-dom
const mockSetSearchParams = vi.fn();
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(''), mockSetSearchParams],
}));

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'details', label: 'Details', count: 42 },
  { id: 'chart', label: 'Chart' },
];

describe('TabNavigation', () => {
  beforeEach(() => {
    mockSetSearchParams.mockClear();
    // Mock IntersectionObserver
    const mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
    vi.stubGlobal('IntersectionObserver', vi.fn(() => mockObserver));
  });

  it('renders all tabs', () => {
    render(
      <TabNavigation tabs={tabs} activeTab="overview" onTabChange={vi.fn()} />
    );
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Chart')).toBeInTheDocument();
  });

  it('shows count badge when tab has count', () => {
    render(
      <TabNavigation tabs={tabs} activeTab="overview" onTabChange={vi.fn()} />
    );
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('marks active tab with aria-selected', () => {
    render(
      <TabNavigation tabs={tabs} activeTab="details" onTabChange={vi.fn()} />
    );
    const detailsTab = screen.getByRole('tab', { name: /Details/i });
    expect(detailsTab).toHaveAttribute('aria-selected', 'true');

    const overviewTab = screen.getByRole('tab', { name: /Overview/i });
    expect(overviewTab).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onTabChange and updates URL on tab click', () => {
    const onTabChange = vi.fn();
    render(
      <TabNavigation tabs={tabs} activeTab="overview" onTabChange={onTabChange} />
    );
    fireEvent.click(screen.getByText('Details'));
    expect(onTabChange).toHaveBeenCalledWith('details');
    expect(mockSetSearchParams).toHaveBeenCalled();
  });

  it('handles Enter key on tab', () => {
    const onTabChange = vi.fn();
    render(
      <TabNavigation tabs={tabs} activeTab="overview" onTabChange={onTabChange} />
    );
    fireEvent.keyDown(screen.getByText('Chart'), { key: 'Enter' });
    expect(onTabChange).toHaveBeenCalledWith('chart');
  });

  it('handles Space key on tab', () => {
    const onTabChange = vi.fn();
    render(
      <TabNavigation tabs={tabs} activeTab="overview" onTabChange={onTabChange} />
    );
    fireEvent.keyDown(screen.getByText('Chart'), { key: ' ' });
    expect(onTabChange).toHaveBeenCalledWith('chart');
  });

  it('sets tabIndex=0 for active tab and -1 for others', () => {
    render(
      <TabNavigation tabs={tabs} activeTab="details" onTabChange={vi.fn()} />
    );
    const detailsTab = screen.getByRole('tab', { name: /Details/i });
    expect(detailsTab).toHaveAttribute('tabindex', '0');

    const overviewTab = screen.getByRole('tab', { name: /Overview/i });
    expect(overviewTab).toHaveAttribute('tabindex', '-1');
  });

  it('has tablist role on nav element', () => {
    render(
      <TabNavigation tabs={tabs} activeTab="overview" onTabChange={vi.fn()} />
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(
      <TabNavigation tabs={tabs} activeTab="overview" onTabChange={vi.fn()} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
