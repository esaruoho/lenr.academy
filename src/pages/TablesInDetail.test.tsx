import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import en from '../i18n/locales/en.json';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const parts = key.split('.');
      let value: unknown = en;
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = (value as Record<string, unknown>)[part];
        } else {
          return key;
        }
      }
      return value as string;
    },
  }),
}));

import TablesInDetail from './TablesInDetail';

describe('TablesInDetail', () => {
  it('renders page title', () => {
    render(<TablesInDetail />);
    expect(screen.getByText(en.tables.title)).toBeInTheDocument();
  });

  it('renders all five database tables', () => {
    render(<TablesInDetail />);
    expect(screen.getByText('FusionAll')).toBeInTheDocument();
    expect(screen.getByText('FissionAll')).toBeInTheDocument();
    expect(screen.getByText('TwoToTwoAll')).toBeInTheDocument();
    expect(screen.getByText('NuclidesPlus')).toBeInTheDocument();
    expect(screen.getByText('ElementsPlus')).toBeInTheDocument();
  });

  it('renders field codes for FusionAll', () => {
    render(<TablesInDetail />);
    // E1 appears in multiple tables, so use getAllByText
    expect(screen.getAllByText('E1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('MeV').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('BEin').length).toBeGreaterThanOrEqual(1);
  });

  it('renders field definitions section', () => {
    render(<TablesInDetail />);
    expect(screen.getByText(en.tables.fieldDefinitions)).toBeInTheDocument();
  });

  it('renders field description keys', () => {
    render(<TablesInDetail />);
    // fieldZ resolves to "Z" which appears many times; check the description instead
    expect(screen.getByText(en.tables.fieldZDescription)).toBeInTheDocument();
    expect(screen.getByText(en.tables.fieldADescription)).toBeInTheDocument();
  });
});
