import { useState, useEffect } from 'react'
import { settingsApi } from '../lib/api'
import { useSettings } from '../contexts/SettingsContext'
import {
  FiSave,
  FiSettings,
  FiGlobe,
  FiMail,
  FiImage,
  FiActivity,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiShield,
  FiHeadphones,
  FiMessageCircle,
} from 'react-icons/fi'
import {
  SiTelegram,
  SiDiscord,
  SiGithub,
  SiReddit,
  SiSignal,
} from 'react-icons/si'

interface SettingGroup {
  key: string
  icon: React.ReactNode
  title: string
  fields: SettingField[]
}

interface SettingField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'url' | 'email' | 'select' | 'password'
  placeholder?: string
  options?: { value: string; label: string }[]
}

interface SocialLink {
  type: string
  url: string
  label?: string
}

const SOCIAL_TYPES = [
  { value: 'telegram', label: 'Telegram', icon: <SiTelegram size={16} /> },
  { value: 'telegram_group', label: 'Telegram Group', icon: <SiTelegram size={16} /> },
  { value: 'telegram_channel', label: 'Telegram Channel', icon: <SiTelegram size={16} /> },
  { value: 'signal', label: 'Signal', icon: <SiSignal size={16} /> },
  { value: 'live_support', label: 'Live Support', icon: <FiHeadphones size={16} /> },
  { value: 'discord', label: 'Discord', icon: <SiDiscord size={16} /> },
  { value: 'twitter', label: 'Twitter / X', icon: <span className="font-bold text-sm">𝕏</span> },
  { value: 'github', label: 'GitHub', icon: <SiGithub size={16} /> },
  { value: 'reddit', label: 'Reddit', icon: <SiReddit size={16} /> },
  { value: 'email', label: 'Email', icon: <FiMail size={16} /> },
  { value: 'website', label: 'Website', icon: <FiGlobe size={16} /> },
]

