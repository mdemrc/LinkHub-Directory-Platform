import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { useSettings } from '../contexts/SettingsContext'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  ogType?: 'website' | 'article'
  ogImage?: string
  noindex?: boolean
  canonical?: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
  breadcrumbs?: { name: string; url: string }[]
}

const SITE_URL = typeof window !== 'undefined' ? window.location.origin : ''

export default function SEO({
  title,
  description,
  keywords,
  ogType = 'website',
  ogImage,
  noindex = false,
  canonical,
  jsonLd,
  breadcrumbs,
}: SEOProps) {
  const { settings } = useSettings()
  const location = useLocation()

  const siteName = settings.site_name || 'LinkHub'
  const pageTitle = title ? `${title} - ${siteName}` : siteName
  const pageDescription = description || settings.site_description || 'Premium Link Directory'
  const pageKeywords = keywords || settings.site_keywords || ''
  const canonicalUrl = canonical || `${SITE_URL}${location.pathname}`

  const breadcrumbJsonLd = breadcrumbs && breadcrumbs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  } : null

  const allJsonLd = [
    ...(breadcrumbJsonLd ? [breadcrumbJsonLd] : []),
    ...(jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []),
  ]

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {pageKeywords && <meta name="keywords" content={pageKeywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Structured Data */}
      {allJsonLd.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  )
}
