import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import type { SupportedLanguage } from '../i18n/config'

interface LanguageSwitcherProps {
  className?: string
  compact?: boolean
}

export default function LanguageSwitcher({ className = '', compact = false }: LanguageSwitcherProps) {
  const { t } = useTranslation()
  const { language, setLanguage, supportedLanguages } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang)
    setIsOpen(false)
  }

  const currentLanguage = supportedLanguages[language]

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
          compact ? 'justify-center' : ''
        }`}
        aria-label={t('language.changeLanguage')}
        title={compact ? t('language.changeLanguage') : undefined}
      >
        <Globe className="w-4 h-4 flex-shrink-0" />
        {!compact && (
          <>
            <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
            <span className="sm:hidden">{currentLanguage.flag}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2">
              {t('language.selectLanguage')}
            </div>
            <div className="space-y-1">
              {Object.entries(supportedLanguages).map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code as SupportedLanguage)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                    language === code
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{info.flag}</span>
                    <div className="text-left">
                      <div className="text-sm font-medium">
                        {info.nativeName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {info.name}
                      </div>
                    </div>
                  </div>
                  {language === code && (
                    <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
