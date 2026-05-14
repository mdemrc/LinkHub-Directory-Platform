import { Link } from 'react-router-dom'
import { FiHome, FiChevronRight, FiShield } from 'react-icons/fi'
import SEO from '../components/SEO'
import { useSettings } from '../contexts/SettingsContext'

type LegalDocument = 'terms' | 'privacy'

const META: Record<
  LegalDocument,
  { title: string; description: string; settingKey: 'legal_terms_html' | 'legal_privacy_html'; label: string }
> = {
  terms: {
    title: 'Terms of Service',
    description: 'Terms of Service for LinkHub — rules, acceptable use, and legal notices.',
    settingKey: 'legal_terms_html',
    label: 'Terms of Service',
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'Privacy Policy for LinkHub — how we handle data and your rights.',
    settingKey: 'legal_privacy_html',
    label: 'Privacy Policy',
  },
}

export default function LegalPage({ document }: { document: LegalDocument }) {
  const { settings, isLoading } = useSettings()
  const meta = META[document]
  const rawHtml = (settings[meta.settingKey] as string | undefined) || ''
  const html = typeof rawHtml === 'string' ? rawHtml.trim() : ''

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative min-h-[70vh] py-8 sm:py-12 px-4 sm:px-6">
      <SEO
        title={meta.title}
        description={meta.description}
        keywords={`${meta.title}, LinkHub, legal`}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: meta.title, url: document === 'terms' ? '/terms' : '/privacy' },
        ]}
      />

      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-[min(900px,90vw)] -translate-x-1/2 rounded-full bg-lz-accent/10 blur-[100px]" />
        <div className="absolute top-40 right-0 h-48 w-48 rounded-full bg-cyan-500/5 blur-[80px]" />
        <div className="absolute bottom-20 left-0 h-40 w-40 rounded-full bg-violet-500/5 blur-[70px]" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-white transition-colors">
            <FiHome size={12} />
            Home
          </Link>
          <FiChevronRight size={12} className="text-white/20" />
          <span className="text-gray-300">{meta.label}</span>
        </nav>

        <header className="mb-10 text-center sm:text-left">
          <div className="mb-5 inline-flex items-center justify-center sm:justify-start">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-lz-accent/30 blur-xl" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-lz-accent/40 bg-gradient-to-br from-lz-accent/20 to-cyan-500/10 shadow-lg shadow-lz-accent/10">
                <FiShield className="text-lz-accent" size={26} />
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">{meta.title}</h1>
          <p className="mt-3 max-w-xl text-sm text-gray-400">
            Please read this document carefully. It governs your use of LinkHub and related services.
          </p>
          <div className="mt-6 h-px w-full max-w-md bg-gradient-to-r from-transparent via-lz-accent/40 to-transparent sm:mx-0 mx-auto" />
        </header>

        <div className="relative rounded-2xl border border-white/[0.08] bg-[#0d1117]/80 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lz-accent/50 to-transparent rounded-t-2xl" />
          <div className="p-6 sm:p-10">
            {html ? (
              <article
                className="legal-prose prose prose-invert prose-sm sm:prose-base max-w-none
                  prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:text-white
                  prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-xl prose-h2:pb-3 prose-h2:border-b prose-h2:border-white/10 prose-h2:first:mt-0
                  prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-lg prose-h3:text-gray-100
                  prose-p:text-gray-400 prose-p:leading-relaxed
                  prose-a:text-lz-accent prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-white prose-strong:font-semibold
                  prose-ul:my-4 prose-ol:my-4 prose-li:text-gray-400 prose-li:marker:text-lz-accent/80
                  prose-blockquote:border-l-lz-accent prose-blockquote:border-l-2 prose-blockquote:bg-lz-accent/[0.06] prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-gray-300
                  prose-code:text-cyan-300 prose-code:bg-white/5 prose-code:rounded-md prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.85em] prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:text-gray-300
                  prose-hr:border-white/10
                "
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02]">
                  <FiShield className="text-gray-600" size={28} />
                </div>
                <h2 className="text-lg font-semibold text-white">Content not published yet</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                  An administrator can add this document from the admin panel under Legal (Terms & Privacy).
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] text-gray-600 sm:text-left">
          If you have questions about this document, please{' '}
          <Link to="/contact" className="text-lz-accent hover:underline">
            contact us
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

export function TermsPage() {
  return <LegalPage document="terms" />
}

export function PrivacyPage() {
  return <LegalPage document="privacy" />
}
