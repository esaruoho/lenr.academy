import { describe, it, expect, vi, beforeEach } from 'vitest';
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

const mockExec = vi.fn();

vi.mock('../contexts/DatabaseContext', () => ({
  useDatabase: () => ({
    db: { exec: mockExec },
    isLoading: false,
    error: null,
    downloadProgress: null,
  }),
}));

vi.mock('../components/DatabaseLoadingCard', () => ({
  default: () => <div data-testid="loading-card" />,
}));

import AllTables from './AllTables';

describe('AllTables', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    render(<AllTables />);
    expect(screen.getByText(en.allTables.title)).toBeInTheDocument();
  });

  it('renders SQL editor section', () => {
    render(<AllTables />);
    expect(screen.getByText(en.allTables.sqlEditor)).toBeInTheDocument();
  });

  it('renders default query in textarea', () => {
    render(<AllTables />);
    const textarea = screen.getByPlaceholderText(en.allTables.queryPlaceholder);
    expect(textarea).toBeInTheDocument();
  });

  it('renders execute button', () => {
    render(<AllTables />);
    expect(screen.getByText(en.allTables.executeQuery)).toBeInTheDocument();
  });

  it('renders clear button', () => {
    render(<AllTables />);
    expect(screen.getByText(en.allTables.clear)).toBeInTheDocument();
  });

  it('renders example queries', () => {
    render(<AllTables />);
    expect(screen.getByText(en.allTables.exampleQueries)).toBeInTheDocument();
    // Should have at least one example query
    expect(screen.getByText(/SELECT \* FROM NuclidesPlus/)).toBeInTheDocument();
  });

  it('renders available tables list', () => {
    render(<AllTables />);
    expect(screen.getByText(en.allTables.availableTables)).toBeInTheDocument();
    expect(screen.getByText('FusionAll')).toBeInTheDocument();
    expect(screen.getByText('FissionAll')).toBeInTheDocument();
  });

  it('renders SQL tips', () => {
    render(<AllTables />);
    expect(screen.getByText(en.allTables.sqlTips)).toBeInTheDocument();
  });

  it('executes query when button clicked', () => {
    mockExec.mockReturnValue([{
      columns: ['Z', 'A', 'MeV'],
      values: [[1, 1, 10.5]],
    }]);
    render(<AllTables />);
    fireEvent.click(screen.getByText(en.allTables.executeQuery));
    expect(mockExec).toHaveBeenCalled();
  });

  it('shows error for destructive queries', () => {
    render(<AllTables />);
    const textarea = screen.getByPlaceholderText(en.allTables.queryPlaceholder);
    fireEvent.change(textarea, { target: { value: 'DROP TABLE FusionAll' } });
    fireEvent.click(screen.getByText(en.allTables.executeQuery));
    expect(screen.getByText(en.allTables.readOnlyError)).toBeInTheDocument();
  });

  it('clears query when clear button clicked', () => {
    render(<AllTables />);
    fireEvent.click(screen.getByText(en.allTables.clear));
    const textarea = screen.getByPlaceholderText(en.allTables.queryPlaceholder) as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
  });

  it('loads example query when clicked', () => {
    render(<AllTables />);
    const exampleBtn = screen.getByText(/SELECT \* FROM NuclidesPlus/);
    fireEvent.click(exampleBtn);
    const textarea = screen.getByPlaceholderText(en.allTables.queryPlaceholder) as HTMLTextAreaElement;
    expect(textarea.value).toContain('NuclidesPlus');
  });

  it('shows query results after execution', () => {
    mockExec.mockReturnValue([{
      columns: ['Z', 'A', 'MeV'],
      values: [[1, 1, 10.5], [2, 4, 20.3]],
    }]);
    render(<AllTables />);
    fireEvent.click(screen.getByText(en.allTables.executeQuery));
    // Should show export button (proves results rendered)
    expect(screen.getByText(en.allTables.exportCsv)).toBeInTheDocument();
    // Should show column headers
    expect(screen.getByText('Z')).toBeInTheDocument();
    expect(screen.getByText('MeV')).toBeInTheDocument();
  });

  it('shows error message on query failure', () => {
    mockExec.mockImplementation(() => { throw new Error('syntax error'); });
    render(<AllTables />);
    fireEvent.click(screen.getByText(en.allTables.executeQuery));
    expect(screen.getByText('syntax error')).toBeInTheDocument();
  });
});
