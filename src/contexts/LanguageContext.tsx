import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupportedLanguage } from '../i18n/config'
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../i18n/config'

interface LanguageContextType {
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage) => void
  supportedLanguages: typeof SUPPORTED_LANGUAGES
  isFirstVisit: boolean
  markLanguageSelected: () => void
}

const LanguageContext = createContext<LanguageContextType | null>(null)

const LANGUAGE_PREFERENCE_KEY = 'lenr-language-preference'
const LANGUAGE_SELECTED_KEY = 'lenr-language-selected'

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n } = useTranslation()
  const [isFirstVisit, setIsFirstVisit] = useState(false)

  // Check if this is the first visit (no language preference saved)
  useEffect(() => {
    const hasSelectedLanguage = localStorage.getItem(LANGUAGE_SELECTED_KEY)
    if (!hasSelectedLanguage) {
      setIsFirstVisit(true)
    }
  }, [])

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    i18n.changeLanguage(lang)
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY, lang)
  }, [i18n])

  const markLanguageSelected = useCallback(() => {
    localStorage.setItem(LANGUAGE_SELECTED_KEY, 'true')
    setIsFirstVisit(false)
  }, [])

  const value: LanguageContextType = {
    language: (i18n.language as SupportedLanguage) || DEFAULT_LANGUAGE,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isFirstVisit,
    markLanguageSelected,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
