import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MeteredConnectionWarning from './MeteredConnectionWarning';
import en from '../i18n/locales/en.json';

// Mock react-i18next
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
  Trans: ({ i18nKey, values }: { i18nKey: string; values?: Record<string, unknown> }) => {
    let text = i18nKey;
    const parts = i18nKey.split('.');
    let value: unknown = en;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        break;
      }
    }
    if (typeof value === 'string') {
      text = value;
      if (values) {
        for (const [k, v] of Object.entries(values)) {
          text = text.replace(`{{${k}}}`, String(v));
        }
      }
      // Strip HTML-like tags
      text = text.replace(/<[^>]+>/g, '');
    }
    return <span>{text}</span>;
  },
}));

describe('MeteredConnectionWarning', () => {
  it('renders warning title', () => {
    render(
      <MeteredConnectionWarning
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        databaseSizeMB={161}
      />
    );
    expect(screen.getByTestId('metered-warning')).toBeInTheDocument();
  });

  it('calls onConfirm when download button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <MeteredConnectionWarning
        onConfirm={onConfirm}
        onCancel={vi.fn()}
        databaseSizeMB={161}
      />
    );
    const downloadBtn = screen.getByText(/download anyway/i);
    fireEvent.click(downloadBtn);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when wait button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <MeteredConnectionWarning
        onConfirm={vi.fn()}
        onCancel={onCancel}
        databaseSizeMB={161}
      />
    );
    const waitBtn = screen.getByText(/wait for wi-?fi/i);
    fireEvent.click(waitBtn);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('has fixed overlay positioning', () => {
    const { container } = render(
      <MeteredConnectionWarning
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        databaseSizeMB={161}
      />
    );
    const overlay = container.firstChild as HTMLElement;
    expect(overlay.className).toContain('fixed');
    expect(overlay.className).toContain('inset-0');
  });
});
