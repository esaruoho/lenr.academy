import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import en from './locales/en.json'
import ru from './locales/ru.json'
import ja from './locales/ja.json'
import zh from './locales/zh.json'
import de from './locales/de.json'
import fr from './locales/fr.json'
import es from './locales/es.json'

export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
} as const

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en'

// Map browser languages to our supported languages
const languageMap: Record<string, SupportedLanguage> = {
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'ru': 'ru',
  'ru-RU': 'ru',
  'ja': 'ja',
  'ja-JP': 'ja',
  'zh': 'zh',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
  'de': 'de',
  'de-DE': 'de',
  'de-AT': 'de',
  'de-CH': 'de',
  'fr': 'fr',
  'fr-FR': 'fr',
  'fr-CA': 'fr',
  'fr-BE': 'fr',
  'fr-CH': 'fr',
  'es': 'es',
  'es-ES': 'es',
  'es-MX': 'es',
  'es-AR': 'es',
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      ja: { translation: ja },
      zh: { translation: zh },
      de: { translation: de },
      fr: { translation: fr },
      es: { translation: es },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[],

    // Language detection configuration
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'lenr-language-preference',
      caches: ['localStorage'],
      excludeCacheFor: ['cimode'],
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: false, // Disable suspense for now
    },
  })

// Custom language detection based on geolocation (optional enhancement)
export async function detectLanguageFromGeolocation(): Promise<SupportedLanguage | null> {
  try {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      return null
    }

    // Get user's position
    await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000,
        maximumAge: 300000, // 5 minutes cache
      })
    })

    // Use a geocoding service to get country from coordinates with the position data
    // For now, we'll use the browser's language as fallback
    // In a production app, you might want to use a service like:
    // https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}

    return null // Return null to use browser language detection
  } catch (error) {
    // User denied geolocation or error occurred
    return null
  }
}

// Helper function to get mapped language
export function getMappedLanguage(browserLang: string): SupportedLanguage {
  return languageMap[browserLang] || DEFAULT_LANGUAGE
}

export default i18n
