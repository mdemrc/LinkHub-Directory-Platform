import { useState, useEffect } from 'react'
import { FiExternalLink, FiShield, FiEye, FiEdit3 } from 'react-icons/fi'
import { settingsApi } from '../lib/api'
import AdminPageHeader from './components/AdminPageHeader'
import AdminButton from './components/AdminButton'
import RichHtmlEditor from './components/RichHtmlEditor'

const TERMS_KEY = 'legal_terms_html'
const PRIVACY_KEY = 'legal_privacy_html'

function valueToHtmlString(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return String(v)
}

export default function AdminLegal() {
  const [termsHtml, setTermsHtml] = useState('')
  const [privacyHtml, setPrivacyHtml] = useState('')
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms')
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'code'>('editor')
  const [loading, setLoading] = useState(true)
  const [savingTerms, setSavingTerms] = useState(false)
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await settingsApi.getAll()
      const map: Record<string, unknown> = {}
      res.data.forEach((s: { key: string; value: unknown }) => { map[s.key] = s.value })
      setTermsHtml(valueToHtmlString(map[TERMS_KEY]))
      setPrivacyHtml(valueToHtmlString(map[PRIVACY_KEY]))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const save = async (which: 'terms' | 'privacy') => {
    const setter = which === 'terms' ? setSavingTerms : setSavingPrivacy
    setter(true)
    try {
      await settingsApi.set(which === 'terms' ? TERMS_KEY : PRIVACY_KEY, which === 'terms' ? termsHtml : privacyHtml)
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e) { console.error(e); alert('Failed to save') }
    finally { setter(false) }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" /></div>
  }

  const currentHtml = activeTab === 'terms' ? termsHtml : privacyHtml
  const setCurrentHtml = activeTab === 'terms' ? setTermsHtml : setPrivacyHtml
  const previewUrl = activeTab === 'terms' ? '/terms' : '/privacy'
  const saving = activeTab === 'terms' ? savingTerms : savingPrivacy

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Legal — Terms & Privacy" description="Edit Terms of Service and Privacy Policy with the rich editor. Public URLs: /terms and /privacy." />

      {/* Tab bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#12151c] p-2">
        {(['terms', 'privacy'] as const).map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[140px] rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-lz-accent/15 text-lz-accent border border-lz-accent/30' : 'text-gray-400 hover:text-white border border-transparent'}`}>
            {tab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
          </button>
        ))}
        <a href={previewUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-all">
          <FiExternalLink size={14} /> Preview live
        </a>
      </div>

      {/* Editor section */}
      <div className="rounded-xl border border-white/10 bg-[#12151c] overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-white/10 p-4 sm:p-5">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lz-accent/10">
              <FiShield className="text-lz-accent" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">Use the toolbar to format text. Supports headings, lists, links, blockquotes, and more.</p>
            </div>
          </div>
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-white/10 bg-[#0d1117] p-0.5">
            {([
              { mode: 'editor' as const, icon: FiEdit3, label: 'Editor' },
              { mode: 'preview' as const, icon: FiEye, label: 'Preview' },
              { mode: 'code' as const, icon: null, label: '<>' },
            ]).map(({ mode, icon: Icon, label }) => (
              <button key={mode} type="button" onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  viewMode === mode ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {Icon && <Icon size={12} />} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="p-0">
          {viewMode === 'editor' && (
            <RichHtmlEditor
              value={currentHtml}
              onChange={setCurrentHtml}
              placeholder={activeTab === 'terms'
                ? 'Write your Terms of Service here…'
                : 'Write your Privacy Policy here…'}
            />
          )}

          {viewMode === 'preview' && (
            <div className="p-5 sm:p-8">
              {currentHtml ? (
                <article className="prose prose-invert prose-sm sm:prose-base max-w-none
                  prose-headings:text-white prose-headings:font-bold
                  prose-h1:text-2xl prose-h1:mb-4
                  prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-white/10
                  prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
                  prose-p:text-gray-400 prose-p:leading-relaxed
                  prose-a:text-lz-accent prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-white
                  prose-ul:my-3 prose-ol:my-3 prose-li:text-gray-400 prose-li:marker:text-lz-accent/70
                  prose-blockquote:border-l-lz-accent prose-blockquote:border-l-2 prose-blockquote:bg-lz-accent/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-gray-300
                  prose-code:text-cyan-300 prose-code:bg-white/5 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none
                  prose-hr:border-white/10"
                  dangerouslySetInnerHTML={{ __html: currentHtml }} />
              ) : (
                <p className="py-16 text-center text-sm text-gray-500">No content to preview. Switch to Editor to start writing.</p>
              )}
            </div>
          )}

          {viewMode === 'code' && (
            <div className="p-4">
              <textarea
                value={currentHtml}
                onChange={(e) => setCurrentHtml(e.target.value)}
                rows={18}
                spellCheck={false}
                className="w-full rounded-lg border border-white/10 bg-[#0d1117] px-4 py-3 font-mono text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-lz-accent/50 focus:ring-1 focus:ring-lz-accent/25 resize-y"
                placeholder="<h2>1. Section Title</h2>\n<p>Content goes here…</p>"
              />
              <p className="mt-2 text-[10px] text-gray-600">Raw HTML mode — edit source directly. Changes sync with the visual editor.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 sm:px-5">
          <p className="text-xs text-gray-500">
            {currentHtml.length.toLocaleString()} characters
            {saved && <span className="ml-2 text-emerald-400">Saved!</span>}
          </p>
          <AdminButton onClick={() => save(activeTab)} loading={saving}>
            Save {activeTab === 'terms' ? 'Terms' : 'Privacy'}
          </AdminButton>
        </div>
      </div>
    </div>
  )
}
