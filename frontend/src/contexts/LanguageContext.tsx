import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Language } from '../types'
import { languagesApi } from '../lib/api'

interface LanguageContextType {
  currentLanguage: string
  languages: Language[]
  isLoading: boolean
  changeLanguage: (code: string) => void
  loadTranslations: (code: string) => Promise<void>
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n } = useTranslation()
  const [languages, setLanguages] = useState<Language[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load available languages
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await languagesApi.getActive()
        if (response.data && Array.isArray(response.data)) {
          setLanguages(response.data)
          
          // Find default language
          const defaultLang = response.data.find((lang: Language) => lang.isDefault)
          const savedLang = localStorage.getItem('language')
          
          if (savedLang && response.data.some((lang: Language) => lang.code === savedLang)) {
            // Use saved language
            await loadTranslations(savedLang)
          } else if (defaultLang) {
            // Use default language from API
            await loadTranslations(defaultLang.code)
          }
        }
      } catch (error) {
        console.error('Failed to load languages:', error)
        // Continue with default English
      } finally {
        setIsLoading(false)
      }
    }

    fetchLanguages()
  }, [])

  const loadTranslations = useCallback(async (code: string) => {
    try {
      const response = await languagesApi.getTranslations(code)
      // Backend returns translations as key-value object directly
      const translations = response.data || {}

      // Add translations to i18next
      i18n.addResourceBundle(code, 'translation', translations, true, true)
      await i18n.changeLanguage(code)
      localStorage.setItem('language', code)
    } catch (error) {
      console.error(`Failed to load translations for ${code}:`, error)
      // Fallback to existing translations
      await i18n.changeLanguage(code)
    }
  }, [i18n])

  const changeLanguage = useCallback(async (code: string) => {
    await loadTranslations(code)
  }, [loadTranslations])

  const value: LanguageContextType = {
    currentLanguage: i18n.language,
    languages,
    isLoading,
    changeLanguage,
    loadTranslations,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
