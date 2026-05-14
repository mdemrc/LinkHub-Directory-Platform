import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { settingsApi } from '../lib/api'

export interface SocialLink {
  type: string
  url: string
  label?: string
}

interface SiteSettings {
  // General
  site_name: string
  site_description: string
  site_keywords: string
  
  // Appearance
  logo_url: string
  favicon_url: string
  primary_color: string
  
  // Contact
  contact_email: string
  discord_url: string
  telegram_url: string
  jabber_url: string
  
  // SEO
  google_analytics_id: string
  robots_txt: string
  
  // Social
  social_links: SocialLink[]

  // Legal (public HTML for /terms and /privacy)
  legal_terms_html: string
  legal_privacy_html: string
  
  // Features
  enable_submissions: boolean
  enable_ads: boolean
  maintenance_mode: boolean
  advertising_page_mode: string

  // Live Chat
  livechat_enabled: boolean
  livechat_provider: string
  livechat_property_id: string
  livechat_base_url: string
  livechat_embed_code: string
  
  // Raw settings for any custom keys
  [key: string]: string | boolean | SocialLink[] | undefined
}

interface SettingsContextType {
  settings: SiteSettings
  isLoading: boolean
  refreshSettings: () => Promise<void>
}

const defaultSettings: SiteSettings = {
  site_name: 'LinkHub',
  site_description: '',
  site_keywords: '',
  logo_url: '',
  favicon_url: '',
  primary_color: '#3B82F6',
  contact_email: '',
  discord_url: '',
  telegram_url: '',
  jabber_url: '',
  google_analytics_id: '',
  robots_txt: '',
  social_links: [],
  legal_terms_html: '',
  legal_privacy_html: '',
  enable_submissions: true,
  enable_ads: true,
  maintenance_mode: false,
  advertising_page_mode: 'pricing',
  livechat_enabled: false,
  livechat_provider: 'none',
  livechat_property_id: '',
  livechat_base_url: '',
  livechat_embed_code: '',
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  refreshSettings: async () => {},
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSettings = async () => {
    try {
      const response = await settingsApi.getPublic()
      const settingsMap: SiteSettings = { ...defaultSettings }
      
      response.data.forEach((setting: { key: string; value: string }) => {
        if (['enable_submissions', 'enable_ads', 'maintenance_mode', 'livechat_enabled'].includes(setting.key)) {
          settingsMap[setting.key] = setting.value === 'true'
        } else if (setting.key === 'social_links') {
          const val = setting.value
          if (Array.isArray(val)) {
            settingsMap.social_links = val
          } else if (typeof val === 'string') {
            try {
              const parsed = JSON.parse(val)
              settingsMap.social_links = Array.isArray(parsed) ? parsed : []
            } catch { settingsMap.social_links = [] }
          } else {
            settingsMap.social_links = []
          }
        } else if (setting.key === 'legal_terms_html' || setting.key === 'legal_privacy_html') {
          const v = setting.value
          settingsMap[setting.key] = typeof v === 'string' ? v : v != null ? String(v) : ''
        } else {
          settingsMap[setting.key] = setting.value
        }
      })
      
      setSettings(settingsMap)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
