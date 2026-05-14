import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Category } from '../types'
import { categoriesApi, submissionsApi } from '../lib/api'
import { countries } from '../data/countries'
import { useSettings } from '../contexts/SettingsContext'
import {
  FiPlus,
  FiLink,
  FiAlertCircle,
  FiCheck,
  FiShield,
  FiFlag,
  FiInfo,
  FiXCircle,
} from 'react-icons/fi'
import { FaTelegram } from 'react-icons/fa'
import SEO from '../components/SEO'
import CaptchaWidget from '../components/CaptchaWidget'

export default function SubmitLinkPage() {
  const { t } = useTranslation()
  const { settings } = useSettings()

  const [categories, setCategories] = useState<Category[]>([])
  const [_isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    mirrorUrl: '',
    altUrl: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    countryCode: '',
    contactTelegram: '',
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getAll()
        setCategories(response.data)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Show disabled message if submissions are disabled
  if (!settings.enable_submissions) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-lz-card border border-lz-border rounded-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <FiXCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            {t('submit.disabled_title', 'Submissions Disabled')}
          </h1>
          <p className="text-lz-muted">
            {t('submit.disabled_message', 'Link submissions are currently disabled. Please check back later.')}
          </p>
        </div>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'categoryId') {
      setFormData(prev => ({ ...prev, categoryId: value, subcategoryId: '' }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Get selected main category and its children
  const mainCategories = categories.filter(c => !c.parentId)
  const selectedMainCat = mainCategories.find(c => c.id.toString() === formData.categoryId)
  const subcategories = selectedMainCat?.children || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.title || (!formData.url && !formData.mirrorUrl) || !formData.categoryId) {
      setError('Please fill in required fields (Title, at least one URL, and Category)')
      return
    }

    // Validate URLs
    if (formData.url) {
      try {
        new URL(formData.url)
      } catch {
        setError('Please enter a valid URL')
        return
      }
    }
    if (formData.mirrorUrl) {
      try {
        new URL(formData.mirrorUrl)
      } catch {
        setError('Please enter a valid Mirror URL')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const finalCategoryId = formData.subcategoryId || formData.categoryId
      await submissionsApi.create({
        title: formData.title,
        url: formData.url,
        mirrorUrl: formData.mirrorUrl || undefined,
        altUrl: formData.altUrl || undefined,
        description: formData.description || undefined,
        categoryId: parseInt(finalCategoryId),
        countryCode: formData.countryCode || undefined,
        contactEmail: formData.contactTelegram || undefined,
        captchaToken: captchaToken || undefined,
      })
      setSuccess(true)
      setFormData({
        title: '',
        url: '',
        mirrorUrl: '',
        altUrl: '',
        description: '',
        categoryId: '',
        subcategoryId: '',
        countryCode: '',
        contactTelegram: '',
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit link. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-lz-card border border-lz-border rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-lz-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="text-lz-success" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('submit.success')}</h1>
          <p className="text-lz-muted mb-2">Your link has been submitted successfully!</p>
          <p className="text-sm text-lz-muted mb-6">
            It will be reviewed by our team and added to the directory if approved.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-2 bg-lz-accent hover:bg-lz-accent/80 text-white rounded-lg transition-colors"
          >
            Submit Another Link
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <SEO
        title="Submit a Link"
        description="Submit your website to LinkHub directory. Get your link listed and reach more visitors."
        keywords="submit link, add website, list website, submit URL"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Submit Link', url: '/submit' }
        ]}
      />
      <div className="bg-lz-card border border-lz-border rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-lz-success/20 rounded-lg flex items-center justify-center">
            <FiPlus className="text-lz-success" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t('submit.title')}</h1>
            <p className="text-xs text-lz-muted">Submit a new link to be added to the directory</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-lz-accent/10 border border-lz-accent/30 rounded-lg flex items-start gap-3">
          <FiInfo className="text-lz-accent flex-shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-lz-muted">
            <p>All submissions are reviewed by our team before being published.</p>
            <p className="mt-1">Review process typically takes 24-48 hours.</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400">
            <FiAlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-lz-muted mb-2">
              Site Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-lz-darker border border-lz-border rounded-lg text-sm text-white placeholder-lz-muted focus:outline-none focus:border-lz-accent transition-colors"
              placeholder="e.g. DuckDuckGo"
            />
          </div>

          {/* Main URL */}
          <div>
            <label className="block text-sm font-medium text-lz-muted mb-2">
              {t('submit.url')} <span className="text-red-500">*</span>
              {formData.mirrorUrl && !formData.url && (
                <span className="text-xs text-green-400 ml-1">(Mirror URL provided)</span>
              )}
            </label>
            <div className="relative">
              <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-lz-muted" size={16} />
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-lz-darker border border-lz-border rounded-lg text-sm text-white placeholder-lz-muted focus:outline-none focus:border-lz-accent transition-colors"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Alternative URLs - mutually exclusive with main URL type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-lz-muted mb-2">
                Mirror URL <span className="text-xs text-purple-400">(optional)</span>
              </label>
              <div className="relative">
                <FiShield className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={14} />
                <input
                  type="text"
                  name="mirrorUrl"
                  value={formData.mirrorUrl}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-lz-darker border border-lz-border rounded-lg text-sm text-white placeholder-lz-muted focus:outline-none focus:border-lz-accent transition-colors"
                  placeholder="https://mirror.example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-lz-muted mb-2">
                Alt URL <span className="text-xs text-orange-400">(optional)</span>
              </label>
              <input
                type="text"
                name="altUrl"
                value={formData.altUrl}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-lz-darker border border-lz-border rounded-lg text-sm text-white placeholder-lz-muted focus:outline-none focus:border-lz-accent transition-colors"
                placeholder="https://alt.example.com"
              />
            </div>
          </div>

          {/* Category & Country in one row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Main Category */}
            <div>
              <label className="block text-sm font-medium text-lz-muted mb-2">
                {t('submit.category')} <span className="text-red-500">*</span>
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-lz-darker border border-lz-border rounded-lg text-sm text-white focus:outline-none focus:border-lz-accent transition-colors"
              >
                <option value="">Select a category</option>
                {mainCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Country/Language (for flag) */}
            <div>
              <label className="block text-sm font-medium text-lz-muted mb-2">
                <FiFlag className="inline mr-1" size={12} />
                Country/Region <span className="text-xs text-lz-muted">(for flag)</span>
              </label>
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-lz-darker border border-lz-border rounded-lg text-sm text-white focus:outline-none focus:border-lz-accent transition-colors"
              >
                <option value="">Select country (optional)</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subcategory - shown only when main category has children */}
          {subcategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-lz-muted mb-2">
                Subcategory <span className="text-xs text-lz-muted">(optional)</span>
              </label>
              <select
                name="subcategoryId"
                value={formData.subcategoryId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-lz-darker border border-lz-border rounded-lg text-sm text-white focus:outline-none focus:border-lz-accent transition-colors"
              >
                <option value="">General (no subcategory)</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-lz-muted mb-2">
              {t('submit.description')} <span className="text-xs text-lz-muted">(optional)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 bg-lz-darker border border-lz-border rounded-lg text-sm text-white placeholder-lz-muted focus:outline-none focus:border-lz-accent transition-colors resize-none"
              placeholder="Brief description of the site..."
            />
          </div>

          {/* Telegram Contact */}
          <div>
            <label className="block text-sm font-medium text-lz-muted mb-2">
              <FaTelegram className="inline mr-1 text-blue-400" size={12} />
              Telegram <span className="text-xs text-lz-muted">(optional, not public)</span>
            </label>
            <input
              type="text"
              name="contactTelegram"
              value={formData.contactTelegram}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-lz-darker border border-lz-border rounded-lg text-sm text-white placeholder-lz-muted focus:outline-none focus:border-lz-accent transition-colors"
              placeholder="@yourusername"
            />
            <p className="text-[10px] text-lz-muted mt-1">
              We'll only contact you if we need more information about your submission.
            </p>
          </div>

          {/* CAPTCHA */}
          <CaptchaWidget onVerify={setCaptchaToken} />

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-lz-accent hover:bg-lz-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              'Submit for Review'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