const settingGroups: SettingGroup[] = [
  {
    key: 'general',
    icon: <FiSettings size={20} />,
    title: 'General Settings',
    fields: [
      { key: 'site_name', label: 'Site Name', type: 'text', placeholder: 'LinkHub' },
      { key: 'site_description', label: 'Site Description', type: 'textarea', placeholder: 'Description...' },
      { key: 'site_keywords', label: 'Keywords (SEO)', type: 'text', placeholder: 'links, directory, ...' },
    ]
  },
  {
    key: 'appearance',
    icon: <FiImage size={20} />,
    title: 'Appearance',
    fields: [
      { key: 'logo_url', label: 'Logo URL', type: 'url', placeholder: 'https://...' },
      { key: 'favicon_url', label: 'Favicon URL', type: 'url', placeholder: 'https://...' },
      { key: 'primary_color', label: 'Primary Color', type: 'text', placeholder: '#3B82F6' },
    ]
  },
  {
    key: 'contact',
    icon: <FiMail size={20} />,
    title: 'Contact Information',
    fields: [
      { key: 'contact_email', label: 'Contact Email', type: 'email', placeholder: 'admin@example.com' },
      { key: 'discord_url', label: 'Discord URL', type: 'url', placeholder: 'https://discord.gg/...' },
      { key: 'telegram_url', label: 'Telegram URL', type: 'url', placeholder: 'https://t.me/...' },
      { key: 'jabber_url', label: 'Jabber / XMPP', type: 'text', placeholder: 'user@jabber.org' },
    ]
  },
  {
    key: 'seo',
    icon: <FiGlobe size={20} />,
    title: 'SEO & Analytics',
    fields: [
      { key: 'google_analytics_id', label: 'Google Analytics ID', type: 'text', placeholder: 'G-XXXXXXX' },
      { key: 'robots_txt', label: 'Robots.txt', type: 'textarea', placeholder: 'User-agent: *\nAllow: /' },
    ]
  },
  {
    key: 'features',
    icon: <FiActivity size={20} />,
    title: 'Features',
    fields: [
      { key: 'enable_submissions', label: 'Enable Submissions', type: 'boolean' },
      { key: 'enable_ads', label: 'Enable Ads', type: 'boolean' },
      { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'boolean' },
      { key: 'advertising_page_mode', label: 'Advertising Page Mode', type: 'select', options: [{ value: 'contact', label: 'Contact Only (Simplified)' }, { value: 'pricing', label: 'Full Pricing Page' }] },
    ]
  },
  {
    key: 'captcha',
    icon: <FiShield size={20} />,
    title: 'CAPTCHA Settings',
    fields: [
      { key: 'captcha_enabled', label: 'Enable CAPTCHA', type: 'boolean' },
      {
        key: 'captcha_provider',
        label: 'CAPTCHA Provider',
        type: 'select',
        options: [
          { value: 'none', label: 'None (Disabled)' },
          { value: 'turnstile', label: 'Cloudflare Turnstile' },
          { value: 'recaptcha_v2', label: 'Google reCAPTCHA v2' },
        ]
      },
      { key: 'captcha_site_key', label: 'Site Key', type: 'text', placeholder: 'Enter site key from provider' },
      { key: 'captcha_secret_key', label: 'Secret Key', type: 'password', placeholder: 'Enter secret key from provider' },
    ]
  },
  {
    key: 'livechat',
    icon: <FiMessageCircle size={20} />,
    title: 'Live Chat',
    fields: [
      { key: 'livechat_enabled', label: 'Enable Live Chat Widget', type: 'boolean' },
      {
        key: 'livechat_provider',
        label: 'Chat Provider',
        type: 'select',
        options: [
          { value: 'none', label: 'None (Disabled)' },
          { value: 'tawkto', label: 'Tawk.to' },
          { value: 'crisp', label: 'Crisp' },
          { value: 'chatwoot', label: 'Chatwoot' },
          { value: 'custom', label: 'Custom Embed Code' },
        ]
      },
      { key: 'livechat_property_id', label: 'Property / Website ID', type: 'text', placeholder: 'e.g. 64xxxxxx/default for Tawk.to' },
      { key: 'livechat_base_url', label: 'Base URL (Chatwoot only)', type: 'url', placeholder: 'https://app.chatwoot.com' },
      { key: 'livechat_embed_code', label: 'Custom Embed Code', type: 'textarea', placeholder: 'Paste the full embed script from your chat provider...' },
    ]
  },
]

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [editingSocialIndex, setEditingSocialIndex] = useState<number | null>(null)
  const [socialForm, setSocialForm] = useState<SocialLink>({ type: 'telegram', url: '', label: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeGroup, setActiveGroup] = useState('general')
  const { refreshSettings } = useSettings()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await settingsApi.getAll()
      const settingsMap: Record<string, string> = {}
      response.data.forEach((setting: { key: string; value: string }) => {
        settingsMap[setting.key] = setting.value
      })
      setSettings(settingsMap)

      if (settingsMap.social_links) {
        const val = settingsMap.social_links
        if (Array.isArray(val)) {
          setSocialLinks(val as unknown as SocialLink[])
        } else if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val)
            if (Array.isArray(parsed)) setSocialLinks(parsed)
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const merged: Record<string, unknown> = { ...settings, social_links: socialLinks }
      const settingsArray = Object.entries(merged).map(([key, value]) => ({ key, value: value as string }))
      await settingsApi.setBulk(settingsArray)
      await refreshSettings()
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const saveSocialLinks = async (links: SocialLink[]) => {
    try {
      await settingsApi.set('social_links', links as any)
      await refreshSettings()
    } catch (error) {
      console.error('Failed to save social links:', error)
      alert('Failed to save social links')
    }
  }

  const addSocialLink = async () => {
    if (!socialForm.url.trim()) return
    let updated: SocialLink[]
    if (editingSocialIndex !== null) {
      updated = [...socialLinks]
      updated[editingSocialIndex] = { ...socialForm }
      setEditingSocialIndex(null)
    } else {
      updated = [...socialLinks, { ...socialForm }]
    }
    setSocialLinks(updated)
    setSocialForm({ type: 'telegram', url: '', label: '' })
    await saveSocialLinks(updated)
  }

  const editSocialLink = (index: number) => {
    setEditingSocialIndex(index)
    setSocialForm({ ...socialLinks[index] })
  }

  const removeSocialLink = async (index: number) => {
    const updated = socialLinks.filter((_, i) => i !== index)
    setSocialLinks(updated)
    if (editingSocialIndex === index) {
      setEditingSocialIndex(null)
      setSocialForm({ type: 'telegram', url: '', label: '' })
    }
    await saveSocialLinks(updated)
  }

  const cancelEditSocial = () => {
    setEditingSocialIndex(null)
    setSocialForm({ type: 'telegram', url: '', label: '' })
  }

  const renderField = (field: SettingField) => {
    const value = settings[field.key] || ''

    if (field.type === 'boolean') {
      return (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => handleChange(field.key, value === 'true' ? 'false' : 'true')}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              value === 'true' ? 'bg-green-500' : 'bg-lz-border'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                value === 'true' ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${value === 'true' ? 'text-green-500' : 'text-lz-muted'}`}>
            {value === 'true' ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      )
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => handleChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className="w-full px-4 py-2 bg-lz-darker border border-lz-border rounded-lg text-white placeholder:text-lz-muted focus:outline-none focus:border-lz-accent resize-none"
        />
      )
    }

    if (field.type === 'select' && field.options) {
      return (
        <select
          value={value}
          onChange={(e) => handleChange(field.key, e.target.value)}
          className="w-full px-4 py-2 bg-lz-darker border border-lz-border rounded-lg text-white focus:outline-none focus:border-lz-accent"
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )
    }

    return (
      <input
        type={field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : 'text'}
        value={value}
        onChange={(e) => handleChange(field.key, e.target.value)}
        placeholder={field.placeholder}
        className="w-full px-4 py-2 bg-lz-darker border border-lz-border rounded-lg text-white placeholder:text-lz-muted focus:outline-none focus:border-lz-accent"
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const currentGroup = settingGroups.find((g) => g.key === activeGroup)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-lz-muted">Manage site configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-lz-accent hover:bg-lz-accent-hover disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          <FiSave size={16} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Sidebar — horizontal scroll on mobile, vertical on desktop */}
        <div className="md:w-64 md:shrink-0">
          <div className="bg-lz-card border border-lz-border rounded-lg overflow-hidden flex md:flex-col overflow-x-auto">
            {settingGroups.map((group) => (
              <button
                key={group.key}
                onClick={() => setActiveGroup(group.key)}
                className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 text-left transition-colors whitespace-nowrap md:w-full flex-shrink-0 ${
                  activeGroup === group.key
                    ? 'bg-lz-accent/20 text-lz-accent md:border-l-2 border-lz-accent'
                    : 'text-lz-muted hover:bg-lz-darker hover:text-white'
                }`}
              >
                {group.icon}
                <span className="text-xs md:text-sm font-medium">{group.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {currentGroup && (
            <div className="bg-lz-card border border-lz-border rounded-lg">
              <div className="p-4 md:p-6 border-b border-lz-border">
                <div className="flex items-center gap-3">
                  <div className="text-lz-accent">{currentGroup.icon}</div>
                  <h2 className="text-base md:text-lg font-semibold text-white">{currentGroup.title}</h2>
                </div>
              </div>
              <div className="p-4 md:p-6 space-y-5 md:space-y-6">
                {currentGroup.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-lz-muted mb-2">
                      {field.label}
                    </label>
                    {renderField(field)}
                  </div>
                ))}

                {activeGroup === 'contact' && (
                  <div className="pt-4 border-t border-lz-border">
                    <h3 className="text-sm font-semibold text-white mb-4">Footer Social Links</h3>

                    {socialLinks.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {socialLinks.map((link, index) => {
                          const typeInfo = SOCIAL_TYPES.find(t => t.value === link.type)
                          return (
                            <div key={index} className="flex items-center gap-3 p-3 bg-lz-darker rounded-lg border border-lz-border/50">
                              <div className="w-8 h-8 rounded bg-lz-card flex items-center justify-center text-lz-accent flex-shrink-0">
                                {typeInfo?.icon || <FiGlobe size={16} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium truncate">
                                  {link.label || typeInfo?.label || link.type}
                                </p>
                                <p className="text-xs text-lz-muted truncate">{link.url}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => editSocialLink(index)}
                                className="p-1.5 text-lz-muted hover:text-lz-accent transition-colors"
                              >
                                <FiEdit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeSocialLink(index)}
                                className="p-1.5 text-lz-muted hover:text-red-400 transition-colors"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div className="p-3 md:p-4 bg-lz-darker rounded-lg border border-lz-border/50 space-y-3">
                      <p className="text-xs font-medium text-lz-muted">
                        {editingSocialIndex !== null ? 'Edit Social Link' : 'Add Social Link'}
                      </p>
                      <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3">
                        <select
                          value={socialForm.type}
                          onChange={(e) => setSocialForm({ ...socialForm, type: e.target.value })}
                          className="w-full px-3 py-2 bg-lz-card border border-lz-border rounded-lg text-white text-sm focus:outline-none focus:border-lz-accent"
                        >
                          {SOCIAL_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={socialForm.url}
                          onChange={(e) => setSocialForm({ ...socialForm, url: e.target.value })}
                          placeholder={socialForm.type === 'email' ? 'contact@example.com' : 'https://...'}
                          className="w-full px-3 py-2 bg-lz-card border border-lz-border rounded-lg text-white placeholder:text-lz-muted text-sm focus:outline-none focus:border-lz-accent"
                        />
                        <input
                          type="text"
                          value={socialForm.label || ''}
                          onChange={(e) => setSocialForm({ ...socialForm, label: e.target.value })}
                          placeholder="Label (optional)"
                          className="w-full px-3 py-2 bg-lz-card border border-lz-border rounded-lg text-white placeholder:text-lz-muted text-sm focus:outline-none focus:border-lz-accent"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={addSocialLink}
                          disabled={!socialForm.url.trim()}
                          className="flex items-center gap-1.5 px-4 py-2 bg-lz-accent hover:bg-lz-accent-hover disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <FiPlus size={14} />
                          {editingSocialIndex !== null ? 'Update' : 'Add'}
                        </button>
                        {editingSocialIndex !== null && (
                          <button
                            type="button"
                            onClick={cancelEditSocial}
                            className="px-4 py-2 bg-lz-card hover:bg-lz-darker text-lz-muted rounded-lg text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
