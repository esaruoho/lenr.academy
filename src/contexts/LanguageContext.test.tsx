import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from './LanguageContext';
import type { ReactNode } from 'react';

// Mock react-i18next — must also export initReactI18next because i18n/config.ts uses it
const mockChangeLanguage = vi.fn();
let mockLanguage = 'en';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      get language() {
        return mockLanguage;
      },
      changeLanguage: mockChangeLanguage,
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

// Mock i18next-browser-languagedetector (imported by i18n/config.ts)
vi.mock('i18next-browser-languagedetector', () => ({
  default: {
    type: 'languageDetector',
    init: () => {},
    detect: () => 'en',
    cacheUserLanguage: () => {},
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

describe('LanguageContext', () => {
  beforeEach(() => {
    localStorage.clear();
    mockLanguage = 'en';
    mockChangeLanguage.mockClear();
  });

  it('provides current language from i18n', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe('en');
  });

  it('provides supportedLanguages with all 7 locales', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const keys = Object.keys(result.current.supportedLanguages);
    expect(keys).toEqual(['en', 'ru', 'ja', 'zh', 'de', 'fr', 'es']);
  });

  it('setLanguage calls i18n.changeLanguage and saves to localStorage', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage('de');
    });

    expect(mockChangeLanguage).toHaveBeenCalledWith('de');
    expect(localStorage.getItem('lenr-language-preference')).toBe('de');
  });

  it('isFirstVisit is true when no language-selected key exists', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.isFirstVisit).toBe(true);
  });

  it('isFirstVisit is false when language-selected key exists', () => {
    localStorage.setItem('lenr-language-selected', 'true');
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.isFirstVisit).toBe(false);
  });

  it('markLanguageSelected sets localStorage and clears isFirstVisit', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.isFirstVisit).toBe(true);

    act(() => {
      result.current.markLanguageSelected();
    });

    expect(result.current.isFirstVisit).toBe(false);
    expect(localStorage.getItem('lenr-language-selected')).toBe('true');
  });

  it('throws when useLanguage is used outside LanguageProvider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useLanguage());
    }).toThrow('useLanguage must be used within LanguageProvider');
    spy.mockRestore();
  });

  it('reflects language changes from i18n', () => {
    mockLanguage = 'ja';
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe('ja');
  });
});
