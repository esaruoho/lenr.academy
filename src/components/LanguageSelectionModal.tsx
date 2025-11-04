import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check, MapPin, X } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import type { SupportedLanguage } from '../i18n/config'

interface LanguageSelectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LanguageSelectionModal({ isOpen, onClose }: LanguageSelectionModalProps) {
  const { t } = useTranslation()
  const { language, setLanguage, supportedLanguages, markLanguageSelected } = useLanguage()
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(language)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [suggestedLanguage, setSuggestedLanguage] = useState<SupportedLanguage | null>(null)

  // Attempt to detect user's location and suggest language
  useEffect(() => {
    if (!isOpen) return

    const detectLanguageFromLocation = async () => {
      setDetectingLocation(true)

      try {
        // Try to get user's position
        if ('geolocation' in navigator) {
          await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 300000, // 5 minutes cache
            })
          })

          // For now, we'll use the browser's language as the suggested language
          // In a production app, you could use a geocoding service to determine
          // the language based on the coordinates with the position data
          const browserLang = navigator.language.split('-')[0]
          if (browserLang in supportedLanguages) {
            setSuggestedLanguage(browserLang as SupportedLanguage)
          }
        }
      } catch (error) {
        // Geolocation failed or was denied, fall back to browser language
        const browserLang = navigator.language.split('-')[0]
        if (browserLang in supportedLanguages) {
          setSuggestedLanguage(browserLang as SupportedLanguage)
        }
      } finally {
        setDetectingLocation(false)
      }
    }

    detectLanguageFromLocation()
  }, [isOpen, supportedLanguages])

  const handleConfirm = () => {
    setLanguage(selectedLanguage)
    markLanguageSelected()
    onClose()
  }

  const handleLanguageClick = (lang: SupportedLanguage) => {
    setSelectedLanguage(lang)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('language.selectLanguage')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Welcome message */}
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('language.firstTimeMessage')}
          </p>

          {/* Location detection status */}
          {detectingLocation && (
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="w-4 h-4 animate-pulse" />
              {t('language.detectingLocation')}
            </div>
          )}

          {/* Suggested language */}
          {suggestedLanguage && !detectingLocation && (
            <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300 mb-2">
                <MapPin className="w-4 h-4" />
                {t('language.recommendedLanguage')}
              </div>
              <button
                onClick={() => handleLanguageClick(suggestedLanguage)}
                className={`w-full flex items-center justify-between p-3 rounded-md border-2 transition-all ${
                  selectedLanguage === suggestedLanguage
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{supportedLanguages[suggestedLanguage].flag}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {supportedLanguages[suggestedLanguage].nativeName}
                  </span>
                </div>
                {selectedLanguage === suggestedLanguage && (
                  <Check className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                )}
              </button>
            </div>
          )}

          {/* Language list */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('language.chooseLanguage')}
            </p>
            {Object.entries(supportedLanguages).map(([code, info]) => (
              <button
                key={code}
                onClick={() => handleLanguageClick(code as SupportedLanguage)}
                className={`w-full flex items-center justify-between p-3 rounded-md border-2 transition-all ${
                  selectedLanguage === code
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{info.flag}</span>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {info.nativeName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {info.name}
                    </div>
                  </div>
                </div>
                {selectedLanguage === code && (
                  <Check className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            {t('language.confirmSelection')}
          </button>
        </div>
      </div>
    </div>
  )
}
